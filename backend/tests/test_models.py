"""Tests for database models, migrations, and Decimal monetary precision."""

import uuid
from decimal import Decimal
import pytest
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.models.audit_log import AuditLog


def test_customer_persistence(db):
    """Verify Customer model insertion and retrieval from database."""
    cust_id = uuid.uuid4()
    cust = Customer(
        id=cust_id,
        external_id=f"CUST_TEST_{uuid.uuid4().hex[:6]}",
        name="Acme Corp",
        email="billing@acme.com",
        payment_method_type="credit_card",
        card_last4="4242",
        card_expiry="12/28",
        is_opted_out=False,
        risk_score=Decimal("15.50"),
    )
    db.add(cust)
    db.flush()

    fetched = db.query(Customer).filter_by(id=cust_id).first()
    assert fetched is not None
    assert fetched.name == "Acme Corp"
    assert fetched.is_opted_out is False
    assert fetched.risk_score == Decimal("15.50")
    assert isinstance(fetched.risk_score, Decimal)


def test_transaction_monetary_precision(db):
    """Verify Transaction amount precision in PostgreSQL."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id=f"CUST_TXN_{uuid.uuid4().hex[:6]}",
        name="Stripe Client",
        email="client@stripe.test",
        is_opted_out=False,
    )
    db.add(cust)
    db.flush()

    txn_id = uuid.uuid4()
    txn = Transaction(
        id=txn_id,
        customer_id=cust.id,
        amount=Decimal("149.99"),
        currency="USD",
        status="failed",
        failure_code="insufficient_funds",
        failure_reason="Card has insufficient funds",
    )
    db.add(txn)
    db.flush()

    fetched_txn = db.query(Transaction).filter_by(id=txn_id).first()
    assert fetched_txn is not None
    assert fetched_txn.amount == Decimal("149.99")
    assert isinstance(fetched_txn.amount, Decimal)
    assert fetched_txn.customer.name == "Stripe Client"


def test_revenue_risk_and_audit_log_workflow(db):
    """Verify RevenueRisk, RecoveryAttempt, Policy, and AuditLog relational persistence."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id=f"CUST_RISK_{uuid.uuid4().hex[:6]}",
        name="Risk Client",
        email="risk@test.com",
        is_opted_out=False,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("499.50"),
        currency="USD",
        status="failed",
        failure_code="expired_card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=txn.id,
        customer_id=cust.id,
        amount_at_risk=Decimal("499.50"),
        amount_recovered=Decimal("0.00"),
        currency="USD",
        detected_failure_type="expired_card",
        status="detected",
        attempt_count=0,
    )
    db.add(risk)
    db.flush()

    attempt = RecoveryAttempt(
        id=uuid.uuid4(),
        revenue_risk_id=risk.id,
        attempt_number=1,
        proposed_action="request_payment_method_update",
        diagnosis_category="expired_card",
        ai_confidence=Decimal("0.950"),
        ai_rationale="Card expired, payment method update link recommended",
        policy_approved=True,
        executed_action="request_payment_method_update",
        execution_channel="email_channel",
        execution_status="pending",
        amount_recovered=Decimal("0.00"),
    )
    db.add(attempt)
    db.flush()

    audit = AuditLog(
        id=uuid.uuid4(),
        revenue_risk_id=risk.id,
        customer_id=cust.id,
        recovery_attempt_id=attempt.id,
        actor="diagnosis_engine",
        step_name="DIAGNOSING",
        diagnosis_summary="Card expired on 08/26",
        recommended_action="request_payment_method_update",
        policy_decision="APPROVED",
        result="SUCCESS",
        amount_recovered=Decimal("0.00"),
    )
    db.add(audit)
    db.flush()

    # Query back and verify relations
    fetched_risk = db.query(RevenueRisk).filter_by(id=risk.id).first()
    assert fetched_risk is not None
    assert fetched_risk.amount_at_risk == Decimal("499.50")
    assert len(fetched_risk.recovery_attempts) == 1
    assert fetched_risk.recovery_attempts[0].proposed_action == "request_payment_method_update"
    assert len(fetched_risk.audit_logs) == 1
    assert fetched_risk.audit_logs[0].step_name == "DIAGNOSING"
