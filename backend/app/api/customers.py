"""Customers API endpoints for customer profiles, history, and opt-out controls."""

import math
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerResponse, CustomerUpdate
from app.schemas.transaction import TransactionResponse
from app.schemas.revenue_risk import RevenueRiskResponse
from app.schemas.tier2_schemas import CustomerRecoveryProfileResponse
from app.services.audit_service import AuditService
from app.schemas.enums import ActorType


class PaginatedCustomersResponse(BaseModel):
    """Paginated customers list."""
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CustomerDetailResponse(CustomerResponse):
    """Detailed customer overview with transaction and risk history."""
    transactions: List[TransactionResponse] = []
    revenue_risks: List[RevenueRiskResponse] = []


class OptOutUpdateRequest(BaseModel):
    """Schema for updating customer opt-out status."""
    is_opted_out: bool


router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=PaginatedCustomersResponse, summary="List customers with filters")
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, email, or external ID"),
    is_opted_out: Optional[bool] = Query(None, description="Filter by opt-out status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> PaginatedCustomersResponse:
    """Retrieve paginated customers."""
    query = db.query(Customer)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.external_id.ilike(search_pattern),
            )
        )

    if is_opted_out is not None:
        query = query.filter(Customer.is_opted_out == is_opted_out)

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = (
        query.order_by(Customer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedCustomersResponse(
        items=[CustomerResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{customer_id}", response_model=CustomerDetailResponse, summary="Get customer 360 overview")
def get_customer_detail(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CustomerDetailResponse:
    """Retrieve full customer profile, transaction history, and associated revenue risks."""
    customer = (
        db.query(Customer)
        .options(
            joinedload(Customer.transactions),
            joinedload(Customer.revenue_risks),
        )
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")

    return CustomerDetailResponse.model_validate(customer)


@router.patch("/{customer_id}/opt-out", response_model=CustomerResponse, summary="Toggle customer opt-out status")
def update_customer_opt_out(
    customer_id: uuid.UUID,
    request: OptOutUpdateRequest,
    db: Session = Depends(get_db),
) -> CustomerResponse:
    """Update customer opt-out status and audit the decision."""
    customer = db.query(Customer).filter_by(id=customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")

    customer.is_opted_out = request.is_opted_out

    AuditService.log_event(
        db=db,
        actor=ActorType.HUMAN_OPERATOR.value,
        step_name="CUSTOMER_OPT_OUT_TOGGLE",
        customer_id=customer.id,
        policy_decision="OPT_OUT_UPDATED",
        result=f"Opt-out set to {request.is_opted_out}",
        decision_payload={"is_opted_out": request.is_opted_out},
    )

    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)


@router.get("/{customer_id}/recovery-profile", response_model=CustomerRecoveryProfileResponse, summary="Get 360 Recovery Profile & Segmentation")
def get_customer_recovery_profile(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CustomerRecoveryProfileResponse:
    """Retrieve 360 recoverability score, empirical recovery metrics, and behavioral segment."""
    from app.services.customer_segment_engine import CustomerSegmentEngine

    customer = (
        db.query(Customer)
        .options(
            joinedload(Customer.transactions),
            joinedload(Customer.revenue_risks),
        )
        .filter(Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")

    return CustomerSegmentEngine.get_customer_profile(customer, customer.transactions)

