"""Database engine, session factory, and base model with resilient fallback."""

import os
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings


def create_resilient_engine():
    """Create SQLAlchemy engine with automatic SQLite fallback if PostgreSQL is unavailable."""
    db_uri = settings.sqlalchemy_database_uri

    # If DATABASE_URL points to a local unreachable postgres and we are on Render / cloud, use SQLite
    if "localhost" in db_uri and (os.environ.get("RENDER") or os.environ.get("PORT")):
        print("Cloud deployment detected without remote PostgreSQL URL. Using SQLite storage.")
        db_uri = "sqlite:///./recoverai.db"

    if db_uri.startswith("sqlite"):
        return create_engine(
            db_uri,
            connect_args={"check_same_thread": False},
            echo=False,
        )

    try:
        eng = create_engine(
            db_uri,
            pool_pre_ping=True,
            echo=False,
        )
        # Test connection
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng
    except Exception as e:
        print(f"PostgreSQL connection unavailable ({e}). Falling back to SQLite database.")
        return create_engine(
            "sqlite:///./recoverai.db",
            connect_args={"check_same_thread": False},
            echo=False,
        )


engine = create_resilient_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """Dependency for yielding database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
