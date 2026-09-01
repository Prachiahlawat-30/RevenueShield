"""Tests for CSV transaction import and Razorpay webhook ingestion."""

import io
import pytest
from fastapi.testclient import TestClient

from app.main import create_application


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_download_sample_csv(client):
    """Test downloading the sample transaction CSV template."""
    res = client.get("/api/transactions/sample-csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "customer_name" in res.text
    assert "amount" in res.text
    assert "Razorpay" in res.text


def test_import_transactions_csv(client):
    """Test bulk importing transactions via CSV upload."""
    csv_data = (
        "customer_name,email,phone,amount,currency,failure_type,failure_reason,card_last4,gateway_name\n"
        "Meera Nair,meera@test.in,+919876543210,1499.00,INR,insufficient_funds,Declined: Insufficient account funds,5544,Razorpay\n"
        "Vikram Seth,vikram@corp.io,+919812345678,5999.00,INR,temporary_decline,Issuer bank soft decline,4242,Razorpay\n"
    )

    files = {
        "file": ("test_failures.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")
    }

    res = client.post("/api/transactions/import-csv", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["imported_count"] == 2
    assert data["failed_count"] == 0
    assert float(data["total_amount_imported"]) == 7498.0
    assert len(data["sample_records"]) == 2
    assert data["sample_records"][0]["customer_name"] == "Meera Nair"


def test_razorpay_webhook_payment_failed(client):
    """Test receiving and processing a real Razorpay payment.failed webhook event."""
    payload = {
        "entity": "event",
        "account_id": "acc_TestRazorpay",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_failed_123456",
                    "entity": "payment",
                    "amount": 499900,  # 4999.00 INR in paise
                    "currency": "INR",
                    "status": "failed",
                    "order_id": "order_test_987",
                    "method": "card",
                    "description": "Annual SaaS License",
                    "card": {
                        "id": "card_test_123",
                        "entity": "card",
                        "name": "Ananya Sharma",
                        "last4": "8811",
                        "network": "Visa",
                        "type": "credit",
                        "issuer": "HDFC",
                        "expiry_month": 11,
                        "expiry_year": 2027,
                    },
                    "email": "ananya.sharma@testcorp.in",
                    "contact": "+919876599999",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment failed: Insufficient balance in customer account.",
                    "error_source": "bank",
                    "error_step": "payment_authorization",
                    "error_reason": "payment_failed_insufficient_funds",
                    "created_at": 1725210000,
                }
            }
        },
    }

    res = client.post("/api/webhooks/razorpay", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["razorpay_payment_id"] == "pay_test_failed_123456"
    assert data["amount"] == 4999.0
    assert data["currency"] == "INR"
    assert "revenue_risk_id" in data
    assert data["customer"]["email"] == "ananya.sharma@testcorp.in"


def test_simulate_razorpay_webhook(client):
    """Test simulating a Razorpay payment failure event."""
    res = client.post(
        "/api/webhooks/razorpay/simulate",
        json={"scenario": "temporary_decline", "amount_inr": 3500.00, "customer_name": "Dev Test Client"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["amount"] == 3500.0
    assert data["currency"] == "INR"
    assert "revenue_risk_id" in data


def test_razorpay_webhook_non_failure_event(client):
    """Test that non-failure events are acknowledged gracefully."""
    payload = {
        "entity": "event",
        "event": "order.paid",
        "payload": {},
    }
    res = client.post("/api/webhooks/razorpay", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "acknowledged"
    assert data["event"] == "order.paid"
