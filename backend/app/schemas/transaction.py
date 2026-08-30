"""Pydantic schemas for Transaction entity."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class TransactionBase(BaseModel):
    amount: Decimal
    currency: str = "USD"
    status: str
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    gateway_payload: Optional[Dict[str, Any]] = None


class TransactionCreate(TransactionBase):
    customer_id: uuid.UUID


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    created_at: datetime
