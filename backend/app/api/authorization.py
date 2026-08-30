"""API endpoints for Feature 2: Adaptive Authorization + Smart 3DS Optimization."""

import uuid
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.schemas.adaptive_authorization import (
    AuthorizationDecisionResponse,
    WhatIfSimulationRequest,
    WhatIfSimulationResponse,
    AuthorizationFunnelResponse,
    AuthorizationLossBreakdownResponse,
)
from app.services.adaptive_authorization_engine import AdaptiveAuthorizationEngine

router = APIRouter(prefix="/authorization", tags=["authorization"])


@router.post("/{transaction_id}/evaluate", response_model=AuthorizationDecisionResponse, summary="Evaluate pre-authorization strategy for transaction")
def evaluate_transaction_authorization(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuthorizationDecisionResponse:
    """Evaluate and recommend the optimal gateway, Smart 3DS authentication, and token strategy before payment failure."""
    try:
        return AdaptiveAuthorizationEngine.evaluate_authorization_for_transaction(
            transaction_id=transaction_id,
            db=db,
            log_audit=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/risk/{risk_id}", response_model=AuthorizationDecisionResponse, summary="Get pre-auth evaluation by revenue risk ID")
def get_authorization_by_risk(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuthorizationDecisionResponse:
    """Retrieve or compute pre-authorization intelligence for a given revenue risk case."""
    risk = db.query(RevenueRisk).filter(RevenueRisk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk {risk_id} not found.")

    if risk.transaction_id:
        try:
            return AdaptiveAuthorizationEngine.evaluate_authorization_for_transaction(
                transaction_id=risk.transaction_id,
                db=db,
                log_audit=False,
            )
        except Exception:
            pass

    # Fallback to payload evaluation using risk entity
    return AdaptiveAuthorizationEngine.evaluate_authorization_payload(
        transaction_id=risk.transaction_id or uuid.uuid4(),
        customer=risk.customer,
        amount=risk.amount_at_risk or Decimal("100.00"),
        currency=risk.currency or "USD",
        payment_method="card",
        policy=None,
        db=db,
        log_audit=False,
    )


@router.get("/{transaction_id}", response_model=AuthorizationDecisionResponse, summary="Get pre-auth evaluation for transaction")
def get_transaction_authorization(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuthorizationDecisionResponse:
    """Retrieve pre-authorization evaluation for a transaction."""
    try:
        return AdaptiveAuthorizationEngine.evaluate_authorization_for_transaction(
            transaction_id=transaction_id,
            db=db,
            log_audit=False,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/what-if", response_model=WhatIfSimulationResponse, summary="Simulate 'What If?' authorization scenario")
def simulate_what_if_scenario(
    request: WhatIfSimulationRequest = Body(...),
) -> WhatIfSimulationResponse:
    """Interactive sandbox allowing judges to test different combinations of gateway, 3DS, and token strategies."""
    return AdaptiveAuthorizationEngine.simulate_what_if(request)


@router.get("/analytics/funnel", response_model=AuthorizationFunnelResponse, summary="Pre-Auth to completed payment funnel")
def get_authorization_funnel() -> AuthorizationFunnelResponse:
    """Return pre-authorization conversion funnel statistics comparing baseline vs RecoverAI optimized routing."""
    return AdaptiveAuthorizationEngine.get_authorization_funnel()


@router.get("/analytics/loss-breakdown", response_model=AuthorizationLossBreakdownResponse, summary="Pre-recovery revenue loss categories")
def get_authorization_loss_breakdown() -> AuthorizationLossBreakdownResponse:
    """Return breakdown of revenue leakage prevented prior to payment recovery."""
    return AdaptiveAuthorizationEngine.get_authorization_loss_breakdown()
