import { apiClient } from './client';
import { AuditLog } from '../types';

export interface ListAuditLogsParams {
  revenue_risk_id?: string;
  customer_id?: string;
  actor?: string;
  step_name?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const getAuditLogs = async (params: ListAuditLogsParams = {}): Promise<PaginatedAuditLogs> => {
  const res = await apiClient.get<PaginatedAuditLogs>('/audit', { params });
  return res.data;
};

export const getAuditLogDetail = async (logId: string): Promise<AuditLog> => {
  const res = await apiClient.get<AuditLog>(`/audit/${logId}`);
  return res.data;
};
