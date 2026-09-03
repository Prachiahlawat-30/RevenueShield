"""RevenueShield FastAPI application entrypoint with all domain, intelligence, predictive, and proactive routers registered."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.health import router as health_router
from app.api.dashboard import router as dashboard_router
from app.api.risks import router as risks_router
from app.api.recovery import router as recovery_router
from app.api.customers import router as customers_router
from app.api.audit import router as audit_router
from app.api.simulation import router as simulation_router
from app.api.recovery_intelligence import router as recovery_intelligence_router
from app.api.experiments import router as experiments_router
from app.api.revenue_leakage import router as revenue_leakage_router
from app.api.incidents import router as incidents_router
from app.api.gateways import router as gateways_router
from app.api.playbooks import router as playbooks_router
from app.api.strategy_simulator import router as strategy_simulator_router
from app.api.policy_playground import router as policy_playground_router
from app.api.copilot import router as copilot_router
from app.api.predictive_risk import router as predictive_risk_router
from app.api.forecast import router as forecast_router
from app.api.heatmap import router as heatmap_router
from app.api.prevention import router as prevention_router
from app.api.unit_economics import router as unit_economics_router
from app.api.autonomy import router as autonomy_router
from app.api.control_center import router as control_center_router
from app.api.decision_intelligence import router as decision_intelligence_router
from app.api.executive_intelligence import router as executive_intelligence_router
from app.api.governance_system import router as governance_system_router
from app.api.demo_lab import router as demo_lab_router
from app.api.authorization import router as authorization_router
from app.api.policy_optimizer import router as policy_optimizer_router
from app.api.hackathon_usecases import router as hackathon_usecases_router
from app.api.webhooks import router as webhooks_router
from app.api.transactions import router as transactions_router
from app.api.smart_scheduler import router as smart_scheduler_router
from app.api.global_intelligence import router as global_intelligence_router


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI-Powered Revenue Recovery & Intelligence Platform for Payment Failure Diagnosis, Experimentation, and Policy Enforcement",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    @app.get("/", summary="Root Health & Service Status")
    def root():
        return {
            "service": "RevenueShield Payment Intelligence & Revenue Recovery Platform",
            "version": settings.VERSION,
            "status": "online",
            "documentation": "/docs",
            "health_check": f"{settings.API_V1_STR}/health",
        }

    # Register API routers
    app.include_router(health_router, prefix=settings.API_V1_STR)
    app.include_router(dashboard_router, prefix=settings.API_V1_STR)
    app.include_router(risks_router, prefix=settings.API_V1_STR)
    app.include_router(recovery_router, prefix=settings.API_V1_STR)
    app.include_router(authorization_router, prefix=settings.API_V1_STR)
    app.include_router(customers_router, prefix=settings.API_V1_STR)
    app.include_router(audit_router, prefix=settings.API_V1_STR)
    app.include_router(simulation_router, prefix=settings.API_V1_STR)
    app.include_router(recovery_intelligence_router, prefix=settings.API_V1_STR)
    app.include_router(experiments_router, prefix=settings.API_V1_STR)
    app.include_router(revenue_leakage_router, prefix=settings.API_V1_STR)
    app.include_router(incidents_router, prefix=settings.API_V1_STR)
    app.include_router(gateways_router, prefix=settings.API_V1_STR)
    app.include_router(playbooks_router, prefix=settings.API_V1_STR)
    app.include_router(strategy_simulator_router, prefix=settings.API_V1_STR)
    app.include_router(policy_playground_router, prefix=settings.API_V1_STR)
    app.include_router(copilot_router, prefix=settings.API_V1_STR)
    app.include_router(predictive_risk_router, prefix=settings.API_V1_STR)
    app.include_router(forecast_router, prefix=settings.API_V1_STR)
    app.include_router(heatmap_router, prefix=settings.API_V1_STR)
    app.include_router(prevention_router, prefix=settings.API_V1_STR)
    app.include_router(unit_economics_router, prefix=settings.API_V1_STR)
    app.include_router(autonomy_router, prefix=settings.API_V1_STR)
    app.include_router(control_center_router, prefix=settings.API_V1_STR)
    app.include_router(decision_intelligence_router, prefix=settings.API_V1_STR)
    app.include_router(executive_intelligence_router, prefix=settings.API_V1_STR)
    app.include_router(governance_system_router, prefix=settings.API_V1_STR)
    app.include_router(demo_lab_router, prefix=settings.API_V1_STR)
    app.include_router(policy_optimizer_router, prefix=settings.API_V1_STR)
    app.include_router(hackathon_usecases_router, prefix=settings.API_V1_STR)
    app.include_router(webhooks_router, prefix=settings.API_V1_STR)
    app.include_router(transactions_router, prefix=settings.API_V1_STR)
    app.include_router(smart_scheduler_router, prefix=settings.API_V1_STR)
    app.include_router(global_intelligence_router, prefix=settings.API_V1_STR)

    @app.on_event("startup")
    def on_startup():
        try:
            from app.core.database import Base, engine, SessionLocal
            from app.data.seed_data import seed_database
            Base.metadata.create_all(bind=engine)
            with SessionLocal() as db:
                seed_database(db=db, reset=False)
        except Exception as e:
            print(f"Database startup/seed notice: {e}")

    return app


app = create_application()


