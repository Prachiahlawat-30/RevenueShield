import { apiClient } from './client';
import { RevenueRisk } from '../types';

export interface ListRisksParams {
  status?: string;
  failure_type?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedRisks {
  items: RevenueRisk[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const getRevenueRisks = async (params: ListRisksParams = {}): Promise<PaginatedRisks> => {
  const res = await apiClient.get<PaginatedRisks>('/risks', { params });
  return res.data;
};

export const getRevenueRiskDetail = async (riskId: string): Promise<RevenueRisk> => {
  const res = await apiClient.get<RevenueRisk>(`/risks/${riskId}`);
  return res.data;
};
