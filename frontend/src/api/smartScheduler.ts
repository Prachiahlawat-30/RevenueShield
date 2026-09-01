import { apiClient } from './client';

export interface SmartRetryScheduleResult {
  risk_id: string;
  failure_type: string;
  failure_type_label: string;
  customer_id: string;
  customer_name: string;
  historical_success_count: number;
  peak_hours_window: string;
  peak_days_window: string;
  recommended_delay_hours: number;
  scheduled_retry_time: string;
  scheduled_retry_formatted: string;
  confidence_score: number;
  probability_lift: string;
  rationale: string;
  is_scheduled: boolean;
  status: string;
}

export const getSmartRetrySchedule = async (riskId: string): Promise<SmartRetryScheduleResult> => {
  const res = await apiClient.get<SmartRetryScheduleResult>(`/recovery/smart-schedule/${riskId}`);
  return res.data;
};

export const confirmSmartRetrySchedule = async (riskId: string): Promise<SmartRetryScheduleResult> => {
  const res = await apiClient.post<SmartRetryScheduleResult>(`/recovery/smart-schedule/${riskId}/confirm`);
  return res.data;
};
