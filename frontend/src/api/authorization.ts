import { apiClient } from './client';
import {
  AuthorizationDecisionResponse,
  WhatIfSimulationRequest,
  WhatIfSimulationResponse,
  AuthorizationFunnelResponse,
  AuthorizationLossBreakdownResponse,
} from '../types';

export const getAuthorizationByRisk = async (
  riskId: string
): Promise<AuthorizationDecisionResponse> => {
  const res = await apiClient.get<AuthorizationDecisionResponse>(`/authorization/risk/${riskId}`);
  return res.data;
};

export const evaluateTransactionAuthorization = async (
  transactionId: string
): Promise<AuthorizationDecisionResponse> => {
  const res = await apiClient.post<AuthorizationDecisionResponse>(
    `/authorization/${transactionId}/evaluate`
  );
  return res.data;
};

export const simulateWhatIfScenario = async (
  request: WhatIfSimulationRequest
): Promise<WhatIfSimulationResponse> => {
  const res = await apiClient.post<WhatIfSimulationResponse>('/authorization/what-if', request);
  return res.data;
};

export const getAuthorizationFunnel = async (): Promise<AuthorizationFunnelResponse> => {
  const res = await apiClient.get<AuthorizationFunnelResponse>('/authorization/analytics/funnel');
  return res.data;
};

export const getAuthorizationLossBreakdown = async (): Promise<AuthorizationLossBreakdownResponse> => {
  const res = await apiClient.get<AuthorizationLossBreakdownResponse>(
    '/authorization/analytics/loss-breakdown'
  );
  return res.data;
};
