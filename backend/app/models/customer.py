"""Customer SQLAlchemy ORM model."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import String, Boolean, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Customer(Base):
    """Customer entity representing an account with billing details."""

    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    merchant_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    external_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    phone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    payment_method_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    card_last4: Mapped[Optional[str]] = mapped_column(
        String(4),
        nullable=True,
    )
    card_expiry: Mapped[Optional[str]] = mapped_column(
        String(7),
        nullable=True,
    )
    is_opted_out: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    risk_score: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    merchant: Mapped[Optional["Merchant"]] = relationship(
        "Merchant",
        back_populates="customers",
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
    revenue_risks: Mapped[List["RevenueRisk"]] = relationship(
        "RevenueRisk",
        back_populates="customer",
        cascade="all, delete-orphan",
    )
