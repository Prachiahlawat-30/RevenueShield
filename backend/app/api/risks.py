"""Revenue Risks API endpoints for searching, filtering, and detailed inspection."""

import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.schemas.revenue_risk import RevenueRiskResponse


class PaginatedRisksResponse(BaseModel):
    """Paginated revenue risks response."""
    items: List[RevenueRiskResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


router = APIRouter(prefix="/risks", tags=["risks"])


@router.get("", response_model=PaginatedRisksResponse, summary="List revenue risks with filters")
def list_revenue_risks(
    status: Optional[str] = Query(None, description="Filter by status (detected, recovering, recovered, escalated, stopped)"),
    failure_type: Optional[str] = Query(None, description="Filter by failure category"),
    search: Optional[str] = Query(None, description="Search by customer name, email, or external ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedRisksResponse:
    """Retrieve filtered and paginated revenue risks."""
    query = (
        db.query(RevenueRisk)
        .options(
            joinedload(RevenueRisk.customer),
            joinedload(RevenueRisk.transaction),
            joinedload(RevenueRisk.recovery_attempts),
        )
    )

    if status:
        query = query.filter(RevenueRisk.status == status)

    if failure_type:
        query = query.filter(RevenueRisk.detected_failure_type == failure_type)

    if search:
        search_pattern = f"%{search}%"
        query = query.join(RevenueRisk.customer).filter(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.external_id.ilike(search_pattern),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = (
        query.order_by(RevenueRisk.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedRisksResponse(
        items=[RevenueRiskResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{risk_id}", response_model=RevenueRiskResponse, summary="Get single revenue risk details")
def get_revenue_risk_detail(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> RevenueRiskResponse:
    """Retrieve detailed state and history for a specific revenue risk case."""
    risk = (
        db.query(RevenueRisk)
        .options(
            joinedload(RevenueRisk.customer),
            joinedload(RevenueRisk.transaction),
            joinedload(RevenueRisk.recovery_attempts),
        )
        .filter(RevenueRisk.id == risk_id)
        .first()
    )

    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    return RevenueRiskResponse.model_validate(risk)
