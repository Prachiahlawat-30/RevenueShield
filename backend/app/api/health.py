"""Health check API router."""

from fastapi import APIRouter
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str
    service: str


router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the RevenueShield API is active and healthy.",
)
def get_health() -> HealthResponse:
    """Return API health status."""
    return HealthResponse(
        status="ok",
        service="revenueshield-api",
    )
