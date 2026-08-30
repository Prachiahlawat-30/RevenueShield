"""Policy Playground API endpoints for interactive policy experimentation."""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.policy import Policy
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import RecoveryAction, FailureType
from app.schemas.tier2_schemas import PolicyPlaygroundRequest, PolicyPlaygroundResponse
from app.services.policy_engine import PolicyEngine

router = APIRouter(prefix="/policy", tags=["policy"])


@router.post("/playground", response_model=PolicyPlaygroundResponse, summary="Evaluate arbitrary transaction parameters in Policy Playground")
def evaluate_in_policy_playground(
    req: PolicyPlaygroundRequest = Body(...),
    db: Session = Depends(get_db),
) -> PolicyPlaygroundResponse:
    """Evaluate synthetic transaction parameters directly against the authoritative PolicyEngine."""
    active_policy = db.query(Policy).filter_by(is_active=True).first()

    # Determine AI recommendation based on failure type
    if req.failure_type == FailureType.EXPIRED_CARD:
        if req.card_expiry and req.card_expiry > "08/26":
            ai_rec = RecoveryAction.RETRY_PAYMENT
        else:
            ai_rec = RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE
    elif req.failure_type == FailureType.INSUFFICIENT_FUNDS:
        ai_rec = RecoveryAction.SEND_PAYMENT_REMINDER if req.attempt_count == 0 else RecoveryAction.RETRY_PAYMENT
    elif req.failure_type in [FailureType.TEMPORARY_DECLINE, FailureType.NETWORK_ERROR]:
        ai_rec = RecoveryAction.RETRY_PAYMENT
    else:
        ai_rec = RecoveryAction.ESCALATE_TO_HUMAN

    # Synthetic entity construction
    cust = Customer(
        id=uuid.uuid4(),
        external_id="PLAYGROUND_USER",
        name="Playground Evaluation Account",
        email="eval@playground.test",
        is_opted_out=req.is_customer_opted_out,
        risk_score=Decimal("20.00"),
        card_expiry=req.card_expiry,
    )

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=uuid.uuid4(),
        amount_at_risk=req.amount,
        detected_failure_type=req.failure_type.value,
        status="action_selected",
        attempt_count=req.attempt_count,
        last_attempt_at=datetime.now(timezone.utc) - timedelta(hours=req.hours_since_last_attempt),
    )

    # Build simulated past attempts
    past_attempts = []
    for i in range(req.attempt_count):
        past_attempts.append(
            RecoveryAttempt(
                id=uuid.uuid4(),
                revenue_risk_id=risk.id,
                attempt_number=i + 1,
                proposed_action="retry_payment",
                policy_approved=True,
                executed_action="retry_payment",
                execution_status="declined",
                amount_recovered=Decimal("0.00"),
                completed_at=datetime.now(timezone.utc) - timedelta(hours=req.hours_since_last_attempt),
            )
        )

    # Run authoritative PolicyEngine evaluation
    policy_eval = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=ai_rec,
        past_attempts=past_attempts,
        policy=active_policy,
        ignore_cooldown_for_demo=False,
    )

    labels = {
        RecoveryAction.RETRY_PAYMENT: "Retry Payment",
        RecoveryAction.SEND_PAYMENT_REMINDER: "Send Payment Reminder",
        RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: "Request Card Update",
        RecoveryAction.ESCALATE_TO_HUMAN: "Escalate to Human Operations",
        RecoveryAction.STOP: "Stop Workflow",
    }

    reasoning = (
        f"PolicyEngine {'APPROVED' if policy_eval.is_approved else 'BLOCKED'} proposed '{labels.get(ai_rec, ai_rec.value)}' "
        f"action. Effective outcome: '{labels.get(policy_eval.effective_action, policy_eval.effective_action.value)}'. "
        f"{('Rejection reason: ' + policy_eval.rejection_reason) if policy_eval.rejection_reason else 'All deterministic policy rules passed.'}"
    )

    return PolicyPlaygroundResponse(
        ai_recommendation=ai_rec,
        ai_recommendation_label=labels.get(ai_rec, ai_rec.value),
        policy_evaluation=policy_eval,
        final_action=policy_eval.effective_action,
        final_action_label=labels.get(policy_eval.effective_action, policy_eval.effective_action.value),
        reasoning=reasoning,
    )
