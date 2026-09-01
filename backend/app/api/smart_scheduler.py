"""API endpoints for Intelligent Retry Timing and Smart Retry Scheduling."""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.smart_retry_scheduler import SmartRetrySchedulerService, SmartRetryScheduleResult

router = APIRouter(prefix="/recovery/smart-schedule", tags=["Smart Retry Scheduler"])


@router.get(
    "/{risk_id}",
    response_model=SmartRetryScheduleResult,
    summary="Get predictive optimal retry time and customer history analysis",
)
def get_smart_retry_schedule(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> SmartRetryScheduleResult:
    """
    Analyze customer historical successful payments, determine failure type cooldown constraints,
    predict optimal retry window, and return scheduled execution time with explainable rationale.
    """
    try:
        return SmartRetrySchedulerService.analyze_and_schedule(db, risk_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{risk_id}/confirm",
    response_model=SmartRetryScheduleResult,
    summary="Confirm and lock in the scheduled smart retry execution",
)
def confirm_smart_retry_schedule(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> SmartRetryScheduleResult:
    """Confirm the scheduled smart retry, update risk step, and log to audit ledger."""
    try:
        return SmartRetrySchedulerService.confirm_schedule(db, risk_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
