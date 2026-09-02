"""Global Payment Intelligence API router for cross-region, gateway, method, and failure pattern observability."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.global_intelligence import GlobalIntelligenceResponse
from app.services.global_intelligence_service import GlobalPaymentIntelligenceService

router = APIRouter(prefix="/global-intelligence", tags=["global-intelligence"])


@router.get("/summary", response_model=GlobalIntelligenceResponse, summary="Get global payment intelligence command center summary")
def get_global_payment_intelligence(
    region: Optional[str] = Query(None, description="Optional region filter (e.g. India, United States, Europe, APAC)"),
    gateway: Optional[str] = Query(None, description="Optional gateway filter (e.g. Gateway A, Gateway B, Gateway C, Razorpay)"),
    payment_method: Optional[str] = Query(None, description="Optional payment method filter (e.g. cards, upi, bank_transfer, wallets)"),
    failure_type: Optional[str] = Query(None, description="Optional failure type filter"),
    db: Session = Depends(get_db),
) -> GlobalIntelligenceResponse:
    """Retrieve multi-dimensional Global Payment Intelligence dashboard metrics, heatmaps, and regional telemetry."""
    return GlobalPaymentIntelligenceService.get_global_intelligence(
        db=db,
        region_filter=region,
        gateway_filter=gateway,
        method_filter=payment_method,
        failure_filter=failure_type,
    )
