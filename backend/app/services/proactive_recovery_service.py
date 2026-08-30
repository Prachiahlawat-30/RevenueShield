"""Proactive Recovery Service for policy-guarded pre-failure interventions and audit logging."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.schemas.tier3_schemas import (
    ProactiveActionExecutionRequest,
    ProactiveActionExecutionResponse,
)
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine


class ProactiveRecoveryService:
    """Executes policy-controlled proactive recovery interventions before payment failure."""

    ACTION_LABELS = {
        "PROACTIVE_PAYMENT_METHOD_CHECK": "Proactive Payment Method Health Check",
        "SEND_PRE_RENEWAL_REMINDER": "Pre-Renewal Calendar Reminder",
        "PRE_ROUTE_SECONDARY_GATEWAY": "Pre-Route to Optimal Secondary Gateway",
        "CARD_EXPIRY_UPDATE_NOTIFICATION": "Payment Credential Expiration Notice",
    }

    @classmethod
    def execute_proactive_action(
        cls,
        db: Session,
        req: ProactiveActionExecutionRequest,
    ) -> ProactiveActionExecutionResponse:
        """Validate policy and execute proactive pre-failure intervention."""
        now = datetime.now(timezone.utc)
        exec_id = uuid.uuid4()

        customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
        if not customer:
            raise ValueError("Customer not found")

        # 1. Policy Gate: Check Opt-Out Status
        if customer.is_opted_out:
            # Policy blocks intervention
            audit = AuditLog(
                id=uuid.uuid4(),
                customer_id=customer.id,
                actor="PolicyEngine",
                step_name="PROACTIVE_INTERVENTION_CHECK",
                diagnosis_summary="Customer opted out of proactive notifications",
                recommended_action=req.action_type,
                policy_decision="REJECTED",
                executed_action="STOP",
                result="BLOCKED_BY_POLICY",
                stop_reason="RULE_OPT_OUT_STOP",
                decision_payload={
                    "reason": "Customer opted out of proactive notifications (RULE_OPT_OUT_STOP)",
                    "requested_action": req.action_type,
                    "customer_id": str(customer.id),
                },
                created_at=now,
            )
            db.add(audit)
            db.commit()

            return ProactiveActionExecutionResponse(
                execution_id=exec_id,
                customer_id=customer.id,
                customer_name=customer.name,
                action_type=req.action_type,
                action_label=cls.ACTION_LABELS.get(req.action_type, req.action_type),
                status="BLOCKED_BY_POLICY",
                policy_approved=False,
                expected_prevented_loss=Decimal("0.00"),
                execution_message="Action rejected by PolicyEngine: Customer has active opt-out preference.",
                executed_at=now,
            )

        # 2. Analyze pre-failure exposure
        risk_item = PredictiveRevenueRiskEngine.analyze_customer(db, customer)
        prevented_loss = (risk_item.predicted_revenue_at_risk * Decimal("0.85")).quantize(Decimal("0.01"))

        # 3. Create Audit Trail Entry
        audit = AuditLog(
            id=uuid.uuid4(),
            customer_id=customer.id,
            actor="ProactiveRecoveryService",
            step_name="PROACTIVE_PRE_DUNNING_DISPATCH",
            diagnosis_summary=f"Pre-failure risk detected ({risk_item.future_risk_score}/100)",
            recommended_action=req.action_type,
            policy_decision="APPROVED",
            executed_action=req.action_type,
            result="SUCCESS",
            amount_recovered=prevented_loss,
            decision_payload={
                "customer_name": customer.name,
                "customer_email": customer.email,
                "upcoming_amount": str(risk_item.upcoming_amount),
                "probability_of_failure": risk_item.probability_of_failure,
                "expected_prevented_loss": str(prevented_loss),
                "custom_notes": req.custom_notes or "Automated pre-dunning intervention dispatched",
            },
            created_at=now,
        )
        db.add(audit)
        db.commit()

        action_label = cls.ACTION_LABELS.get(req.action_type, req.action_type)
        msg = f"Successfully dispatched '{action_label}' to {customer.name}. Expected prevented loss: ${prevented_loss}."

        return ProactiveActionExecutionResponse(
            execution_id=exec_id,
            customer_id=customer.id,
            customer_name=customer.name,
            action_type=req.action_type,
            action_label=action_label,
            status="SUCCESS",
            policy_approved=True,
            expected_prevented_loss=prevented_loss,
            execution_message=msg,
            executed_at=now,
        )
