"""Pydantic schemas for Tier 1 Recovery Intelligence."""

import uuid
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.enums import FailureType, RecoveryAction, RiskStatus
from app.schemas.policy import PolicyEvaluationResult


class RecoveryProbabilityResult(BaseModel):
    """Result of the deterministic, explainable recovery probability calculation."""
    probability: float = Field(ge=0.0, le=1.0, description="Estimated recovery probability between 0.0 and 1.0")
    score: int = Field(ge=0, le=100, description="Recoverability score between 0 and 100")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in the calculation")
    factors: List[str] = Field(default_factory=list, description="All contributing explainability factors")
    positive_factors: List[str] = Field(default_factory=list, description="Positive signals increasing recovery likelihood")
    negative_factors: List[str] = Field(default_factory=list, description="Negative signals decreasing recovery likelihood")


class RecoveryPriorityResult(BaseModel):
    """Result of multi-factor urgency and value prioritization."""
    priority_score: int = Field(ge=0, le=100, description="Overall actionable priority score (0-100)")
    priority_band: str = Field(description="Priority classification: CRITICAL, HIGH, MEDIUM, LOW")
    components: Dict[str, float] = Field(default_factory=dict, description="Component contributions to the priority score")
    reason: str = Field(description="Concise summary explaining why this priority was assigned")


class ExpectedRecoveryResult(BaseModel):
    """Result of monetary expected value calculation."""
    transaction_amount: Decimal = Field(description="Original failed transaction amount")
    recovery_probability: float = Field(description="Estimated probability")
    expected_recovery_value: Decimal = Field(description="Expected monetary recovery: amount * probability")
    expected_loss: Decimal = Field(description="Expected unrecovered loss: amount - expected_recovery_value")


class ActionCandidateScore(BaseModel):
    """Evaluation score for an individual candidate recovery intervention."""
    action: RecoveryAction
    action_label: str
    action_recovery_probability: float
    expected_recovery_value: Decimal
    intervention_cost: Decimal
    expected_net_recovery: Decimal
    risk_level: str  # 'LOW', 'MEDIUM', 'HIGH / COSTLY'
    reason: str
    is_eligible: bool


class NextBestActionResult(BaseModel):
    """Overall recommendation from the Next Best Action engine."""
    recommended_action: RecoveryAction
    recommended_action_label: str
    confidence: float
    expected_recovery_value: Decimal
    expected_net_recovery: Decimal
    candidates: List[ActionCandidateScore]
    reason: str


class RetryTimingResult(BaseModel):
    """Deterministic retry timing recommendation."""
    recommended_delay_hours: float
    recommended_delay_label: str
    reason: str


class RecoveryOpportunityItem(BaseModel):
    """Consolidated opportunity record for intelligence table and drawer."""
    risk_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    customer_risk_score: Decimal
    is_opted_out: bool
    transaction_id: uuid.UUID
    transaction_amount: Decimal
    currency: str
    failure_type: str
    failure_type_label: str
    failure_reason: Optional[str] = None
    status: str
    attempt_count: int
    created_at: str

    # Intelligence metrics
    recovery_probability: float
    recoverability_score: int
    priority_score: int
    priority_band: str
    expected_recovery_value: Decimal
    expected_loss: Decimal
    recommended_action: RecoveryAction
    recommended_action_label: str
    recommended_delay_hours: float
    recommended_delay_label: str
    confidence: float
    reason: str
    positive_factors: List[str] = Field(default_factory=list)
    negative_factors: List[str] = Field(default_factory=list)
    candidates: List[ActionCandidateScore] = Field(default_factory=list)
    policy_preview: Optional[PolicyEvaluationResult] = None


class PaginatedOpportunitiesResponse(BaseModel):
    """Paginated list of prioritized recovery opportunities."""
    items: List[RecoveryOpportunityItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RecoveryIntelligenceSummary(BaseModel):
    """Aggregated executive overview metrics for the intelligence layer."""
    total_revenue_at_risk: Decimal
    expected_recoverable_revenue: Decimal
    expected_loss_total: Decimal
    average_recovery_probability: float
    high_priority_opportunities: int
    critical_opportunities: int
    total_risks: int
    action_distribution: Dict[str, int]
    priority_distribution: Dict[str, int]
    expected_by_failure_type: List[Dict[str, Any]]
    recovery_funnel: List[Dict[str, Any]]
