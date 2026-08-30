"""REST API router for Revenue Protection Score, Prediction Accuracy, Decision Explainability & Decision Replay."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    RevenueProtectionScoreResponse,
    PredictionAccuracyMetricsResponse,
    DecisionExplainabilityResponse,
    DecisionReplayResponse,
    ReplayCaseListItem,
)
from app.services.revenue_protection_score_engine import RevenueProtectionScoreEngine
from app.services.decision_replay_service import DecisionReplayService

router = APIRouter(prefix="/decision-intelligence", tags=["Decision Intelligence & Forensic Replay"])


@router.get("/protection-score", response_model=RevenueProtectionScoreResponse)
def get_revenue_protection_score(db: Session = Depends(get_db)):
    """Retrieve executive Revenue Protection Score (0-100) and 6 operational pillar scores."""
    return RevenueProtectionScoreEngine.calculate_protection_score(db)


@router.get("/accuracy-metrics", response_model=PredictionAccuracyMetricsResponse)
def get_prediction_accuracy_metrics(db: Session = Depends(get_db)):
    """Retrieve simulated/historical prediction quality, precision, recall, and false positive rates."""
    return RevenueProtectionScoreEngine.get_prediction_accuracy_metrics(db)


@router.get("/explainability/{risk_id}", response_model=DecisionExplainabilityResponse)
def get_decision_explainability(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve factor weights, confidence, and reproducibility signature for a decision."""
    try:
        return RevenueProtectionScoreEngine.get_decision_explainability(db, risk_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/replay-cases", response_model=List[ReplayCaseListItem])
def list_replayable_cases(
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Retrieve list of historical cases available for forensic decision replay."""
    return DecisionReplayService.get_replayable_cases(db, limit=limit)


@router.get("/replay/{risk_id}", response_model=DecisionReplayResponse)
def get_decision_replay(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Reconstruct what RecoverAI knew, predicted, recommended, policy-evaluated, and executed."""
    try:
        return DecisionReplayService.reconstruct_replay(db, risk_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
