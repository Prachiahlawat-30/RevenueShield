import { apiClient } from './client';
import { DashboardMetrics, DashboardChartsData } from '../types';

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const res = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
  return res.data;
};

export const getDashboardCharts = async (): Promise<DashboardChartsData> => {
  const res = await apiClient.get<DashboardChartsData>('/dashboard/charts');
  return res.data;
};
