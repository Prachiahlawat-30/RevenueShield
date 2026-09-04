"""Pydantic schemas for RevenueRisk entity."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.customer import CustomerResponse
from app.schemas.transaction import TransactionResponse


class RevenueRiskBase(BaseModel):
    amount_at_risk: Decimal
    amount_recovered: Decimal = Decimal("0.00")
    currency: str = "USD"
    detected_failure_type: str
    status: str = "detected"
    current_step: Optional[str] = None
    attempt_count: int = 0
    last_attempt_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    stop_reason: Optional[str] = None
    payment_link_id: Optional[str] = None
    payment_link_url: Optional[str] = None
    source: str = "simulation"


class RevenueRiskCreate(RevenueRiskBase):
    transaction_id: uuid.UUID
    customer_id: uuid.UUID


class RecoveryAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    revenue_risk_id: uuid.UUID
    attempt_number: int
    proposed_action: str
    diagnosis_category: Optional[str] = None
    ai_confidence: Optional[Decimal] = None
    ai_rationale: Optional[str] = None
    policy_approved: bool
    policy_rejection_reason: Optional[str] = None
    executed_action: Optional[str] = None
    execution_channel: Optional[str] = None
    execution_status: str
    amount_recovered: Decimal
    initiated_at: datetime
    completed_at: Optional[datetime] = None


class RevenueRiskResponse(RevenueRiskBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    transaction_id: uuid.UUID
    customer_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerResponse] = None
    transaction: Optional[TransactionResponse] = None
    recovery_attempts: List[RecoveryAttemptResponse] = []
