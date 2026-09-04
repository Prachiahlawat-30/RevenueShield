"""Razorpay Test Mode Connection & Status Router."""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.razorpay_service import RazorpayService

router = APIRouter(prefix="/razorpay", tags=["Razorpay Infrastructure"])


class RazorpayStatusResponse(BaseModel):
    is_configured: bool
    key_id: str
    webhook_configured: bool
    last_webhook_at: str | None = None
    mode: str = "test"


@router.get("/status", response_model=RazorpayStatusResponse, summary="Get Razorpay TEST MODE connection status")
def get_razorpay_status() -> RazorpayStatusResponse:
    """Check whether Razorpay API keys and webhook secrets are configured."""
    status_data = RazorpayService.get_connection_status()
    return RazorpayStatusResponse(**status_data)


@router.post("/test-connection", summary="Test live connection to Razorpay API in TEST MODE")
def test_razorpay_connection() -> Dict[str, Any]:
    """Perform a live test read against Razorpay API using configured TEST credentials."""
    return RazorpayService.test_connection()
