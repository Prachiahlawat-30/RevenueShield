export type FailureType =
  | 'temporary_decline'
  | 'insufficient_funds'
  | 'expired_card'
  | 'network_error'
  | 'unknown_failure';

export type RecoveryAction =
  | 'retry_payment'
  | 'send_payment_reminder'
  | 'request_payment_method_update'
  | 'escalate_to_human'
  | 'stop';

export type RiskStatus =
  | 'detected'
  | 'diagnosing'
  | 'action_selected'
  | 'recovering'
  | 'recovered'
  | 'escalated'
  | 'failed'
  | 'stopped';

export type ExecutionStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'declined'
  | 'no_response'
  | 'escalated';

export type PriorityBand = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Customer {
  id: string;
  external_id: string;
  name: string;
  email: string;
  phone?: string;
  payment_method_type?: string;
  card_last4?: string;
  card_expiry?: string;
  is_opted_out: boolean;
  risk_score: string | number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  amount: string | number;
  currency: string;
  status: string;
  failure_code?: string;
  failure_reason?: string;
  gateway_payload?: Record<string, any>;
  created_at: string;
}

export interface RecoveryAttempt {
  id: string;
  revenue_risk_id: string;
  attempt_number: number;
  proposed_action: RecoveryAction;
  diagnosis_category?: FailureType;
  ai_confidence?: number;
  ai_rationale?: string;
  policy_approved: boolean;
  policy_rejection_reason?: string;
  executed_action?: string;
  execution_channel?: string;
  execution_status: ExecutionStatus;
  amount_recovered: string | number;
  outcome_details?: Record<string, any>;
  initiated_at: string;
  completed_at?: string;
}

export interface RevenueRisk {
  id: string;
  transaction_id: string;
  customer_id: string;
  amount_at_risk: string | number;
  amount_recovered: string | number;
  currency: string;
  detected_failure_type: FailureType;
  status: RiskStatus;
  current_step?: string;
  attempt_count: number;
  last_attempt_at?: string;
  resolved_at?: string;
  stop_reason?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  transaction?: Transaction;
  recovery_attempts?: RecoveryAttempt[];
}

export interface AuditLog {
  id: string;
  revenue_risk_id?: string;
  customer_id?: string;
  recovery_attempt_id?: string;
  actor: string;
  step_name: string;
  diagnosis_summary?: string;
  recommended_action?: string;
  policy_decision?: string;
  executed_action?: string;
  result?: string;
  amount_recovered?: string | number;
  stop_reason?: string;
  input_payload?: Record<string, any>;
  decision_payload?: Record<string, any>;
  created_at: string;
}

export interface DashboardMetrics {
  total_revenue_at_risk: string | number;
  total_revenue_recovered: string | number;
  recovery_rate_pct: number;
  active_cases: number;
  escalated_cases: number;
  successful_recovery_attempts: number;
  failed_recovery_attempts: number;
}

export interface DailyRecoveryTrend {
  date: string;
  amount_at_risk: string | number;
  amount_recovered: string | number;
}

export interface FailureTypeBreakdown {
  failure_type: string;
  total_count: number;
  recovered_count: number;
  amount_at_risk: string | number;
  amount_recovered: string | number;
  recovery_rate_pct: number;
}

export interface DashboardChartsData {
  daily_trends: DailyRecoveryTrend[];
  failure_breakdown: FailureTypeBreakdown[];
  stage_conversion_funnel: Array<{ stage: string; count: number; description: string }>;
}

export interface AIDiagnosisResult {
  failure_category: FailureType;
  root_cause_summary: string;
  confidence_score: number;
  recommended_action: RecoveryAction;
  action_rationale: string;
  suggested_cooldown_hours: number;
  customer_communication_draft?: string;
}

export interface PolicyEvaluationResult {
  is_approved: boolean;
  original_proposed_action: RecoveryAction;
  effective_action: RecoveryAction;
  applied_rules: string[];
  rejection_reason?: string;
  requires_escalation: boolean;
  is_terminal_stop: boolean;
  stop_reason?: string;
}

export interface RecoveryExecutionResult {
  success: boolean;
  status: ExecutionStatus;
  amount_recovered: string | number;
  channel: string;
  outcome_details: Record<string, any>;
  raw_gateway_code?: string;
  message: string;
}

export interface RecoveryStepResponse {
  risk_id: string;
  step_name: string;
  previous_status: RiskStatus;
  current_status: RiskStatus;
  diagnosis?: AIDiagnosisResult;
  policy_evaluation?: PolicyEvaluationResult;
  execution_result?: RecoveryExecutionResult;
  is_terminal: boolean;
  stop_reason?: string;
  amount_recovered: string | number;
}

export interface BatchRecoveryResultItem {
  risk_id: string;
  customer_name: string;
  amount_at_risk: string | number;
  amount_recovered: string | number;
  detected_failure_type: string;
  final_status: string;
  step_count: number;
  priority_score?: number;
  stop_reason?: string;
}

export interface BatchRecoveryResponse {
  processed_count: number;
  recovered_count: number;
  escalated_count: number;
  stopped_count: number;
  total_amount_recovered: string | number;
  execution_mode?: string;
  results: BatchRecoveryResultItem[];
}

// -------------------------------------------------------------
// TIER 1: RECOVERY INTELLIGENCE SCHEMAS & INTERFACES
// -------------------------------------------------------------

export interface RecoveryProbabilityResult {
  probability: number;
  score: number;
  confidence: number;
  factors: string[];
  positive_factors: string[];
  negative_factors: string[];
}

export interface RecoveryPriorityResult {
  priority_score: number;
  priority_band: PriorityBand;
  components: Record<string, number>;
  reason: string;
}

export interface ExpectedRecoveryResult {
  transaction_amount: string | number;
  recovery_probability: number;
  expected_recovery_value: string | number;
  expected_loss: string | number;
}

export interface ActionCandidateScore {
  action: RecoveryAction;
  action_label: string;
  action_recovery_probability: number;
  expected_recovery_value: string | number;
  intervention_cost: string | number;
  expected_net_recovery: string | number;
  risk_level: string;
  reason: string;
  is_eligible: boolean;
}

export interface NextBestActionResult {
  recommended_action: RecoveryAction;
  recommended_action_label: string;
  confidence: number;
  expected_recovery_value: string | number;
  expected_net_recovery: string | number;
  candidates: ActionCandidateScore[];
  reason: string;
}

export interface RetryTimingResult {
  recommended_delay_hours: number;
  recommended_delay_label: string;
  reason: string;
}

export interface RecoveryOpportunityItem {
  risk_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_risk_score: string | number;
  is_opted_out: boolean;
  transaction_id: string;
  transaction_amount: string | number;
  currency: string;
  failure_type: string;
  failure_type_label: string;
  failure_reason?: string;
  status: string;
  attempt_count: number;
  created_at: string;

  // Intelligence
  recovery_probability: number;
  recoverability_score: number;
  priority_score: number;
  priority_band: PriorityBand;
  expected_recovery_value: string | number;
  expected_loss: string | number;
  recommended_action: RecoveryAction;
  recommended_action_label: string;
  recommended_delay_hours: number;
  recommended_delay_label: string;
  confidence: number;
  reason: string;
  positive_factors: string[];
  negative_factors: string[];
  candidates: ActionCandidateScore[];
  policy_preview?: PolicyEvaluationResult;
}

export interface PaginatedOpportunitiesResponse {
  items: RecoveryOpportunityItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ExpectedByFailureTypeItem {
  failure_type: string;
  failure_type_label: string;
  count: number;
  amount_at_risk: string | number;
  expected_recovery: string | number;
  average_probability: number;
}

export interface RecoveryFunnelItem {
  stage: string;
  amount: string | number;
  description: string;
}

export interface RecoveryIntelligenceSummary {
  total_revenue_at_risk: string | number;
  expected_recoverable_revenue: string | number;
  expected_loss_total: string | number;
  average_recovery_probability: number;
  high_priority_opportunities: number;
  critical_opportunities: number;
  total_risks: number;
  action_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  expected_by_failure_type: ExpectedByFailureTypeItem[];
  recovery_funnel: RecoveryFunnelItem[];
}

// -------------------------------------------------------------
// TIER 2: ADVANCED REVENUE INTELLIGENCE INTERFACES
// -------------------------------------------------------------

export interface StrategyPerformanceItem {
  strategy: string;
  strategy_label: string;
  is_control: boolean;
  recovery_rate: number;
  recovered_revenue: string | number;
  revenue_at_risk: string | number;
  interventions_count: number;
  average_attempts: number;
  escalation_rate: number;
  customer_contact_rate: number;
  expected_net_recovery: string | number;
}

export interface ExperimentResultsResponse {
  experiment_id: string;
  name: string;
  description?: string;
  status: string;
  total_assigned: number;
  control_strategy: string;
  treatment_strategy: string;
  control_metrics: StrategyPerformanceItem;
  treatment_metrics: StrategyPerformanceItem;
  lift_percentage: number;
  additional_revenue_generated: string | number;
  best_strategy: string;
  confidence_level: number;
}

export interface RecoveryExperiment {
  id: string;
  name: string;
  description?: string;
  strategy_a: string;
  strategy_b: string;
  traffic_percentage: number;
  status: string;
  start_time: string;
  end_time?: string;
  created_at: string;
}

export interface CustomerRecoveryProfile {
  customer_id: string;
  customer_name: string;
  segment: string;
  segment_label: string;
  segment_description: string;
  recoverability_score: number;
  historical_recovery_rate: number;
  successful_recovery_attempts: number;
  total_failed_events: number;
  preferred_recovery_action: string;
  best_recovery_window: string;
  average_recovery_delay_hours: number;
  contact_sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RevenueLeakageBreakdownItem {
  dimension: string;
  dimension_value: string;
  dimension_label: string;
  total_payment_volume: string | number;
  revenue_at_risk: string | number;
  expected_recoverable: string | number;
  recovered_revenue: string | number;
  unrecovered_leakage: string | number;
  recovery_rate: number;
  transaction_count: number;
}

export interface RevenueLeakageSummary {
  total_payment_volume: string | number;
  revenue_at_risk: string | number;
  expected_recoverable_revenue: string | number;
  recovered_revenue: string | number;
  unrecovered_revenue: string | number;
  recovery_rate: number;
  breakdown_by_failure_type: RevenueLeakageBreakdownItem[];
  breakdown_by_gateway: RevenueLeakageBreakdownItem[];
  breakdown_by_payment_method: RevenueLeakageBreakdownItem[];
  breakdown_by_customer_segment: RevenueLeakageBreakdownItem[];
  breakdown_by_merchant: RevenueLeakageBreakdownItem[];
}

export interface ExecutiveLeakageSummary {
  revenue_leakage_total: string | number;
  current_at_risk: string | number;
  recoverable_revenue: string | number;
  recovered_revenue: string | number;
  recovery_rate: number;
  largest_leakage_source: string;
  largest_recovery_source: string;
  worst_performing_gateway: string;
  best_performing_strategy: string;
}

export interface PaymentIncident {
  id: string;
  incident_code: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';
  affected_gateway: string;
  affected_payment_method?: string;
  failure_types?: string[];
  estimated_revenue_impact: string | number;
  root_cause_summary?: string;
  confidence: number;
  evidence_list?: string[];
  detected_at: string;
  resolved_at?: string;
}

export interface AnomalyDetectionResult {
  has_anomaly: boolean;
  current_failure_rate: number;
  baseline_failure_rate: number;
  deviation_percentage_points: number;
  affected_gateway?: string;
  affected_payment_method?: string;
  active_incident?: PaymentIncident;
  message: string;
}

export interface GatewayHealthMetric {
  gateway_name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  success_rate: number;
  failure_rate: number;
  latency_ms: number;
  timeout_rate: number;
  failure_distribution: Record<string, number>;
  is_recommended: boolean;
}

export interface GatewayRoutingRecommendation {
  recommended_gateway: string;
  expected_success_probability: number;
  expected_recovery_value: string | number;
  policy_approved: boolean;
  policy_rejection_reason?: string;
  reason: string;
  evaluated_gateways: GatewayHealthMetric[];
}

export interface PlaybookStepItem {
  step_number: number;
  time_offset_label: string;
  action: RecoveryAction;
  action_label: string;
  status: 'COMPLETED' | 'CURRENT' | 'SCHEDULED' | 'SKIPPED';
  expected_recovery_rate: number;
  policy_guardrail: string;
  description: string;
}

export interface RecoveryPlaybook {
  playbook_id: string;
  playbook_name: string;
  target_failure_type: string;
  customer_segment: string;
  total_steps: number;
  current_step_index: number;
  stopping_rules: string[];
  steps: PlaybookStepItem[];
}

export interface StrategySimulationRequest {
  simulated_max_attempts: number;
  simulated_cooldown_hours: number;
  simulated_high_value_threshold: number;
  simulated_retry_delay_hours: number;
  simulated_preferred_strategy: string;
}

export interface StrategySimulationMetrics {
  revenue_at_risk: string | number;
  expected_recovery: string | number;
  recovery_rate: number;
  interventions_count: number;
  escalations_count: number;
  customer_contacts_count: number;
  net_recovered_revenue: string | number;
}

export interface StrategySimulationResponse {
  current: StrategySimulationMetrics;
  simulated: StrategySimulationMetrics;
  difference_expected_recovery: string | number;
  difference_recovery_rate: number;
  difference_interventions: number;
  difference_escalations: number;
  summary_analysis: string;
}

export interface PolicyPlaygroundRequest {
  amount: number;
  failure_type: FailureType;
  attempt_count: number;
  is_customer_opted_out: boolean;
  hours_since_last_attempt: number;
  customer_segment: string;
  card_expiry?: string;
}

export interface PolicyPlaygroundResponse {
  ai_recommendation: RecoveryAction;
  ai_recommendation_label: string;
  policy_evaluation: PolicyEvaluationResult;
  final_action: RecoveryAction;
  final_action_label: string;
  reasoning: string;
}

export interface AttributionCategoryItem {
  category_key: string;
  category_label: string;
  recovered_revenue: string | number;
  interventions_count: number;
  percentage_of_total: number;
}

export interface RecoveryROIResponse {
  total_recovered_revenue: string | number;
  total_intervention_cost: string | number;
  net_recovered_revenue: string | number;
  roi_multiple: number;
  attribution_by_action: AttributionCategoryItem[];
  attribution_by_failure_type: AttributionCategoryItem[];
  attribution_by_strategy: AttributionCategoryItem[];
  attribution_by_gateway: AttributionCategoryItem[];
}

export interface CopilotEvidenceItem {
  title: string;
  metric_value: string;
  context: string;
}

export interface CopilotQueryRequest {
  query: string;
}

export interface CopilotQueryResponse {
  query: string;
  answer: string;
  confidence: number;
  evidence: CopilotEvidenceItem[];
  suggested_follow_ups: string[];
  is_executable: boolean;
  policy_notice: string;
}

// Tier 3: Predictive Revenue Protection & Risk Forecasting
export interface PredictiveRiskItem {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  merchant_id?: string;
  merchant_name: string;
  upcoming_amount: string | number;
  upcoming_renewal_at: string;
  future_risk_score: number;
  probability_of_failure: number;
  predicted_revenue_at_risk: string | number;
  risk_horizon: string;
  risk_horizon_hours: number;
  risk_reasons: string[];
  recommended_proactive_action: string;
  payment_method_health: 'HEALTHY' | 'DEGRADING' | 'CRITICAL';
}

export interface PredictiveRiskSummaryResponse {
  total_upcoming_volume: string | number;
  total_predicted_revenue_at_risk: string | number;
  average_failure_probability: number;
  high_risk_accounts_count: number;
  moderate_risk_accounts_count: number;
  low_risk_accounts_count: number;
  top_risk_merchant?: string;
  predictive_accounts: PredictiveRiskItem[];
}

export interface DailyForecastPoint {
  day_label: string;
  date_str: string;
  expected_payment_volume: string | number;
  predicted_failure_exposure: string | number;
  predicted_recoverable_revenue: string | number;
  confidence_percentage: number;
}

export interface RevenueForecastHorizon {
  horizon_label: string;
  expected_payment_volume: string | number;
  predicted_failure_exposure: string | number;
  expected_recoverable_revenue: string | number;
  predicted_failure_rate_pct: number;
  predicted_net_retention_pct: number;
}

export interface RevenueForecastResponse {
  horizon_24h: RevenueForecastHorizon;
  horizon_7d: RevenueForecastHorizon;
  horizon_30d: RevenueForecastHorizon;
  daily_forecasts: DailyForecastPoint[];
  top_risk_drivers: {
    category: string;
    exposure_amount: string | number;
    share_pct: number;
    urgency: string;
  }[];
  model_calibration_timestamp: string;
  is_simulated_forecast: boolean;
}

// Feature 3: Revenue Risk Heatmap
export interface HeatmapCell {
  day_of_week: string;
  day_index: number;
  hour_label: string;
  hour_24: number;
  transaction_count: number;
  failure_count: number;
  failure_rate_pct: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  color_indicator: 'GREEN' | 'YELLOW' | 'RED';
}

export interface RevenueRiskHeatmapResponse {
  days: string[];
  time_slots: string[];
  matrix: HeatmapCell[];
  highest_risk_window: string;
  safest_window: string;
  peak_failure_day: string;
  sample_transactions_analyzed: number;
}

// Feature 4 & 5: Proactive Recovery & Prevention Decision
export interface PreventionOptionA {
  name: string;
  description: string;
  expected_loss: string | number;
  intervention_cost: string | number;
  net_financial_outcome: string | number;
  customer_churn_risk: string;
}

export interface PreventionOptionB {
  name: string;
  description: string;
  expected_recovered: string | number;
  intervention_cost: string | number;
  net_financial_yield: string | number;
  expected_recovery_rate_pct: number;
  customer_churn_risk: string;
}

export interface PreventionOptionC {
  name: string;
  description: string;
  recommended_action: string;
  expected_prevented_loss: string | number;
  intervention_cost: string | number;
  net_financial_yield: string | number;
  expected_prevention_efficiency_pct: number;
  customer_churn_risk: string;
}

export interface PreventionDecisionResult {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  merchant_name: string;
  upcoming_amount: string | number;
  probability_of_failure: number;
  predicted_exposure: string | number;
  risk_horizon: string;
  option_a: PreventionOptionA;
  option_b: PreventionOptionB;
  option_c: PreventionOptionC;
  best_option: 'PROACTIVE_INTERVENTION' | 'RECOVER_AFTER_FAILURE' | 'DO_NOTHING';
  best_option_label: string;
  net_value_advantage: string | number;
  economic_rationale: string;
}

export interface ProactiveActionExecutionRequest {
  customer_id: string;
  action_type?: string;
  custom_notes?: string;
}

export interface ProactiveActionExecutionResponse {
  execution_id: string;
  customer_id: string;
  customer_name: string;
  action_type: string;
  action_label: string;
  status: string;
  policy_approved: boolean;
  expected_prevented_loss: string | number;
  execution_message: string;
  executed_at: string;
}

// Feature 6: Customer Lifetime Value Protection
export interface CustomerValueProfile {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  current_transaction_amount: string | number;
  historical_volume: string | number;
  average_transaction_amount: string | number;
  relationship_tenure_months: number;
  customer_value_score: number;
  value_tier: 'VIP_ENTERPRISE' | 'HIGH_GROWTH' | 'STANDARD' | 'STARTER';
  recommended_touch_level: 'WHITE_GLOVE_HUMAN' | 'ACCOUNT_MANAGER_CONCIERGE' | 'AUTOMATED_BALANCED';
  explanation: string;
}

// Feature 7 & 8: Recovery Cost Optimization & Margin-Aware Recovery
export interface InterventionCostBreakdown {
  action: string;
  action_label: string;
  intervention_cost: string | number;
  expected_gross_recovery: string | number;
  expected_net_recovery: string | number;
  roi_multiple: number;
  is_margin_viable: boolean;
  viability_status: 'ECONOMICALLY_VIABLE' | 'MARGIN_NEGATIVE_REJECTED';
  rationale: string;
}

export interface InterventionCostConfigResponse {
  retry_payment_cost: string | number;
  send_payment_reminder_cost: string | number;
  request_payment_method_update_cost: string | number;
  escalate_to_human_cost: string | number;
  minimum_expected_net_recovery: string | number;
}

// Feature 9: Contact Fatigue Protection
export interface ContactFatigueProfile {
  customer_id: string;
  customer_name: string;
  messages_sent_24h: number;
  messages_limit_24h: number;
  messages_sent_7d: number;
  messages_limit_7d: number;
  last_contact_time?: string;
  hours_since_last_contact?: number;
  contact_sensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  contact_success_rate_pct: number;
  is_contact_allowed: boolean;
  rejection_reason?: string;
  cooldown_remaining_hours: number;
}

// Feature 10: Smart Channel Selection
export interface ChannelScore {
  channel: string;
  channel_label: string;
  expected_response_probability: number;
  marginal_cost: string | number;
  is_available: boolean;
  rank: number;
}

export interface ChannelOptimizationResult {
  customer_id: string;
  customer_name: string;
  best_channel: string;
  best_channel_label: string;
  expected_response_probability: number;
  channel_rankings: ChannelScore[];
  selection_reason: string;
}

// Feature 11: Customer Communication Personalization
export interface CommunicationDraftRequest {
  customer_id: string;
  failure_type: string;
  amount: string | number;
  recommended_action: string;
  payment_deadline?: string;
  preferred_channel?: string;
}

export interface CommunicationDraftResponse {
  customer_name: string;
  channel: string;
  subject_line: string;
  body_text: string;
  action_button_label: string;
  action_url: string;
  facts_grounding: string[];
  generated_at: string;
}

// Feature 12 & 13: Autonomy Levels & Control Center
export type AutonomyMode = 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';

export interface AutonomyConfigResponse {
  current_mode: AutonomyMode;
  automatic_actions: string[];
  human_approval_required: string[];
  safety_warning: string;
  last_updated_at: string;
}

// Feature 14: Human Approval Queue
export interface ApprovalQueueItem {
  id: string;
  risk_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  merchant_name: string;
  amount: string | number;
  urgency_tag: 'HIGH_VALUE' | 'REPEATED_FAILURE' | 'UNKNOWN_FAILURE' | 'SENSITIVE_ACCOUNT';
  ai_recommendation: string;
  policy_reason: string;
  expected_recovery: string | number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  requested_at: string;
}

export interface HumanApprovalActionResponse {
  risk_id: string;
  action: string;
  new_status: string;
  audit_event_logged: string;
  message: string;
  processed_at: string;
}

// Feature 15 & 16: Recovery Control Center & Real-Time Event Stream
export interface ControlCenterKPIs {
  revenue_at_risk: string | number;
  expected_recovery: string | number;
  recovered_today: string | number;
  active_recoveries_count: number;
  pending_approvals_count: number;
  open_incidents_count: number;
  predicted_risk_volume: string | number;
  recovery_efficiency_pct: number;
}

export interface LiveEventItem {
  id: string;
  timestamp_str: string;
  event_type: string;
  headline: string;
  details: string;
  customer_name?: string;
  amount?: string | number;
  badge_color: 'GREEN' | 'BLUE' | 'PURPLE' | 'AMBER' | 'RED';
  created_at: string;
}

export interface LiveEventStreamResponse {
  events: LiveEventItem[];
  total_events: number;
  last_event_time: string;
}

export interface ControlCenterSummaryResponse {
  kpis: ControlCenterKPIs;
  critical_revenue_risks: any[];
  payment_incidents: any[];
  human_approvals: ApprovalQueueItem[];
  active_playbooks: any[];
  recent_events: LiveEventItem[];
  system_health_status: 'OPTIMAL' | 'DEGRADED' | 'INCIDENT_ACTIVE';
  last_refreshed_at: string;
}

// Feature 17 & 18: Incident Response Playbook & Simulation
export interface IncidentPlaybookStep {
  step_number: number;
  step_name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  description: string;
  data_payload?: any;
}

export interface IncidentPlaybookItem {
  incident_id: string;
  incident_title: string;
  gateway_name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detected_at: string;
  revenue_at_risk_hourly: string | number;
  affected_transactions_count: number;
  recommended_mitigation: string;
  target_gateway: string;
  expected_improvement_pct: number;
  expected_protected_revenue_hourly: string | number;
  steps: IncidentPlaybookStep[];
  policy_approval_status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
}

export interface IncidentMitigationSimulationRequest {
  incident_id: string;
  current_gateway_share_pct?: number;
  proposed_gateway_share_pct?: number;
  target_gateway_share_pct?: number;
}

export interface IncidentMitigationSimulationResponse {
  incident_id: string;
  current_gateway_share: string;
  proposed_gateway_share: string;
  current_success_rate_pct: number;
  expected_success_rate_pct: number;
  success_rate_delta_pct: number;
  expected_protected_revenue_hourly: string | number;
  estimated_latency_delta_ms: number;
  policy_approved: boolean;
  requires_human_approval: boolean;
  simulation_summary: string;
  simulated_at: string;
}

export interface IncidentMitigationExecutionRequest {
  incident_id: string;
  target_gateway: string;
  proposed_share_pct?: number;
  operator_notes?: string;
}

export interface IncidentMitigationExecutionResponse {
  incident_id: string;
  action_taken: string;
  status: string;
  audit_event_logged: string;
  message: string;
  executed_at: string;
}

// Feature 19: Revenue Protection Score
export interface RevenueProtectionScorePillars {
  recovery: number;
  prevention: number;
  policy_compliance: number;
  incident_response: number;
  prediction_accuracy: number;
  contact_efficiency: number;
}

export interface RevenueProtectionScoreResponse {
  overall_score: number;
  previous_period_score: number;
  trend_delta_pct: number;
  is_positive_trend: boolean;
  grade: 'EXCELLENT' | 'HEALTHY' | 'NEEDS_ATTENTION';
  pillars: RevenueProtectionScorePillars;
  summary_explanation: string;
  evaluated_at: string;
}

// Feature 20: Prediction Accuracy
export interface PredictionAccuracyMetricsResponse {
  recovery_probability_accuracy_pct: number;
  risk_prediction_accuracy_pct: number;
  precision_pct: number;
  recall_pct: number;
  false_positive_rate_pct: number;
  false_negative_rate_pct: number;
  predicted_high_risk_count: number;
  actually_failed_count: number;
  total_evaluated_predictions: number;
  evaluation_label: string;
  model_version: string;
  last_evaluated_at: string;
}

// Feature 21: Model / Decision Explainability
export interface DecisionFactorWeight {
  factor_name: string;
  weight_pct: number;
  impact_direction: 'INCREASES_RISK' | 'DECREASES_RISK' | 'PROMOTES_ACTION';
  evidence_text: string;
}

export interface DecisionExplainabilityResponse {
  risk_id: string;
  failure_probability_pct: number;
  confidence_pct: number;
  decision_version: string;
  data_timestamp: string;
  top_factors: DecisionFactorWeight[];
  reproducibility_hash: string;
  explanation_summary: string;
}

// Feature 22: Decision Replay
export interface DecisionReplayTimelineEvent {
  timestamp_str: string;
  stage_name: 'DETECTION' | 'PREDICTION' | 'RECOMMENDATION' | 'POLICY_GATE' | 'EXECUTION' | 'SETTLEMENT';
  headline: string;
  detail: string;
  status_badge: 'SUCCESS' | 'APPROVED' | 'RECOMMENDED' | 'DETECTED';
  payload_snapshot?: any;
}

export interface DecisionReplayResponse {
  risk_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  merchant_name: string;
  amount_at_risk: string | number;
  amount_recovered: string | number;
  current_status: string;

  what_recoverai_knew: any;
  what_it_predicted: any;
  what_it_recommended: any;
  what_policy_decided: any;
  what_happened: any;

  timeline_events: DecisionReplayTimelineEvent[];
  decision_version: string;
  reconstructed_at: string;
}

export interface ReplayCaseListItem {
  risk_id: string;
  customer_name: string;
  amount: string | number;
  failure_type: string;
  status: string;
  occurred_at: string;
}

// Feature 23: Counterfactual Analysis ("What Would Have Happened?")
export interface CounterfactualAnalysisResponse {
  risk_id: string;
  actual_recovered_amount: string | number;
  without_recoverai_expected_loss: string | number;
  with_recoverai_recovered: string | number;
  net_revenue_protected: string | number;
  strategy_comparison_a_name: string;
  strategy_comparison_a_expected_recovery: string | number;
  strategy_comparison_b_name: string;
  strategy_comparison_b_expected_recovery: string | number;
  strategy_recovery_difference: string | number;
  counterfactual_disclaimer: string;
  simulated_at: string;
}

// Feature 24: Executive "Money Story"
export interface FailureCauseBreakdown {
  failure_category: string;
  amount_lost: string | number;
  percentage_share: number;
  primary_solution: string;
}

export interface ExecutiveMoneyStoryResponse {
  revenue_at_risk: string | number;
  protected_before_failure: string | number;
  recovered_so_far: string | number;
  remaining_opportunity: string | number;
  expected_recoverable: string | number;
  top_failure_causes: FailureCauseBreakdown[];
  primary_recommended_action: string;
  action_expected_yield: string | number;
  action_urgency: 'IMMEDIATE' | 'HIGH' | 'SCHEDULED';
  headline_narrative: string;
  generated_at: string;
}

// Feature 25: Proactive Recommendation Feed
export interface ProactiveRecommendationItem {
  id: string;
  priority_level: 'HIGH_PRIORITY' | 'CUSTOMER_RISK' | 'EXPIRING_CARDS' | 'OPTIMAL_TIMING';
  badge_label: string;
  title: string;
  description: string;
  financial_impact_metric: string;
  recommended_action: string;
  expected_protected_revenue: string | number;
  action_type: 'SIMULATE' | 'VIEW_CUSTOMERS' | 'LAUNCH_CAMPAIGN' | 'APPLY_TIMING';
  target_route?: string;
  created_at: string;
}

export interface RecommendationsFeedResponse {
  total_recommendations: number;
  high_priority_count: number;
  estimated_total_addressable_revenue: string | number;
  recommendations: ProactiveRecommendationItem[];
  last_updated_at: string;
}

// Feature 26 & 27: Merchant Health Score & Merchant Action Plan
export interface MerchantHealthPillars {
  payment_health: number;
  recovery: number;
  revenue_leakage: number;
  gateway_reliability: number;
  customer_recoverability: number;
  incident_frequency: number;
}

export interface MerchantHealthScoreResponse {
  merchant_id: string;
  merchant_name: string;
  overall_health_score: number;
  grade: 'TIER_1_EXCELLENT' | 'TIER_2_HEALTHY' | 'TIER_3_ELEVATED_RISK';
  pillars: MerchantHealthPillars;
  active_customers_count: number;
  monthly_volume: string | number;
  evaluated_at: string;
}

export interface MerchantActionPlanOpportunity {
  rank: number;
  title: string;
  potential_monthly_revenue: string | number;
  failure_cause: string;
  recommended_playbook: string;
}

export interface MerchantActionPlanResponse {
  merchant_id: string;
  merchant_name: string;
  health_score: number;
  predicted_monthly_leakage: string | number;
  top_3_opportunities: MerchantActionPlanOpportunity[];
  top_3_failure_causes: string[];
  top_recovery_strategy: string;
  top_gateway_issue: string;
  recommended_interventions: string[];
  generated_at: string;
}

// Feature 28: Monthly Revenue Recovery Report
export interface MonthlyRecoveryReportResponse {
  report_title: string;
  period: string;
  revenue_at_risk: string | number;
  recovered: string | number;
  prevented: string | number;
  recovery_rate_pct: number;
  top_failure: string;
  best_strategy: string;
  worst_gateway: string;
  policy_violations: number;
  generated_at: string;
  csv_data: string;
}

// Feature 29: Revenue Recovery Leaderboards
export interface LeaderboardRankingItem {
  rank: number;
  name: string;
  metric_value: string | number;
  metric_formatted: string;
  secondary_info: string;
  badge_label?: string;
}

export interface RevenueLeaderboardResponse {
  period_filter: string;
  top_strategies: LeaderboardRankingItem[];
  top_actions: LeaderboardRankingItem[];
  top_gateways: LeaderboardRankingItem[];
  top_customer_segments: LeaderboardRankingItem[];
  top_merchants: LeaderboardRankingItem[];
  last_updated_at: string;
}

// Feature 30 & 31: Versioning & Advanced Audit
export interface DecisionVersionConfigResponse {
  recovery_intelligence_version: string;
  policy_version: string;
  strategy_version: string;
  governance_model: string;
  immutable_audit_logging_active: boolean;
  active_audit_event_types: string[];
}

// Feature 32: System Health & Resilience
export interface SystemHealthComponent {
  component_name: string;
  status: 'HEALTHY' | 'AVAILABLE' | 'READY' | 'OPERATIONAL' | 'DEGRADED' | 'FALLBACK_ACTIVE';
  is_operational: boolean;
  status_message: string;
  latency_ms: number;
}

export interface SystemHealthResponse {
  overall_system_status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  is_resilient: boolean;
  components: SystemHealthComponent[];
  openai_available: boolean;
  fallback_diagnosis_ready: boolean;
  checked_at: string;
}

// Feature 33: Failure Chaos Simulation
export interface ChaosSimulationResultResponse {
  scenario: string;
  trigger_event: string;
  initial_condition: string;
  subsystem_response: string;
  fallback_activated: boolean;
  recovery_workflow_status: string;
  policy_engine_status: string;
  safety_guarantee_observed: string;
  audit_event_logged: string;
  executed_at: string;
}

// Feature 34 & 35: AI vs Rules Transparency & Demo
export interface PolicyRuleEvaluationItem {
  rule_name: string;
  status: 'PASSED' | 'VIOLATION' | 'FAILED';
  description: string;
  impact: string;
}

export interface AiVsRulesEvaluationRequest {
  transaction_amount: string | number;
  ai_proposed_action: string;
  ai_confidence_pct: number;
  customer_opted_out: boolean;
  prior_attempts: number;
}

export interface AiVsRulesEvaluationResponse {
  transaction_amount: string | number;
  ai_proposal: string;
  ai_confidence_pct: number;
  policy_rules_evaluated: PolicyRuleEvaluationItem[];
  policy_verdict: 'BLOCK' | 'ALLOW';
  policy_violation_reason?: string;
  final_decision: string;
  responsible_ai_summary: string;
  evaluated_at: string;
}

// Feature 36 & 37: Demo Scenario Builder & Demo Reset
export interface DemoScenarioInfo {
  id: string;
  title: string;
  description: string;
  key_concept: string;
  expected_outcome: string;
  icon_name: string;
}

export interface DemoScenarioExecutionResponse {
  scenario_id: string;
  scenario_title: string;
  risk_id?: string;
  customer_name: string;
  amount_formatted: string;
  failure_type: string;
  step_1_diagnosis: string;
  step_2_ai_recommendation: string;
  step_3_policy_gate: string;
  step_4_execution_result: string;
  final_status: string;
  audit_trace_id: string;
  differentiator_slogan: string;
  executed_at: string;
}

export interface DemoResetResponse {
  success: boolean;
  message: string;
  restored_customers: number;
  restored_risks: number;
  reset_at: string;
}

export interface GuidedDemoSceneItem {
  scene_number: number;
  title: string;
  narrative_hook: string;
  action_button_label: string;
  target_tab: string;
  highlight_metrics: string[];
}

// -------------------------------------------------------------------------
// Flagship Feature 1: Payment Decision Graph Types
// -------------------------------------------------------------------------

export type DecisionGraphNodeStatus =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'PASS'
  | 'BLOCK'
  | 'ALLOW'
  | 'ESCALATE'
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING'
  | 'ACTIVE'
  | 'NEUTRAL';

export interface DecisionGraphNode {
  id: string;
  type: string;
  label: string;
  subtitle?: string;
  status: DecisionGraphNodeStatus;
  data: Record<string, any>;
  details: Record<string, any>;
  tooltip: string;
  stage_index: number;
}

export interface DecisionGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  style: string;
}

export interface DecisionFactor {
  category: string;
  factor: string;
  value: any;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  explanation: string;
  tag: string;
}

export interface PolicyEvaluationSummary {
  rule_name: string;
  status: 'PASS' | 'BLOCK' | 'TRIGGERED';
  description: string;
  impact: string;
}

export interface AiVsPolicyComparison {
  ai_proposed_action: string;
  ai_confidence_pct: number;
  ai_rationale: string;
  ai_source: string;
  policy_rules: PolicyEvaluationSummary[];
  policy_verdict: string;
  policy_reason?: string;
  final_decision_action: string;
  final_decision_status: string;
  is_ai_overridden: boolean;
  summary: string;
}

export interface DecisionTimelineEvent {
  step_name: string;
  actor: string;
  timestamp: string;
  summary: string;
  status: string;
}

export interface PaymentDecisionGraphResponse {
  decision_id: string;
  risk_id: string;
  transaction_id?: string;
  customer_id?: string;
  timestamp: string;
  decision_version: string;
  policy_version: string;
  strategy_version: string;
  nodes: DecisionGraphNode[];
  edges: DecisionGraphEdge[];
  factors: DecisionFactor[];
  ai_proposal: Record<string, any>;
  policy_result: Record<string, any>;
  final_decision: Record<string, any>;
  execution_result: Record<string, any>;
  outcome: Record<string, any>;
  ai_vs_policy: AiVsPolicyComparison;
  timeline: DecisionTimelineEvent[];
  differentiator_slogan: string;
}

// -------------------------------------------------------------------------
// Flagship Feature 2: Adaptive Authorization & Smart 3DS Types
// -------------------------------------------------------------------------

export type AuthenticationStrategyType =
  | 'NO_3DS'
  | 'FRICTIONLESS_3DS'
  | 'CHALLENGE_3DS'
  | 'NOT_APPLICABLE';

export type TokenStrategyType =
  | 'STANDARD_CREDENTIAL'
  | 'NETWORK_TOKEN_SIMULATED'
  | 'NOT_AVAILABLE';

export interface AuthorizationStrategyCandidate {
  gateway_name: string;
  authentication_method: string;
  token_strategy: string;
  authorization_probability: number;
  conversion_probability: number;
  customer_friction_score: number;
  customer_friction_label: string;
  expected_gross_revenue: number;
  estimated_cost: number;
  expected_net_revenue: number;
  strategy_score: number;
  is_recommended: boolean;
  rank: number;
}

export interface WhyThisPathFactor {
  factor: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'WARNING';
  description: string;
}

export interface WhatIfSimulationRequest {
  amount: number;
  currency?: string;
  selected_gateway: string;
  selected_authentication: string;
  selected_token_strategy: string;
  customer_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  is_opted_out?: boolean;
}

export interface WhatIfSimulationResponse {
  selected_gateway: string;
  selected_authentication: string;
  selected_token_strategy: string;
  authorization_probability: number;
  conversion_probability: number;
  customer_friction_score: number;
  customer_friction_label: string;
  expected_net_revenue: number;
  recommended_net_revenue: number;
  delta_vs_recommended: number;
  comparison_summary: string;
  simulation_disclaimer: string;
}

export interface AuthorizationPolicyResult {
  status: 'ALLOW' | 'BLOCK' | 'HUMAN_APPROVAL_REQUIRED';
  rules_evaluated: string[];
  requires_escalation: boolean;
  rejection_reason?: string;
}

export interface AuthorizationDecisionResponse {
  decision_id: string;
  transaction_id: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  currency: string;
  payment_method: string;
  card_last4?: string;
  recommended_strategy: {
    gateway: string;
    authentication: string;
    token_strategy: string;
  };
  baseline_strategy: {
    gateway: string;
    authentication: string;
    token_strategy: string;
  };
  authorization_probability: number;
  conversion_probability: number;
  customer_friction_score: number;
  customer_friction_label: string;
  expected_gross_revenue: number;
  estimated_cost: number;
  expected_net_revenue: number;
  baseline_net_revenue: number;
  expected_revenue_lift: number;
  why_this_path: WhyThisPathFactor[];
  alternatives: AuthorizationStrategyCandidate[];
  policy_result: AuthorizationPolicyResult;
  decision_version: string;
  evaluated_at: string;
  simulation_disclaimer: string;
}

export interface AuthorizationFunnelStage {
  stage_name: string;
  baseline_count: number;
  optimized_count: number;
  baseline_rate: number;
  optimized_rate: number;
  lift_pct: number;
}

export interface AuthorizationFunnelResponse {
  total_transactions: number;
  stages: AuthorizationFunnelStage[];
  overall_conversion_lift_pct: number;
  total_revenue_lift_formatted: string;
}

export interface AuthorizationLossCategory {
  category: string;
  lost_amount: number;
  lost_percentage: number;
  preventable_by_recoverai: number;
  explanation: string;
}

export interface AuthorizationLossBreakdownResponse {
  total_lost_revenue: number;
  preventable_total: number;
  categories: AuthorizationLossCategory[];
}

// -------------------------------------------------------------------------
// Self-Learning Policy Optimizer Types
// -------------------------------------------------------------------------

export interface AttemptEfficiencyMetric {
  attempt_number: number;
  total_attempts: number;
  successful_recoveries: number;
  recovery_rate: number;
  incremental_recovery_rate: number;
  intervention_cost: number;
  customer_friction_index: number;
  is_economically_viable: boolean;
}

export interface CooldownPerformanceMetric {
  window_label: string;
  min_hours: number;
  max_hours?: number;
  attempts_count: number;
  success_rate: number;
  is_optimal_window: boolean;
}

export interface CurrentPolicyState {
  id: string;
  name: string;
  version: number;
  max_attempts: number;
  cooldown_hours: number;
  high_value_threshold: number;
  active_since: string;
}

export interface PolicySafetyAssessment {
  is_safe: boolean;
  overall_safety_score: number;
  customer_protection_score: number;
  financial_safety_score: number;
  operational_safety_score: number;
  magnitude_score: number;
  checks_passed: string[];
  violations: string[];
}

export interface WhyNotAlternative {
  alternative_value: string;
  projected_recovery: string;
  projected_friction: string;
  net_revenue_impact: string;
  rejection_rationale: string;
}

export interface PolicySimulationResponse {
  proposal_id: string;
  parameter_name: string;
  current_value: string;
  proposed_value: string;
  current_gross_revenue: number;
  current_cost: number;
  current_net_revenue: number;
  current_recovery_rate: number;
  proposed_gross_revenue: number;
  proposed_cost: number;
  proposed_net_revenue: number;
  proposed_recovery_rate: number;
  net_revenue_delta: number;
  recovery_rate_delta: number;
  cost_delta: number;
  customer_friction_delta: number;
  confidence_score: number;
  observations_count: number;
  affected_transactions: number;
  safety_assessment: PolicySafetyAssessment;
  simulation_disclaimer: string;
}

export interface PolicyProposalResponse {
  id: string;
  proposal_id: string;
  parameter_name: string;
  parameter_label: string;
  current_value: string;
  proposed_value: string;
  policy_version_before: number;
  policy_version_after?: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ACTIVATED' | 'ROLLED_BACK' | 'STALE';
  confidence_score: number;
  observations_count: number;
  affected_transactions: number;
  projected_recovery_delta: number;
  projected_cost_delta: number;
  projected_net_revenue_delta: number;
  projected_customer_friction_delta: number;
  ai_summary?: string;
  ai_rationale?: string;
  ai_risk_factors: string[];
  why_not_alternatives: WhyNotAlternative[];
  safety_assessment: PolicySafetyAssessment;
  reviewed_by?: string;
  review_reason?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface PolicyPerformanceOverview {
  current_policy: CurrentPolicyState;
  overall_recovery_rate: number;
  total_at_risk: number;
  total_recovered: number;
  total_intervention_cost: number;
  net_recovered_revenue: number;
  attempts_breakdown: AttemptEfficiencyMetric[];
  cooldown_breakdown: CooldownPerformanceMetric[];
  customer_friction_rate: number;
  policy_performance_score: number;
  pending_proposals_count: number;
  potential_monthly_opportunity: number;
}

export interface PolicyApprovalRequest {
  operator_name: string;
  reason?: string;
}

export interface PolicyRejectionRequest {
  operator_name: string;
  reason: string;
  notes?: string;
}

export interface PolicyRollbackRequest {
  operator_name: string;
  target_version?: number;
  reason: string;
}

export interface PolicyHistoryItem {
  version: number;
  max_attempts: number;
  cooldown_hours: number;
  high_value_threshold: number;
  is_active: boolean;
  created_at: string;
  changed_by?: string;
  change_reason?: string;
  proposal_id?: string;
}

// -----------------------------------------------------------------------------
// Hackathon Specialized Directions: B2B, Mandates, Hinglish Voice, Promise-to-Pay
// -----------------------------------------------------------------------------

export interface PromiseToPayRecord {
  id: string;
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  promised_amount: number | string;
  promised_date: string;
  status: 'ACTIVE_PROMISE' | 'FULFILLED' | 'BROKEN' | 'ESCALATED';
  channel_committed: 'VOICE_CALL' | 'WHATSAPP' | 'PORTAL' | 'EMAIL';
  operator_notes?: string;
  dunning_paused: boolean;
  created_at: string;
}

export interface PromiseToPayCreateRequest {
  invoice_id: string;
  customer_id: string;
  promised_amount: number | string;
  promised_date: string;
  channel?: string;
  operator_notes?: string;
}

export interface B2BReceivableInvoice {
  id: string;
  invoice_number: string;
  po_number: string;
  customer_id: string;
  customer_name: string;
  company_name: string;
  amount_due: number | string;
  currency: string;
  due_date: string;
  days_overdue: number;
  aging_bucket: 'CURRENT_0_30' | 'OVERDUE_31_60' | 'CRITICAL_61_90' | 'DEFAULT_RISK_90_PLUS';
  status: 'UNPAID' | 'PROMISE_TO_PAY' | 'ESCALATED_HUMAN' | 'RECOVERED' | 'DISPUTED';
  dispute_reason?: string;
  has_active_promise: boolean;
  active_promise_date?: string;
  recommended_action: string;
  ai_risk_score: number;
  is_vip: boolean;
}

export interface B2BReceivablesSummary {
  total_receivables_at_risk: number | string;
  total_invoices_count: number;
  current_bucket_amount: number | string;
  overdue_bucket_amount: number | string;
  critical_bucket_amount: number | string;
  default_risk_bucket_amount: number | string;
  active_ptp_count: number;
  active_ptp_volume: number | string;
  broken_ptp_count: number;
  human_escalations_count: number;
  invoices: B2BReceivableInvoice[];
  recent_promises: PromiseToPayRecord[];
}

export interface MandateSequenceItem {
  id: string;
  mandate_id: string;
  mandate_type: 'UPI_AUTOPAY' | 'ENACH' | 'DEBIT_CARD_MANDATE' | 'CREDIT_CARD_MANDATE';
  customer_name: string;
  subscription_plan: string;
  amount: number | string;
  currency: string;
  bank_name: string;
  detected_failure_code: string;
  failure_reason: string;
  aligned_salary_day: number;
  optimal_retry_window: string;
  next_scheduled_retry: string;
  retry_attempt_number: number;
  max_mandate_attempts: number;
  expected_success_rate_pct: number;
  sequence_status: 'SCHEDULED' | 'WAITING_SALARY_CYCLE' | 'EXECUTED_SUCCESS' | 'MANDATE_EXPIRED';
  strategy_applied: string;
}

export interface MandateSequencerSummary {
  total_mandates_at_risk: number | string;
  active_mandates_count: number;
  upi_autopay_volume: number | string;
  enach_volume: number | string;
  card_mandate_volume: number | string;
  optimal_window_projected_lift_pct: number;
  salary_cycle_aligned_count: number;
  scheduled_sequences: MandateSequenceItem[];
}

export interface MandateExecuteResponse {
  mandate_id: string;
  status: string;
  amount_recovered: number | string;
  execution_receipt: string;
  bank_response_code: string;
  settled_at: string;
  audit_event_id: string;
}

export interface HinglishVoiceCallScript {
  call_id: string;
  customer_name: string;
  customer_phone: string;
  amount_due_formatted: string;
  language_mode: 'HINGLISH' | 'HINDI' | 'ENGLISH';
  intent_detected: string;
  call_duration_est_sec: number;
  opening_line: string;
  audio_simulation_url?: string;
  dialogue_turns: Array<{ speaker: string; text: string }>;
  recommended_settlement_offer?: string;
  payment_link: string;
  compliance_disclaimer: string;
}

export interface WhatsAppRecoveryMessage {
  message_id: string;
  customer_name: string;
  customer_phone: string;
  language: string;
  header_text: string;
  body_text: string;
  quick_reply_buttons: string[];
  payment_cta_url: string;
  opt_out_text: string;
  delivery_status: string;
}

export interface ConversationalStudioGenerateRequest {
  customer_id: string;
  amount: number | string;
  failure_type?: string;
  preferred_language: 'HINGLISH' | 'HINDI' | 'ENGLISH';
  channel?: 'VOICE_CALL' | 'WHATSAPP' | 'SMS' | 'ALL';
  tone?: string;
}

export interface ConversationalStudioResponse {
  voice_script?: HinglishVoiceCallScript;
  whatsapp_message?: WhatsAppRecoveryMessage;
  facts_grounding: string[];
  policy_compliance_check: string;
  generated_at: string;
}











