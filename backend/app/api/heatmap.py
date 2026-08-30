"""REST API router for Revenue Risk Heatmap matrix."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import RevenueRiskHeatmapResponse
from app.services.revenue_risk_heatmap_service import RevenueRiskHeatmapService

router = APIRouter(prefix="/heatmap", tags=["Revenue Risk Heatmap"])


@router.get("/risk-matrix", response_model=RevenueRiskHeatmapResponse)
def get_revenue_risk_heatmap(db: Session = Depends(get_db)):
    """Retrieve dynamic Time of Day x Day of Week failure risk heatmap matrix."""
    return RevenueRiskHeatmapService.generate_heatmap(db)
