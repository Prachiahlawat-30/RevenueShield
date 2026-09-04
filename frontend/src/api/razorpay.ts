import { apiClient } from './client';
import { RazorpayStatus, RazorpayConnectionTestResult } from '../types';

export const getRazorpayStatus = async (): Promise<RazorpayStatus> => {
  const response = await apiClient.get<RazorpayStatus>('/razorpay/status');
  return response.data;
};

export const testRazorpayConnection = async (): Promise<RazorpayConnectionTestResult> => {
  const response = await apiClient.post<RazorpayConnectionTestResult>('/razorpay/test-connection');
  return response.data;
};

export interface CreatePaymentLinkResponse {
  payment_link_id: string;
  payment_link_url: string;
  is_live_test_api: boolean;
  status: string;
}

export const createRecoveryPaymentLink = async (riskId: string): Promise<CreatePaymentLinkResponse> => {
  const response = await apiClient.post<CreatePaymentLinkResponse>(`/recovery/${riskId}/create-payment-link`);
  return response.data;
};

export const getRecoveryRiskStatus = async (riskId: string) => {
  const response = await apiClient.get(`/recovery/${riskId}/status`);
  return response.data;
};

export interface SimulateRazorpayParams {
  scenario?: 'insufficient_funds' | 'temporary_decline' | 'expired_card' | 'network_error';
  amount_inr?: number;
  customer_name?: string;
  customer_email?: string;
}

export const simulateRazorpayWebhook = async (params: SimulateRazorpayParams = {}) => {
  const response = await apiClient.post('/webhooks/razorpay/simulate', params);
  return response.data;
};
