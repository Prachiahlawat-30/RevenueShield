"""Dashboard API endpoints for executive metrics, charts, and funnel analytics."""

from decimal import Decimal
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.dashboard import (
    DashboardMetrics,
    DashboardChartsResponse,
    DailyRecoveryTrend,
    FailureTypeBreakdown,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics, summary="Get summary KPI metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)) -> DashboardMetrics:
    """Calculate and return high-level revenue recovery KPIs."""
    # Aggregates from revenue_risks
    risk_stats = db.query(
        func.coalesce(func.sum(RevenueRisk.amount_at_risk), Decimal("0.00")).label("total_at_risk"),
        func.coalesce(func.sum(RevenueRisk.amount_recovered), Decimal("0.00")).label("total_recovered"),
        func.count(
            case((RevenueRisk.status.in_(["detected", "diagnosing", "action_selected", "recovering"]), 1))
        ).label("active_cases"),
        func.count(
            case((RevenueRisk.status == "escalated", 1))
        ).label("escalated_cases"),
    ).first()

    total_at_risk = Decimal(str(risk_stats.total_at_risk or "0.00"))
    total_recovered = Decimal(str(risk_stats.total_recovered or "0.00"))
    active_cases = int(risk_stats.active_cases or 0)
    escalated_cases = int(risk_stats.escalated_cases or 0)

    recovery_rate_pct = 0.0
    if total_at_risk > Decimal("0.00"):
        recovery_rate_pct = round(float((total_recovered / total_at_risk) * 100), 2)

    # Aggregates from recovery_attempts
    attempt_stats = db.query(
        func.count(
            case(((RecoveryAttempt.execution_status == "succeeded") & (RecoveryAttempt.amount_recovered > 0), 1))
        ).label("successful_attempts"),
        func.count(
            case((RecoveryAttempt.execution_status.in_(["declined", "failed", "no_response"]), 1))
        ).label("failed_attempts"),
    ).first()

    successful_attempts = int(attempt_stats.successful_attempts or 0)
    failed_attempts = int(attempt_stats.failed_attempts or 0)

    return DashboardMetrics(
        total_revenue_at_risk=total_at_risk,
        total_revenue_recovered=total_recovered,
        recovery_rate_pct=recovery_rate_pct,
        active_cases=active_cases,
        escalated_cases=escalated_cases,
        successful_recovery_attempts=successful_attempts,
        failed_recovery_attempts=failed_attempts,
    )


@router.get("/charts", response_model=DashboardChartsResponse, summary="Get chart visualizations data")
def get_dashboard_charts(db: Session = Depends(get_db)) -> DashboardChartsResponse:
    """Return aggregated time-series trends, breakdown by failure type, and stage funnel."""
    # 1. Failure type breakdown
    breakdown_rows = (
        db.query(
            RevenueRisk.detected_failure_type,
            func.count(RevenueRisk.id).label("total_count"),
            func.count(case((RevenueRisk.status == "recovered", 1))).label("recovered_count"),
            func.coalesce(func.sum(RevenueRisk.amount_at_risk), Decimal("0.00")).label("amount_at_risk"),
            func.coalesce(func.sum(RevenueRisk.amount_recovered), Decimal("0.00")).label("amount_recovered"),
        )
        .group_by(RevenueRisk.detected_failure_type)
        .all()
    )

    failure_breakdowns = []
    for row in breakdown_rows:
        at_risk = Decimal(str(row.amount_at_risk or "0.00"))
        recovered = Decimal(str(row.amount_recovered or "0.00"))
        rate = round(float((recovered / at_risk) * 100), 2) if at_risk > 0 else 0.0

        failure_breakdowns.append(
            FailureTypeBreakdown(
                failure_type=row.detected_failure_type,
                total_count=int(row.total_count),
                recovered_count=int(row.recovered_count),
                amount_at_risk=at_risk,
                amount_recovered=recovered,
                recovery_rate_pct=rate,
            )
        )

    # 2. Daily trends (grouped by date of creation)
    # Using SQL cast/strftime for date grouping compatible with PostgreSQL and SQLite
    trend_rows = (
        db.query(
            func.date(RevenueRisk.created_at).label("risk_date"),
            func.coalesce(func.sum(RevenueRisk.amount_at_risk), Decimal("0.00")).label("amount_at_risk"),
            func.coalesce(func.sum(RevenueRisk.amount_recovered), Decimal("0.00")).label("amount_recovered"),
        )
        .group_by(func.date(RevenueRisk.created_at))
        .order_by(func.date(RevenueRisk.created_at).asc())
        .limit(30)
        .all()
    )

    daily_trends = [
        DailyRecoveryTrend(
            date=str(row.risk_date),
            amount_at_risk=Decimal(str(row.amount_at_risk or "0.00")),
            amount_recovered=Decimal(str(row.amount_recovered or "0.00")),
        )
        for row in trend_rows
    ]

    # 3. Stage conversion funnel
    total_risks = db.query(func.count(RevenueRisk.id)).scalar() or 0
    diagnosed_count = db.query(func.count(RevenueRisk.id)).filter(RevenueRisk.attempt_count > 0).scalar() or 0
    recovered_count = db.query(func.count(RevenueRisk.id)).filter(RevenueRisk.status == "recovered").scalar() or 0
    escalated_count = db.query(func.count(RevenueRisk.id)).filter(RevenueRisk.status == "escalated").scalar() or 0
    stopped_count = db.query(func.count(RevenueRisk.id)).filter(RevenueRisk.status == "stopped").scalar() or 0

    stage_funnel = [
        {"stage": "DETECTED", "count": total_risks, "description": "Payment failures identified and quantified"},
        {"stage": "DIAGNOSED", "count": diagnosed_count, "description": "AI diagnosed with bounded action recommendation"},
        {"stage": "ACTION_EXECUTED", "count": diagnosed_count, "description": "Interventions executed through simulated gateway"},
        {"stage": "RECOVERED", "count": recovered_count, "description": "Revenue successfully captured and settled"},
        {"stage": "ESCALATED", "count": escalated_count, "description": "High-touch escalation to human finance desk"},
        {"stage": "STOPPED", "count": stopped_count, "description": "Terminated per policy bounds (opt-out / max retries)"},
    ]

    return DashboardChartsResponse(
        daily_trends=daily_trends,
        failure_breakdown=failure_breakdowns,
        stage_conversion_funnel=stage_funnel,
    )
