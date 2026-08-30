"""Pydantic schemas for Feature: Self-Learning Policy Optimizer."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AttemptEfficiencyMetric(BaseModel):
    """Attempt-level recovery performance and incremental yield."""

    attempt_number: int
    total_attempts: int
    successful_recoveries: int
    recovery_rate: float
    incremental_recovery_rate: float
    intervention_cost: Decimal
    customer_friction_index: float
    is_economically_viable: bool


class CooldownPerformanceMetric(BaseModel):
    """Cooldown time bucket recovery success rate analysis."""

    window_label: str
    min_hours: int
    max_hours: Optional[int]
    attempts_count: int
    success_rate: float
    is_optimal_window: bool


class CurrentPolicyState(BaseModel):
    """Active recovery policy configuration state and version."""

    id: uuid.UUID
    name: str
    version: int
    max_attempts: int
    cooldown_hours: int
    high_value_threshold: Decimal
    active_since: datetime


class PolicySafetyAssessment(BaseModel):
    """Deterministic 4-pillar safety compliance check."""

    is_safe: bool
    overall_safety_score: int = Field(..., ge=0, le=100)
    customer_protection_score: int = Field(..., ge=0, le=100)
    financial_safety_score: int = Field(..., ge=0, le=100)
    operational_safety_score: int = Field(..., ge=0, le=100)
    magnitude_score: int = Field(..., ge=0, le=100)
    checks_passed: List[str]
    violations: List[str]


class WhyNotAlternative(BaseModel):
    """Counterfactual explanation for why an alternative parameter was not chosen."""

    alternative_value: str
    projected_recovery: str
    projected_friction: str
    net_revenue_impact: str
    rejection_rationale: str


class PolicySimulationResponse(BaseModel):
    """Counterfactual simulation output comparing Current vs Proposed policy."""

    proposal_id: str
    parameter_name: str
    current_value: str
    proposed_value: str

    current_gross_revenue: Decimal
    current_cost: Decimal
    current_net_revenue: Decimal
    current_recovery_rate: float

    proposed_gross_revenue: Decimal
    proposed_cost: Decimal
    proposed_net_revenue: Decimal
    proposed_recovery_rate: float

    net_revenue_delta: Decimal
    recovery_rate_delta: float
    cost_delta: Decimal
    customer_friction_delta: float

    confidence_score: float
    observations_count: int
    affected_transactions: int
    safety_assessment: PolicySafetyAssessment
    simulation_disclaimer: str = (
        "Simulation estimate based on counterfactual execution against historical synthetic dataset."
    )


class PolicyProposalResponse(BaseModel):
    """Structured policy improvement proposal awaiting human review."""

    id: uuid.UUID
    proposal_id: str
    parameter_name: str
    parameter_label: str
    current_value: str
    proposed_value: str
    policy_version_before: int
    policy_version_after: Optional[int] = None
    status: str  # "PENDING_REVIEW", "APPROVED", "REJECTED", "ACTIVATED", "ROLLED_BACK", "STALE"

    confidence_score: float
    observations_count: int
    affected_transactions: int

    projected_recovery_delta: float
    projected_cost_delta: Decimal
    projected_net_revenue_delta: Decimal
    projected_customer_friction_delta: float

    ai_summary: Optional[str] = None
    ai_rationale: Optional[str] = None
    ai_risk_factors: List[str] = []
    why_not_alternatives: List[WhyNotAlternative] = []
    safety_assessment: PolicySafetyAssessment

    reviewed_by: Optional[str] = None
    review_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class PolicyPerformanceOverview(BaseModel):
    """Comprehensive historical recovery analytics and policy performance overview."""

    current_policy: CurrentPolicyState
    overall_recovery_rate: float
    total_at_risk: Decimal
    total_recovered: Decimal
    total_intervention_cost: Decimal
    net_recovered_revenue: Decimal
    attempts_breakdown: List[AttemptEfficiencyMetric]
    cooldown_breakdown: List[CooldownPerformanceMetric]
    customer_friction_rate: float
    policy_performance_score: int  # 0-100
    pending_proposals_count: int
    potential_monthly_opportunity: Decimal


class PolicyApprovalRequest(BaseModel):
    """Request payload for Human Operator approving a policy change."""

    operator_name: str = Field(default="Human Operator (Risk & Policy Lead)")
    reason: Optional[str] = Field(default="Approved after reviewing counterfactual simulation evidence.")


class PolicyRejectionRequest(BaseModel):
    """Request payload for Human Operator rejecting a proposal."""

    operator_name: str = Field(default="Human Operator (Risk & Policy Lead)")
    reason: str = Field(..., description="E.g. Business constraint, Insufficient evidence, Customer experience concern")
    notes: Optional[str] = None


class PolicyRollbackRequest(BaseModel):
    """Request payload for Human Operator rolling back to a previous policy version."""

    operator_name: str = Field(default="Human Operator (Emergency Lead)")
    target_version: Optional[int] = None
    reason: str = Field(default="Emergency rollback to restore prior stable thresholds.")


class PolicyHistoryItem(BaseModel):
    """Immutable record in the policy versioning audit trail."""

    version: int
    max_attempts: int
    cooldown_hours: int
    high_value_threshold: Decimal
    is_active: bool
    created_at: datetime
    changed_by: Optional[str] = None
    change_reason: Optional[str] = None
    proposal_id: Optional[str] = None
