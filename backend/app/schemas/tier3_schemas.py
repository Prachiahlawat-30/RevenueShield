"""Pydantic schemas for Tier 3: Predictive Protection, Forecast, Heatmap, Proactive Prevention, Value Protection, Margin Optimization, Smart Channels, Personalization, Autonomy & Human Approval Queue."""

import uuid
from enum import Enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# -------------------------------------------------------------------------
# Feature 1 & 2: Predictive Risk & Forecast Schemas
# -------------------------------------------------------------------------

class PredictiveRiskItem(BaseModel):
    """Individual customer pre-failure risk prediction."""

    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    merchant_id: Optional[uuid.UUID] = None
    merchant_name: str
    upcoming_amount: Decimal
    upcoming_renewal_at: datetime
    future_risk_score: int = Field(..., ge=0, le=100, description="Predictive risk score from 0 to 100")
    probability_of_failure: float = Field(..., ge=0.0, le=1.0, description="Predicted probability of failure")
    predicted_revenue_at_risk: Decimal
    risk_horizon: str = Field(..., description="Estimated time horizon until risk event, e.g., '18 hours'")
    risk_horizon_hours: int = Field(..., ge=0, description="Numeric hours until predicted risk event")
    risk_reasons: List[str] = Field(default_factory=list, description="Deterministic explainable evidence bullets")
    recommended_proactive_action: str
    payment_method_health: str = Field(..., description="Health state: HEALTHY, DEGRADING, CRITICAL")


class PredictiveRiskSummaryResponse(BaseModel):
    """Aggregate macro view of pre-failure revenue risks."""

    total_upcoming_volume: Decimal
    total_predicted_revenue_at_risk: Decimal
    average_failure_probability: float
    high_risk_accounts_count: int
    moderate_risk_accounts_count: int
    low_risk_accounts_count: int
    top_risk_merchant: Optional[str] = None
    predictive_accounts: List[PredictiveRiskItem]


class DailyForecastPoint(BaseModel):
    """Single daily point in a revenue risk forecast timeline."""

    day_label: str  # e.g. "Today", "Tomorrow", "Day 3", "Day 4"
    date_str: str   # e.g. "2026-08-27"
    expected_payment_volume: Decimal
    predicted_failure_exposure: Decimal
    predicted_recoverable_revenue: Decimal
    confidence_percentage: int


class RevenueForecastHorizon(BaseModel):
    """Forecast metrics for a specific forward-looking time horizon."""

    horizon_label: str  # e.g. "Next 24 Hours", "Next 7 Days", "Next 30 Days"
    expected_payment_volume: Decimal
    predicted_failure_exposure: Decimal
    expected_recoverable_revenue: Decimal
    predicted_failure_rate_pct: float
    predicted_net_retention_pct: float


class RevenueForecastResponse(BaseModel):
    """Complete multi-horizon revenue risk forecast response."""

    horizon_24h: RevenueForecastHorizon
    horizon_7d: RevenueForecastHorizon
    horizon_30d: RevenueForecastHorizon
    daily_forecasts: List[DailyForecastPoint]
    top_risk_drivers: List[Dict[str, Any]]
    model_calibration_timestamp: datetime
    is_simulated_forecast: bool = True


# -------------------------------------------------------------------------
# Feature 3: Revenue Risk Heatmap Schemas (Time x Failure Risk)
# -------------------------------------------------------------------------

class HeatmapCell(BaseModel):
    """Single time-slot cell in the Revenue Risk Heatmap."""

    day_of_week: str  # "MON", "TUE", "WED", "THU", "FRI"
    day_index: int    # 0 = Monday, 4 = Friday
    hour_label: str   # "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"
    hour_24: int      # 10, 12, 14, 16, 18
    transaction_count: int
    failure_count: int
    failure_rate_pct: float
    risk_level: str   # "LOW", "MEDIUM", "HIGH"
    color_indicator: str  # "GREEN", "YELLOW", "RED"


class RevenueRiskHeatmapResponse(BaseModel):
    """Complete Time x Failure Risk Heatmap Matrix."""

    days: List[str]
    time_slots: List[str]
    matrix: List[HeatmapCell]
    highest_risk_window: str
    safest_window: str
    peak_failure_day: str
    sample_transactions_analyzed: int


# -------------------------------------------------------------------------
# Feature 4 & 5: Proactive Recovery & Prevention Decision Schemas
# -------------------------------------------------------------------------

class PreventionOptionA(BaseModel):
    """Option A: Do Nothing."""

    name: str = "Do Nothing"
    description: str = "Allow transaction to proceed without intervention and absorb potential decline"
    expected_loss: Decimal
    intervention_cost: Decimal = Decimal("0.00")
    net_financial_outcome: Decimal
    customer_churn_risk: str = "High"


class PreventionOptionB(BaseModel):
    """Option B: Recover After Failure (Reactive)."""

    name: str = "Recover After Failure"
    description: str = "Wait for bank decline, then trigger automated reactive dunning & retries"
    expected_recovered: Decimal
    intervention_cost: Decimal
    net_financial_yield: Decimal
    expected_recovery_rate_pct: float
    customer_churn_risk: str = "Medium"


class PreventionOptionC(BaseModel):
    """Option C: Proactive Intervention Before Failure (Preventive)."""

    name: str = "Proactive Intervention"
    description: str = "Pre-empt decline with pre-renewal notification, credential update, or gateway pre-routing"
    recommended_action: str
    expected_prevented_loss: Decimal
    intervention_cost: Decimal
    net_financial_yield: Decimal
    expected_prevention_efficiency_pct: float
    customer_churn_risk: str = "Low"


class PreventionDecisionResult(BaseModel):
    """3-Way Economic Decision Analysis comparing Do Nothing vs Reactive vs Proactive."""

    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    merchant_name: str
    upcoming_amount: Decimal
    probability_of_failure: float
    predicted_exposure: Decimal
    risk_horizon: str
    option_a: PreventionOptionA
    option_b: PreventionOptionB
    option_c: PreventionOptionC
    best_option: str  # "PROACTIVE_INTERVENTION", "RECOVER_AFTER_FAILURE", "DO_NOTHING"
    best_option_label: str
    net_value_advantage: Decimal
    economic_rationale: str


class ProactiveActionExecutionRequest(BaseModel):
    """Request to execute a policy-checked proactive intervention."""

    customer_id: uuid.UUID
    action_type: str = "PROACTIVE_PAYMENT_METHOD_CHECK"
    custom_notes: Optional[str] = None


class ProactiveActionExecutionResponse(BaseModel):
    """Result of proactive intervention execution."""

    execution_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    action_type: str
    action_label: str
    status: str
    policy_approved: bool
    expected_prevented_loss: Decimal
    execution_message: str
    executed_at: datetime


# -------------------------------------------------------------------------
# Feature 6: Customer Value Protection Schemas
# -------------------------------------------------------------------------

class CustomerValueProfile(BaseModel):
    """Customer Lifetime Value Profile and relative tier score."""

    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    current_transaction_amount: Decimal
    historical_volume: Decimal
    average_transaction_amount: Decimal
    relationship_tenure_months: int
    customer_value_score: int = Field(..., ge=0, le=100, description="Relative value score from 0 to 100")
    value_tier: str  # "VIP_ENTERPRISE", "HIGH_GROWTH", "STANDARD", "STARTER"
    recommended_touch_level: str  # "WHITE_GLOVE_HUMAN", "ACCOUNT_MANAGER_CONCIERGE", "AUTOMATED_BALANCED"
    explanation: str


# -------------------------------------------------------------------------
# Feature 7 & 8: Recovery Cost Optimization & Margin-Aware Recovery Schemas
# -------------------------------------------------------------------------

class InterventionCostBreakdown(BaseModel):
    """Cost-benefit breakdown for a specific candidate recovery intervention."""

    action: str
    action_label: str
    intervention_cost: Decimal
    expected_gross_recovery: Decimal
    expected_net_recovery: Decimal
    roi_multiple: float
    is_margin_viable: bool
    viability_status: str  # "ECONOMICALLY_VIABLE", "MARGIN_NEGATIVE_REJECTED"
    rationale: str


class InterventionCostConfigResponse(BaseModel):
    """Current intervention cost configuration and margin thresholds."""

    retry_payment_cost: Decimal
    send_payment_reminder_cost: Decimal
    request_payment_method_update_cost: Decimal
    escalate_to_human_cost: Decimal
    minimum_expected_net_recovery: Decimal


# -------------------------------------------------------------------------
# Feature 9: Contact Fatigue Protection Schemas
# -------------------------------------------------------------------------

class ContactFatigueProfile(BaseModel):
    """Customer communication velocity and contact fatigue status."""

    customer_id: uuid.UUID
    customer_name: str
    messages_sent_24h: int
    messages_limit_24h: int
    messages_sent_7d: int
    messages_limit_7d: int
    last_contact_time: Optional[datetime] = None
    hours_since_last_contact: Optional[int] = None
    contact_sensitivity: str  # "LOW", "MEDIUM", "HIGH"
    contact_success_rate_pct: float
    is_contact_allowed: bool
    rejection_reason: Optional[str] = None
    cooldown_remaining_hours: int = 0


# -------------------------------------------------------------------------
# Feature 10: Smart Channel Selection Schemas
# -------------------------------------------------------------------------

class CommunicationChannel(str, Enum):
    """Available customer communication channels."""

    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"


class ChannelScore(BaseModel):
    """Evaluation metrics for a single communication channel."""

    channel: str
    channel_label: str
    expected_response_probability: float = Field(..., ge=0.0, le=1.0)
    marginal_cost: Decimal
    is_available: bool
    rank: int


class ChannelOptimizationResult(BaseModel):
    """Smart channel optimization ranking and recommendation."""

    customer_id: uuid.UUID
    customer_name: str
    best_channel: str
    best_channel_label: str
    expected_response_probability: float
    channel_rankings: List[ChannelScore]
    selection_reason: str


# -------------------------------------------------------------------------
# Feature 11: Customer Communication Personalization Schemas
# -------------------------------------------------------------------------

class CommunicationDraftRequest(BaseModel):
    """Request to generate a factual personalized dunning communication draft."""

    customer_id: uuid.UUID
    failure_type: str
    amount: Decimal
    recommended_action: str
    payment_deadline: Optional[str] = None
    preferred_channel: Optional[str] = None


class CommunicationDraftResponse(BaseModel):
    """Generated personalized communication draft strictly grounded in structured facts."""

    customer_name: str
    channel: str
    subject_line: str
    body_text: str
    action_button_label: str
    action_url: str
    facts_grounding: List[str]
    generated_at: datetime


# -------------------------------------------------------------------------
# Feature 12 & 13: Autonomy Levels & Autonomy Control Center Schemas
# -------------------------------------------------------------------------

class AutonomyMode(str, Enum):
    """Autonomy execution mode for recovery engine."""

    MANUAL = "MANUAL"
    ASSISTED = "ASSISTED"
    AUTOMATIC = "AUTOMATIC"


class AutonomyConfigResponse(BaseModel):
    """Active autonomy mode and policy governance checklist."""

    current_mode: AutonomyMode
    automatic_actions: List[str]
    human_approval_required: List[str]
    safety_warning: str
    last_updated_at: datetime


class AutonomyModeUpdateRequest(BaseModel):
    """Request to update active autonomy level."""

    mode: AutonomyMode


# -------------------------------------------------------------------------
# Feature 14: Human Approval Queue Schemas
# -------------------------------------------------------------------------

class ApprovalQueueItem(BaseModel):
    """Item waiting in human operator approval queue."""

    id: uuid.UUID
    risk_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    merchant_name: str
    amount: Decimal
    urgency_tag: str  # "HIGH_VALUE", "REPEATED_FAILURE", "UNKNOWN_FAILURE", "SENSITIVE_ACCOUNT"
    ai_recommendation: str
    policy_reason: str
    expected_recovery: Decimal
    status: str  # "PENDING_APPROVAL", "APPROVED", "REJECTED", "ESCALATED"
    requested_at: datetime


class HumanApprovalActionRequest(BaseModel):
    """Operator action on a queued approval item."""

    action: str = Field(..., description="'APPROVE', 'REJECT', or 'ESCALATE'")
    operator_notes: Optional[str] = None


class HumanApprovalActionResponse(BaseModel):
    """Result of human operator approval execution."""

    risk_id: uuid.UUID
    action: str
    new_status: str
    audit_event_logged: str
    message: str
    processed_at: datetime


# -------------------------------------------------------------------------
# Feature 15 & 16: Recovery Control Center & Real-Time Event Stream Schemas
# -------------------------------------------------------------------------

class ControlCenterKPIs(BaseModel):
    """Macro KPIs for live recovery operations."""

    revenue_at_risk: Decimal
    expected_recovery: Decimal
    recovered_today: Decimal
    active_recoveries_count: int
    pending_approvals_count: int
    open_incidents_count: int
    predicted_risk_volume: Decimal
    recovery_efficiency_pct: float


class LiveEventItem(BaseModel):
    """Single event in the real-time telemetry activity stream."""

    id: str
    timestamp_str: str  # e.g. "12:41:03"
    event_type: str     # "RECOVERY_SUCCEEDED", "POLICY_APPROVED", "AI_RECOMMENDED", "GATEWAY_SELECTED", "FAILURE_DETECTED"
    headline: str       # e.g. "₹84,000 recovery succeeded"
    details: str
    customer_name: Optional[str] = None
    amount: Optional[Decimal] = None
    badge_color: str    # "GREEN", "BLUE", "PURPLE", "AMBER", "RED"
    created_at: datetime


class LiveEventStreamResponse(BaseModel):
    """Real-time event stream feed response."""

    events: List[LiveEventItem]
    total_events: int
    last_event_time: datetime


class ControlCenterSummaryResponse(BaseModel):
    """Complete central operations command center payload."""

    kpis: ControlCenterKPIs
    critical_revenue_risks: List[Dict[str, Any]]
    payment_incidents: List[Dict[str, Any]]
    human_approvals: List[ApprovalQueueItem]
    active_playbooks: List[Dict[str, Any]]
    recent_events: List[LiveEventItem]
    system_health_status: str  # "OPTIMAL", "DEGRADED", "INCIDENT_ACTIVE"
    last_refreshed_at: datetime


# -------------------------------------------------------------------------
# Feature 17 & 18: Incident Response Playbook & Simulation Schemas
# -------------------------------------------------------------------------

class IncidentPlaybookStep(BaseModel):
    """Step in an 8-stage incident response pipeline."""

    step_number: int
    step_name: str
    status: str  # "COMPLETED", "IN_PROGRESS", "PENDING"
    description: str
    data_payload: Optional[Dict[str, Any]] = None


class IncidentPlaybookItem(BaseModel):
    """Comprehensive incident response playbook with live assessments."""

    incident_id: uuid.UUID
    incident_title: str
    gateway_name: str
    severity: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    detected_at: datetime
    revenue_at_risk_hourly: Decimal
    affected_transactions_count: int
    recommended_mitigation: str
    target_gateway: str
    expected_improvement_pct: float
    expected_protected_revenue_hourly: Decimal
    steps: List[IncidentPlaybookStep]
    policy_approval_status: str  # "APPROVED", "PENDING_APPROVAL", "REJECTED"


class IncidentMitigationSimulationRequest(BaseModel):
    """Request to simulate an operational mitigation before applying."""

    incident_id: uuid.UUID
    current_gateway_share_pct: int = 70
    proposed_gateway_share_pct: int = 30
    target_gateway_share_pct: int = 70


class IncidentMitigationSimulationResponse(BaseModel):
    """Zero-mutation pre-flight simulation result for incident mitigation."""

    incident_id: uuid.UUID
    current_gateway_share: str
    proposed_gateway_share: str
    current_success_rate_pct: float
    expected_success_rate_pct: float
    success_rate_delta_pct: float
    expected_protected_revenue_hourly: Decimal
    estimated_latency_delta_ms: int
    policy_approved: bool
    requires_human_approval: bool
    simulation_summary: str
    simulated_at: datetime


class IncidentMitigationExecutionRequest(BaseModel):
    """Request to execute a policy-approved incident mitigation."""

    incident_id: uuid.UUID
    target_gateway: str
    proposed_share_pct: int = 70
    operator_notes: Optional[str] = None


class IncidentMitigationExecutionResponse(BaseModel):
    """Result of applied incident mitigation."""

    incident_id: uuid.UUID
    action_taken: str
    status: str
    audit_event_logged: str
    message: str
    executed_at: datetime


# -------------------------------------------------------------------------
# Feature 19: Revenue Protection Score Schemas
# -------------------------------------------------------------------------

class RevenueProtectionScorePillars(BaseModel):
    """6 individual sub-pillar components for the Revenue Protection Score."""

    recovery: int = Field(..., ge=0, le=100)
    prevention: int = Field(..., ge=0, le=100)
    policy_compliance: int = Field(..., ge=0, le=100)
    incident_response: int = Field(..., ge=0, le=100)
    prediction_accuracy: int = Field(..., ge=0, le=100)
    contact_efficiency: int = Field(..., ge=0, le=100)


class RevenueProtectionScoreResponse(BaseModel):
    """Executive composite Revenue Protection Score (0-100) with trend and pillar breakdown."""

    overall_score: int = Field(..., ge=0, le=100)
    previous_period_score: int = Field(..., ge=0, le=100)
    trend_delta_pct: float
    is_positive_trend: bool
    grade: str  # "EXCELLENT", "HEALTHY", "NEEDS_ATTENTION"
    pillars: RevenueProtectionScorePillars
    summary_explanation: str
    evaluated_at: datetime


# -------------------------------------------------------------------------
# Feature 20: Prediction Accuracy Schemas
# -------------------------------------------------------------------------

class PredictionAccuracyMetricsResponse(BaseModel):
    """Simulated/historical prediction quality and accuracy measurements."""

    recovery_probability_accuracy_pct: float
    risk_prediction_accuracy_pct: float
    precision_pct: float
    recall_pct: float
    false_positive_rate_pct: float
    false_negative_rate_pct: float
    predicted_high_risk_count: int
    actually_failed_count: int
    total_evaluated_predictions: int
    evaluation_label: str = "Simulation / historical evaluation"
    model_version: str = "v3.2.0-deterministic"
    last_evaluated_at: datetime


# -------------------------------------------------------------------------
# Feature 21: Model / Decision Explainability Schemas
# -------------------------------------------------------------------------

class DecisionFactorWeight(BaseModel):
    """Weight and contribution of an individual evidence factor."""

    factor_name: str
    weight_pct: int
    impact_direction: str  # "INCREASES_RISK", "DECREASES_RISK", "PROMOTES_ACTION"
    evidence_text: str


class DecisionExplainabilityResponse(BaseModel):
    """Model explainability metadata for a specific risk prediction or action."""

    risk_id: uuid.UUID
    failure_probability_pct: int
    confidence_pct: int
    decision_version: str = "v3.2.0-deterministic"
    data_timestamp: datetime
    top_factors: List[DecisionFactorWeight]
    reproducibility_hash: str
    explanation_summary: str


# -------------------------------------------------------------------------
# Feature 22: Decision Replay Schemas
# -------------------------------------------------------------------------

class DecisionReplayTimelineEvent(BaseModel):
    """Single chronological step in a decision replay forensic reconstruction."""

    timestamp_str: str  # e.g. "10:21:00"
    stage_name: str     # "DETECTION", "PREDICTION", "RECOMMENDATION", "POLICY_GATE", "EXECUTION", "SETTLEMENT"
    headline: str       # e.g. "₹42,000 recovered"
    detail: str
    status_badge: str   # "SUCCESS", "APPROVED", "RECOMMENDED", "DETECTED"
    payload_snapshot: Optional[Dict[str, Any]] = None


class DecisionReplayResponse(BaseModel):
    """Complete 5-stage reconstructed replay for a historical recovery risk."""

    risk_id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: str
    customer_email: str
    merchant_name: str
    amount_at_risk: Decimal
    amount_recovered: Decimal
    current_status: str

    # 5 Pillars of Decision Reconstruction:
    what_recoverai_knew: Dict[str, Any]
    what_it_predicted: Dict[str, Any]
    what_it_recommended: Dict[str, Any]
    what_policy_decided: Dict[str, Any]
    what_happened: Dict[str, Any]

    timeline_events: List[DecisionReplayTimelineEvent]
    decision_version: str = "v3.2.0-deterministic"
    reconstructed_at: datetime


class ReplayCaseListItem(BaseModel):
    """Summary item in the decision replay case selector."""

    risk_id: uuid.UUID
    customer_name: str
    amount: Decimal
    failure_type: str
    status: str
    occurred_at: datetime


# -------------------------------------------------------------------------
# Feature 23: Counterfactual Analysis ("What Would Have Happened?") Schemas
# -------------------------------------------------------------------------

class CounterfactualAnalysisResponse(BaseModel):
    """Counterfactual baseline loss vs RecoverAI protection simulation."""

    risk_id: uuid.UUID
    actual_recovered_amount: Decimal
    without_recoverai_expected_loss: Decimal
    with_recoverai_recovered: Decimal
    net_revenue_protected: Decimal
    strategy_comparison_a_name: str
    strategy_comparison_a_expected_recovery: Decimal
    strategy_comparison_b_name: str
    strategy_comparison_b_expected_recovery: Decimal
    strategy_recovery_difference: Decimal
    counterfactual_disclaimer: str = "Model estimate / simulation. Counterfactual projections are statistical simulations and not factual historical occurrences."
    simulated_at: datetime


# -------------------------------------------------------------------------
# Feature 24: Executive "Money Story" Schemas
# -------------------------------------------------------------------------

class FailureCauseBreakdown(BaseModel):
    """Category breakdown of why money is being lost."""

    failure_category: str
    amount_lost: Decimal
    percentage_share: float
    primary_solution: str


class ExecutiveMoneyStoryResponse(BaseModel):
    """Executive financial command overview answering the 6 core questions."""

    # 1. How much money was at risk?
    revenue_at_risk: Decimal
    # 2. How much did we protect before failure?
    protected_before_failure: Decimal
    # 3. How much did we recover?
    recovered_so_far: Decimal
    # 4. How much more could we recover?
    remaining_opportunity: Decimal
    expected_recoverable: Decimal

    # 5. Why are we losing money?
    top_failure_causes: List[FailureCauseBreakdown]

    # 6. What should we do next?
    primary_recommended_action: str
    action_expected_yield: Decimal
    action_urgency: str  # "IMMEDIATE", "HIGH", "SCHEDULED"
    headline_narrative: str
    generated_at: datetime


# -------------------------------------------------------------------------
# Feature 25: Proactive Recommendation Feed Schemas
# -------------------------------------------------------------------------

class ProactiveRecommendationItem(BaseModel):
    """Actionable autonomous recommendation surfaced by RecoverAI."""

    id: str
    priority_level: str  # "HIGH_PRIORITY", "CUSTOMER_RISK", "EXPIRING_CARDS", "OPTIMAL_TIMING"
    badge_label: str     # "🔥 HIGH PRIORITY", "⚠️ CUSTOMER RISK", "💡 CARD REFRESH", "⚡ OPTIMAL TIMING"
    title: str
    description: str
    financial_impact_metric: str  # e.g. "₹8.2L/hour estimated leakage"
    recommended_action: str
    expected_protected_revenue: Decimal
    action_type: str     # "SIMULATE", "VIEW_CUSTOMERS", "LAUNCH_CAMPAIGN", "APPLY_TIMING"
    target_route: Optional[str] = None
    created_at: datetime


class RecommendationsFeedResponse(BaseModel):
    """Proactive recommendation feed payload."""

    total_recommendations: int
    high_priority_count: int
    estimated_total_addressable_revenue: Decimal
    recommendations: List[ProactiveRecommendationItem]
    last_updated_at: datetime


# -------------------------------------------------------------------------
# Feature 26 & 27: Merchant Health Score & Merchant Action Plan Schemas
# -------------------------------------------------------------------------

class MerchantHealthPillars(BaseModel):
    """Sub-pillars composing the Merchant Health Score."""

    payment_health: int = Field(..., ge=0, le=100)
    recovery: int = Field(..., ge=0, le=100)
    revenue_leakage: int = Field(..., ge=0, le=100)
    gateway_reliability: int = Field(..., ge=0, le=100)
    customer_recoverability: int = Field(..., ge=0, le=100)
    incident_frequency: int = Field(..., ge=0, le=100)


class MerchantHealthScoreResponse(BaseModel):
    """Merchant-level Revenue Health Index (0-100)."""

    merchant_id: uuid.UUID
    merchant_name: str
    overall_health_score: int = Field(..., ge=0, le=100)
    grade: str  # "TIER_1_EXCELLENT", "TIER_2_HEALTHY", "TIER_3_ELEVATED_RISK"
    pillars: MerchantHealthPillars
    active_customers_count: int
    monthly_volume: Decimal
    evaluated_at: datetime


class MerchantActionPlanOpportunity(BaseModel):
    """Single revenue recovery opportunity for a merchant."""

    rank: int
    title: str
    potential_monthly_revenue: Decimal
    failure_cause: str
    recommended_playbook: str


class MerchantActionPlanResponse(BaseModel):
    """Actionable intelligence growth report and top revenue opportunities for a merchant."""

    merchant_id: uuid.UUID
    merchant_name: str
    health_score: int
    predicted_monthly_leakage: Decimal
    top_3_opportunities: List[MerchantActionPlanOpportunity]
    top_3_failure_causes: List[str]
    top_recovery_strategy: str
    top_gateway_issue: str
    recommended_interventions: List[str]
    generated_at: datetime


# -------------------------------------------------------------------------
# Feature 28: Monthly Revenue Recovery Report Schemas
# -------------------------------------------------------------------------

class MonthlyRecoveryReportResponse(BaseModel):
    """Formal executive monthly revenue recovery report."""

    report_title: str = "RecoverAI Revenue Recovery Report"
    period: str = "August 2026"
    revenue_at_risk: Decimal
    recovered: Decimal
    prevented: Decimal
    recovery_rate_pct: float
    top_failure: str
    best_strategy: str
    worst_gateway: str
    policy_violations: int = 0
    generated_at: datetime
    csv_data: str


# -------------------------------------------------------------------------
# Feature 29: Revenue Recovery Leaderboard Schemas
# -------------------------------------------------------------------------

class LeaderboardRankingItem(BaseModel):
    """Individual ranked item in a recovery leaderboard."""

    rank: int
    name: str
    metric_value: Decimal
    metric_formatted: str
    secondary_info: str
    badge_label: Optional[str] = None


class RevenueLeaderboardResponse(BaseModel):
    """Comprehensive recovery leaderboards across strategies, actions, gateways, segments, and merchants."""

    period_filter: str  # "7d", "30d", "90d", "all"
    top_strategies: List[LeaderboardRankingItem]
    top_actions: List[LeaderboardRankingItem]
    top_gateways: List[LeaderboardRankingItem]
    top_customer_segments: List[LeaderboardRankingItem]
    top_merchants: List[LeaderboardRankingItem]
    last_updated_at: datetime


# -------------------------------------------------------------------------
# Feature 30 & 31: Advanced Audit & Decision Versioning Schemas
# -------------------------------------------------------------------------

class DecisionVersionConfigResponse(BaseModel):
    """Active software and logic versions governing intelligence, safety, and routing."""

    recovery_intelligence_version: str = "v3.2.0"
    policy_version: str = "v2.1.0"
    strategy_version: str = "v4.0.0"
    governance_model: str = "Deterministic Rule-Gated Autonomy"
    immutable_audit_logging_active: bool = True
    active_audit_event_types: List[str]


# -------------------------------------------------------------------------
# Feature 32: System Health & Resilience Schemas
# -------------------------------------------------------------------------

class SystemHealthComponent(BaseModel):
    """Status of an individual system subsystem."""

    component_name: str
    status: str  # "HEALTHY", "AVAILABLE", "READY", "OPERATIONAL", "DEGRADED", "FALLBACK_ACTIVE"
    is_operational: bool
    status_message: str
    latency_ms: int


class SystemHealthResponse(BaseModel):
    """Unified system health dashboard displaying primary and fallback subsystems."""

    overall_system_status: str  # "OPERATIONAL", "DEGRADED", "OUTAGE"
    is_resilient: bool
    components: List[SystemHealthComponent]
    openai_available: bool
    fallback_diagnosis_ready: bool
    checked_at: datetime


# -------------------------------------------------------------------------
# Feature 33: Failure Chaos Simulation Schemas
# -------------------------------------------------------------------------

class ChaosSimulationScenarioRequest(BaseModel):
    """Request to trigger a controlled demo-only chaos simulation."""

    scenario: str = Field(
        ...,
        description="'OPENAI_FAILURE', 'GATEWAY_FAILURE', 'DATABASE_LATENCY', 'PAYMENT_FAILURE_SPIKE', 'REPEATED_FAILURE', 'HIGH_VALUE_TRANSACTION', 'CUSTOMER_OPT_OUT'",
    )


class ChaosSimulationResultResponse(BaseModel):
    """Demonstration outcome proving RecoverAI's graceful degradation and deterministic safety invariants."""

    scenario: str
    trigger_event: str
    initial_condition: str
    subsystem_response: str
    fallback_activated: bool
    recovery_workflow_status: str
    policy_engine_status: str
    safety_guarantee_observed: str
    audit_event_logged: str
    executed_at: datetime


# -------------------------------------------------------------------------
# Feature 34 & 35: AI vs Rules Transparency & "AI Cannot Override Policy" Live Demo
# -------------------------------------------------------------------------

class AiVsRulesEvaluationRequest(BaseModel):
    """Request to evaluate an AI recommendation against deterministic PolicyEngine rules."""

    transaction_amount: Decimal = Decimal("250000.00")
    ai_proposed_action: str = "retry_payment"
    ai_confidence_pct: int = 84
    customer_opted_out: bool = False
    prior_attempts: int = 0


class AiVsRulesEvaluationResponse(BaseModel):
    """Interactive visual outcome demonstrating that AI cannot override deterministic PolicyEngine rules."""

    transaction_amount: Decimal
    ai_proposal: str
    ai_confidence_pct: int
    policy_rules_evaluated: List[Dict[str, Any]]
    policy_verdict: str  # "BLOCK", "ALLOW"
    policy_violation_reason: Optional[str]
    final_decision: str  # "ESCALATE_TO_HUMAN", "ALLOW"
    responsible_ai_summary: str
    evaluated_at: datetime


# -------------------------------------------------------------------------
# Feature 36 & 37: Demo Scenario Builder & Demo Reset Schemas
# -------------------------------------------------------------------------

class DemoScenarioInfo(BaseModel):
    """Catalog item for pre-packaged judge demo scenarios."""

    id: str
    title: str
    description: str
    key_concept: str
    expected_outcome: str
    icon_name: str


class DemoScenarioExecutionRequest(BaseModel):
    """Request to execute a pre-packaged demo scenario."""

    scenario_id: str


class DemoScenarioExecutionResponse(BaseModel):
    """Live execution trace of a demo scenario."""

    scenario_id: str
    scenario_title: str
    risk_id: Optional[uuid.UUID] = None
    customer_name: str
    amount_formatted: str
    failure_type: str
    step_1_diagnosis: str
    step_2_ai_recommendation: str
    step_3_policy_gate: str
    step_4_execution_result: str
    final_status: str
    audit_trace_id: str
    differentiator_slogan: str = "RecoverAI doesn't ask AI how to move money. It uses AI to understand revenue risk, while deterministic policy decides what the system is allowed to do."
    executed_at: datetime


class DemoResetResponse(BaseModel):
    """Outcome of resetting demo state back to clean baseline."""

    success: bool
    message: str
    restored_customers: int
    restored_risks: int
    reset_at: datetime


class GuidedDemoSceneItem(BaseModel):
    """A single guided step in the 5-minute hackathon pitch."""

    scene_number: int
    title: str
    narrative_hook: str
    action_button_label: str
    target_tab: str
    highlight_metrics: List[str]





