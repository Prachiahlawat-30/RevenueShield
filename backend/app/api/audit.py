"""Audit Trail API endpoints for searching and inspecting immutable decision logs."""

import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse


class PaginatedAuditLogsResponse(BaseModel):
    """Paginated audit trail response."""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=PaginatedAuditLogsResponse, summary="Query and filter audit trail logs")
def list_audit_logs(
    revenue_risk_id: Optional[uuid.UUID] = Query(None, description="Filter by revenue risk ID"),
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter by customer ID"),
    actor: Optional[str] = Query(None, description="Filter by actor (risk_engine, diagnosis_engine, policy_engine, recovery_engine, human_operator)"),
    step_name: Optional[str] = Query(None, description="Filter by step name (DETECTED, DIAGNOSING, POLICY_CHECK, ACTION_EXECUTED, etc.)"),
    search: Optional[str] = Query(None, description="Search in diagnosis summary or recommended action"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedAuditLogsResponse:
    """Retrieve filtered and paginated immutable audit log records."""
    query = db.query(AuditLog)

    if revenue_risk_id:
        query = query.filter(AuditLog.revenue_risk_id == revenue_risk_id)

    if customer_id:
        query = query.filter(AuditLog.customer_id == customer_id)

    if actor:
        query = query.filter(AuditLog.actor == actor)

    if step_name:
        query = query.filter(AuditLog.step_name == step_name)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.diagnosis_summary.ilike(pattern),
                AuditLog.recommended_action.ilike(pattern),
                AuditLog.policy_decision.ilike(pattern),
                AuditLog.stop_reason.ilike(pattern),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = (
        query.order_by(AuditLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedAuditLogsResponse(
        items=[AuditLogResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{log_id}", response_model=AuditLogResponse, summary="Get single audit log entry with complete payloads")
def get_audit_log_detail(
    log_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuditLogResponse:
    """Retrieve a single audit log snapshot including full input and decision payloads."""
    log_entry = db.query(AuditLog).filter_by(id=log_id).first()
    if not log_entry:
        raise HTTPException(status_code=404, detail=f"AuditLog with ID {log_id} not found.")

    return AuditLogResponse.model_validate(log_entry)
