"""AuditLog SQLAlchemy ORM model."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AuditLog(Base):
    """AuditLog entity maintaining an append-only, immutable record of all decisions and state changes."""

    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    revenue_risk_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("revenue_risks.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    recovery_attempt_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recovery_attempts.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    actor: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    step_name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    diagnosis_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    recommended_action: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    policy_decision: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    executed_action: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    result: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    amount_recovered: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )
    stop_reason: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    input_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True,
    )
    decision_payload: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    # Relationships
    revenue_risk: Mapped[Optional["RevenueRisk"]] = relationship(
        "RevenueRisk",
        back_populates="audit_logs",
    )
    recovery_attempt: Mapped[Optional["RecoveryAttempt"]] = relationship(
        "RecoveryAttempt",
        back_populates="audit_logs",
    )
