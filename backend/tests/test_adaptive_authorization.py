"""Unit & Integration tests for Feature 2: Adaptive Authorization + Smart 3DS Optimization."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.policy import Policy
from app.schemas.adaptive_authorization import (
    AuthenticationStrategy,
    TokenStrategy,
    WhatIfSimulationRequest,
)
from app.services.smart_authentication_engine import SmartAuthenticationEngine
from app.services.authorization_value_engine import AuthorizationValueEngine
from app.services.adaptive_authorization_engine import AdaptiveAuthorizationEngine


@pytest.fixture
def client(db):
    """FastAPI TestClient configured with test database override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_smart_authentication_engine_tradeoffs():
    """Verify Smart 3DS correctly balances auth rate vs conversion vs friction."""
    # 1. Low Risk Card
    no_3ds = SmartAuthenticationEngine.evaluate_authentication_candidate(
        strategy=AuthenticationStrategy.NO_3DS,
        payment_method="card",
        amount=Decimal("2400.00"),
        customer_risk_tier="LOW",
    )
    assert no_3ds["authorization_probability"] >= 0.90
    assert no_3ds["conversion_probability"] >= 0.95
    assert no_3ds["customer_friction_score"] == 10
    assert no_3ds["customer_friction_label"] == "LOW"

    # 2. Challenge 3DS has highest auth prob but high friction & lower conversion
    challenge = SmartAuthenticationEngine.evaluate_authentication_candidate(
        strategy=AuthenticationStrategy.CHALLENGE_3DS,
        payment_method="card",
        amount=Decimal("2400.00"),
        customer_risk_tier="LOW",
    )
    assert challenge["authorization_probability"] >= 0.97
    assert challenge["conversion_probability"] <= 0.80  # Cart drop-off
    assert challenge["customer_friction_score"] >= 70
    assert challenge["customer_friction_label"] == "HIGH"

    # 3. Non-card method (UPI)
    upi = SmartAuthenticationEngine.evaluate_authentication_candidate(
        strategy=AuthenticationStrategy.NO_3DS,
        payment_method="upi",
        amount=Decimal("2400.00"),
        customer_risk_tier="LOW",
    )
    assert upi["strategy"] == AuthenticationStrategy.NOT_APPLICABLE.value
    assert upi["customer_friction_label"] == "NONE"


def test_authorization_value_engine_network_token_lift():
    """Verify network tokenization provides +3.5% authorization boost and fee discount."""
    std_val = AuthorizationValueEngine.evaluate_strategy_value(
        amount=Decimal("18400.00"),
        base_auth_probability=0.91,
        conversion_probability=0.95,
        customer_friction_score=10,
        authentication_cost=Decimal("0.00"),
        token_strategy=TokenStrategy.STANDARD_CREDENTIAL,
    )

    token_val = AuthorizationValueEngine.evaluate_strategy_value(
        amount=Decimal("18400.00"),
        base_auth_probability=0.91,
        conversion_probability=0.95,
        customer_friction_score=10,
        authentication_cost=Decimal("0.00"),
        token_strategy=TokenStrategy.NETWORK_TOKEN_SIMULATED,
    )

    assert token_val["effective_auth_probability"] > std_val["effective_auth_probability"]
    assert token_val["expected_net_revenue"] > std_val["expected_net_revenue"]


def test_adaptive_authorization_low_risk_recommendation(db):
    """Verify low-risk transaction prefers high-conversion, low-friction pathway."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_AUTH_LOW_01",
        name="Low Risk VIP",
        email="vip@lowrisk.io",
        risk_score=Decimal("15.0"),
        is_opted_out=False,
        card_last4="4242",
        card_expiry="12/29",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("240.00"),
        currency="USD",
        status="PENDING",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.commit()

    res = AdaptiveAuthorizationEngine.evaluate_authorization_for_transaction(transaction_id=txn.id, db=db)

    assert res.recommended_strategy["gateway"].startswith("Gateway B")
    assert res.customer_friction_label == "LOW"
    assert res.expected_net_revenue > Decimal("0.00")
    assert res.expected_revenue_lift >= Decimal("0.00")
    assert res.policy_result.status == "ALLOW"
    assert len(res.alternatives) >= 6


def test_adaptive_authorization_high_value_human_approval(client, db):
    """Verify transaction > $1,000 / ₹1,00,000 requires human approval by PolicyEngine."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_AUTH_HIGH_01",
        name="Enterprise Treasury",
        email="treasury@enterprise.io",
        risk_score=Decimal("20.0"),
        is_opted_out=False,
        card_last4="8888",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("1800.00"),  # > $1,000 limit
        currency="USD",
        status="PENDING",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.commit()

    response = client.post(f"/api/authorization/{txn.id}/evaluate")
    assert response.status_code == 200
    data = response.json()

    assert data["policy_result"]["status"] == "HUMAN_APPROVAL_REQUIRED"
    assert data["policy_result"]["requires_escalation"] is True
    assert "exceeds automated limit" in data["policy_result"]["rejection_reason"]


def test_adaptive_authorization_opt_out_block(client, db):
    """Verify opted-out customer causes PolicyEngine to strictly BLOCK pre-authorization."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_AUTH_OPTOUT_01",
        name="Opted Out User",
        email="optout@user.io",
        is_opted_out=True,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("120.00"),
        currency="USD",
        status="PENDING",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.commit()

    response = client.post(f"/api/authorization/{txn.id}/evaluate")
    assert response.status_code == 200
    data = response.json()

    assert data["policy_result"]["status"] == "BLOCK"
    assert "opt-out" in data["policy_result"]["rejection_reason"].lower()


def test_what_if_interactive_simulation(client):
    """Verify interactive 'What If?' sandbox computes revenue deltas correctly."""
    req = WhatIfSimulationRequest(
        amount=Decimal("84000.00"),
        currency="INR",
        selected_gateway="Gateway A (Primary Global)",
        selected_authentication="CHALLENGE_3DS",
        selected_token_strategy="STANDARD_CREDENTIAL",
        customer_risk_level="LOW",
    )

    response = client.post("/api/authorization/what-if", json=req.model_dump(mode="json"))
    assert response.status_code == 200
    data = response.json()

    assert data["customer_friction_score"] >= 70
    assert data["customer_friction_label"] == "HIGH"
    assert "delta_vs_recommended" in data


def test_authorization_funnel_and_loss_breakdown_endpoints(client):
    """Verify GET /api/authorization/analytics/funnel and /loss-breakdown."""
    funnel_res = client.get("/api/authorization/analytics/funnel")
    assert funnel_res.status_code == 200
    funnel_data = funnel_res.json()
    assert len(funnel_data["stages"]) == 4
    assert funnel_data["overall_conversion_lift_pct"] > 0

    loss_res = client.get("/api/authorization/analytics/loss-breakdown")
    assert loss_res.status_code == 200
    loss_data = loss_res.json()
    assert len(loss_data["categories"]) >= 3
    assert float(loss_data["total_lost_revenue"]) > 0
