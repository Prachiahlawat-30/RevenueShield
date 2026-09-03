"""Tests for RecoverAI Operator Copilot multi-turn analytics conversation."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_application


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_copilot_multi_turn_incident_dialogue(client):
    """Verify operator copilot handles why rate fell, what to do, and simulation."""
    # Turn 1: Why did recovery rate fall today?
    res1 = client.post("/api/copilot/query", json={"query": "Why did recovery rate fall today?"})
    assert res1.status_code == 200
    data1 = res1.json()
    assert "Gateway A" in data1["answer"]
    assert "8.4%" in data1["answer"] or "3.7×" in data1["answer"]
    assert len(data1["evidence"]) >= 1

    # Turn 2: What should we do?
    res2 = client.post("/api/copilot/query", json={"query": "What should we do?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "Gateway B" in data2["answer"]
    assert "₹3.2L" in data2["answer"] or "3.2L" in data2["answer"]

    # Turn 3: Simulate it.
    res3 = client.post("/api/copilot/query", json={"query": "Simulate it."})
    assert res3.status_code == 200
    data3 = res3.json()
    assert "Simulation completed" in data3["answer"]
    assert "71%" in data3["answer"] and "79%" in data3["answer"]


def test_copilot_blocks_direct_charge_command(client):
    """Verify copilot strictly blocks requests like 'charge all customers now'."""
    res = client.post("/api/copilot/query", json={"query": "charge all customers now"})
    assert res.status_code == 200
    data = res.json()
    assert "blocked" in data["answer"].lower() or "prohibited" in data["answer"].lower()
    assert data["confidence"] == 1.0
    assert any("BLOCKED" in ev["metric_value"] for ev in data["evidence"])


def test_copilot_fallback_no_zero_roi(client):
    """Verify general questions do not output unformatted 0.0x ROI answers."""
    res = client.post("/api/copilot/query", json={"query": "Hello, how is the system doing?"})
    assert res.status_code == 200
    data = res.json()
    assert "0.0x" not in data["answer"]
    assert "RevenueShield is currently tracking" in data["answer"]
