"""REST API router for Unit Economics, Customer Lifetime Value, and Contact Fatigue Protection."""

import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.enums import RecoveryAction
from app.schemas.tier3_schemas import (
    CustomerValueProfile,
    InterventionCostBreakdown,
    InterventionCostConfigResponse,
    ContactFatigueProfile,
)
from app.services.customer_value_engine import CustomerValueEngine
from app.services.recovery_cost_engine import RecoveryCostEngine
from app.services.contact_policy_engine import ContactPolicyEngine

router = APIRouter(prefix="/unit-economics", tags=["Unit Economics & Value Protection"])


@router.get("/customer-value/{customer_id}", response_model=CustomerValueProfile)
def get_customer_value_profile(
    customer_id: uuid.UUID,
    amount: Optional[Decimal] = None,
    db: Session = Depends(get_db),
):
    """Retrieve explainable Customer Lifetime Value profile, score (0-100), and touch tier."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return CustomerValueEngine.calculate_profile(db, customer, current_amount=amount)


@router.get("/costs", response_model=InterventionCostConfigResponse)
def get_intervention_costs_config():
    """Retrieve current configured intervention unit costs and margin thresholds."""
    return RecoveryCostEngine.get_config()


@router.get("/contact-fatigue/{customer_id}", response_model=ContactFatigueProfile)
def get_contact_fatigue_profile(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve customer communication frequency, 24h/7d velocity, and contact fatigue safety."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ContactPolicyEngine.evaluate_contact_profile(db, customer)


@router.get("/margin-evaluate", response_model=InterventionCostBreakdown)
def evaluate_margin_viability(
    action: str,
    amount_at_risk: Decimal,
    recovery_probability: float,
):
    """Evaluate gross recovery vs intervention cost and margin viability constraint."""
    try:
        act_enum = RecoveryAction(action)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid recovery action: {action}")
    return RecoveryCostEngine.evaluate_cost_breakdown(
        action=act_enum,
        amount_at_risk=amount_at_risk,
        recovery_probability=recovery_probability,
    )
