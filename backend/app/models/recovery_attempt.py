"""RecoveryAttempt SQLAlchemy ORM model."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Boolean, Numeric, Integer, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecoveryAttempt(Base):
    """RecoveryAttempt entity logging individual interventions and outcomes."""

    __tablename__ = "recovery_attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    revenue_risk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("revenue_risks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    attempt_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    proposed_action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    diagnosis_category: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    ai_confidence: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(4, 3),
        nullable=True,
    )
    ai_rationale: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    policy_approved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    policy_rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    executed_action: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    execution_channel: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    execution_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
    )
    amount_recovered: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    outcome_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True,
    )
    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    revenue_risk: Mapped["RevenueRisk"] = relationship(
        "RevenueRisk",
        back_populates="recovery_attempts",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="recovery_attempt",
    )
