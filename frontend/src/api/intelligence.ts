import { apiClient } from './client';
import {
  RecoveryIntelligenceSummary,
  PaginatedOpportunitiesResponse,
  RecoveryOpportunityItem,
  RecoveryProbabilityResult,
  NextBestActionResult,
  RetryTimingResult,
  BatchRecoveryResponse,
} from '../types';

export interface GetOpportunitiesParams {
  priority_band?: string;
  failure_type?: string;
  status?: string;
  min_probability?: number;
  sort_by?: string;
  order?: string;
  page?: number;
  page_size?: number;
}

export const getIntelligenceSummary = async (): Promise<RecoveryIntelligenceSummary> => {
  const response = await apiClient.get<RecoveryIntelligenceSummary>('/recovery-intelligence/summary');
  return response.data;
};

export const getOpportunities = async (params?: GetOpportunitiesParams): Promise<PaginatedOpportunitiesResponse> => {
  const response = await apiClient.get<PaginatedOpportunitiesResponse>('/recovery-intelligence/opportunities', {
    params,
  });
  return response.data;
};

export const getOpportunityDetail = async (riskId: string): Promise<RecoveryOpportunityItem> => {
  const response = await apiClient.get<RecoveryOpportunityItem>(`/recovery-intelligence/opportunities/${riskId}`);
  return response.data;
};

export const getRiskProbability = async (riskId: string): Promise<RecoveryProbabilityResult> => {
  const response = await apiClient.get<RecoveryProbabilityResult>(`/recovery-intelligence/${riskId}/probability`);
  return response.data;
};

export const getRiskNextBestAction = async (riskId: string): Promise<NextBestActionResult> => {
  const response = await apiClient.get<NextBestActionResult>(`/recovery-intelligence/${riskId}/next-best-action`);
  return response.data;
};

export const getRiskTiming = async (riskId: string): Promise<RetryTimingResult> => {
  const response = await apiClient.get<RetryTimingResult>(`/recovery-intelligence/${riskId}/timing`);
  return response.data;
};

export const runPriorityBatchRecovery = async (
  batchSize: number = 10,
  forceCooldownOverride: boolean = true
): Promise<BatchRecoveryResponse> => {
  const response = await apiClient.post<BatchRecoveryResponse>('/recovery/run-batch?mode=priority', {
    batch_size: batchSize,
    force_cooldown_override: forceCooldownOverride,
    mode: 'priority',
  });
  return response.data;
};
