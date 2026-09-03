"""Test operator candidate override actions in recovery step execution."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_application


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_execute_step_with_override_actions(client):
    """Verify executing specific candidate actions directly via override_action."""
    client.post("/api/simulation/seed", json={"reset": True})
    risks = client.get("/api/risks").json()["items"]

    target_risk = risks[0]
    risk_id = target_risk["id"]

    # 1. Execute "send_payment_reminder"
    res1 = client.post(
        f"/api/recovery/{risk_id}/step",
        json={"force_cooldown_override": True, "override_action": "send_payment_reminder"},
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["current_status"] in ("detected", "recovering", "recovered", "escalated")

    # 2. Execute "retry_payment"
    res2 = client.post(
        f"/api/recovery/{risk_id}/step",
        json={"force_cooldown_override": True, "override_action": "retry_payment"},
    )
    assert res2.status_code == 200

    # 3. Execute "escalate_to_human" on another risk
    # 3. Execute "escalate_to_human" on another risk that is not opted out
    target_risk_2 = next((r for r in risks[1:] if not (r.get("customer") and r["customer"].get("is_opted_out"))), risks[-1] if len(risks) > 1 else None)
    if target_risk_2:
        res3 = client.post(
            f"/api/recovery/{target_risk_2['id']}/step",
            json={"force_cooldown_override": True, "override_action": "escalate_to_human"},
        )
        assert res3.status_code == 200
        data3 = res3.json()
        assert data3["current_status"] in ("escalated", "recovering", "stopped")
