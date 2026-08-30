"""REST API router for Autonomy Levels, Control Center, Human Approval Queue, Channel Selection & Personalization."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.tier3_schemas import (
    AutonomyConfigResponse,
    AutonomyModeUpdateRequest,
    ApprovalQueueItem,
    HumanApprovalActionRequest,
    HumanApprovalActionResponse,
    ChannelOptimizationResult,
    CommunicationDraftRequest,
    CommunicationDraftResponse,
)
from app.services.autonomy_service import AutonomyService
from app.services.channel_optimization_engine import ChannelOptimizationEngine
from app.services.personalized_communication_service import PersonalizedCommunicationService

router = APIRouter(prefix="/autonomy", tags=["Autonomy & Human-in-the-Loop Controls"])


@router.get("/config", response_model=AutonomyConfigResponse)
def get_autonomy_config():
    """Retrieve active autonomy mode, automated action checklist, and human approval rules."""
    return AutonomyService.get_config()


@router.post("/mode", response_model=AutonomyConfigResponse)
def update_autonomy_mode(req: AutonomyModeUpdateRequest):
    """Update active system autonomy level (MANUAL, ASSISTED, AUTOMATIC)."""
    AutonomyService.set_mode(req.mode) if hasattr(AutonomyService, "set_mode") else AutonomyService.set_current_mode(req.mode)
    return AutonomyService.get_config()


@router.get("/queue", response_model=List[ApprovalQueueItem])
def get_human_approval_queue(db: Session = Depends(get_db)):
    """Retrieve transactions waiting in the Human Approval Queue."""
    return AutonomyService.get_approval_queue(db)


@router.post("/approve/{risk_id}", response_model=HumanApprovalActionResponse)
def approve_queued_action(
    risk_id: uuid.UUID,
    req: Optional[HumanApprovalActionRequest] = None,
    db: Session = Depends(get_db),
):
    """Human operator approves and triggers execution on a queued recovery item."""
    try:
        return AutonomyService.approve_item(db, risk_id, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/reject/{risk_id}", response_model=HumanApprovalActionResponse)
def reject_queued_action(
    risk_id: uuid.UUID,
    req: Optional[HumanApprovalActionRequest] = None,
    db: Session = Depends(get_db),
):
    """Human operator rejects and terminates workflow for a queued item."""
    try:
        return AutonomyService.reject_item(db, risk_id, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/escalate/{risk_id}", response_model=HumanApprovalActionResponse)
def escalate_queued_action(
    risk_id: uuid.UUID,
    req: Optional[HumanApprovalActionRequest] = None,
    db: Session = Depends(get_db),
):
    """Human operator escalates queued item to dedicated high-touch desk."""
    try:
        return AutonomyService.escalate_item(db, risk_id, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/channels/{customer_id}", response_model=ChannelOptimizationResult)
def get_customer_smart_channels(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Evaluate response probabilities and rank delivery channels for a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return ChannelOptimizationEngine.optimize_channel(customer)


@router.post("/draft-communication", response_model=CommunicationDraftResponse)
def generate_personalized_communication_draft(
    req: CommunicationDraftRequest,
    db: Session = Depends(get_db),
):
    """Generate a personalized dunning communication draft strictly from structured facts."""
    try:
        return PersonalizedCommunicationService.generate_draft(db, req)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
