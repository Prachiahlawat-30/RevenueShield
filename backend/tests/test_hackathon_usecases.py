"""Unit tests for Hackathon Specialized Directions:
- B2B Receivables & Aging Buckets
- Promise-to-Pay (PTP) Tracker
- Mandate Retry Sequencer (UPI Autopay & eNACH)
- Hinglish & Localized Voice / WhatsApp Recovery Studio
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_b2b_receivables_summary():
    """Test retrieving B2B receivables overview across aging buckets."""
    response = client.get("/api/use-cases/b2b-receivables")
    assert response.status_code == 200
    data = response.json()
    assert "total_receivables_at_risk" in data
    assert "current_bucket_amount" in data
    assert "overdue_bucket_amount" in data
    assert "critical_bucket_amount" in data
    assert "default_risk_bucket_amount" in data
    assert len(data["invoices"]) > 0
    assert len(data["recent_promises"]) > 0


def test_record_and_fulfill_promise_to_pay():
    """Test recording a customer promise to pay and marking it fulfilled."""
    req_payload = {
        "invoice_id": "inv_corp_101",
        "customer_id": "cust_test_123",
        "promised_amount": 12500.00,
        "promised_date": "2026-09-05",
        "channel": "VOICE_CALL",
        "operator_notes": "Customer CFO confirmed payment on 5th September via NEFT",
    }
    create_res = client.post("/api/use-cases/promise-to-pay", json=req_payload)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["status"] == "ACTIVE_PROMISE"
    assert created["dunning_paused"] is True
    ptp_id = created["id"]

    # Fulfill promise
    fulfill_res = client.post(f"/api/use-cases/promise-to-pay/{ptp_id}/fulfill")
    assert fulfill_res.status_code == 200
    fulfilled = fulfill_res.json()
    assert fulfilled["status"] == "FULFILLED"
    assert fulfilled["dunning_paused"] is False


def test_get_mandate_sequencer_summary():
    """Test retrieving mandate retry sequences and salary cycle alignment."""
    response = client.get("/api/use-cases/mandate-sequencer")
    assert response.status_code == 200
    data = response.json()
    assert "total_mandates_at_risk" in data
    assert "upi_autopay_volume" in data
    assert "enach_volume" in data
    assert len(data["scheduled_sequences"]) > 0
    assert any(s["mandate_type"] == "UPI_AUTOPAY" for s in data["scheduled_sequences"])
    assert any(s["mandate_type"] == "ENACH" for s in data["scheduled_sequences"])


def test_execute_mandate():
    """Test executing an optimal mandate sequence."""
    req_payload = {
        "mandate_id": "mandate_upi_9921",
        "override_window": "IMMEDIATE",
    }
    response = client.post("/api/use-cases/mandate-sequencer/execute", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SETTLED_SUCCESS"
    assert "NPCI_REC_" in data["execution_receipt"]


def test_generate_hinglish_conversational_flow():
    """Test generating natural Hinglish IVR voice script and WhatsApp template."""
    req_payload = {
        "customer_id": "cust_test_001",
        "amount": 4500.00,
        "failure_type": "insufficient_funds",
        "preferred_language": "HINGLISH",
        "channel": "VOICE_CALL",
        "tone": "FRIENDLY_PROFESSIONAL",
    }
    response = client.post("/api/use-cases/conversational-studio/generate", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["voice_script"] is not None
    assert "Namaste" in data["voice_script"]["opening_line"]
    assert len(data["voice_script"]["dialogue_turns"]) > 0
    assert data["voice_script"]["language_mode"] == "HINGLISH"


def test_generate_hindi_and_english_flows():
    """Test generating Hindi and English variations."""
    # Hindi WhatsApp
    hi_res = client.post(
        "/api/use-cases/conversational-studio/generate",
        json={
            "customer_id": "cust_test_001",
            "amount": 2500.00,
            "preferred_language": "HINDI",
            "channel": "WHATSAPP",
        },
    )
    assert hi_res.status_code == 200
    hi_data = hi_res.json()
    assert hi_data["whatsapp_message"] is not None
    assert "नमस्ते" in hi_data["whatsapp_message"]["body_text"]

    # English Call
    en_res = client.post(
        "/api/use-cases/conversational-studio/generate",
        json={
            "customer_id": "cust_test_001",
            "amount": 1200.00,
            "preferred_language": "ENGLISH",
            "channel": "VOICE_CALL",
        },
    )
    assert en_res.status_code == 200
    en_data = en_res.json()
    assert en_data["voice_script"] is not None
    assert any(w in en_data["voice_script"]["opening_line"] for w in ["Hello", "Hi"])
