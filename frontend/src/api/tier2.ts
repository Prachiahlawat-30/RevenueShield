/** Frontend Axios API client for Tier 2 Advanced Revenue Intelligence. */

import { apiClient } from './client';
import {
  RecoveryExperiment,
  ExperimentResultsResponse,
  RevenueLeakageSummary,
  ExecutiveLeakageSummary,
  PaymentIncident,
  AnomalyDetectionResult,
  GatewayHealthMetric,
  GatewayRoutingRecommendation,
  RecoveryPlaybook,
  StrategySimulationRequest,
  StrategySimulationResponse,
  PolicyPlaygroundRequest,
  PolicyPlaygroundResponse,
  RecoveryROIResponse,
  CopilotQueryRequest,
  CopilotQueryResponse,
  CustomerRecoveryProfile,
} from '../types';

// 1. EXPERIMENTS API
export const getExperiments = async (): Promise<RecoveryExperiment[]> => {
  const res = await apiClient.get('/experiments/');
  return res.data;
};

export const createExperiment = async (data: {
  name: string;
  description?: string;
  strategy_a: string;
  strategy_b: string;
  traffic_percentage: number;
}): Promise<RecoveryExperiment> => {
  const res = await apiClient.post('/experiments/', data);
  return res.data;
};

export const getExperimentResults = async (experimentId: string): Promise<ExperimentResultsResponse> => {
  const res = await apiClient.get(`/experiments/${experimentId}/results`);
  return res.data;
};

export const assignRiskToExperiment = async (
  experimentId: string,
  riskId: string
): Promise<{ assignment_id: string; variant: string; assigned_strategy: string }> => {
  const res = await apiClient.post(`/experiments/${experimentId}/assign/${riskId}`);
  return res.data;
};

// 2. REVENUE LEAKAGE & ROI API
export const getRevenueLeakageSummary = async (): Promise<RevenueLeakageSummary> => {
  const res = await apiClient.get('/revenue-leakage/summary');
  return res.data;
};

export const getExecutiveLeakageSummary = async (): Promise<ExecutiveLeakageSummary> => {
  const res = await apiClient.get('/revenue-leakage/executive');
  return res.data;
};

export const getRecoveryROI = async (): Promise<RecoveryROIResponse> => {
  const res = await apiClient.get('/revenue-leakage/roi');
  return res.data;
};

// 3. INCIDENTS API
export const getIncidents = async (): Promise<PaymentIncident[]> => {
  const res = await apiClient.get('/incidents/');
  return res.data;
};

export const detectAnomalies = async (): Promise<AnomalyDetectionResult> => {
  const res = await apiClient.get('/incidents/detect');
  return res.data;
};

export const getIncidentDetail = async (incidentId: string): Promise<PaymentIncident> => {
  const res = await apiClient.get(`/incidents/${incidentId}`);
  return res.data;
};

export const resolveIncident = async (incidentId: string): Promise<PaymentIncident> => {
  const res = await apiClient.post(`/incidents/${incidentId}/resolve`);
  return res.data;
};

// 4. GATEWAY INTELLIGENCE & PLAYBOOKS API
export const getGatewayHealth = async (): Promise<GatewayHealthMetric[]> => {
  const res = await apiClient.get('/gateways/health');
  return res.data;
};

export const recommendGatewayRoute = async (riskId: string): Promise<GatewayRoutingRecommendation> => {
  const res = await apiClient.post(`/gateways/recommend-route/${riskId}`);
  return res.data;
};

export const getRecoveryPlaybook = async (riskId: string): Promise<RecoveryPlaybook> => {
  const res = await apiClient.get(`/playbooks/${riskId}`);
  return res.data;
};

// 5. STRATEGY SIMULATOR & POLICY PLAYGROUND API
export const runStrategySimulation = async (
  req: Partial<StrategySimulationRequest>
): Promise<StrategySimulationResponse> => {
  const res = await apiClient.post('/strategy-simulator/simulate', req);
  return res.data;
};

export const evaluatePolicyPlayground = async (
  req: PolicyPlaygroundRequest
): Promise<PolicyPlaygroundResponse> => {
  const res = await apiClient.post('/policy/playground', req);
  return res.data;
};

// 6. OPERATOR COPILOT API
export const queryOperatorCopilot = async (query: string): Promise<CopilotQueryResponse> => {
  const res = await apiClient.post('/copilot/query', { query });
  return res.data;
};

// 7. CUSTOMER PROFILE API
export const getCustomerRecoveryProfile = async (customerId: string): Promise<CustomerRecoveryProfile> => {
  const res = await apiClient.get(`/customers/${customerId}/recovery-profile`);
  return res.data;
};
