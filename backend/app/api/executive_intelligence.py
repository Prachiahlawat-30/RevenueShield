"""REST API router for Counterfactual Analysis, Executive Money Story, Recommendations Feed & Merchant Action Plans."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    CounterfactualAnalysisResponse,
    ExecutiveMoneyStoryResponse,
    RecommendationsFeedResponse,
    MerchantHealthScoreResponse,
    MerchantActionPlanResponse,
)
from app.services.counterfactual_analysis_engine import CounterfactualAnalysisEngine
from app.services.executive_money_story_service import ExecutiveMoneyStoryService
from app.services.proactive_recommendations_engine import ProactiveRecommendationsEngine
from app.services.merchant_intelligence_engine import MerchantIntelligenceEngine

router = APIRouter(prefix="/executive-intelligence", tags=["Executive Intelligence & Money Story"])


@router.get("/counterfactual/{risk_id}", response_model=CounterfactualAnalysisResponse)
def get_counterfactual_analysis(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve 'What would have happened?' counterfactual analysis for a recovery transaction."""
    try:
        return CounterfactualAnalysisEngine.get_counterfactual_analysis(db, risk_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/money-story", response_model=ExecutiveMoneyStoryResponse)
def get_executive_money_story(db: Session = Depends(get_db)):
    """Retrieve executive financial command overview answering the 6 core questions."""
    return ExecutiveMoneyStoryService.get_money_story(db)


@router.get("/recommendations", response_model=RecommendationsFeedResponse)
def get_proactive_recommendations_feed(db: Session = Depends(get_db)):
    """Retrieve ranked proactive operational recommendations."""
    return ProactiveRecommendationsEngine.get_recommendations_feed(db)


@router.get("/merchants/health", response_model=List[MerchantHealthScoreResponse])
def list_merchant_health_scores(db: Session = Depends(get_db)):
    """Retrieve 0-100 Revenue Health scores for merchants."""
    return MerchantIntelligenceEngine.get_merchant_health_scores(db)


@router.get("/merchants/{merchant_id}/action-plan", response_model=MerchantActionPlanResponse)
def get_merchant_action_plan(
    merchant_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve prioritized recovery action plan and top 3 revenue opportunities for a merchant."""
    return MerchantIntelligenceEngine.get_merchant_action_plan(db, merchant_id)
