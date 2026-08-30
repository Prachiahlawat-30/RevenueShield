"""Tests for DiagnosisEngine structured AI recommendations and deterministic fallbacks."""

import uuid
from decimal import Decimal
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import FailureType, RecoveryAction
from app.services.diagnosis_engine import DiagnosisEngine


def test_fallback_diagnosis_expired_card():
    """Verify expired card diagnosis recommends payment method update link."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_EXP",
        name="Alice Expired",
        email="alice@test.com",
        card_last4="1234",
        card_expiry="05/26",  # Expired
    )
    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("120.00"),
        status="failed",
        failure_code="expired_card",
    )
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=txn.id,
        customer_id=cust.id,
        amount_at_risk=Decimal("120.00"),
        detected_failure_type="expired_card",
        status="detected",
    )

    diag = DiagnosisEngine.diagnose_risk(risk=risk, customer=cust, transaction=txn)
    assert diag.failure_category == FailureType.EXPIRED_CARD
    assert diag.recommended_action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE
    assert diag.confidence_score >= 0.90
    assert "expired" in diag.action_rationale.lower()


def test_fallback_diagnosis_insufficient_funds_progression():
    """Verify insufficient funds recommends reminder on attempt 0, and retry on attempt 1."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_FUNDS",
        name="Bob LowBalance",
        email="bob@test.com",
    )
    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("450.00"),
        status="failed",
        failure_code="insufficient_funds",
    )
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=txn.id,
        customer_id=cust.id,
        amount_at_risk=Decimal("450.00"),
        detected_failure_type="insufficient_funds",
        status="detected",
    )

    # First attempt: should suggest payment reminder
    diag_1 = DiagnosisEngine.diagnose_risk(risk=risk, customer=cust, transaction=txn, past_attempts=[])
    assert diag_1.recommended_action == RecoveryAction.SEND_PAYMENT_REMINDER
    assert diag_1.suggested_cooldown_hours == 24

    # Second attempt (after reminder sent): should suggest retry_payment
    dummy_attempt = RecoveryAttempt(
        id=uuid.uuid4(),
        revenue_risk_id=risk.id,
        attempt_number=1,
        proposed_action="send_payment_reminder",
        policy_approved=True,
        execution_status="succeeded",
        amount_recovered=Decimal("0.00"),
    )
    diag_2 = DiagnosisEngine.diagnose_risk(risk=risk, customer=cust, transaction=txn, past_attempts=[dummy_attempt])
    assert diag_2.recommended_action == RecoveryAction.RETRY_PAYMENT


def test_fallback_diagnosis_network_error():
    """Verify network error recommends immediate retry."""
    cust = Customer(id=uuid.uuid4(), external_id="CUST_NET", name="Carol Net", email="carol@test.com")
    txn = Transaction(id=uuid.uuid4(), customer_id=cust.id, amount=Decimal("299.00"), status="failed", failure_code="network_error")
    risk = RevenueRisk(id=uuid.uuid4(), transaction_id=txn.id, customer_id=cust.id, amount_at_risk=Decimal("299.00"), detected_failure_type="network_error", status="detected")

    diag = DiagnosisEngine.diagnose_risk(risk=risk, customer=cust, transaction=txn)
    assert diag.failure_category == FailureType.NETWORK_ERROR
    assert diag.recommended_action == RecoveryAction.RETRY_PAYMENT
    assert diag.suggested_cooldown_hours == 1
