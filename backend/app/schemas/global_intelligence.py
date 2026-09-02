"""Pydantic schemas for Global Payment Intelligence."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GlobalKPIs(BaseModel):
    total_volume: Decimal
    total_transactions: int
    success_rate: float
    failure_rate: float
    recovery_rate: float
    revenue_at_risk: Decimal
    recovered_revenue: Decimal
    currency_symbol: str = "₹"


class GlobalHealthScore(BaseModel):
    overall_score: int
    status_label: str  # HEALTHY, WATCH, DEGRADED
    authorization_score: int
    recovery_score: int
    gateway_stability_score: int
    customer_friction_score: int
    is_demo_derived: bool = True


class RegionPerformanceItem(BaseModel):
    region_id: str
    region_name: str
    country_code: str
    flag_emoji: str
    currency: str
    total_volume: Decimal
    success_rate: float
    failure_rate: float
    recovery_rate: float
    revenue_at_risk: Decimal
    recovered_revenue: Decimal
    status: str  # HEALTHY, WATCH, HIGH RISK
    top_failure_type: str
    top_gateway: str
    transaction_count: int
    coordinates: Dict[str, float] = Field(default_factory=dict)


class PaymentMethodPerformanceItem(BaseModel):
    method_id: str
    method_label: str
    success_rate: float
    failure_rate: float
    recovery_rate: float
    total_volume: Decimal
    revenue_at_risk: Decimal
    transaction_count: int
    is_best_performing: bool = False
    is_highest_risk: bool = False


class GatewayGlobalPerformanceItem(BaseModel):
    gateway_name: str
    authorization_rate: float
    failure_rate: float
    timeout_rate: float
    revenue_impact: Decimal
    status: str  # OPTIMAL, HEALTHY, DEGRADED


class FailureIntelligenceItem(BaseModel):
    failure_type: str
    failure_label: str
    count: int
    volume: Decimal
    revenue_at_risk: Decimal
    percentage_of_total: float
    recovery_rate: float


class HeatmapCell(BaseModel):
    region: str
    failure_type: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    amount: Decimal
    count: int


class GlobalPaymentFunnelStep(BaseModel):
    step_key: str
    step_label: str
    count: int
    percentage: float
    volume: Decimal


class RecoveryOpportunityHighlight(BaseModel):
    recoverable_revenue: Decimal
    largest_opportunity_category: str
    largest_opportunity_amount: Decimal
    best_next_action: str
    expected_yield_lift: float


class TopLeakageAreaItem(BaseModel):
    rank: int
    failure_type: str
    failure_label: str
    revenue_at_risk: Decimal
    recovery_potential: Decimal
    percentage: float


class GlobalIntelligenceResponse(BaseModel):
    kpis: GlobalKPIs
    health_score: GlobalHealthScore
    regions: List[RegionPerformanceItem]
    payment_methods: List[PaymentMethodPerformanceItem]
    gateways: List[GatewayGlobalPerformanceItem]
    failure_intelligence: List[FailureIntelligenceItem]
    heatmap: List[HeatmapCell]
    funnel: List[GlobalPaymentFunnelStep]
    recovery_opportunity: RecoveryOpportunityHighlight
    top_leakage_areas: List[TopLeakageAreaItem]
    executive_summary: str
    insights: List[str]
    technical_signals: Dict[str, str]
    last_updated: datetime
    is_simulation: bool = True
