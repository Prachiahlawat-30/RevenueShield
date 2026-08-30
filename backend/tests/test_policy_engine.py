"""Tests for PolicyEngine deterministic boundary and stopping rules."""

import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.schemas.enums import RecoveryAction, StoppingReason
from app.services.policy_engine import PolicyEngine


def test_policy_opt_out_rule():
    """Verify PolicyEngine immediately stops workflow if customer has opted out."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_OPTOUT",
        name="Opted Out User",
        email="optout@test.com",
        is_opted_out=True,
    )
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=cust.id,
        amount_at_risk=Decimal("150.00"),
        detected_failure_type="temporary_decline",
        status="detected",
    )

    verdict = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.RETRY_PAYMENT,
    )

    assert verdict.is_approved is False
    assert verdict.effective_action == RecoveryAction.STOP
    assert verdict.is_terminal_stop is True
    assert verdict.stop_reason == StoppingReason.CUSTOMER_OPT_OUT.value
    assert "RULE_OPT_OUT_STOP: TRIGGERED" in verdict.applied_rules


def test_policy_high_value_escalation_rule():
    """Verify PolicyEngine auto-escalates transactions exceeding the auto-recovery ceiling ($1000)."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_VIP",
        name="Enterprise Client",
        email="vip@corp.com",
        is_opted_out=False,
    )
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=cust.id,
        amount_at_risk=Decimal("1500.00"),  # > $1000 threshold
        detected_failure_type="temporary_decline",
        status="detected",
    )

    verdict = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.RETRY_PAYMENT,
    )

    assert verdict.is_approved is True
    assert verdict.effective_action == RecoveryAction.ESCALATE_TO_HUMAN
    assert verdict.requires_escalation is True
    assert verdict.stop_reason == StoppingReason.ESCALATED_HIGH_VALUE.value


def test_policy_max_attempts_rule():
    """Verify PolicyEngine prevents exceeding the maximum allowable retry attempts (3)."""
    cust = Customer(id=uuid.uuid4(), external_id="CUST_MAX", name="Max User", email="max@test.com", is_opted_out=False)
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=cust.id,
        amount_at_risk=Decimal("300.00"),
        detected_failure_type="temporary_decline",
        status="detected",
    )

    # 3 existing attempts
    attempts = [
        RecoveryAttempt(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            attempt_number=i,
            proposed_action="retry_payment",
            policy_approved=True,
            execution_status="declined",
            amount_recovered=Decimal("0.00"),
        )
        for i in range(1, 4)
    ]

    verdict = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.RETRY_PAYMENT,
        past_attempts=attempts,
    )

    assert verdict.effective_action in [RecoveryAction.ESCALATE_TO_HUMAN, RecoveryAction.STOP]
    assert verdict.is_terminal_stop is True
    assert verdict.stop_reason in [
        StoppingReason.MAX_ATTEMPTS_EXCEEDED.value,
        StoppingReason.ESCALATED_EXHAUSTED.value,
    ]


def test_policy_cooldown_enforcement():
    """Verify PolicyEngine blocks attempts if cooldown window has not elapsed."""
    cust = Customer(id=uuid.uuid4(), external_id="CUST_COOL", name="Cool User", email="cool@test.com", is_opted_out=False)
    recent_time = datetime.now(timezone.utc) - timedelta(minutes=5)
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=cust.id,
        amount_at_risk=Decimal("100.00"),
        detected_failure_type="temporary_decline",
        status="detected",
        last_attempt_at=recent_time,
    )

    past_attempt = RecoveryAttempt(
        id=uuid.uuid4(),
        revenue_risk_id=risk.id,
        attempt_number=1,
        proposed_action="retry_payment",
        policy_approved=True,
        execution_status="declined",
        amount_recovered=Decimal("0.00"),
        initiated_at=recent_time,
    )

    verdict = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.RETRY_PAYMENT,
        past_attempts=[past_attempt],
        ignore_cooldown_for_demo=False,
    )

    assert verdict.is_approved is False
    assert verdict.stop_reason == StoppingReason.COOLDOWN_ACTIVE.value
    assert "Cooldown active" in (verdict.rejection_reason or "")


def test_policy_already_recovered_rule():
    """Verify PolicyEngine stops immediately if payment is already recovered."""
    cust = Customer(id=uuid.uuid4(), external_id="CUST_REC", name="Paid User", email="paid@test.com", is_opted_out=False)
    risk = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=cust.id,
        amount_at_risk=Decimal("100.00"),
        amount_recovered=Decimal("100.00"),
        detected_failure_type="temporary_decline",
        status="recovered",
    )

    verdict = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.RETRY_PAYMENT,
    )

    assert verdict.is_approved is False
    assert verdict.effective_action == RecoveryAction.STOP
    assert verdict.stop_reason == StoppingReason.SUCCESS_STOP.value
