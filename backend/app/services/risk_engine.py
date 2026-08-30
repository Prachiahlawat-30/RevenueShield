"""RiskEngine for detecting payment failures and calculating revenue at risk."""

import uuid
from typing import Optional
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.schemas.enums import FailureType, RiskStatus, ActorType
from app.services.audit_service import AuditService


class RiskEngine:
    """Detects payment failures, categorizes failure types, and calculates revenue at risk."""

    @staticmethod
    def map_failure_type(failure_code: Optional[str], failure_reason: Optional[str] = None) -> FailureType:
        """Map raw failure code or message to standard FailureType enum."""
        code = (failure_code or "").lower().strip()
        reason = (failure_reason or "").lower().strip()

        # Check explicit exact codes first
        if code == "unknown_failure":
            return FailureType.UNKNOWN_FAILURE
        elif code == "expired_card":
            return FailureType.EXPIRED_CARD
        elif code == "insufficient_funds":
            return FailureType.INSUFFICIENT_FUNDS
        elif code == "network_error":
            return FailureType.NETWORK_ERROR
        elif code == "temporary_decline":
            return FailureType.TEMPORARY_DECLINE

        combined = f"{code} {reason}"

        if any(term in combined for term in ["expired", "card_expired", "invalid_expiry", "54"]):
            return FailureType.EXPIRED_CARD
        elif any(term in combined for term in ["insufficient", "not_enough", "funds", "balance", "51"]):
            return FailureType.INSUFFICIENT_FUNDS
        elif any(term in combined for term in ["timeout", "network", "system_error", "gateway_error", "91"]):
            return FailureType.NETWORK_ERROR
        elif any(term in combined for term in ["temporary", "decline", "do_not_honor", "processor_decline", "05"]):
            return FailureType.TEMPORARY_DECLINE
        else:
            return FailureType.UNKNOWN_FAILURE

    @classmethod
    def process_failed_transaction(
        cls,
        db: Session,
        transaction_id: uuid.UUID,
    ) -> RevenueRisk:
        """Evaluate a failed transaction, calculate revenue at risk, and instantiate a RevenueRisk record."""
        transaction = db.query(Transaction).filter_by(id=transaction_id).first()
        if not transaction:
            raise ValueError(f"Transaction with ID {transaction_id} not found.")

        # Check if a RevenueRisk already exists for this transaction
        existing_risk = db.query(RevenueRisk).filter_by(transaction_id=transaction_id).first()
        if existing_risk:
            return existing_risk

        detected_type = cls.map_failure_type(
            transaction.failure_code,
            transaction.failure_reason,
        )

        revenue_risk = RevenueRisk(
            id=uuid.uuid4(),
            transaction_id=transaction.id,
            customer_id=transaction.customer_id,
            amount_at_risk=transaction.amount,
            amount_recovered=0.00,
            currency=transaction.currency,
            detected_failure_type=detected_type.value,
            status=RiskStatus.DETECTED.value,
            current_step="DETECTED",
            attempt_count=0,
        )

        db.add(revenue_risk)
        db.flush()

        # Write immutable audit trail record for detection
        AuditService.log_event(
            db=db,
            actor=ActorType.RISK_ENGINE.value,
            step_name="DETECTED",
            revenue_risk_id=revenue_risk.id,
            customer_id=transaction.customer_id,
            diagnosis_summary=f"Payment failure detected: {detected_type.value}. Amount at risk: {transaction.amount} {transaction.currency}.",
            result="DETECTED",
            amount_recovered=0.00,
            input_payload={
                "transaction_id": str(transaction.id),
                "amount": str(transaction.amount),
                "currency": transaction.currency,
                "failure_code": transaction.failure_code,
                "failure_reason": transaction.failure_reason,
            },
            decision_payload={
                "detected_failure_type": detected_type.value,
                "amount_at_risk": str(revenue_risk.amount_at_risk),
                "initial_status": revenue_risk.status,
            },
        )

        db.flush()
        return revenue_risk
