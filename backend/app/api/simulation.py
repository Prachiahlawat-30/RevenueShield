"""Simulation API endpoints for synthetic seeding and on-demand payment failure generation."""

import uuid
import random
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.schemas.enums import FailureType
from app.schemas.revenue_risk import RevenueRiskResponse
from app.services.risk_engine import RiskEngine
from app.data.seed_data import seed_database

router = APIRouter(prefix="/simulation", tags=["simulation"])


class SeedDatabaseRequest(BaseModel):
    """Request schema for seeding the database."""
    reset: bool = Field(default=False, description="Whether to purge existing data before seeding")


class SeedDatabaseResponse(BaseModel):
    """Response containing seeded counts."""
    seeded_customers: int
    seeded_transactions: int
    seeded_risks: int
    message: str


class GenerateFailureRequest(BaseModel):
    """Request schema to inject an on-demand synthetic payment failure."""
    failure_type: FailureType = Field(description="Failure type (temporary_decline, insufficient_funds, expired_card, network_error, unknown_failure)")
    amount: Optional[Decimal] = Field(default=None, description="Transaction amount (randomized if omitted)")
    customer_name: Optional[str] = Field(default=None, description="Customer name (generated if omitted)")
    is_opted_out: bool = Field(default=False, description="Whether the synthetic customer is opted out")


@router.post("/seed", response_model=SeedDatabaseResponse, summary="Seed database with realistic demo scenarios")
def seed_demo_data(
    request: SeedDatabaseRequest = Body(default_factory=SeedDatabaseRequest),
    db: Session = Depends(get_db),
) -> SeedDatabaseResponse:
    """Populate database with synthetic customers, failure scenarios, and default policies."""
    result = seed_database(db=db, reset=request.reset)
    return SeedDatabaseResponse(
        seeded_customers=result["seeded_customers"],
        seeded_transactions=result["seeded_transactions"],
        seeded_risks=result["seeded_risks"],
        message="Database successfully seeded with realistic failure scenarios.",
    )


@router.post("/generate-failure", response_model=RevenueRiskResponse, summary="Inject an on-demand failed transaction")
def generate_synthetic_failure(
    request: GenerateFailureRequest,
    db: Session = Depends(get_db),
) -> RevenueRiskResponse:
    """Inject a new synthetic payment failure and return the initiated RevenueRisk."""
    # Randomized defaults if not provided
    amount = request.amount or Decimal(str(random.choice([49.00, 89.00, 120.00, 249.00, 450.00, 1250.00])))
    random_id = uuid.uuid4().hex[:6].upper()
    name = request.customer_name or f"Synthetic Client {random_id}"

    card_expiry = "05/26" if request.failure_type == FailureType.EXPIRED_CARD else "12/28"

    customer = Customer(
        id=uuid.uuid4(),
        external_id=f"CUST_SYN_{random_id}",
        name=name,
        email=f"client_{random_id.lower()}@demo.recoverai.io",
        phone=f"+1-555-01{random.randint(10, 99)}",
        payment_method_type="credit_card",
        card_last4=str(random.randint(1000, 9999)),
        card_expiry=card_expiry,
        is_opted_out=request.is_opted_out,
        risk_score=Decimal(str(random.randint(5, 50))),
    )
    db.add(customer)
    db.flush()

    failure_reasons = {
        FailureType.TEMPORARY_DECLINE: "Bank soft decline: Suspicious transaction rule triggered",
        FailureType.INSUFFICIENT_FUNDS: "Declined: Insufficient funds in account",
        FailureType.EXPIRED_CARD: "Declined: Card expired 05/26",
        FailureType.NETWORK_ERROR: "Gateway error: Timeout connecting to issuer network (91)",
        FailureType.UNKNOWN_FAILURE: "ISO 05: Do not honor generic bank error",
    }

    transaction = Transaction(
        id=uuid.uuid4(),
        customer_id=customer.id,
        amount=amount,
        currency="USD",
        status="failed",
        failure_code=request.failure_type.value,
        failure_reason=failure_reasons.get(request.failure_type, "Declined"),
    )
    db.add(transaction)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, transaction.id)
    db.commit()
    db.refresh(risk)

    return RevenueRiskResponse.model_validate(risk)
