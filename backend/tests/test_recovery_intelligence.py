"""Unit and integration tests for Tier 1 Recovery Intelligence services and endpoints."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import FailureType, RecoveryAction
from app.services.recovery_probability_engine import RecoveryProbabilityEngine
from app.services.recovery_priority_engine import RecoveryPriorityEngine
from app.services.expected_recovery_engine import ExpectedRecoveryEngine
from app.services.next_best_action_engine import NextBestActionEngine
from app.services.retry_timing_engine import RetryTimingEngine


@pytest.fixture
def client(db):
    """FastAPI TestClient with test database override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# =========================================================================
# 1. RecoveryProbabilityEngine Tests
# =========================================================================

def test_probability_engine_failure_types():
    """Verify baseline probability order across all 5 failure types."""
    customer = Customer(id=uuid.uuid4(), external_id="C_1", name="Test Cust", email="c@test.com", is_opted_out=False, risk_score=Decimal("15.00"))

    # Network Error
    risk_net = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.NETWORK_ERROR.value, status="detected", attempt_count=0)
    res_net = RecoveryProbabilityEngine.calculate_probability(risk_net, customer)
    assert res_net.probability >= 0.85
    assert "positive_factors" in res_net.model_dump()

    # Temporary Decline
    risk_temp = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("120.00"), detected_failure_type=FailureType.TEMPORARY_DECLINE.value, status="detected", attempt_count=0)
    res_temp = RecoveryProbabilityEngine.calculate_probability(risk_temp, customer)
    assert res_temp.probability >= 0.75

    # Insufficient Funds
    risk_funds = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("89.00"), detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value, status="detected", attempt_count=0)
    res_funds = RecoveryProbabilityEngine.calculate_probability(risk_funds, customer)
    assert res_funds.probability >= 0.60

    # Expired Card
    risk_exp = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("50.00"), detected_failure_type=FailureType.EXPIRED_CARD.value, status="detected", attempt_count=0)
    res_exp = RecoveryProbabilityEngine.calculate_probability(risk_exp, customer)
    assert res_exp.probability <= 0.70

    # Unknown Failure
    risk_unk = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("300.00"), detected_failure_type=FailureType.UNKNOWN_FAILURE.value, status="detected", attempt_count=0)
    res_unk = RecoveryProbabilityEngine.calculate_probability(risk_unk, customer)
    assert res_unk.probability <= 0.45


def test_probability_engine_opted_out():
    """Verify opted-out customer yields strictly 0.0 probability."""
    customer = Customer(id=uuid.uuid4(), external_id="C_OPT", name="Opted Out", email="opt@test.com", is_opted_out=True)
    risk = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.TEMPORARY_DECLINE.value, status="detected", attempt_count=0)

    res = RecoveryProbabilityEngine.calculate_probability(risk, customer)
    assert res.probability == 0.0
    assert res.score == 0
    assert len(res.negative_factors) > 0


def test_probability_engine_attempt_progression():
    """Verify multiple failed attempts decrease probability score."""
    customer = Customer(id=uuid.uuid4(), external_id="C_PROG", name="Progression Cust", email="prog@test.com", is_opted_out=False)
    risk_0 = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value, status="detected", attempt_count=0)
    risk_2 = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value, status="detected", attempt_count=2)

    res_0 = RecoveryProbabilityEngine.calculate_probability(risk_0, customer)
    res_2 = RecoveryProbabilityEngine.calculate_probability(risk_2, customer)
    assert res_0.probability > res_2.probability


# =========================================================================
# 2. RecoveryPriorityEngine Tests
# =========================================================================

def test_priority_engine_bands():
    """Verify priority score calculations and classification bands."""
    customer = Customer(id=uuid.uuid4(), external_id="C_PRIO", name="Prio Cust", email="prio@test.com", is_opted_out=False, risk_score=Decimal("5.00"))

    # High value ($850) + high probability (0.90) => CRITICAL
    risk_high = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("850.00"), detected_failure_type=FailureType.NETWORK_ERROR.value, status="detected", attempt_count=0)
    prob_high = RecoveryProbabilityEngine.calculate_probability(risk_high, customer)
    prio_high = RecoveryPriorityEngine.calculate_priority(risk_high, prob_high, customer)
    assert prio_high.priority_score >= 80
    assert prio_high.priority_band == "CRITICAL"

    # Moderate value ($80) => MEDIUM / HIGH
    risk_med = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("80.00"), detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value, status="detected", attempt_count=1)
    prob_med = RecoveryProbabilityEngine.calculate_probability(risk_med, customer)
    prio_med = RecoveryPriorityEngine.calculate_priority(risk_med, prob_med, customer)
    assert prio_med.priority_band in ["MEDIUM", "HIGH"]


# =========================================================================
# 3. ExpectedRecoveryEngine Tests
# =========================================================================

def test_expected_recovery_calculation():
    """Verify exact Decimal arithmetic: ₹10,000 * 0.80 = ₹8,000."""
    amount = Decimal("10000.00")
    prob = 0.80
    res = ExpectedRecoveryEngine.calculate_expected_recovery(amount, prob)

    assert isinstance(res.expected_recovery_value, Decimal)
    assert isinstance(res.expected_loss, Decimal)
    assert res.expected_recovery_value == Decimal("8000.00")
    assert res.expected_loss == Decimal("2000.00")


# =========================================================================
# 4. NextBestActionEngine & Factual Explanations Tests (Feature 13)
# =========================================================================

def test_next_best_action_selection_and_factual_explanations():
    """Verify next-best-action selection and deterministic 'Why this action?' explanations."""
    customer = Customer(
        id=uuid.uuid4(),
        external_id="C_NBA",
        name="Sarah Jenkins",
        email="sarah@test.com",
        card_last4="1881",
        card_expiry="05/25",
        is_opted_out=False,
    )

    # 1. Expired card selects method update with factual explanation
    risk_exp = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=customer.id,
        amount_at_risk=Decimal("150.00"),
        detected_failure_type=FailureType.EXPIRED_CARD.value,
        status="detected",
        attempt_count=0,
    )
    res_exp = NextBestActionEngine.evaluate_actions(risk_exp, customer)
    assert res_exp.recommended_action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE
    assert "RevenueShield recommends `request_payment_method_update`" in res_exp.reason
    assert "card ending in 1881 is expired" in res_exp.reason
    assert len(res_exp.candidates) >= 4

    # 2. Insufficient funds selects payment reminder with factual explanation
    risk_funds = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=customer.id,
        amount_at_risk=Decimal("89.00"),
        detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value,
        status="detected",
        attempt_count=0,
    )
    res_funds = NextBestActionEngine.evaluate_actions(risk_funds, customer)
    assert res_funds.recommended_action == RecoveryAction.SEND_PAYMENT_REMINDER
    assert "RevenueShield recommends `send_payment_reminder`" in res_funds.reason
    assert "recovers 78% of insufficient-funds failures after receiving a polite reminder" in res_funds.reason

    # 3. Temporary decline selects retry with factual explanation
    risk_temp = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=customer.id,
        amount_at_risk=Decimal("120.00"),
        detected_failure_type=FailureType.TEMPORARY_DECLINE.value,
        status="detected",
        attempt_count=0,
    )
    res_temp = NextBestActionEngine.evaluate_actions(risk_temp, customer)
    assert res_temp.recommended_action == RecoveryAction.RETRY_PAYMENT
    assert "RevenueShield recommends `retry_payment`" in res_temp.reason

    # 4. High value ($1,500) selects human escalation
    risk_high = RevenueRisk(
        id=uuid.uuid4(),
        transaction_id=uuid.uuid4(),
        customer_id=customer.id,
        amount_at_risk=Decimal("1500.00"),
        detected_failure_type=FailureType.UNKNOWN_FAILURE.value,
        status="detected",
        attempt_count=0,
    )
    res_high = NextBestActionEngine.evaluate_actions(risk_high, customer)
    assert res_high.recommended_action == RecoveryAction.ESCALATE_TO_HUMAN
    assert "exceeds the $1,000 automated recovery threshold" in res_high.reason

    # 5. Opted-out customer selects STOP with factual explanation
    customer_opt = Customer(id=uuid.uuid4(), external_id="C_STOP", name="Stop Cust", email="stop@test.com", is_opted_out=True)
    res_stop = NextBestActionEngine.evaluate_actions(risk_exp, customer_opt)
    assert res_stop.recommended_action == RecoveryAction.STOP
    assert "customer has explicitly opted out" in res_stop.reason


# =========================================================================
# 5. RetryTimingEngine Tests
# =========================================================================

def test_retry_timing_engine_mappings():
    """Verify smart delay hours across failure categories."""
    customer = Customer(id=uuid.uuid4(), external_id="C_TIME", name="Time Cust", email="time@test.com", is_opted_out=False)

    risk_net = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.NETWORK_ERROR.value, status="detected", attempt_count=0)
    assert RetryTimingEngine.calculate_recommended_timing(risk_net, customer).recommended_delay_hours == 1.0

    risk_temp = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.TEMPORARY_DECLINE.value, status="detected", attempt_count=0)
    assert RetryTimingEngine.calculate_recommended_timing(risk_temp, customer).recommended_delay_hours == 12.0

    risk_exp = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.EXPIRED_CARD.value, status="detected", attempt_count=0)
    assert RetryTimingEngine.calculate_recommended_timing(risk_exp, customer).recommended_delay_hours == 24.0

    risk_funds = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=customer.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.INSUFFICIENT_FUNDS.value, status="detected", attempt_count=0)
    assert RetryTimingEngine.calculate_recommended_timing(risk_funds, customer).recommended_delay_hours == 48.0


# =========================================================================
# 6. Recovery Intelligence REST API Integration Tests
# =========================================================================

def test_intelligence_api_summary_and_opportunities(client):
    """Verify /api/recovery-intelligence/summary and /api/recovery-intelligence/opportunities."""
    # 1. Seed demo database
    client.post("/api/simulation/seed", json={"reset": True})

    # 2. Test Summary
    summary_res = client.get("/api/recovery-intelligence/summary")
    assert summary_res.status_code == 200
    s_data = summary_res.json()
    assert float(s_data["total_revenue_at_risk"]) > 0
    assert float(s_data["expected_recoverable_revenue"]) > 0
    assert s_data["average_recovery_probability"] > 0
    assert len(s_data["recovery_funnel"]) == 4

    # 3. Test Opportunities List
    opps_res = client.get("/api/recovery-intelligence/opportunities?page=1&page_size=10")
    assert opps_res.status_code == 200
    o_data = opps_res.json()
    assert o_data["total"] >= 7
    assert len(o_data["items"]) >= 7

    # Verify first opportunity has all required intelligence fields
    first_opp = o_data["items"][0]
    assert "priority_score" in first_opp
    assert "expected_recovery_value" in first_opp
    assert "recommended_action" in first_opp
    assert "recommended_delay_label" in first_opp
    assert "reason" in first_opp
    assert "RevenueShield recommends" in first_opp["reason"]
    assert len(first_opp["candidates"]) >= 4

    # 4. Test Opportunity Detail
    risk_id = first_opp["risk_id"]
    detail_res = client.get(f"/api/recovery-intelligence/opportunities/{risk_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["risk_id"] == risk_id

    # 5. Test Probability, NBA, and Timing Endpoints
    assert client.get(f"/api/recovery-intelligence/{risk_id}/probability").status_code == 200
    assert client.get(f"/api/recovery-intelligence/{risk_id}/next-best-action").status_code == 200
    assert client.get(f"/api/recovery-intelligence/{risk_id}/timing").status_code == 200


def test_priority_aware_batch_execution(client):
    """Verify batch recovery executes in priority-score descending order."""
    client.post("/api/simulation/seed", json={"reset": True})

    res = client.post("/api/recovery/run-batch?mode=priority", json={"batch_size": 5, "force_cooldown_override": True})
    assert res.status_code == 200
    data = res.json()
    assert data["execution_mode"] == "priority"
    assert data["processed_count"] == 5

    # Check that priority scores are non-increasing (descending)
    scores = [item["priority_score"] for item in data["results"] if item["priority_score"] is not None]
    assert scores == sorted(scores, reverse=True)
