"""Unit and integration tests for Smart Retry Scheduler (Feature 8)."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_application


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_smart_retry_schedule_prediction(client):
    """Test getting smart retry schedule prediction for an existing risk."""
    risks_res = client.get("/api/risks")
    assert risks_res.status_code == 200
    risks = risks_res.json()["items"]
    if not risks:
        client.post("/api/simulation/seed", json={"reset": True})
        risks = client.get("/api/risks").json()["items"]

    assert len(risks) > 0

    target_risk = risks[0]
    res = client.get(f"/api/recovery/smart-schedule/{target_risk['id']}")
    assert res.status_code == 200

    data = res.json()
    assert data["risk_id"] == target_risk["id"]
    assert "failure_type" in data
    assert "peak_hours_window" in data
    assert "scheduled_retry_formatted" in data
    assert "probability_lift" in data
    assert "rationale" in data
    assert "previous successful payments" in data["rationale"] or "Benchmark payment clearing" in data["rationale"]
    assert data["confidence_score"] > 0.8


def test_confirm_smart_retry_schedule(client):
    """Test confirming and locking in a smart retry schedule."""
    risks_res = client.get("/api/risks")
    risks = risks_res.json()["items"]
    target_risk = risks[0]

    res = client.post(f"/api/recovery/smart-schedule/{target_risk['id']}/confirm")
    assert res.status_code == 200
    data = res.json()
    assert data["is_scheduled"] is True
    assert data["status"] == "SCHEDULED"

    # Verify audit trail contains the event
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    logs = audit_res.json()["items"]
    assert any(log["step_name"] == "RETRY_SCHEDULED" for log in logs)
