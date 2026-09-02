/** API client and types for Global Payment Intelligence. */

import { apiClient } from './client';

export interface GlobalKPIs {
  total_volume: number;
  total_transactions: number;
  success_rate: number;
  failure_rate: number;
  recovery_rate: number;
  revenue_at_risk: number;
  recovered_revenue: number;
  currency_symbol: string;
}

export interface GlobalHealthScore {
  overall_score: number;
  status_label: 'HEALTHY' | 'WATCH' | 'DEGRADED';
  authorization_score: number;
  recovery_score: number;
  gateway_stability_score: number;
  customer_friction_score: number;
  is_demo_derived: boolean;
}

export interface RegionPerformanceItem {
  region_id: string;
  region_name: string;
  country_code: string;
  flag_emoji: string;
  currency: string;
  total_volume: number;
  success_rate: number;
  failure_rate: number;
  recovery_rate: number;
  revenue_at_risk: number;
  recovered_revenue: number;
  status: 'HEALTHY' | 'WATCH' | 'HIGH RISK';
  top_failure_type: string;
  top_gateway: string;
  transaction_count: number;
  coordinates: {
    lat?: number;
    lng?: number;
    x: number;
    y: number;
  };
}

export interface PaymentMethodPerformanceItem {
  method_id: string;
  method_label: string;
  success_rate: number;
  failure_rate: number;
  recovery_rate: number;
  total_volume: number;
  revenue_at_risk: number;
  transaction_count: number;
  is_best_performing: boolean;
  is_highest_risk: boolean;
}

export interface GatewayGlobalPerformanceItem {
  gateway_name: string;
  authorization_rate: number;
  failure_rate: number;
  timeout_rate: number;
  revenue_impact: number;
  status: string;
}

export interface FailureIntelligenceItem {
  failure_type: string;
  failure_label: string;
  count: number;
  volume: number;
  revenue_at_risk: number;
  percentage_of_total: number;
  recovery_rate: number;
}

export interface HeatmapCell {
  region: string;
  failure_type: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  amount: number;
  count: number;
}

export interface GlobalPaymentFunnelStep {
  step_key: string;
  step_label: string;
  count: number;
  percentage: number;
  volume: number;
}

export interface RecoveryOpportunityHighlight {
  recoverable_revenue: number;
  largest_opportunity_category: string;
  largest_opportunity_amount: number;
  best_next_action: string;
  expected_yield_lift: number;
}

export interface TopLeakageAreaItem {
  rank: number;
  failure_type: string;
  failure_label: string;
  revenue_at_risk: number;
  recovery_potential: number;
  percentage: number;
}

export interface GlobalIntelligenceResponse {
  kpis: GlobalKPIs;
  health_score: GlobalHealthScore;
  regions: RegionPerformanceItem[];
  payment_methods: PaymentMethodPerformanceItem[];
  gateways: GatewayGlobalPerformanceItem[];
  failure_intelligence: FailureIntelligenceItem[];
  heatmap: HeatmapCell[];
  funnel: GlobalPaymentFunnelStep[];
  recovery_opportunity: RecoveryOpportunityHighlight;
  top_leakage_areas: TopLeakageAreaItem[];
  executive_summary: string;
  insights: string[];
  technical_signals: Record<string, string>;
  last_updated: string;
  is_simulation: boolean;
}

export interface GlobalIntelligenceFilterParams {
  region?: string;
  gateway?: string;
  payment_method?: string;
  failure_type?: string;
}

export const getGlobalPaymentIntelligence = async (
  params?: GlobalIntelligenceFilterParams
): Promise<GlobalIntelligenceResponse> => {
  const res = await apiClient.get<GlobalIntelligenceResponse>('/global-intelligence/summary', {
    params,
  });
  return res.data;
};
