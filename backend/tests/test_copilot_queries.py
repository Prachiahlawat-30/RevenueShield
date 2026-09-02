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
