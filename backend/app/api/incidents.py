"""Payment Incidents API endpoints for operational degradation detection and resolution."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment_incident import PaymentIncident
from app.schemas.tier2_schemas import PaymentIncidentResponse, AnomalyDetectionResult
from app.services.payment_incident_engine import PaymentIncidentEngine

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("/", response_model=List[PaymentIncidentResponse], summary="List all operational payment incidents")
def list_incidents(db: Session = Depends(get_db)) -> List[PaymentIncidentResponse]:
    """Retrieve all active and historical operational payment degradation incidents."""
    return db.query(PaymentIncident).order_by(PaymentIncident.detected_at.desc()).all()


@router.get("/detect", response_model=AnomalyDetectionResult, summary="Run anomaly detection on live payment streams")
def detect_anomalies(db: Session = Depends(get_db)) -> AnomalyDetectionResult:
    """Evaluate current payment success rates and concentration to detect operational degradation anomalies."""
    return PaymentIncidentEngine.check_for_anomalies(db)


@router.get("/{incident_id}", response_model=PaymentIncidentResponse, summary="Get incident details and root cause evidence")
def get_incident(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> PaymentIncidentResponse:
    """Retrieve full incident dossier with structured evidence list."""
    incident = db.query(PaymentIncident).filter_by(id=incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident


@router.post("/{incident_id}/resolve", response_model=PaymentIncidentResponse, summary="Mark incident as resolved")
def resolve_incident(incident_id: uuid.UUID, db: Session = Depends(get_db)) -> PaymentIncidentResponse:
    """Mark an active payment degradation incident as resolved."""
    try:
        return PaymentIncidentEngine.resolve_incident(db, incident_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
