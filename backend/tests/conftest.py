"""Pytest fixtures for RecoverAI backend tests."""

import uuid
from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base
from app.models.policy import Policy

# In-memory SQLite with static pool for isolated tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure clean database schema for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Provide a clean database session populated with default policy."""
    session = TestingSessionLocal()

    # Insert default policy for tests
    policy = Policy(
        id=uuid.uuid4(),
        name="Standard Policy",
        rule_code="DEFAULT_PAYMENT_FAILURE_POLICY",
        max_attempts=3,
        cooldown_seconds=86400,
        max_auto_recovery_amount=Decimal("1000.00"),
        is_active=True,
    )
    session.add(policy)
    session.commit()

    yield session

    session.close()
