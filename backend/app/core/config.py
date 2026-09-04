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

    PROJECT_NAME: str = "RevenueShield API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"

    # Database Settings
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5433/revenueshield"

    # AI Configuration (OpenAI Python SDK)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    DEMO_MODE: bool = True

    # Configurable Recovery Intervention Costs (Decimal)
    RETRY_PAYMENT_COST: Decimal = Decimal("0.50")
    PAYMENT_REMINDER_COST: Decimal = Decimal("0.10")
    METHOD_UPDATE_COST: Decimal = Decimal("0.20")
    HUMAN_ESCALATION_COST: Decimal = Decimal("15.00")

    # Payment Gateway Configuration (Razorpay TEST MODE)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    @property
    def is_razorpay_configured(self) -> bool:
        """Check if Razorpay API keys are configured."""
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)

    @property
    def masked_razorpay_key(self) -> str:
        """Return masked key ID for safe UI status display without revealing credentials."""
        if not self.RAZORPAY_KEY_ID:
            return ""
        if len(self.RAZORPAY_KEY_ID) > 8:
            return f"{self.RAZORPAY_KEY_ID[:8]}********"
        return "********"

    # CORS Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://revenueshield.vercel.app",
        "https://revenue-shield.vercel.app",
        "https://revenueshield.onrender.com",
        "https://recover-ai-nu.vercel.app",
        "https://recoverai.vercel.app",
        "https://recover-ai.vercel.app",
        "https://recover-ai-1-jwzz.onrender.com",
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
