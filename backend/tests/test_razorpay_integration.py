"""Comprehensive integration tests for Razorpay TEST MODE payment workflows."""

import hmac
import hashlib
import json
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import create_application
from app.core.database import get_db
from app.core.config import settings
from app.models.revenue_risk import RevenueRisk
from app.models.transaction import Transaction
from app.models.audit_log import AuditLog
from app.models.webhook_event import WebhookEvent
from app.schemas.enums import RiskStatus
from app.services.razorpay_service import RazorpayService


@pytest.fixture
def client(db):
    app = create_application()
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_razorpay_status_endpoint(client):
    """Verify GET /api/razorpay/status returns connection and config status."""
    res = client.get("/api/razorpay/status")
    assert res.status_code == 200
    data = res.json()
    assert "is_configured" in data
    assert data["mode"] == "test"
    assert "key_id" in data
    assert "webhook_configured" in data


def test_razorpay_test_connection_endpoint(client):
    """Verify POST /api/razorpay/test-connection."""
    res = client.post("/api/razorpay/test-connection")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "connected" in data
    assert "message" in data


def test_razorpay_webhook_signature_verification(client, monkeypatch):
    """Verify that invalid HMAC signatures are rejected with 400."""
    monkeypatch.setattr(settings, "RAZORPAY_WEBHOOK_SECRET", "test_webhook_secret_key_999")
    payload = {"event": "payment.failed", "entity": "event"}
    raw_body = json.dumps(payload).encode("utf-8")

    # Invalid signature
    res = client.post(
        "/api/webhooks/razorpay",
        content=raw_body,
        headers={"X-Razorpay-Signature": "invalid_signature_hex_code", "Content-Type": "application/json"},
    )
    assert res.status_code == 400
    assert "signature verification failed" in res.json()["detail"].lower()

    # Valid signature
    valid_sig = hmac.new(b"test_webhook_secret_key_999", raw_body, hashlib.sha256).hexdigest()
    res = client.post(
        "/api/webhooks/razorpay",
        content=raw_body,
        headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"},
    )
    # Acknowledged or processed
    assert res.status_code == 200


def test_razorpay_full_recovery_lifecycle(client, db):
    """
    Test full end-to-end recovery lifecycle:
    1. Ingest payment.failed webhook (< 1000 INR policy auto-recovery threshold)
    2. Policy engine approves and generates Razorpay payment link
    3. Verify idempotency when same webhook arrives
    4. Ingest payment.captured webhook
    5. Verify risk transitions to RECOVERED with audit trail
    """
    payment_id = f"pay_live_test_{uuid.uuid4().hex[:10]}"
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    failed_payload = {
        "entity": "event",
        "account_id": "acc_TestModeAccount",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": 85000,  # 850.00 INR (under standard policy threshold of 1000.00)
                    "currency": "INR",
                    "status": "failed",
                    "order_id": order_id,
                    "method": "upi",
                    "description": "Premium Subscription Renewal",
                    "email": "rohit.verma@fintechstartup.in",
                    "contact": "+919811223344",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed: Insufficient funds in bank account.",
                    "error_source": "bank",
                    "error_step": "payment_authorization",
                    "error_reason": "payment_failed_insufficient_funds",
                    "created_at": 1725300000,
                }
            }
        },
    }

    # Step 1: Send payment.failed
    res = client.post("/api/webhooks/razorpay", json=failed_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["razorpay_payment_id"] == payment_id
    assert data["amount"] == 850.0
    risk_id = data["revenue_risk_id"]
    assert risk_id is not None
    assert data["payment_link_url"] is not None
    assert data["payment_link_url"].startswith("http")

    # Verify risk in database
    risk = db.query(RevenueRisk).filter_by(id=uuid.UUID(risk_id)).first()
    assert risk is not None
    assert risk.source in ("razorpay", "razorpay_webhook")
    assert risk.status == RiskStatus.RECOVERING.value
    assert risk.payment_link_id is not None
    assert risk.payment_link_url is not None

    # Step 2: Test Idempotency (resending the exact same failed webhook)
    res_duplicate = client.post("/api/webhooks/razorpay", json=failed_payload)
    assert res_duplicate.status_code == 200
    assert res_duplicate.json()["status"] == "duplicate"
    assert res_duplicate.json()["duplicate"] is True

    # Step 3: Test manual create-payment-link endpoint
    res_link = client.post(f"/api/recovery/{risk_id}/create-payment-link")
    assert res_link.status_code == 200
    link_data = res_link.json()
    assert "payment_link_url" in link_data
    assert link_data["payment_link_url"] == risk.payment_link_url

    # Step 4: Ingest payment.captured webhook simulating customer completing the payment
    captured_payload = {
        "entity": "event",
        "account_id": "acc_TestModeAccount",
        "event": "payment.captured",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_captured_{uuid.uuid4().hex[:10]}",
                    "entity": "payment",
                    "amount": 85000,
                    "currency": "INR",
                    "status": "captured",
                    "order_id": order_id,
                    "method": "upi",
                    "email": "rohit.verma@fintechstartup.in",
                    "contact": "+919811223344",
                    "notes": {
                        "revenue_risk_id": risk_id,
                        "payment_link_id": risk.payment_link_id,
                    },
                    "created_at": 1725300500,
                }
            }
        },
    }

    res_cap = client.post("/api/webhooks/razorpay", json=captured_payload)
    assert res_cap.status_code == 200
    cap_data = res_cap.json()
    assert cap_data["status"] == "success"
    assert cap_data["revenue_risk_id"] == risk_id
    assert cap_data["amount_recovered"] == 850.0

    # Step 5: Verify risk status updated to RECOVERED in DB
    db.refresh(risk)
    assert risk.status == RiskStatus.RECOVERED.value
    assert risk.amount_recovered == Decimal("850.00")
    assert risk.stop_reason == "SUCCESS_STOP"
    assert risk.resolved_at is not None

    # Step 6: Verify audit trail
    audits = db.query(AuditLog).filter_by(revenue_risk_id=risk.id).all()
    step_names = [a.step_name for a in audits]
    assert "DETECTED" in step_names
    assert "DIAGNOSING" in step_names
    assert "POLICY_CHECK" in step_names
    assert "PAYMENT_LINK_CREATED" in step_names
    assert "PAYMENT_CAPTURED" in step_names
    assert "REVENUE_RECOVERED" in step_names
