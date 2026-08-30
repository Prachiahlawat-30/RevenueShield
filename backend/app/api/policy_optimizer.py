"""REST API endpoints for Self-Learning Policy Optimizer."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.policy_optimizer import (
    PolicyPerformanceOverview,
    PolicyProposalResponse,
    PolicySimulationResponse,
    PolicyApprovalRequest,
    PolicyRejectionRequest,
    PolicyRollbackRequest,
    PolicyHistoryItem,
)
from app.services.policy_optimizer import PolicyOptimizerEngine
from app.services.policy_performance_analyzer import PolicyPerformanceAnalyzer

router = APIRouter(prefix="/policy-optimizer", tags=["policy-optimizer"])


@router.get("/overview", response_model=PolicyPerformanceOverview, summary="Get current policy performance and optimization overview")
def get_policy_overview(db: Session = Depends(get_db)) -> PolicyPerformanceOverview:
    """Retrieve active policy performance, incremental attempt yields, and potential revenue opportunities."""
    return PolicyOptimizerEngine.get_overview(db=db)


@router.get("/performance", response_model=PolicyPerformanceOverview, summary="Get detailed historical policy performance analytics")
def get_policy_performance(db: Session = Depends(get_db)) -> PolicyPerformanceOverview:
    """Retrieve detailed attempt efficiency, cooldown curves, and friction metrics."""
    return PolicyPerformanceAnalyzer.analyze_current_performance(db=db)


@router.get("/proposals", response_model=List[PolicyProposalResponse], summary="List all policy improvement proposals")
def list_proposals(db: Session = Depends(get_db)) -> List[PolicyProposalResponse]:
    """Retrieve candidate policy improvements awaiting human operator review."""
    return PolicyOptimizerEngine.get_proposals(db=db)


@router.get("/proposals/{proposal_id}", response_model=PolicyProposalResponse, summary="Get single proposal details")
def get_proposal_detail(
    proposal_id: str,
    db: Session = Depends(get_db),
) -> PolicyProposalResponse:
    """Retrieve full proposal telemetry, projected deltas, safety validation, and AI rationale."""
    try:
        return PolicyOptimizerEngine.get_proposal_by_id(proposal_id=proposal_id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{proposal_id}/simulate", response_model=PolicySimulationResponse, summary="Run counterfactual simulation for proposal")
def simulate_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
) -> PolicySimulationResponse:
    """Simulate counterfactual execution comparing current vs proposed policy across historical dataset."""
    try:
        return PolicyOptimizerEngine.simulate_proposal(proposal_id=proposal_id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{proposal_id}/approve", response_model=PolicyProposalResponse, summary="Human Operator approval of policy proposal")
def approve_proposal(
    proposal_id: str,
    body: PolicyApprovalRequest = Body(default_factory=PolicyApprovalRequest),
    db: Session = Depends(get_db),
) -> PolicyProposalResponse:
    """Approve and activate a proposed policy change, incrementing policy version under strict human audit."""
    try:
        return PolicyOptimizerEngine.approve_proposal(
            proposal_id=proposal_id,
            operator_name=body.operator_name,
            reason=body.reason,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{proposal_id}/reject", response_model=PolicyProposalResponse, summary="Human Operator rejection of policy proposal")
def reject_proposal(
    proposal_id: str,
    body: PolicyRejectionRequest = Body(...),
    db: Session = Depends(get_db),
) -> PolicyProposalResponse:
    """Reject candidate proposal with structured rejection reason."""
    try:
        return PolicyOptimizerEngine.reject_proposal(
            proposal_id=proposal_id,
            operator_name=body.operator_name,
            reason=body.reason,
            notes=body.notes,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rollback", response_model=PolicyHistoryItem, summary="Emergency rollback to restore prior policy baseline")
def rollback_policy(
    body: PolicyRollbackRequest = Body(default_factory=PolicyRollbackRequest),
    db: Session = Depends(get_db),
) -> PolicyHistoryItem:
    """Execute an emergency rollback, creating a new policy version with restored parameters."""
    try:
        return PolicyOptimizerEngine.rollback_policy(
            operator_name=body.operator_name,
            reason=body.reason,
            target_version=body.target_version,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/policy-history", response_model=List[PolicyHistoryItem], summary="Get immutable policy version history")
def get_policy_history(db: Session = Depends(get_db)) -> List[PolicyHistoryItem]:
    """Retrieve chronological audit timeline of all active and historical policy versions."""
    return PolicyOptimizerEngine.get_policy_history(db=db)
