"""RecoveryExperiment & Assignment SQLAlchemy ORM models for A/B testing."""

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RecoveryExperiment(Base):
    """RecoveryExperiment entity for A/B recovery strategy testing."""

    __tablename__ = "recovery_experiments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    strategy_a: Mapped[str] = mapped_column(
        String(100),
        nullable=False,  # e.g. "immediate_retry"
    )
    strategy_b: Mapped[str] = mapped_column(
        String(100),
        nullable=False,  # e.g. "timed_reminder"
    )
    traffic_percentage: Mapped[int] = mapped_column(
        Integer,
        default=50,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        index=True,
        default="ACTIVE",  # ACTIVE, COMPLETED, DRAFT
        nullable=False,
    )
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    assignments: Mapped[List["RecoveryExperimentAssignment"]] = relationship(
        "RecoveryExperimentAssignment",
        back_populates="experiment",
        cascade="all, delete-orphan",
    )


class RecoveryExperimentAssignment(Base):
    """RecoveryExperimentAssignment tracks deterministic risk assignments to experiments."""

    __tablename__ = "recovery_experiment_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    experiment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recovery_experiments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    revenue_risk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("revenue_risks.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    assigned_strategy: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    variant: Mapped[str] = mapped_column(
        String(20),  # 'control' or 'treatment'
        nullable=False,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    experiment: Mapped["RecoveryExperiment"] = relationship(
        "RecoveryExperiment",
        back_populates="assignments",
    )
    revenue_risk: Mapped["RevenueRisk"] = relationship(
        "RevenueRisk",
    )
