"""RevenueRisk SQLAlchemy ORM model."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import String, Numeric, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RevenueRisk(Base):
    """RevenueRisk entity tracking payment failure exposure and recovery state."""

    __tablename__ = "revenue_risks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    amount_at_risk: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    amount_recovered: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="USD",
        nullable=False,
    )
    detected_failure_type: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        index=True,
        default="detected",
        nullable=False,
    )
    current_step: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    attempt_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    last_attempt_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    stop_reason: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    payment_link_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        index=True,
        nullable=True,
    )
    payment_link_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        default="simulation",
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(
        "Customer",
        back_populates="revenue_risks",
    )
    transaction: Mapped["Transaction"] = relationship(
        "Transaction",
        back_populates="revenue_risk",
    )
    recovery_attempts: Mapped[List["RecoveryAttempt"]] = relationship(
        "RecoveryAttempt",
        back_populates="revenue_risk",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="revenue_risk",
    )
