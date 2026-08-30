/** Frontend API client for Hackathon Specialized Recovery Directions:
- B2B Receivables Chaser & Promise-to-Pay Tracker
- Mandate Retry Sequencer (UPI Autopay & eNACH)
- Hinglish & Localized Conversational Recovery Studio
*/

import { apiClient } from './client';
import {
  B2BReceivablesSummary,
  PromiseToPayRecord,
  PromiseToPayCreateRequest,
  MandateSequencerSummary,
  MandateExecuteResponse,
  ConversationalStudioGenerateRequest,
  ConversationalStudioResponse,
} from '../types';

// 1. B2B Receivables & Promise-to-Pay (PTP)
export const getB2BReceivablesSummary = async (): Promise<B2BReceivablesSummary> => {
  const res = await apiClient.get<B2BReceivablesSummary>('/use-cases/b2b-receivables');
  return res.data;
};

export const recordPromiseToPay = async (
  payload: PromiseToPayCreateRequest
): Promise<PromiseToPayRecord> => {
  const res = await apiClient.post<PromiseToPayRecord>('/use-cases/promise-to-pay', payload);
  return res.data;
};

export const fulfillPromiseToPay = async (ptpId: string): Promise<PromiseToPayRecord> => {
  const res = await apiClient.post<PromiseToPayRecord>(`/use-cases/promise-to-pay/${ptpId}/fulfill`);
  return res.data;
};

// 2. Mandate Retry Sequencer (UPI Autopay & eNACH)
export const getMandateSequencerSummary = async (): Promise<MandateSequencerSummary> => {
  const res = await apiClient.get<MandateSequencerSummary>('/use-cases/mandate-sequencer');
  return res.data;
};

export const executeMandateSequence = async (
  mandateId: string,
  overrideWindow?: string
): Promise<MandateExecuteResponse> => {
  const res = await apiClient.post<MandateExecuteResponse>('/use-cases/mandate-sequencer/execute', {
    mandate_id: mandateId,
    override_window: overrideWindow,
  });
  return res.data;
};

// 3. Hinglish & Localized Voice / WhatsApp Studio
export const generateConversationalFlow = async (
  payload: ConversationalStudioGenerateRequest
): Promise<ConversationalStudioResponse> => {
  const res = await apiClient.post<ConversationalStudioResponse>(
    '/use-cases/conversational-studio/generate',
    payload
  );
  return res.data;
};
