"""API endpoints for Hackathon Specialized Directions:
- B2B Receivables Chaser
- Promise-to-Pay (PTP) Tracker
- Mandate Retry Sequencer (UPI Autopay & eNACH)
- Hinglish & Localized Voice / WhatsApp Recovery Studio
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.hackathon_usecases import (
    B2BReceivablesSummary,
    PromiseToPayRecord,
    PromiseToPayCreateRequest,
    MandateSequencerSummary,
    MandateExecuteRequest,
    MandateExecuteResponse,
    ConversationalStudioGenerateRequest,
    ConversationalStudioResponse,
)
from app.services.b2b_receivables_service import B2BReceivablesService
from app.services.mandate_sequencer_service import MandateSequencerService
from app.services.conversational_recovery_service import ConversationalRecoveryService

router = APIRouter(prefix="/use-cases", tags=["hackathon-use-cases"])


# -----------------------------------------------------------------------------
# 1. B2B Receivables & Promise-to-Pay Endpoints
# -----------------------------------------------------------------------------

@router.get("/b2b-receivables", response_model=B2BReceivablesSummary, summary="Get B2B receivables overview across aging buckets")
def get_b2b_receivables_summary(db: Session = Depends(get_db)) -> B2BReceivablesSummary:
    """Retrieve multi-tier aging analysis (0-30d, 31-60d, 61-90d, 90d+) and corporate invoices."""
    return B2BReceivablesService.get_summary(db)


@router.post("/promise-to-pay", response_model=PromiseToPayRecord, summary="Record a new customer Promise-to-Pay commitment")
def record_promise_to_pay(
    req: PromiseToPayCreateRequest,
    db: Session = Depends(get_db),
) -> PromiseToPayRecord:
    """Record a promise-to-pay commitment, pause automated dunning sequences, and write to audit trail."""
    return B2BReceivablesService.record_promise_to_pay(db, req)


@router.post("/promise-to-pay/{ptp_id}/fulfill", response_model=PromiseToPayRecord, summary="Mark promise-to-pay as fulfilled")
def fulfill_promise_to_pay(
    ptp_id: str,
    db: Session = Depends(get_db),
) -> PromiseToPayRecord:
    """Mark a promise-to-pay as successfully settled."""
    try:
        return B2BReceivablesService.fulfill_promise_to_pay(db, ptp_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# -----------------------------------------------------------------------------
# 2. Mandate Retry Sequencer (UPI Autopay & eNACH) Endpoints
# -----------------------------------------------------------------------------

@router.get("/mandate-sequencer", response_model=MandateSequencerSummary, summary="Get scheduled mandate retries & salary cycle alignment")
def get_mandate_sequencer_summary(db: Session = Depends(get_db)) -> MandateSequencerSummary:
    """Get active UPI Autopay, eNACH, and card mandate retry schedule aligned with banking cycles."""
    return MandateSequencerService.get_summary(db)


@router.post("/mandate-sequencer/execute", response_model=MandateExecuteResponse, summary="Execute a scheduled mandate immediately")
def execute_mandate(
    req: MandateExecuteRequest,
    db: Session = Depends(get_db),
) -> MandateExecuteResponse:
    """Execute a scheduled mandate under policy constraints."""
    return MandateSequencerService.execute_mandate(db, req)


# -----------------------------------------------------------------------------
# 3. Hinglish & Localized Voice / WhatsApp Studio Endpoints
# -----------------------------------------------------------------------------

@router.post("/conversational-studio/generate", response_model=ConversationalStudioResponse, summary="Generate natural Hinglish voice IVR script or WhatsApp message")
def generate_conversational_flow(
    req: ConversationalStudioGenerateRequest,
    db: Session = Depends(get_db),
) -> ConversationalStudioResponse:
    """Generate culturally tailored, compliant conversational voice scripts and WhatsApp recovery templates."""
    return ConversationalRecoveryService.generate_conversational_flow(db, req)
