"""Pydantic schemas for AuditLog entity."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditLogBase(BaseModel):
    revenue_risk_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    recovery_attempt_id: Optional[uuid.UUID] = None
    actor: str
    step_name: str
    diagnosis_summary: Optional[str] = None
    recommended_action: Optional[str] = None
    policy_decision: Optional[str] = None
    executed_action: Optional[str] = None
    result: Optional[str] = None
    amount_recovered: Optional[Decimal] = None
    stop_reason: Optional[str] = None
    input_payload: Optional[Dict[str, Any]] = None
    decision_payload: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
