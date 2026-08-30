"""Gateways API endpoints for gateway health metrics and intelligent routing recommendations."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.models.policy import Policy
from app.schemas.tier2_schemas import GatewayHealthMetric, GatewayRoutingRecommendation
from app.services.gateway_routing_engine import GatewayRoutingEngine

router = APIRouter(prefix="/gateways", tags=["gateways"])


@router.get("/health", response_model=List[GatewayHealthMetric], summary="Get real-time gateway health metrics")
def get_gateway_health() -> List[GatewayHealthMetric]:
    """Retrieve simulated operational health, success rates, and latency across payment gateways."""
    return GatewayRoutingEngine.get_gateway_health_overview()


@router.post("/recommend-route/{risk_id}", response_model=GatewayRoutingRecommendation, summary="Get policy-checked gateway routing recommendation")
def recommend_gateway_route(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> GatewayRoutingRecommendation:
    """Recommend the optimal payment processor route for a specific failed payment under PolicyEngine constraints."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="RevenueRisk not found.")

    active_policy = db.query(Policy).filter_by(is_active=True).first()
    return GatewayRoutingEngine.recommend_optimal_gateway(risk, active_policy)
