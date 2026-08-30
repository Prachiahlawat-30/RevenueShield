"""Recovery Intelligence API endpoints for ranking, expected recovery valuation, and next-best-actions."""

import math
import uuid
from decimal import Decimal
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.models.policy import Policy
from app.schemas.enums import ActorType
from app.schemas.recovery_intelligence import (
    RecoveryIntelligenceSummary,
    PaginatedOpportunitiesResponse,
    RecoveryOpportunityItem,
    RecoveryProbabilityResult,
    NextBestActionResult,
    RetryTimingResult,
)
from app.services.recovery_probability_engine import RecoveryProbabilityEngine
from app.services.recovery_priority_engine import RecoveryPriorityEngine
from app.services.expected_recovery_engine import ExpectedRecoveryEngine
from app.services.next_best_action_engine import NextBestActionEngine
from app.services.retry_timing_engine import RetryTimingEngine
from app.services.recovery_intelligence_service import RecoveryIntelligenceService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/recovery-intelligence", tags=["recovery-intelligence"])


@router.get("/summary", response_model=RecoveryIntelligenceSummary, summary="Get high-level recovery intelligence KPI summary")
def get_intelligence_summary(db: Session = Depends(get_db)) -> RecoveryIntelligenceSummary:
    """Return aggregated expected recoverable revenue, average recovery probability, and priority distribution."""
    return RecoveryIntelligenceService.get_summary_metrics(db)


@router.get("/opportunities", response_model=PaginatedOpportunitiesResponse, summary="Get ranked list of recovery opportunities")
def get_ranked_opportunities(
    priority_band: Optional[str] = Query(None, description="Filter by priority band (CRITICAL, HIGH, MEDIUM, LOW)"),
    failure_type: Optional[str] = Query(None, description="Filter by failure category"),
    status: Optional[str] = Query(None, description="Filter by risk status"),
    min_probability: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum recovery probability threshold"),
    sort_by: str = Query("priority_score", description="Sort field: priority_score, expected_recovery_value, recovery_probability, amount_at_risk"),
    order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(15, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedOpportunitiesResponse:
    """Retrieve filtered, prioritized, and scored recovery opportunities."""
    query = (
        db.query(RevenueRisk)
        .options(
            joinedload(RevenueRisk.customer),
            joinedload(RevenueRisk.transaction),
            joinedload(RevenueRisk.recovery_attempts),
        )
    )

    if status and status != "all":
        query = query.filter(RevenueRisk.status == status)

    if failure_type and failure_type != "all":
        query = query.filter(RevenueRisk.detected_failure_type == failure_type)

    active_policy = db.query(Policy).filter_by(is_active=True).first()
    all_risks = query.all()

    # Evaluate intelligence for all matching risks
    opportunities: List[RecoveryOpportunityItem] = []
    for risk in all_risks:
        opp = RecoveryIntelligenceService.evaluate_risk_intelligence(
            risk=risk,
            customer=risk.customer,
            past_attempts=risk.recovery_attempts,
            policy=active_policy,
        )

        # Apply post-evaluation filters
        if priority_band and priority_band != "all" and opp.priority_band != priority_band:
            continue
        if min_probability is not None and opp.recovery_probability < min_probability:
            continue

        opportunities.append(opp)

    # Sort opportunities
    reverse = (order.lower() == "desc")
    if sort_by == "priority_score":
        opportunities.sort(key=lambda o: o.priority_score, reverse=reverse)
    elif sort_by == "expected_recovery_value":
        opportunities.sort(key=lambda o: o.expected_recovery_value, reverse=reverse)
    elif sort_by == "recovery_probability":
        opportunities.sort(key=lambda o: o.recovery_probability, reverse=reverse)
    elif sort_by == "amount_at_risk":
        opportunities.sort(key=lambda o: o.transaction_amount, reverse=reverse)
    else:
        opportunities.sort(key=lambda o: o.priority_score, reverse=True)

    total = len(opportunities)
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = opportunities[start_idx:end_idx]

    return PaginatedOpportunitiesResponse(
        items=paginated_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/opportunities/{risk_id}", response_model=RecoveryOpportunityItem, summary="Get full intelligence details for a specific opportunity")
def get_opportunity_detail(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RecoveryOpportunityItem:
    """Retrieve full intelligence breakdown, candidate actions, and policy check preview for a specific risk."""
    risk = (
        db.query(RevenueRisk)
        .options(
            joinedload(RevenueRisk.customer),
            joinedload(RevenueRisk.transaction),
            joinedload(RevenueRisk.recovery_attempts),
        )
        .filter(RevenueRisk.id == risk_id)
        .first()
    )

    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    active_policy = db.query(Policy).filter_by(is_active=True).first()
    opp = RecoveryIntelligenceService.evaluate_risk_intelligence(
        risk=risk,
        customer=risk.customer,
        past_attempts=risk.recovery_attempts,
        policy=active_policy,
    )

    # Log intelligence evaluation event
    AuditService.log_event(
        db=db,
        actor=ActorType.RISK_ENGINE.value,
        step_name="RECOVERY_INTELLIGENCE_EVALUATED",
        revenue_risk_id=risk.id,
        customer_id=risk.customer_id,
        diagnosis_summary=f"Calculated recovery probability: {int(opp.recovery_probability * 100)}%, Priority Score: {opp.priority_score} ({opp.priority_band})",
        recommended_action=opp.recommended_action.value,
        amount_recovered=Decimal("0.00"),
        decision_payload={
            "recovery_probability": opp.recovery_probability,
            "recoverability_score": opp.recoverability_score,
            "priority_score": opp.priority_score,
            "priority_band": opp.priority_band,
            "expected_recovery_value": str(opp.expected_recovery_value),
            "recommended_action": opp.recommended_action.value,
            "recommended_delay_hours": opp.recommended_delay_hours,
            "positive_factors": opp.positive_factors,
            "negative_factors": opp.negative_factors,
        },
    )
    db.commit()

    return opp


@router.get("/{risk_id}/probability", response_model=RecoveryProbabilityResult, summary="Get recovery probability calculation for a risk")
def get_risk_probability(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RecoveryProbabilityResult:
    """Calculate and return explainable recovery probability."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    customer = db.query(Customer).filter_by(id=risk.customer_id).first()
    return RecoveryProbabilityEngine.calculate_probability(risk, customer)


@router.get("/{risk_id}/next-best-action", response_model=NextBestActionResult, summary="Get next-best-action analysis for a risk")
def get_risk_next_best_action(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> NextBestActionResult:
    """Evaluate candidate actions and return the highest expected-value action."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    customer = db.query(Customer).filter_by(id=risk.customer_id).first()
    prob_res = RecoveryProbabilityEngine.calculate_probability(risk, customer)
    return NextBestActionEngine.evaluate_actions(risk, customer, base_probability=prob_res.probability)


@router.get("/{risk_id}/timing", response_model=RetryTimingResult, summary="Get smart retry timing recommendations")
def get_risk_timing(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RetryTimingResult:
    """Return optimal delay hours and timing rationale."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    customer = db.query(Customer).filter_by(id=risk.customer_id).first()
    return RetryTimingEngine.calculate_recommended_timing(risk, customer)
