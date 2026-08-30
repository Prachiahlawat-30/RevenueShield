"""Application configuration using Pydantic Settings."""

from decimal import Decimal
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    PROJECT_NAME: str = "RecoverAI API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # Database Settings
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5433/recoverai"

    # AI Configuration (OpenAI Python SDK)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    DEMO_MODE: bool = True

    # Configurable Recovery Intervention Costs (Decimal)
    RETRY_PAYMENT_COST: Decimal = Decimal("0.50")
    PAYMENT_REMINDER_COST: Decimal = Decimal("0.10")
    METHOD_UPDATE_COST: Decimal = Decimal("0.20")
    HUMAN_ESCALATION_COST: Decimal = Decimal("15.00")

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    @property
    def sqlalchemy_database_uri(self) -> str:
        """Sanitize DATABASE_URL for SQLAlchemy psycopg3 compatibility."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
