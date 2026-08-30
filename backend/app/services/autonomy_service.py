"""AutonomyService managing controlled autonomy levels, approval queues, and human-in-the-loop decisions."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.models.audit_log import AuditLog
from app.schemas.enums import RecoveryAction
from app.schemas.tier3_schemas import (
    AutonomyMode,
    AutonomyConfigResponse,
    ApprovalQueueItem,
    HumanApprovalActionRequest,
    HumanApprovalActionResponse,
)
from app.services.recovery_engine import RecoveryEngine
from app.services.risk_engine import RiskStatus


class AutonomyService:
    """Manages system autonomy configuration (MANUAL, ASSISTED, AUTOMATIC) and the human approval queue."""

    _CURRENT_MODE: AutonomyMode = AutonomyMode.AUTOMATIC
    _LAST_UPDATED: datetime = datetime.now(timezone.utc)

    @classmethod
    def get_current_mode(cls) -> AutonomyMode:
        """Get the current global autonomy mode."""
        return cls._CURRENT_MODE

    @classmethod
    def set_current_mode(cls, mode: AutonomyMode) -> AutonomyMode:
        """Update the active global autonomy mode."""
        cls._CURRENT_MODE = mode
        cls._LAST_UPDATED = datetime.now(timezone.utc)
        return cls._CURRENT_MODE

    @classmethod
    def get_config(cls) -> AutonomyConfigResponse:
        """Return the active autonomy control configuration and checklist."""
        auto_actions = [
            "Retry low-value network/soft decline payments (< $1,000)",
            "Schedule payment reminder within contact limits",
            "Generate payment method update portal links",
            "Pre-route renewal through secondary payment gateways",
        ]
        human_req = [
            "High-value transactions (≥ $1,000.00)",
            "Repeated failures (≥ 2 prior attempts)",
            "Customer-sensitive and high churn-risk accounts",
            "Unknown or suspicious processor decline codes",
        ]
        return AutonomyConfigResponse(
            current_mode=cls._CURRENT_MODE,
            automatic_actions=auto_actions,
            human_approval_required=human_req,
            safety_warning="Financial actions remain strictly subject to PolicyEngine deterministic controls and customer opt-out preferences.",
            last_updated_at=cls._LAST_UPDATED,
        )

    @classmethod
    def get_approval_queue(cls, db: Session) -> List[ApprovalQueueItem]:
        """Fetch transactions currently waiting in the Human Approval Queue."""
        # Find risks requiring human review: escalated status, amount >= 1000, attempt_count >= 2, or unknown failure
        risks = (
            db.query(RevenueRisk)
            .filter(
                (RevenueRisk.status == "escalated")
                | (RevenueRisk.amount_at_risk >= Decimal("1000.00"))
                | (RevenueRisk.detected_failure_type == "unknown_failure")
            )
            .order_by(RevenueRisk.amount_at_risk.desc())
            .all()
        )

        items: List[ApprovalQueueItem] = []
        for r in risks:
            if r.status in ["recovered", "resolved"]:
                continue

            cust = r.customer
            amt = r.amount_at_risk or Decimal("0.00")

            if amt >= Decimal("1000.00"):
                urgency = "HIGH_VALUE"
                policy_reason = f"Transaction amount (${amt:,.2f}) exceeds $1,000 auto-recovery threshold."
                rec = "Specialist manual outreach / secondary gateway routing"
            elif r.detected_failure_type == "unknown_failure":
                urgency = "UNKNOWN_FAILURE"
                policy_reason = "Unrecognized processor decline code requires manual verification."
                rec = "Investigate processor decline logs and contact issuing bank"
            elif r.attempt_count >= 2:
                urgency = "REPEATED_FAILURE"
                policy_reason = f"Exhausted {r.attempt_count} automated attempts without settlement."
                rec = "Direct executive escalation to client finance desk"
            else:
                urgency = "SENSITIVE_ACCOUNT"
                policy_reason = "High churn risk account requires human-in-the-loop signoff."
                rec = "Review customer dunning history before approving"

            exp_rec = (amt * Decimal("0.80")).quantize(Decimal("0.01"))

            items.append(
                ApprovalQueueItem(
                    id=r.id,
                    risk_id=r.id,
                    customer_id=r.customer_id,
                    customer_name=cust.name if cust else "Unknown Customer",
                    customer_email=cust.email if cust else "unknown@test.com",
                    merchant_name=(cust.merchant.name if (cust and cust.merchant) else "Acme Merchant"),
                    amount=amt,
                    urgency_tag=urgency,
                    ai_recommendation=rec,
                    policy_reason=policy_reason,
                    expected_recovery=exp_rec,
                    status="PENDING_APPROVAL",
                    requested_at=r.created_at or datetime.now(timezone.utc),
                )
            )

        return items

    @classmethod
    def approve_item(
        cls,
        db: Session,
        risk_id: uuid.UUID,
        req: Optional[HumanApprovalActionRequest] = None,
    ) -> HumanApprovalActionResponse:
        """Human operator approves and executes the queued recovery action."""
        now = datetime.now(timezone.utc)
        risk = db.query(RevenueRisk).filter(RevenueRisk.id == risk_id).first()
        if not risk:
            raise ValueError("RevenueRisk not found")

        # 1. Execute recovery step
        step_res = RecoveryEngine.execute_step(db=db, risk_id=risk.id)

        # 2. Write Audit Log for Human Approval
        audit = AuditLog(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            customer_id=risk.customer_id,
            actor="HumanOperator",
            step_name="HUMAN_APPROVAL_QUEUE",
            diagnosis_summary=f"Human operator approved action for risk {risk.id}",
            recommended_action=step_res.diagnosis.recommended_action.value if hasattr(step_res.diagnosis.recommended_action, "value") else str(step_res.diagnosis.recommended_action),
            policy_decision="APPROVED",
            executed_action=step_res.diagnosis.recommended_action.value if hasattr(step_res.diagnosis.recommended_action, "value") else str(step_res.diagnosis.recommended_action),
            result="HUMAN_APPROVED",
            amount_recovered=step_res.amount_recovered,
            decision_payload={
                "operator_notes": req.operator_notes if req else "Approved from /approval-queue",
                "autonomy_mode": cls._CURRENT_MODE.value,
                "amount_at_risk": str(risk.amount_at_risk),
            },
            created_at=now,
        )
        db.add(audit)
        db.commit()

        return HumanApprovalActionResponse(
            risk_id=risk.id,
            action="APPROVE",
            new_status=step_res.current_status.value if hasattr(step_res.current_status, "value") else str(step_res.current_status),
            audit_event_logged="HUMAN_APPROVED",
            message=f"Action successfully approved and executed. New status: {step_res.current_status}.",
            processed_at=now,
        )

    @classmethod
    def reject_item(
        cls,
        db: Session,
        risk_id: uuid.UUID,
        req: Optional[HumanApprovalActionRequest] = None,
    ) -> HumanApprovalActionResponse:
        """Human operator rejects and halts recovery on the queued item."""
        now = datetime.now(timezone.utc)
        risk = db.query(RevenueRisk).filter(RevenueRisk.id == risk_id).first()
        if not risk:
            raise ValueError("RevenueRisk not found")

        risk.status = "stopped"
        db.commit()

        audit = AuditLog(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            customer_id=risk.customer_id,
            actor="HumanOperator",
            step_name="HUMAN_APPROVAL_QUEUE",
            diagnosis_summary="Human operator rejected automated recovery execution",
            policy_decision="REJECTED",
            executed_action="STOP",
            result="HUMAN_REJECTED",
            stop_reason="OPERATOR_MANUAL_REJECT",
            decision_payload={
                "operator_notes": req.operator_notes if req else "Rejected from /approval-queue",
                "autonomy_mode": cls._CURRENT_MODE.value,
            },
            created_at=now,
        )
        db.add(audit)
        db.commit()

        return HumanApprovalActionResponse(
            risk_id=risk.id,
            action="REJECT",
            new_status="stopped",
            audit_event_logged="HUMAN_REJECTED",
            message="Recovery action rejected. Workflow halted under operator instruction.",
            processed_at=now,
        )

    @classmethod
    def escalate_item(
        cls,
        db: Session,
        risk_id: uuid.UUID,
        req: Optional[HumanApprovalActionRequest] = None,
    ) -> HumanApprovalActionResponse:
        """Human operator escalates queued item to dedicated high-touch operations desk."""
        now = datetime.now(timezone.utc)
        risk = db.query(RevenueRisk).filter(RevenueRisk.id == risk_id).first()
        if not risk:
            raise ValueError("RevenueRisk not found")

        risk.status = "escalated"
        db.commit()

        audit = AuditLog(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            customer_id=risk.customer_id,
            actor="HumanOperator",
            step_name="HUMAN_APPROVAL_QUEUE",
            diagnosis_summary="Human operator escalated case to high-touch operations desk",
            policy_decision="ESCALATED",
            executed_action="ESCALATE_TO_HUMAN",
            result="HUMAN_ESCALATED",
            stop_reason="OPERATOR_MANUAL_ESCALATION",
            decision_payload={
                "operator_notes": req.operator_notes if req else "Escalated from /approval-queue",
                "autonomy_mode": cls._CURRENT_MODE.value,
            },
            created_at=now,
        )
        db.add(audit)
        db.commit()

        return HumanApprovalActionResponse(
            risk_id=risk.id,
            action="ESCALATE",
            new_status="escalated",
            audit_event_logged="HUMAN_ESCALATED",
            message="Case escalated to dedicated high-touch account management desk.",
            processed_at=now,
        )
