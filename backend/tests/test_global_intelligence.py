"""Integration tests for Global Payment Intelligence API."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_application


@pytest.fixture
def client():
    app = create_application()
    return TestClient(app)


def test_get_global_payment_intelligence_summary(client):
    """Verify global payment intelligence summary endpoint returns complete dossier."""
    res = client.get("/api/global-intelligence/summary")
    assert res.status_code == 200
    data = res.json()

    # 1. KPIs
    assert "kpis" in data
    assert float(data["kpis"]["total_volume"]) > 0
    assert 0.0 <= data["kpis"]["success_rate"] <= 1.0
    assert 0.0 <= data["kpis"]["failure_rate"] <= 1.0

    # 2. Health Score
    assert "health_score" in data
    assert 0 <= data["health_score"]["overall_score"] <= 100
    assert data["health_score"]["status_label"] in ("HEALTHY", "WATCH", "DEGRADED")

    # 3. Regions
    assert "regions" in data
    assert len(data["regions"]) >= 4
    region_names = [r["region_name"] for r in data["regions"]]
    assert "India" in region_names
    assert "United States" in region_names
    assert "Europe" in region_names
    assert "APAC" in region_names

    # 4. Payment Methods
    assert "payment_methods" in data
    assert len(data["payment_methods"]) >= 3
    method_labels = [m["method_id"] for m in data["payment_methods"]]
    assert "cards" in method_labels
    assert "upi" in method_labels

    # 5. Gateways
    assert "gateways" in data
    assert len(data["gateways"]) >= 3

    # 6. Failure Intelligence
    assert "failure_intelligence" in data
    assert len(data["failure_intelligence"]) >= 3

    # 7. Heatmap
    assert "heatmap" in data
    assert len(data["heatmap"]) >= 8

    # 8. Funnel
    assert "funnel" in data
    assert len(data["funnel"]) == 6

    # 9. Recovery Opportunity & Insights
    assert "recovery_opportunity" in data
    print("RECOVERY_OPPORTUNITY DATA:", data["recovery_opportunity"])
    assert float(data["recovery_opportunity"]["recoverable_revenue"]) >= 0
    assert "insights" in data
    assert len(data["insights"]) >= 3
    assert "technical_signals" in data


def test_global_payment_intelligence_filters(client):
    """Verify regional and gateway filters function gracefully."""
    res = client.get("/api/global-intelligence/summary?region=India&gateway=Gateway%20A")
    assert res.status_code == 200
    data = res.json()
    assert data["kpis"]["total_transactions"] >= 0
