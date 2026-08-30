"""REST API router for Predictive Revenue Risk evaluation."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.tier3_schemas import (
    PredictiveRiskSummaryResponse,
    PredictiveRiskItem,
)
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine

router = APIRouter(prefix="/predictive-risk", tags=["Predictive Revenue Risk"])


@router.get("/summary", response_model=PredictiveRiskSummaryResponse)
def get_predictive_risk_summary(db: Session = Depends(get_db)):
    """Retrieve macro summary of pre-failure revenue risks and ranked accounts."""
    return PredictiveRevenueRiskEngine.get_summary(db)


@router.get("/items", response_model=List[PredictiveRiskItem])
def get_predictive_risk_items(
    min_score: int = Query(0, ge=0, le=100),
    health: str = Query(None),
    db: Session = Depends(get_db),
):
    """Retrieve pre-failure risk predictions filtered by minimum risk score or health status."""
    summary = PredictiveRevenueRiskEngine.get_summary(db)
    items = summary.predictive_accounts

    if min_score > 0:
        items = [it for it in items if it.future_risk_score >= min_score]
    if health:
        items = [it for it in items if it.payment_method_health.upper() == health.upper()]

    return items


@router.get("/customer/{customer_id}", response_model=PredictiveRiskItem)
def get_customer_predictive_risk(customer_id: uuid.UUID, db: Session = Depends(get_db)):
    """Analyze pre-failure risk profile and explainable evidence for a single customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return PredictiveRevenueRiskEngine.analyze_customer(db, customer)
