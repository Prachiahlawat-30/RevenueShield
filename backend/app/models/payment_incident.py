"""PaymentIncident SQLAlchemy ORM model for payment system degradation tracking."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Numeric, DateTime, Text, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PaymentIncident(Base):
    """PaymentIncident entity representing operational degradation across gateways or payment rails."""

    __tablename__ = "payment_incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    incident_code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        String(50),
        index=True,
        default="HIGH",  # CRITICAL, HIGH, MEDIUM, LOW
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        index=True,
        default="ACTIVE",  # ACTIVE, INVESTIGATING, MITIGATED, RESOLVED
        nullable=False,
    )
    affected_gateway: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )
    affected_payment_method: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    failure_types: Mapped[Optional[List[str]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True,
    )
    estimated_revenue_impact: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    root_cause_summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    confidence: Mapped[Decimal] = mapped_column(
        Numeric(4, 3),
        default=Decimal("0.850"),
        nullable=False,
    )
    evidence_list: Mapped[Optional[List[str]]] = mapped_column(
        JSONB().with_variant(JSON(), "sqlite"),
        nullable=True,
    )
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
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
