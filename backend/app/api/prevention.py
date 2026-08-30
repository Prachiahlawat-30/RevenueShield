"""REST API router for Prevention vs Recovery decisions and proactive action execution."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.tier3_schemas import (
    PreventionDecisionResult,
    ProactiveActionExecutionRequest,
    ProactiveActionExecutionResponse,
)
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine
from app.services.prevention_decision_engine import PreventionDecisionEngine
from app.services.proactive_recovery_service import ProactiveRecoveryService

router = APIRouter(prefix="/prevention", tags=["Prevention vs Recovery Decisions"])


@router.get("/decisions", response_model=List[PreventionDecisionResult])
def get_prevention_decisions(db: Session = Depends(get_db)):
    """Retrieve 3-way economic decision analysis (Do Nothing vs Reactive vs Proactive) for all pre-failure accounts."""
    return PreventionDecisionEngine.evaluate_all(db)


@router.get("/decision/{customer_id}", response_model=PreventionDecisionResult)
def get_single_prevention_decision(customer_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve 3-way economic decision analysis for a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    risk_item = PredictiveRevenueRiskEngine.analyze_customer(db, customer)
    return PreventionDecisionEngine.evaluate_account(risk_item)


@router.post("/execute-proactive", response_model=ProactiveActionExecutionResponse)
def execute_proactive_action(
    req: ProactiveActionExecutionRequest,
    db: Session = Depends(get_db),
):
    """Execute a policy-checked proactive intervention before payment failure occurs."""
    try:
        return ProactiveRecoveryService.execute_proactive_action(db, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
