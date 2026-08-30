"""Pydantic schemas for Dashboard metrics and charts."""

from decimal import Decimal
from typing import List, Dict, Any
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    """Core summary metrics for RecoverAI executive dashboard."""
    total_revenue_at_risk: Decimal
    total_revenue_recovered: Decimal
    recovery_rate_pct: float
    active_cases: int
    escalated_cases: int
    successful_recovery_attempts: int
    failed_recovery_attempts: int


class DailyRecoveryTrend(BaseModel):
    date: str
    amount_at_risk: Decimal
    amount_recovered: Decimal


class FailureTypeBreakdown(BaseModel):
    failure_type: str
    total_count: int
    recovered_count: int
    amount_at_risk: Decimal
    amount_recovered: Decimal
    recovery_rate_pct: float


class DashboardChartsResponse(BaseModel):
    daily_trends: List[DailyRecoveryTrend]
    failure_breakdown: List[FailureTypeBreakdown]
    stage_conversion_funnel: List[Dict[str, Any]]
