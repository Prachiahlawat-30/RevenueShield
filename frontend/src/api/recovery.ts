import { apiClient } from './client';
import {
  AIDiagnosisResult,
  RecoveryStepResponse,
  BatchRecoveryResponse,
  RevenueRisk,
  PaymentDecisionGraphResponse,
} from '../types';

export const runAIDiagnosis = async (riskId: string): Promise<AIDiagnosisResult> => {
  const res = await apiClient.post<AIDiagnosisResult>(`/recovery/${riskId}/diagnose`);
  return res.data;
};

export const getPaymentDecisionGraph = async (
  riskId: string
): Promise<PaymentDecisionGraphResponse> => {
  const res = await apiClient.get<PaymentDecisionGraphResponse>(`/recovery/${riskId}/decision-graph`);
  return res.data;
};

export const executeRecoveryStep = async (
  riskId: string,
  forceCooldownOverride: boolean = true
): Promise<RecoveryStepResponse> => {
  const res = await apiClient.post<RecoveryStepResponse>(`/recovery/${riskId}/step`, {
    force_cooldown_override: forceCooldownOverride,
  });
  return res.data;
};

export const runFullRecoveryWorkflow = async (
  riskId: string,
  maxSteps: number = 5,
  forceCooldownOverride: boolean = true
): Promise<RecoveryStepResponse[]> => {
  const res = await apiClient.post<RecoveryStepResponse[]>(`/recovery/${riskId}/run-full`, {
    max_steps: maxSteps,
    force_cooldown_override: forceCooldownOverride,
  });
  return res.data;
};

export const runBatchRecovery = async (
  batchSize: number = 10,
  forceCooldownOverride: boolean = true
): Promise<BatchRecoveryResponse> => {
  const res = await apiClient.post<BatchRecoveryResponse>('/recovery/run-batch', {
    batch_size: batchSize,
    force_cooldown_override: forceCooldownOverride,
  });
  return res.data;
};

export const manualResolveRisk = async (
  riskId: string,
  action: 'mark_recovered' | 'write_off',
  notes?: string
): Promise<RevenueRisk> => {
  const res = await apiClient.post<RevenueRisk>(`/recovery/${riskId}/manual-resolve`, {
    action,
    notes,
  });
  return res.data;
};
