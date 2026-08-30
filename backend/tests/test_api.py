"""Comprehensive API integration tests for all RecoverAI REST endpoints."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.schemas.enums import FailureType, RiskStatus


@pytest.fixture
def client(db):
    """FastAPI TestClient configured with the test database dependency override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_api_health_endpoint(client):
    """Verify GET /api/health."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["service"] == "recoverai-api"


def test_api_simulation_seed(client):
    """Verify POST /api/simulation/seed."""
    res = client.post("/api/simulation/seed", json={"reset": True})
    assert res.status_code == 200
    data = res.json()
    assert data["seeded_customers"] >= 7
    assert data["seeded_risks"] >= 7


def test_api_dashboard_endpoints(client):
    """Verify GET /api/dashboard/metrics and GET /api/dashboard/charts."""
    # Seed data first
    client.post("/api/simulation/seed", json={"reset": True})

    # Metrics
    metrics_res = client.get("/api/dashboard/metrics")
    assert metrics_res.status_code == 200
    m_data = metrics_res.json()
    assert float(m_data["total_revenue_at_risk"]) > 0
    assert "recovery_rate_pct" in m_data
    assert m_data["active_cases"] >= 5

    # Charts
    charts_res = client.get("/api/dashboard/charts")
    assert charts_res.status_code == 200
    c_data = charts_res.json()
    assert len(c_data["failure_breakdown"]) >= 5
    assert len(c_data["stage_conversion_funnel"]) == 6


def test_api_risks_listing_and_detail(client):
    """Verify GET /api/risks and GET /api/risks/{id}."""
    client.post("/api/simulation/seed", json={"reset": True})

    # List
    list_res = client.get("/api/risks?page=1&page_size=10")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 7
    assert len(data["items"]) >= 7

    # Detail
    risk_id = data["items"][0]["id"]
    detail_res = client.get(f"/api/risks/{risk_id}")
    assert detail_res.status_code == 200
    d_data = detail_res.json()
    assert d_data["id"] == risk_id
    assert d_data["customer"] is not None


def test_api_recovery_lifecycle_endpoints(client):
    """Verify diagnose, step, run-full, run-batch, and manual-resolve endpoints."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. Get a pending risk (e.g. temporary decline)
    risks_res = client.get("/api/risks?failure_type=temporary_decline")
    items = risks_res.json()["items"]
    target_risk = items[0]
    risk_id = target_risk["id"]

    # 2. POST /api/recovery/{id}/diagnose
    diag_res = client.post(f"/api/recovery/{risk_id}/diagnose")
    assert diag_res.status_code == 200
    diag_data = diag_res.json()
    assert diag_data["failure_category"] == "temporary_decline"
    assert diag_data["recommended_action"] == "retry_payment"

    # 3. POST /api/recovery/{id}/step
    step_res = client.post(f"/api/recovery/{risk_id}/step", json={"force_cooldown_override": True})
    assert step_res.status_code == 200
    step_data = step_res.json()
    assert step_data["current_status"] == "recovered"
    assert step_data["is_terminal"] is True
    assert float(step_data["amount_recovered"]) == float(target_risk["amount_at_risk"])

    # 4. POST /api/recovery/run-batch
    batch_res = client.post("/api/recovery/run-batch", json={"batch_size": 10, "force_cooldown_override": True})
    assert batch_res.status_code == 200
    b_data = batch_res.json()
    assert b_data["processed_count"] >= 5
    assert b_data["recovered_count"] >= 1
    assert b_data["escalated_count"] >= 1


def test_api_manual_resolve(client):
    """Verify POST /api/recovery/{id}/manual-resolve for escalated cases."""
    client.post("/api/simulation/seed", json={"reset": True})

    # Find the high-value risk ($1500)
    risks_res = client.get("/api/risks?failure_type=unknown_failure")
    risk_id = risks_res.json()["items"][0]["id"]

    # Step it so it becomes ESCALATED
    client.post(f"/api/recovery/{risk_id}/step", json={"force_cooldown_override": True})

    # Manual resolve
    res = client.post(
        f"/api/recovery/{risk_id}/manual-resolve",
        json={"action": "mark_recovered", "notes": "Approved by CFO after customer call."},
    )
    expected_amount = float(risks_res.json()["items"][0]["amount_at_risk"])
    assert float(res.json()["amount_recovered"]) == expected_amount


def test_api_customers_and_opt_out(client):
    """Verify customers listing, detail, and opt-out toggle."""
    client.post("/api/simulation/seed", json={"reset": True})

    cust_list = client.get("/api/customers").json()
    assert cust_list["total"] >= 7
    cust_id = cust_list["items"][0]["id"]

    # Detail
    cust_detail = client.get(f"/api/customers/{cust_id}").json()
    assert cust_detail["id"] == cust_id
    assert len(cust_detail["revenue_risks"]) >= 1

    # Toggle opt-out
    patch_res = client.patch(f"/api/customers/{cust_id}/opt-out", json={"is_opted_out": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["is_opted_out"] is True


def test_api_audit_logs(client):
    """Verify GET /api/audit listing and detail."""
    client.post("/api/simulation/seed", json={"reset": True})

    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    data = audit_res.json()
    assert data["total"] >= 7

    log_id = data["items"][0]["id"]
    detail_res = client.get(f"/api/audit/{log_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == log_id


def test_api_simulation_generate_failure(client):
    """Verify POST /api/simulation/generate-failure."""
    res = client.post(
        "/api/simulation/generate-failure",
        json={"failure_type": "insufficient_funds", "amount": 320.00, "customer_name": "On Demand Corp"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_failure_type"] == "insufficient_funds"
    assert float(data["amount_at_risk"]) == 320.00
    assert data["status"] == "detected"
