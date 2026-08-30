"""Recovery Playbooks API endpoints."""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.schemas.tier2_schemas import RecoveryPlaybookResponse
from app.services.recovery_playbook_engine import RecoveryPlaybookEngine

router = APIRouter(prefix="/playbooks", tags=["playbooks"])


@router.get("/{risk_id}", response_model=RecoveryPlaybookResponse, summary="Get structured recovery sequence playbook for a risk")
def get_recovery_playbook(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RecoveryPlaybookResponse:
    """Generate multi-step recovery sequence playbook and timeline for a specific risk."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="RevenueRisk not found.")

    return RecoveryPlaybookEngine.generate_playbook(risk, risk.customer)
