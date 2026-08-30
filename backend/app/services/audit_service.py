"""AuditService for maintaining an immutable, append-only decision and event log."""

import json
import uuid
from decimal import Decimal
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def _sanitize_payload(payload: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Recursively convert Decimals, UUIDs, and datetimes to JSON-compatible types."""
    if payload is None:
        return None
    try:
        return json.loads(json.dumps(payload, default=str))
    except Exception:
        return {"raw": str(payload)}


class AuditService:
    """Service to create immutable audit trail records."""

    @staticmethod
    def log_event(
        db: Session,
        actor: str,
        step_name: str,
        revenue_risk_id: Optional[uuid.UUID] = None,
        customer_id: Optional[uuid.UUID] = None,
        recovery_attempt_id: Optional[uuid.UUID] = None,
        diagnosis_summary: Optional[str] = None,
        recommended_action: Optional[str] = None,
        policy_decision: Optional[str] = None,
        executed_action: Optional[str] = None,
        result: Optional[str] = None,
        amount_recovered: Optional[Decimal] = None,
        stop_reason: Optional[str] = None,
        input_payload: Optional[Dict[str, Any]] = None,
        decision_payload: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Create and persist an immutable audit log entry."""
        audit_entry = AuditLog(
            id=uuid.uuid4(),
            revenue_risk_id=revenue_risk_id,
            customer_id=customer_id,
            recovery_attempt_id=recovery_attempt_id,
            actor=actor,
            step_name=step_name,
            diagnosis_summary=diagnosis_summary,
            recommended_action=recommended_action,
            policy_decision=policy_decision,
            executed_action=executed_action,
            result=result,
            amount_recovered=amount_recovered,
            stop_reason=stop_reason,
            input_payload=_sanitize_payload(input_payload),
            decision_payload=_sanitize_payload(decision_payload),
        )
        db.add(audit_entry)
        db.flush()
        return audit_entry
