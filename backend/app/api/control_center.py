"""REST API router for Recovery Control Center, Live Event Stream, Incident Playbooks & Mitigation Simulation."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    ControlCenterSummaryResponse,
    LiveEventStreamResponse,
    IncidentPlaybookItem,
    IncidentMitigationSimulationRequest,
    IncidentMitigationSimulationResponse,
    IncidentMitigationExecutionRequest,
    IncidentMitigationExecutionResponse,
)
from app.services.control_center_service import ControlCenterService
from app.services.incident_response_engine import IncidentResponseEngine

router = APIRouter(prefix="/control-center", tags=["Recovery Control Center & Live Operations"])


@router.get("/summary", response_model=ControlCenterSummaryResponse)
def get_control_center_summary(db: Session = Depends(get_db)):
    """Retrieve central operations dashboard KPIs, live queues, and recent events."""
    return ControlCenterService.get_summary(db)


@router.get("/live-events", response_model=LiveEventStreamResponse)
def get_live_events_stream(
    limit: int = 15,
    db: Session = Depends(get_db),
):
    """Retrieve chronological real-time event telemetry stream."""
    return ControlCenterService.get_live_events(db, limit=limit)


@router.get("/incident-playbooks", response_model=List[IncidentPlaybookItem])
def get_incident_playbooks(db: Session = Depends(get_db)):
    """Retrieve 8-stage incident response playbooks for active payment incidents."""
    return IncidentResponseEngine.get_playbooks(db)


@router.post("/simulate-mitigation", response_model=IncidentMitigationSimulationResponse)
def simulate_incident_mitigation(req: IncidentMitigationSimulationRequest):
    """Simulate the operational revenue and latency impact of a proposed mitigation."""
    return IncidentResponseEngine.simulate_mitigation(req)


@router.post("/execute-mitigation", response_model=IncidentMitigationExecutionResponse)
def execute_incident_mitigation(
    req: IncidentMitigationExecutionRequest,
    db: Session = Depends(get_db),
):
    """Execute a policy-approved operational mitigation with audit logging."""
    return IncidentResponseEngine.execute_mitigation(db, req)
