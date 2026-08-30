/** Frontend API client for Tier 3: Predictive Revenue Protection, Risk Forecasting, Heatmap, Proactive Prevention, Value Protection, Margin Optimization, Smart Channels, Personalization, Autonomy & Human Approval Queue. */

import { apiClient } from './client';
import {
  PredictiveRiskSummaryResponse,
  PredictiveRiskItem,
  RevenueForecastResponse,
  DailyForecastPoint,
  RevenueRiskHeatmapResponse,
  PreventionDecisionResult,
  ProactiveActionExecutionRequest,
  ProactiveActionExecutionResponse,
  CustomerValueProfile,
  InterventionCostConfigResponse,
  InterventionCostBreakdown,
  ContactFatigueProfile,
  ChannelOptimizationResult,
  CommunicationDraftRequest,
  CommunicationDraftResponse,
  AutonomyMode,
  AutonomyConfigResponse,
  ApprovalQueueItem,
  HumanApprovalActionResponse,
} from '../types';

// 1. Predictive Risk & Forecast API
export const getPredictiveRiskSummary = async (): Promise<PredictiveRiskSummaryResponse> => {
  const res = await apiClient.get('/predictive-risk/summary');
  return res.data;
};

export const getPredictiveRiskItems = async (params?: {
  min_score?: number;
  health?: string;
}): Promise<PredictiveRiskItem[]> => {
  const res = await apiClient.get('/predictive-risk/items', { params });
  return res.data;
};

export const getCustomerPredictiveRisk = async (customerId: string): Promise<PredictiveRiskItem> => {
  const res = await apiClient.get(`/predictive-risk/customer/${customerId}`);
  return res.data;
};

export const getRevenueForecastSummary = async (): Promise<RevenueForecastResponse> => {
  const res = await apiClient.get('/forecast/summary');
  return res.data;
};

export const getForecastTimeseries = async (): Promise<DailyForecastPoint[]> => {
  const res = await apiClient.get('/forecast/timeseries');
  return res.data;
};

// 2. Revenue Risk Heatmap API
export const getRevenueRiskHeatmap = async (): Promise<RevenueRiskHeatmapResponse> => {
  const res = await apiClient.get('/heatmap/risk-matrix');
  return res.data;
};

// 3. Prevention vs Recovery Decision API
export const getPreventionDecisions = async (): Promise<PreventionDecisionResult[]> => {
  const res = await apiClient.get('/prevention/decisions');
  return res.data;
};

export const getSinglePreventionDecision = async (customerId: string): Promise<PreventionDecisionResult> => {
  const res = await apiClient.get(`/prevention/decision/${customerId}`);
  return res.data;
};

export const executeProactiveAction = async (
  req: ProactiveActionExecutionRequest
): Promise<ProactiveActionExecutionResponse> => {
  const res = await apiClient.post('/prevention/execute-proactive', req);
  return res.data;
};

// 4. Customer Value, Unit Cost & Contact Fatigue APIs (Features 6, 7, 8, 9)
export const getCustomerValueProfile = async (
  customerId: string,
  amount?: number | string
): Promise<CustomerValueProfile> => {
  const res = await apiClient.get(`/unit-economics/customer-value/${customerId}`, {
    params: amount ? { amount } : undefined,
  });
  return res.data;
};

export const getInterventionCostsConfig = async (): Promise<InterventionCostConfigResponse> => {
  const res = await apiClient.get('/unit-economics/costs');
  return res.data;
};

export const getContactFatigueProfile = async (customerId: string): Promise<ContactFatigueProfile> => {
  const res = await apiClient.get(`/unit-economics/contact-fatigue/${customerId}`);
  return res.data;
};

export const evaluateMarginViability = async (params: {
  action: string;
  amount_at_risk: number | string;
  recovery_probability: number;
}): Promise<InterventionCostBreakdown> => {
  const res = await apiClient.get('/unit-economics/margin-evaluate', { params });
  return res.data;
};

// 5. Smart Channel Selection & Personalized Communication (Features 10, 11)
export const getSmartChannels = async (customerId: string): Promise<ChannelOptimizationResult> => {
  const res = await apiClient.get(`/autonomy/channels/${customerId}`);
  return res.data;
};

export const generatePersonalizedDraft = async (
  req: CommunicationDraftRequest
): Promise<CommunicationDraftResponse> => {
  const res = await apiClient.post('/autonomy/draft-communication', req);
  return res.data;
};

// 6. Autonomy Control Center & Human Approval Queue (Features 12, 13, 14)
export const getAutonomyConfig = async (): Promise<AutonomyConfigResponse> => {
  const res = await apiClient.get('/autonomy/config');
  return res.data;
};

export const updateAutonomyMode = async (mode: AutonomyMode): Promise<AutonomyConfigResponse> => {
  const res = await apiClient.post('/autonomy/mode', { mode });
  return res.data;
};

export const getApprovalQueue = async (): Promise<ApprovalQueueItem[]> => {
  const res = await apiClient.get('/autonomy/queue');
  return res.data;
};

export const approveQueuedAction = async (
  riskId: string,
  operatorNotes?: string
): Promise<HumanApprovalActionResponse> => {
  const res = await apiClient.post(`/autonomy/approve/${riskId}`, {
    action: 'APPROVE',
    operator_notes: operatorNotes,
  });
  return res.data;
};

export const rejectQueuedAction = async (
  riskId: string,
  operatorNotes?: string
): Promise<HumanApprovalActionResponse> => {
  const res = await apiClient.post(`/autonomy/reject/${riskId}`, {
    action: 'REJECT',
    operator_notes: operatorNotes,
  });
  return res.data;
};

export const escalateQueuedAction = async (
  riskId: string,
  operatorNotes?: string
): Promise<HumanApprovalActionResponse> => {
  const res = await apiClient.post(`/autonomy/escalate/${riskId}`, {
    action: 'ESCALATE',
    operator_notes: operatorNotes,
  });
  return res.data;
};

// 7. Recovery Control Center & Real-Time Event Stream (Features 15, 16)
export const getControlCenterSummary = async () => {
  const res = await apiClient.get('/control-center/summary');
  return res.data;
};

export const getLiveEventsStream = async (limit: number = 15) => {
  const res = await apiClient.get('/control-center/live-events', { params: { limit } });
  return res.data;
};

// 8. Incident Playbook & Mitigation Simulation (Features 17, 18)
export const getIncidentPlaybooks = async () => {
  const res = await apiClient.get('/control-center/incident-playbooks');
  return res.data;
};

export const simulateIncidentMitigation = async (req: {
  incident_id: string;
  current_gateway_share_pct?: number;
  proposed_gateway_share_pct?: number;
  target_gateway_share_pct?: number;
}) => {
  const res = await apiClient.post('/control-center/simulate-mitigation', req);
  return res.data;
};

export const executeIncidentMitigation = async (req: {
  incident_id: string;
  target_gateway: string;
  proposed_share_pct?: number;
  operator_notes?: string;
}) => {
  const res = await apiClient.post('/control-center/execute-mitigation', req);
  return res.data;
};

// 9. Decision Intelligence, Protection Score & Replay (Features 19, 20, 21, 22)
export const getRevenueProtectionScore = async () => {
  const res = await apiClient.get('/decision-intelligence/protection-score');
  return res.data;
};

export const getPredictionAccuracyMetrics = async () => {
  const res = await apiClient.get('/decision-intelligence/accuracy-metrics');
  return res.data;
};

export const getDecisionExplainability = async (riskId: string) => {
  const res = await apiClient.get(`/decision-intelligence/explainability/${riskId}`);
  return res.data;
};

export const getReplayCases = async (limit: number = 20) => {
  const res = await apiClient.get('/decision-intelligence/replay-cases', { params: { limit } });
  return res.data;
};

export const getDecisionReplay = async (riskId: string) => {
  const res = await apiClient.get(`/decision-intelligence/replay/${riskId}`);
  return res.data;
};

// 10. Executive Money Story, Recommendations, Counterfactuals & Merchant Intelligence (Features 23, 24, 25, 26, 27)
export const getCounterfactualAnalysis = async (riskId: string) => {
  const res = await apiClient.get(`/executive-intelligence/counterfactual/${riskId}`);
  return res.data;
};

export const getExecutiveMoneyStory = async () => {
  const res = await apiClient.get('/executive-intelligence/money-story');
  return res.data;
};

export const getProactiveRecommendations = async () => {
  const res = await apiClient.get('/executive-intelligence/recommendations');
  return res.data;
};

export const getMerchantHealthScores = async () => {
  const res = await apiClient.get('/executive-intelligence/merchants/health');
  return res.data;
};

export const getMerchantActionPlan = async (merchantId: string) => {
  const res = await apiClient.get(`/executive-intelligence/merchants/${merchantId}/action-plan`);
  return res.data;
};

// 11. Reports, Leaderboards, System Health, Chaos Sim & AI Transparency (Features 28, 29, 30, 31, 32, 33, 34, 35)
export const getMonthlyReport = async () => {
  const res = await apiClient.get('/governance-system/monthly-report');
  return res.data;
};

export const getLeaderboards = async (period: string = '30d') => {
  const res = await apiClient.get('/governance-system/leaderboards', { params: { period } });
  return res.data;
};

export const getSystemVersions = async () => {
  const res = await apiClient.get('/governance-system/versions');
  return res.data;
};

export const getSystemHealth = async () => {
  const res = await apiClient.get('/governance-system/health');
  return res.data;
};

export const simulateChaos = async (scenario: string) => {
  const res = await apiClient.post('/governance-system/simulate-chaos', { scenario });
  return res.data;
};

export const evaluateAiVsRulesDemo = async (payload: {
  transaction_amount: number | string;
  ai_proposed_action: string;
  ai_confidence_pct: number;
  customer_opted_out: boolean;
  prior_attempts: number;
}) => {
  const res = await apiClient.post('/governance-system/ai-vs-rules-demo', payload);
  return res.data;
};

// 12. Demo Scenario Builder & Guided Hackathon Scenes (Features 36, 37)
export const getDemoScenarios = async () => {
  const res = await apiClient.get('/demo-lab/scenarios');
  return res.data;
};

export const getGuidedDemoScenes = async () => {
  const res = await apiClient.get('/demo-lab/guided-scenes');
  return res.data;
};

export const runDemoScenario = async (scenarioId: string) => {
  const res = await apiClient.post('/demo-lab/run-scenario', { scenario_id: scenarioId });
  return res.data;
};

export const resetDemoDatabase = async () => {
  const res = await apiClient.post('/demo-lab/reset');
  return res.data;
};





