import { apiClient } from './client';
import {
  PolicyPerformanceOverview,
  PolicyProposalResponse,
  PolicySimulationResponse,
  PolicyApprovalRequest,
  PolicyRejectionRequest,
  PolicyRollbackRequest,
  PolicyHistoryItem,
} from '../types';

export const getPolicyOverview = async (): Promise<PolicyPerformanceOverview> => {
  const res = await apiClient.get<PolicyPerformanceOverview>('/policy-optimizer/overview');
  return res.data;
};

export const getPolicyPerformance = async (): Promise<PolicyPerformanceOverview> => {
  const res = await apiClient.get<PolicyPerformanceOverview>('/policy-optimizer/performance');
  return res.data;
};

export const getPolicyProposals = async (): Promise<PolicyProposalResponse[]> => {
  const res = await apiClient.get<PolicyProposalResponse[]>('/policy-optimizer/proposals');
  return res.data;
};

export const getPolicyProposalDetail = async (
  proposalId: string
): Promise<PolicyProposalResponse> => {
  const res = await apiClient.get<PolicyProposalResponse>(`/policy-optimizer/proposals/${proposalId}`);
  return res.data;
};

export const simulatePolicyProposal = async (
  proposalId: string
): Promise<PolicySimulationResponse> => {
  const res = await apiClient.post<PolicySimulationResponse>(
    `/policy-optimizer/${proposalId}/simulate`
  );
  return res.data;
};

export const approvePolicyProposal = async (
  proposalId: string,
  data: PolicyApprovalRequest
): Promise<PolicyProposalResponse> => {
  const res = await apiClient.post<PolicyProposalResponse>(
    `/policy-optimizer/${proposalId}/approve`,
    data
  );
  return res.data;
};

export const rejectPolicyProposal = async (
  proposalId: string,
  data: PolicyRejectionRequest
): Promise<PolicyProposalResponse> => {
  const res = await apiClient.post<PolicyProposalResponse>(
    `/policy-optimizer/${proposalId}/reject`,
    data
  );
  return res.data;
};

export const rollbackPolicy = async (
  data: PolicyRollbackRequest
): Promise<PolicyHistoryItem> => {
  const res = await apiClient.post<PolicyHistoryItem>('/policy-optimizer/rollback', data);
  return res.data;
};

export const getPolicyHistory = async (): Promise<PolicyHistoryItem[]> => {
  const res = await apiClient.get<PolicyHistoryItem[]>('/policy-optimizer/policy-history');
  return res.data;
};
