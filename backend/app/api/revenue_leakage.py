"""Revenue Leakage API endpoints for multidimensional leakage radar and executive analytics."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier2_schemas import (
    RevenueLeakageSummaryResponse,
    ExecutiveLeakageSummary,
    RecoveryROIResponse,
)
from app.services.revenue_leakage_service import RevenueLeakageService
from app.services.recovery_roi_engine import RecoveryROIEngine

router = APIRouter(prefix="/revenue-leakage", tags=["revenue-leakage"])


@router.get("/summary", response_model=RevenueLeakageSummaryResponse, summary="Get full revenue leakage radar summary")
def get_leakage_radar(db: Session = Depends(get_db)) -> RevenueLeakageSummaryResponse:
    """Return multidimensional revenue leakage breakdown by failure type, gateway, payment method, customer segment, and merchant."""
    return RevenueLeakageService.get_leakage_summary(db)


@router.get("/executive", response_model=ExecutiveLeakageSummary, summary="Get executive revenue leakage briefing")
def get_executive_leakage_briefing(db: Session = Depends(get_db)) -> ExecutiveLeakageSummary:
    """Return high-level executive revenue leakage metrics and primary failure/recovery sources."""
    return RevenueLeakageService.get_executive_summary(db)


@router.get("/roi", response_model=RecoveryROIResponse, summary="Get portfolio recovery ROI and attribution")
def get_recovery_roi(db: Session = Depends(get_db)) -> RecoveryROIResponse:
    """Calculate net recovered revenue, ROI multiplier, and attribution by action, failure type, strategy, and gateway."""
    return RecoveryROIEngine.calculate_roi_and_attribution(db)
