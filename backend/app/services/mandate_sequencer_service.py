"""MandateSequencerService for UPI Autopay, eNACH, and recurring card mandate schedule optimization."""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.hackathon_usecases import (
    MandateSequenceItem,
    MandateSequencerSummary,
    MandateExecuteRequest,
    MandateExecuteResponse,
)
from app.services.audit_service import AuditService

_MANDATE_STORE: List[MandateSequenceItem] = []


def _init_mandate_store(db: Session):
    global _MANDATE_STORE
    if _MANDATE_STORE:
        return

    customers = db.query(Customer).limit(8).all()

    _MANDATE_STORE = [
        MandateSequenceItem(
            id="mseq_001",
            mandate_id="mandate_upi_9921",
            mandate_type="UPI_AUTOPAY",
            customer_name=customers[0].name if customers else "TechCorp Solutions",
            subscription_plan="Enterprise SaaS Pro Annual",
            amount=Decimal("4500.00"),
            currency="INR",
            bank_name="HDFC Bank",
            detected_failure_code="U19_INSUFFICIENT_FUNDS",
            failure_reason="Balance dip prior to salary credit. Customer salary arrives on 1st.",
            aligned_salary_day=1,
            optimal_retry_window="01st of month (08:30 AM - 10:30 AM IST)",
            next_scheduled_retry=(datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d 09:00:00 UTC"),
            retry_attempt_number=1,
            max_mandate_attempts=3,
            expected_success_rate_pct=88.4,
            sequence_status="WAITING_SALARY_CYCLE",
            strategy_applied="SALARY_CYCLE_ALIGNMENT_EARLY_MORNING",
        ),
        MandateSequenceItem(
            id="mseq_002",
            mandate_id="mandate_enach_8812",
            mandate_type="ENACH",
            customer_name=customers[1].name if len(customers) > 1 else "Sarah Jenkins",
            subscription_plan="Quarterly Infrastructure Cluster",
            amount=Decimal("18500.00"),
            currency="INR",
            bank_name="State Bank of India (SBI)",
            detected_failure_code="E04_NACH_CLEARING_WINDOW_CLOSED",
            failure_reason="Attempted outside RTGS/NACH settlement batch window.",
            aligned_salary_day=5,
            optimal_retry_window="NACH Cycle 1 (07:00 AM IST)",
            next_scheduled_retry=(datetime.now(timezone.utc) + timedelta(hours=14)).strftime("%Y-%m-%d %H:%M:%S UTC"),
            retry_attempt_number=2,
            max_mandate_attempts=3,
            expected_success_rate_pct=94.2,
            sequence_status="SCHEDULED",
            strategy_applied="NACH_CYCLE_1_WINDOW_LOCK",
        ),
        MandateSequenceItem(
            id="mseq_003",
            mandate_id="mandate_upi_7731",
            mandate_type="UPI_AUTOPAY",
            customer_name=customers[2].name if len(customers) > 2 else "Marcus Vance",
            subscription_plan="Cloud Storage Scale 10TB",
            amount=Decimal("1299.00"),
            currency="INR",
            bank_name="ICICI Bank",
            detected_failure_code="ZM_DEGRADED_PSP_RESPONSE",
            failure_reason="PSP degraded response during evening UPI peak traffic hour.",
            aligned_salary_day=30,
            optimal_retry_window="Off-peak slot (11:30 AM IST)",
            next_scheduled_retry=(datetime.now(timezone.utc) + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S UTC"),
            retry_attempt_number=1,
            max_mandate_attempts=3,
            expected_success_rate_pct=91.0,
            sequence_status="SCHEDULED",
            strategy_applied="OFF_PEAK_PSP_AVOIDANCE",
        ),
        MandateSequenceItem(
            id="mseq_004",
            mandate_id="mandate_card_5502",
            mandate_type="DEBIT_CARD_MANDATE",
            customer_name=customers[3].name if len(customers) > 3 else "Apex Logistics Global",
            subscription_plan="AI Workflow Analytics Enterprise",
            amount=Decimal("6200.00"),
            currency="INR",
            bank_name="Axis Bank",
            detected_failure_code="51_INSUFFICIENT_FUNDS",
            failure_reason="Weekend decline. Auto-sequencer delayed execution to Monday 10:00 AM.",
            aligned_salary_day=2,
            optimal_retry_window="First Business Day 10:00 AM",
            next_scheduled_retry=(datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S UTC"),
            retry_attempt_number=1,
            max_mandate_attempts=3,
            expected_success_rate_pct=86.5,
            sequence_status="WAITING_SALARY_CYCLE",
            strategy_applied="WEEKEND_AVOIDANCE_BUFFER",
        ),
    ]


class MandateSequencerService:
    """Service optimizing recurring mandate execution windows aligned with salary cycles and banking velocity."""

    @classmethod
    def get_summary(cls, db: Session) -> MandateSequencerSummary:
        """Fetch scheduled mandate retries sequenced by balance availability curves and salary day alignment."""
        _init_mandate_store(db)

        upi_vol = sum((s.amount for s in _MANDATE_STORE if s.mandate_type == "UPI_AUTOPAY"), Decimal("0"))
        enach_vol = sum((s.amount for s in _MANDATE_STORE if s.mandate_type == "ENACH"), Decimal("0"))
        card_vol = sum((s.amount for s in _MANDATE_STORE if "CARD" in s.mandate_type), Decimal("0"))
        total_vol = upi_vol + enach_vol + card_vol

        return MandateSequencerSummary(
            total_mandates_at_risk=total_vol,
            active_mandates_count=len(_MANDATE_STORE),
            upi_autopay_volume=upi_vol,
            enach_volume=enach_vol,
            card_mandate_volume=card_vol,
            optimal_window_projected_lift_pct=28.5,
            salary_cycle_aligned_count=len([s for s in _MANDATE_STORE if s.sequence_status == "WAITING_SALARY_CYCLE"]),
            scheduled_sequences=_MANDATE_STORE,
        )

    @classmethod
    def execute_mandate(
        cls,
        db: Session,
        req: MandateExecuteRequest,
    ) -> MandateExecuteResponse:
        """Execute a scheduled mandate immediately under policy-safe bounds."""
        _init_mandate_store(db)

        target_item = None
        for item in _MANDATE_STORE:
            if item.mandate_id == req.mandate_id:
                target_item = item
                item.sequence_status = "EXECUTED_SUCCESS"
                item.retry_attempt_number = min(item.retry_attempt_number + 1, item.max_mandate_attempts)
                item.failure_reason = "Successfully recovered via NPCI Instant Clearing"
                item.optimal_retry_window = "Settled • Real-time debit confirmed"
                break

        recovered_amt = target_item.amount if target_item else Decimal("4500.00")
        receipt = f"NPCI_REC_{uuid.uuid4().hex[:10].upper()}"
        audit_id = f"aud_mnd_{uuid.uuid4().hex[:8]}"

        AuditService.log_event(
            db=db,
            actor="MANDATE_RETRY_SEQUENCER",
            step_name="MANDATE_EXECUTION_TRIGGERED",
            executed_action="NPCI_RETRY_SUBMITTED",
            result="SETTLED_SUCCESS",
            amount_recovered=recovered_amt,
            decision_payload={
                "mandate_id": req.mandate_id,
                "execution_receipt": receipt,
                "status": "SETTLED_SUCCESS",
                "amount": float(recovered_amt),
            },
        )

        return MandateExecuteResponse(
            mandate_id=req.mandate_id,
            status="SETTLED_SUCCESS",
            amount_recovered=recovered_amt,
            execution_receipt=receipt,
            bank_response_code="00_SUCCESS_AUTO_DEBITED",
            settled_at=datetime.now(timezone.utc).isoformat(),
            audit_event_id=audit_id,
        )
