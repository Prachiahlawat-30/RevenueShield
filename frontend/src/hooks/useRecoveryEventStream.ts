import { useState, useEffect, useRef, useCallback } from 'react';
import { RecoveryStreamEvent } from '../types';

interface UseRecoveryEventStreamOptions {
  onRiskDetected?: (data: any) => void;
  onRevenueRecovered?: (data: any) => void;
  onPaymentLinkCreated?: (data: any) => void;
  onEvent?: (event: RecoveryStreamEvent) => void;
  enabled?: boolean;
}

export const useRecoveryEventStream = ({
  onRiskDetected,
  onRevenueRecovered,
  onPaymentLinkCreated,
  onEvent,
  enabled = true,
}: UseRecoveryEventStreamOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RecoveryStreamEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback refs fresh
  const onRiskDetectedRef = useRef(onRiskDetected);
  const onRevenueRecoveredRef = useRef(onRevenueRecovered);
  const onPaymentLinkCreatedRef = useRef(onPaymentLinkCreated);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onRiskDetectedRef.current = onRiskDetected;
    onRevenueRecoveredRef.current = onRevenueRecovered;
    onPaymentLinkCreatedRef.current = onPaymentLinkCreated;
    onEventRef.current = onEvent;
  });

  const connect = useCallback(() => {
    if (!enabled) return;

    const baseApi = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
      : '/api';
    const streamUrl = `${baseApi}/recovery/stream`;

    try {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      const handlePayload = (eventType: string, e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          const streamEvent: RecoveryStreamEvent = {
            event: eventType as any,
            data: parsed.data || parsed,
            timestamp: parsed.timestamp || new Date().toISOString(),
          };
          setLastEvent(streamEvent);
          onEventRef.current?.(streamEvent);

          if (eventType === 'REVENUE_RISK_DETECTED') {
            onRiskDetectedRef.current?.(streamEvent.data);
          } else if (eventType === 'REVENUE_RECOVERED') {
            onRevenueRecoveredRef.current?.(streamEvent.data);
          } else if (eventType === 'PAYMENT_LINK_CREATED') {
            onPaymentLinkCreatedRef.current?.(streamEvent.data);
          }
        } catch (err) {
          console.error('Error parsing SSE event payload:', err);
        }
      };

      es.addEventListener('REVENUE_RISK_DETECTED', (e: MessageEvent) => {
        handlePayload('REVENUE_RISK_DETECTED', e);
      });

      es.addEventListener('REVENUE_RECOVERED', (e: MessageEvent) => {
        handlePayload('REVENUE_RECOVERED', e);
      });

      es.addEventListener('PAYMENT_LINK_CREATED', (e: MessageEvent) => {
        handlePayload('PAYMENT_LINK_CREATED', e);
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        // Reconnect after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };
    } catch (err) {
      console.warn('Failed to initialize EventSource stream:', err);
      setIsConnected(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, enabled]);

  return { isConnected, lastEvent };
};
