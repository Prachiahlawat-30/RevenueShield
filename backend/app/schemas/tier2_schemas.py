"""Pydantic schemas for Tier 2 Advanced Revenue Intelligence & Optimization."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.enums import FailureType, RecoveryAction, RiskStatus
from app.schemas.policy import PolicyEvaluationResult


# -------------------------------------------------------------
# 1. EXPERIMENTATION & A/B TESTING
# -------------------------------------------------------------

class StrategyPerformanceItem(BaseModel):
    strategy: str
    strategy_label: str
    is_control: bool
    recovery_rate: float
    recovered_revenue: Decimal
    revenue_at_risk: Decimal
    interventions_count: int
    average_attempts: float
    escalation_rate: float
    customer_contact_rate: float
    expected_net_recovery: Decimal


class ExperimentResultsResponse(BaseModel):
    experiment_id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    total_assigned: int
    control_strategy: str
    treatment_strategy: str
    control_metrics: StrategyPerformanceItem
    treatment_metrics: StrategyPerformanceItem
    lift_percentage: float
    additional_revenue_generated: Decimal
    best_strategy: str
    confidence_level: float


class RecoveryExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    strategy_a: str = Field(default="immediate_retry", description="Control strategy")
    strategy_b: str = Field(default="timed_reminder", description="Treatment strategy")
    traffic_percentage: int = Field(default=50, ge=1, le=99)


class RecoveryExperimentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    strategy_a: str
    strategy_b: str
    traffic_percentage: int
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# -------------------------------------------------------------
# 2. CUSTOMER SEGMENTATION & RECOVERY PROFILE
# -------------------------------------------------------------

class CustomerRecoveryProfileResponse(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    segment: str
    segment_label: str
    segment_description: str
    recoverability_score: int
    historical_recovery_rate: float
    successful_recovery_attempts: int
    total_failed_events: int
    preferred_recovery_action: str
    best_recovery_window: str
    average_recovery_delay_hours: float
    contact_sensitivity: str  # LOW, MEDIUM, HIGH


# -------------------------------------------------------------
# 3. REVENUE LEAKAGE RADAR & SUMMARY
# -------------------------------------------------------------

class RevenueLeakageBreakdownItem(BaseModel):
    dimension: str
    dimension_value: str
    dimension_label: str
    total_payment_volume: Decimal
    revenue_at_risk: Decimal
    expected_recoverable: Decimal
    recovered_revenue: Decimal
    unrecovered_leakage: Decimal
    recovery_rate: float
    transaction_count: int


class RevenueLeakageSummaryResponse(BaseModel):
    total_payment_volume: Decimal
    revenue_at_risk: Decimal
    expected_recoverable_revenue: Decimal
    recovered_revenue: Decimal
    unrecovered_revenue: Decimal
    recovery_rate: float
    breakdown_by_failure_type: List[RevenueLeakageBreakdownItem]
    breakdown_by_gateway: List[RevenueLeakageBreakdownItem]
    breakdown_by_payment_method: List[RevenueLeakageBreakdownItem]
    breakdown_by_customer_segment: List[RevenueLeakageBreakdownItem]
    breakdown_by_merchant: List[RevenueLeakageBreakdownItem]


class ExecutiveLeakageSummary(BaseModel):
    revenue_leakage_total: Decimal
    current_at_risk: Decimal
    recoverable_revenue: Decimal
    recovered_revenue: Decimal
    recovery_rate: float
    largest_leakage_source: str
    largest_recovery_source: str
    worst_performing_gateway: str
    best_performing_strategy: str


# -------------------------------------------------------------
# 4. PAYMENT ANOMALIES & INCIDENTS
# -------------------------------------------------------------

class PaymentIncidentResponse(BaseModel):
    id: uuid.UUID
    incident_code: str
    title: str
    severity: str
    status: str
    affected_gateway: str
    affected_payment_method: Optional[str] = None
    failure_types: Optional[List[str]] = None
    estimated_revenue_impact: Decimal
    root_cause_summary: Optional[str] = None
    confidence: Decimal
    evidence_list: Optional[List[str]] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnomalyDetectionResult(BaseModel):
    has_anomaly: bool
    current_failure_rate: float
    baseline_failure_rate: float
    deviation_percentage_points: float
    affected_gateway: Optional[str] = None
    affected_payment_method: Optional[str] = None
    active_incident: Optional[PaymentIncidentResponse] = None
    message: str


# -------------------------------------------------------------
# 5. GATEWAY INTELLIGENCE & ROUTING
# -------------------------------------------------------------

class GatewayHealthMetric(BaseModel):
    gateway_name: str
    status: str  # HEALTHY, DEGRADED, DOWN
    success_rate: float
    failure_rate: float
    latency_ms: int
    timeout_rate: float
    failure_distribution: Dict[str, int]
    is_recommended: bool


class GatewayRoutingRecommendation(BaseModel):
    recommended_gateway: str
    expected_success_probability: float
    expected_recovery_value: Decimal
    policy_approved: bool
    policy_rejection_reason: Optional[str] = None
    reason: str
    evaluated_gateways: List[GatewayHealthMetric]


# -------------------------------------------------------------
# 6. RECOVERY PLAYBOOK ENGINE
# -------------------------------------------------------------

class PlaybookStepItem(BaseModel):
    step_number: int
    time_offset_label: str  # e.g. "T+0", "T+5m", "T+24h", "T+48h"
    action: RecoveryAction
    action_label: str
    status: str  # "COMPLETED", "CURRENT", "SCHEDULED", "SKIPPED"
    expected_recovery_rate: float
    policy_guardrail: str
    description: str


class RecoveryPlaybookResponse(BaseModel):
    playbook_id: str
    playbook_name: str
    target_failure_type: str
    customer_segment: str
    total_steps: int
    current_step_index: int
    stopping_rules: List[str]
    steps: List[PlaybookStepItem]


# -------------------------------------------------------------
# 7. WHAT-IF STRATEGY SIMULATOR
# -------------------------------------------------------------

class StrategySimulationRequest(BaseModel):
    simulated_max_attempts: int = Field(default=2, ge=1, le=5)
    simulated_cooldown_hours: int = Field(default=12, ge=1, le=168)
    simulated_high_value_threshold: Decimal = Field(default=Decimal("1500.00"))
    simulated_retry_delay_hours: int = Field(default=12, ge=1, le=72)
    simulated_preferred_strategy: str = Field(default="balanced_dunning")


class StrategySimulationMetrics(BaseModel):
    revenue_at_risk: Decimal
    expected_recovery: Decimal
    recovery_rate: float
    interventions_count: int
    escalations_count: int
    customer_contacts_count: int
    net_recovered_revenue: Decimal


class StrategySimulationResponse(BaseModel):
    current: StrategySimulationMetrics
    simulated: StrategySimulationMetrics
    difference_expected_recovery: Decimal
    difference_recovery_rate: float
    difference_interventions: int
    difference_escalations: int
    summary_analysis: str


# -------------------------------------------------------------
# 8. POLICY PLAYGROUND
# -------------------------------------------------------------

class PolicyPlaygroundRequest(BaseModel):
    amount: Decimal = Field(default=Decimal("150.00"))
    failure_type: FailureType = Field(default=FailureType.TEMPORARY_DECLINE)
    attempt_count: int = Field(default=0, ge=0, le=10)
    is_customer_opted_out: bool = Field(default=False)
    hours_since_last_attempt: int = Field(default=25, ge=0)
    customer_segment: str = Field(default="FAST_RECOVERY")
    card_expiry: Optional[str] = Field(default="12/28")


class PolicyPlaygroundResponse(BaseModel):
    ai_recommendation: RecoveryAction
    ai_recommendation_label: str
    policy_evaluation: PolicyEvaluationResult
    final_action: RecoveryAction
    final_action_label: str
    reasoning: str


# -------------------------------------------------------------
# 9. RECOVERY ROI & ATTRIBUTION
# -------------------------------------------------------------

class AttributionCategoryItem(BaseModel):
    category_key: str
    category_label: str
    recovered_revenue: Decimal
    interventions_count: int
    percentage_of_total: float


class RecoveryROIResponse(BaseModel):
    total_recovered_revenue: Decimal
    total_intervention_cost: Decimal
    net_recovered_revenue: Decimal
    roi_multiple: float  # e.g. 18.4x
    attribution_by_action: List[AttributionCategoryItem]
    attribution_by_failure_type: List[AttributionCategoryItem]
    attribution_by_strategy: List[AttributionCategoryItem]
    attribution_by_gateway: List[AttributionCategoryItem]


# -------------------------------------------------------------
# 10. OPERATOR COPILOT
# -------------------------------------------------------------

class CopilotQueryRequest(BaseModel):
    query: str = Field(description="Natural language question from payment merchant or operator")


class CopilotEvidenceItem(BaseModel):
    title: str
    metric_value: str
    context: str


class CopilotQueryResponse(BaseModel):
    query: str
    answer: str
    confidence: float
    evidence: List[CopilotEvidenceItem]
    suggested_follow_ups: List[str]
    is_executable: bool = False
    policy_notice: str
