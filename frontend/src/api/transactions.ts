import { apiClient } from './client';

export interface BatchImportResponse {
  imported_count: number;
  failed_count: number;
  total_amount_imported: number;
  currency: string;
  errors: string[];
  sample_records: Array<{
    id: string;
    customer_name: string;
    email: string;
    amount: number;
    currency: string;
    failure_type: string;
    risk_id: string;
  }>;
  message: string;
}

export interface RazorpayWebhookResponse {
  status: string;
  message: string;
  event: string;
  razorpay_payment_id: string;
  transaction_id: string;
  revenue_risk_id: string;
  detected_failure_type: string;
  amount: number;
  currency: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

export const importTransactionsCsv = async (file: File): Promise<BatchImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post<BatchImportResponse>('/transactions/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const downloadSampleCsv = async (): Promise<void> => {
  const res = await apiClient.get('/transactions/sample-csv', {
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'revenueshield_transactions_template.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const simulateRazorpayWebhook = async (params: {
  scenario?: string;
  amount_inr?: number;
  customer_name?: string;
  customer_email?: string;
} = {}): Promise<RazorpayWebhookResponse> => {
  const res = await apiClient.post<RazorpayWebhookResponse>('/webhooks/razorpay/simulate', params);
  return res.data;
};
