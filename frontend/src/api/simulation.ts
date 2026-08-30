import { apiClient } from './client';
import { RevenueRisk, FailureType } from '../types';

export interface SeedResponse {
  seeded_customers: number;
  seeded_transactions: number;
  seeded_risks: number;
  message: string;
}

export interface GenerateFailureParams {
  failure_type: FailureType;
  amount?: number;
  customer_name?: string;
  is_opted_out?: boolean;
}

export const seedDemoDatabase = async (reset: boolean = false): Promise<SeedResponse> => {
  const res = await apiClient.post<SeedResponse>('/simulation/seed', { reset });
  return res.data;
};

export const generateSyntheticFailure = async (
  params: GenerateFailureParams
): Promise<RevenueRisk> => {
  const res = await apiClient.post<RevenueRisk>('/simulation/generate-failure', params);
  return res.data;
};
