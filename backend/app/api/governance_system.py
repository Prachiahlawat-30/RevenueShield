"""REST API router for Monthly Reports, Leaderboards, System Health, Chaos Simulator, and AI vs Rules Policy Gating."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    MonthlyRecoveryReportResponse,
    RevenueLeaderboardResponse,
    DecisionVersionConfigResponse,
    SystemHealthResponse,
    ChaosSimulationScenarioRequest,
    ChaosSimulationResultResponse,
    AiVsRulesEvaluationRequest,
    AiVsRulesEvaluationResponse,
)
from app.services.monthly_report_service import MonthlyReportService
from app.services.recovery_leaderboard_service import RecoveryLeaderboardService
from app.services.system_health_service import SystemHealthService
from app.services.chaos_simulation_engine import ChaosSimulationEngine
from app.services.ai_policy_transparency_service import AiPolicyTransparencyService

router = APIRouter(prefix="/governance-system", tags=["Governance, Resilience & Responsible AI"])


@router.get("/monthly-report", response_model=MonthlyRecoveryReportResponse)
def get_monthly_recovery_report(db: Session = Depends(get_db)):
    """Retrieve formal executive monthly revenue recovery report."""
    return MonthlyReportService.get_monthly_report(db)


@router.get("/monthly-report/csv")
def download_monthly_recovery_report_csv(db: Session = Depends(get_db)):
    """Download executive monthly recovery report as a CSV file."""
    report = MonthlyReportService.get_monthly_report(db)
    return Response(
        content=report.csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="RevenueShield_Monthly_Report_August_2026.csv"'},
    )


@router.get("/leaderboards", response_model=RevenueLeaderboardResponse)
def get_recovery_leaderboards(
    period: str = "30d",
    db: Session = Depends(get_db),
):
    """Retrieve recovery rankings across strategies, actions, gateways, segments, and merchants."""
    return RecoveryLeaderboardService.get_leaderboards(db, period=period)


@router.get("/versions", response_model=DecisionVersionConfigResponse)
def get_system_versions():
    """Retrieve active software, intelligence, policy, and strategy versions."""
    return SystemHealthService.get_version_config()


@router.get("/health", response_model=SystemHealthResponse)
def get_live_system_health(db: Session = Depends(get_db)):
    """Retrieve live status across Database, OpenAI, Fallback Diagnosis, and PolicyEngine."""
    return SystemHealthService.get_system_health(db)


@router.post("/simulate-chaos", response_model=ChaosSimulationResultResponse)
def simulate_system_chaos(
    req: ChaosSimulationScenarioRequest,
    db: Session = Depends(get_db),
):
    """Execute controlled demo-only chaos scenario to prove deterministic safety and fallback readiness."""
    return ChaosSimulationEngine.simulate_chaos(db, req)


@router.post("/ai-vs-rules-demo", response_model=AiVsRulesEvaluationResponse)
def evaluate_ai_vs_rules_demo(req: AiVsRulesEvaluationRequest):
    """Execute 'AI Cannot Override Policy' live demonstration sandbox."""
    return AiPolicyTransparencyService.evaluate_ai_vs_policy(req)
