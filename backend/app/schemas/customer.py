"""Pydantic schemas for Customer entity."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    payment_method_type: Optional[str] = None
    card_last4: Optional[str] = None
    card_expiry: Optional[str] = None
    is_opted_out: bool = False
    risk_score: Decimal = Decimal("0.00")


class CustomerCreate(CustomerBase):
    external_id: str


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    payment_method_type: Optional[str] = None
    card_last4: Optional[str] = None
    card_expiry: Optional[str] = None
    is_opted_out: Optional[bool] = None
    risk_score: Optional[Decimal] = None


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    external_id: str
    created_at: datetime
    updated_at: datetime
