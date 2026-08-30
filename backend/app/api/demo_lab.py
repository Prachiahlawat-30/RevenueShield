"""REST API router for Demo Lab scenario executions, demo reset, and guided 9-scene demo flows."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    DemoScenarioInfo,
    DemoScenarioExecutionRequest,
    DemoScenarioExecutionResponse,
    DemoResetResponse,
    GuidedDemoSceneItem,
)
from app.services.demo_lab_service import DemoLabService

router = APIRouter(prefix="/demo-lab", tags=["Demo Lab & Evaluation Sandbox"])


@router.get("/scenarios", response_model=List[DemoScenarioInfo])
def list_demo_scenarios():
    """Retrieve catalog of 8 pre-packaged judge demo scenarios."""
    return DemoLabService.get_scenarios()


@router.get("/guided-scenes", response_model=List[GuidedDemoSceneItem])
def list_guided_demo_scenes():
    """Retrieve 9 structured scenes for the 5-minute hackathon pitch."""
    return DemoLabService.get_guided_scenes()


@router.post("/run-scenario", response_model=DemoScenarioExecutionResponse)
def run_demo_scenario(
    req: DemoScenarioExecutionRequest,
    db: Session = Depends(get_db),
):
    """Execute a selected demo scenario end-to-end and return real-time trace."""
    return DemoLabService.run_scenario(req.scenario_id, db)


@router.post("/reset", response_model=DemoResetResponse)
def reset_demo_environment(db: Session = Depends(get_db)):
    """Reset demo mutations and restore known clean synthetic baseline data."""
    return DemoLabService.reset_demo_database(db)
