"""Tests for RecoveryEngine end-to-end state machine transitions and audit trails."""

import uuid
from decimal import Decimal
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog
from app.schemas.enums import RiskStatus, StoppingReason
from app.services.risk_engine import RiskEngine
from app.services.recovery_engine import RecoveryEngine
from app.data.seed_data import seed_database


def test_end_to_end_single_step_recovery(db):
    """Verify standard temporary decline succeeds in single step with full audit logging."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_FLOW_1",
        name="Flow Test User",
        email="flow1@test.com",
        payment_method_type="credit_card",
        card_last4="4242",
        card_expiry="12/28",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("89.00"),
        status="failed",
        failure_code="temporary_decline",
        failure_reason="Soft decline",
    )
    db.add(txn)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, txn.id)
    assert risk.status == RiskStatus.DETECTED.value

    # Execute recovery step
    res = RecoveryEngine.execute_step(db=db, risk_id=risk.id)

    assert res.current_status == RiskStatus.RECOVERED
    assert res.is_terminal is True
    assert res.amount_recovered == Decimal("89.00")
    assert res.stop_reason == StoppingReason.SUCCESS_STOP.value

    # Verify audit logs captured the step progression
    logs = db.query(AuditLog).filter_by(revenue_risk_id=risk.id).all()
    step_names = [log.step_name for log in logs]
    assert "DETECTED" in step_names
    assert "DIAGNOSING" in step_names
    assert "POLICY_CHECK" in step_names
    assert "ACTION_EXECUTED" in step_names


def test_expired_card_multi_step_recovery_workflow(db):
    """Verify expired card lifecycle: 1. Update request -> 2. Payment retry -> Recovered."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_EXP_FLOW",
        name="Expired Card User",
        email="exp_flow@test.com",
        card_last4="1001",
        card_expiry="05/26",  # Expired
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("120.00"),
        status="failed",
        failure_code="expired_card",
    )
    db.add(txn)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, txn.id)

    # Step 1: AI diagnoses expired card -> proposes request_payment_method_update -> executed
    step_1 = RecoveryEngine.execute_step(db=db, risk_id=risk.id)
    assert step_1.diagnosis.recommended_action.value == "request_payment_method_update"
    assert step_1.current_status == RiskStatus.DETECTED
    assert step_1.is_terminal is False

    # Check that customer expiry was updated by the simulated action
    db.refresh(cust)
    assert cust.card_expiry == "12/29"

    # Step 2: AI detects updated card -> proposes retry_payment -> executed -> recovers funds
    step_2 = RecoveryEngine.execute_step(db=db, risk_id=risk.id)
    assert step_2.diagnosis.recommended_action.value == "retry_payment"
    assert step_2.current_status == RiskStatus.RECOVERED
    assert step_2.is_terminal is True
    assert step_2.amount_recovered == Decimal("120.00")


def test_opt_out_stopping_workflow(db):
    """Verify opted-out customer terminates immediately on first step."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_OPTOUT_FLOW",
        name="Opted Out User",
        email="opt@test.com",
        is_opted_out=True,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("200.00"),
        status="failed",
        failure_code="temporary_decline",
    )
    db.add(txn)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, txn.id)
    step_res = RecoveryEngine.execute_step(db=db, risk_id=risk.id)

    assert step_res.current_status == RiskStatus.STOPPED
    assert step_res.is_terminal is True
    assert step_res.stop_reason == StoppingReason.CUSTOMER_OPT_OUT.value


def test_high_value_escalation_workflow(db):
    """Verify high-value transaction ($1500) escalates directly to human operations."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_HIGH_VAL",
        name="Enterprise Client",
        email="enterprise@test.com",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("1500.00"),
        status="failed",
        failure_code="unknown_failure",
    )
    db.add(txn)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, txn.id)
    step_res = RecoveryEngine.execute_step(db=db, risk_id=risk.id)

    assert step_res.current_status == RiskStatus.ESCALATED
    assert step_res.is_terminal is True
    assert step_res.stop_reason == StoppingReason.ESCALATED_HIGH_VALUE.value


def test_seed_database_execution(db):
    """Verify synthetic dataset seeds realistic scenarios across all 5 failure types."""
    result = seed_database(db=db, reset=True)
    assert result["seeded_customers"] >= 7
    assert result["seeded_transactions"] >= 7
    assert result["seeded_risks"] >= 7

    # Query risks from DB and check failure types represented
    risks = db.query(RevenueRisk).all()
    types_found = {r.detected_failure_type for r in risks}
    assert "temporary_decline" in types_found
    assert "insufficient_funds" in types_found
    assert "expired_card" in types_found
    assert "network_error" in types_found
    assert "unknown_failure" in types_found
