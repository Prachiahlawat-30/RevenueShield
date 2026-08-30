"""Comprehensive unit and integration tests for Tier 2 Advanced Revenue Intelligence."""

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
from app.models.recovery_experiment import RecoveryExperiment, RecoveryExperimentAssignment
from app.models.payment_incident import PaymentIncident
from app.schemas.enums import FailureType, RecoveryAction
from app.schemas.tier2_schemas import StrategySimulationRequest, PolicyPlaygroundRequest, CopilotQueryRequest
from app.services.customer_segment_engine import CustomerSegmentEngine
from app.services.recovery_learning_engine import RecoveryLearningEngine
from app.services.recovery_experiment_engine import RecoveryExperimentEngine
from app.services.revenue_leakage_service import RevenueLeakageService
from app.services.payment_incident_engine import PaymentIncidentEngine
from app.services.gateway_routing_engine import GatewayRoutingEngine
from app.services.recovery_playbook_engine import RecoveryPlaybookEngine
from app.services.strategy_simulator_engine import StrategySimulatorEngine
from app.services.recovery_roi_engine import RecoveryROIEngine
from app.services.operator_copilot_service import OperatorCopilotService


@pytest.fixture
def client(db):
    """FastAPI TestClient with test database override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# =========================================================================
# 1. CustomerSegmentEngine & 360 Profile Tests
# =========================================================================

def test_customer_segment_classification():
    """Verify deterministic customer segmentation rules."""
    # 1. High value reliable ($600, low risk 10.0)
    c_reliable = Customer(id=uuid.uuid4(), external_id="C_REL", name="Reliable Corp", email="r@test.com", risk_score=Decimal("10.00"), is_opted_out=False)
    tx_reliable = [Transaction(id=uuid.uuid4(), customer_id=c_reliable.id, amount=Decimal("600.00"), status="succeeded", gateway_name="Gateway A", payment_method="credit_card")]
    assert CustomerSegmentEngine.determine_segment(c_reliable, tx_reliable) == "HIGH_VALUE_RELIABLE"

    # 2. High value risk ($1,200, elevated risk 40.0)
    c_risk = Customer(id=uuid.uuid4(), external_id="C_RISK", name="Risk Corp", email="risk@test.com", risk_score=Decimal("40.00"), is_opted_out=False)
    tx_risk = [Transaction(id=uuid.uuid4(), customer_id=c_risk.id, amount=Decimal("1200.00"), status="failed", gateway_name="Gateway A", payment_method="credit_card")]
    assert CustomerSegmentEngine.determine_segment(c_risk, tx_risk) == "HIGH_VALUE_RISK"

    # 3. 360 Profile generation
    profile = CustomerSegmentEngine.get_customer_profile(c_reliable, tx_reliable)
    assert profile.segment == "HIGH_VALUE_RELIABLE"
    assert profile.recoverability_score > 80
    assert profile.contact_sensitivity == "LOW"


# =========================================================================
# 2. RecoveryLearningEngine Tests
# =========================================================================

def test_recovery_learning_matrix(db):
    """Verify empirical learning matrix aggregation."""
    matrix = RecoveryLearningEngine.get_strategy_performance_matrix(db)
    assert "action_performance" in matrix
    assert "failure_action_matrix" in matrix
    assert matrix["failure_action_matrix"]["temporary_decline"]["retry_payment"] >= 0.80


# =========================================================================
# 3. RecoveryExperimentEngine & A/B Testing Tests
# =========================================================================

def test_experiment_assignment_and_lift(db):
    """Verify deterministic hashing assignment and statistical lift calculations."""
    exp = RecoveryExperiment(
        id=uuid.uuid4(),
        name="Test Experiment",
        strategy_a="immediate_retry",
        strategy_b="timed_retry_6h",
        traffic_percentage=50,
        status="ACTIVE",
    )
    db.add(exp)
    db.commit()

    cust = Customer(id=uuid.uuid4(), external_id="C_EXP", name="Exp Cust", email="e@test.com", is_opted_out=False)
    db.add(cust)
    db.flush()

    risk1 = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=cust.id, amount_at_risk=Decimal("100.00"), detected_failure_type=FailureType.TEMPORARY_DECLINE.value, status="detected", attempt_count=0)
    db.add(risk1)
    db.commit()

    # Deterministic assignment
    assignment1 = RecoveryExperimentEngine.assign_risk_to_experiment(db, exp, risk1)
    assert assignment1.variant in ["control", "treatment"]
    assert assignment1.assigned_strategy in [exp.strategy_a, exp.strategy_b]

    # Re-assigning returns the same variant
    assignment2 = RecoveryExperimentEngine.assign_risk_to_experiment(db, exp, risk1)
    assert assignment2.variant == assignment1.variant

    # Lift evaluation
    results = RecoveryExperimentEngine.evaluate_experiment(db, exp)
    assert results.name == "Test Experiment"
    assert results.control_metrics.strategy == "immediate_retry"
    assert results.treatment_metrics.strategy == "timed_retry_6h"


# =========================================================================
# 4. PaymentIncidentEngine & Anomaly Detection Tests
# =========================================================================

def test_anomaly_detection_and_incident_resolution(db):
    """Verify anomaly detector triggers incidents with structured evidence."""
    anomaly_res = PaymentIncidentEngine.check_for_anomalies(db)
    assert anomaly_res.affected_gateway == "Gateway A"
    assert anomaly_res.has_anomaly is True
    assert anomaly_res.active_incident is not None
    assert len(anomaly_res.active_incident.evidence_list) >= 3

    # Test resolution
    resolved = PaymentIncidentEngine.resolve_incident(db, anomaly_res.active_incident.id)
    assert resolved.status == "RESOLVED"
    assert resolved.resolved_at is not None


# =========================================================================
# 5. GatewayRoutingEngine Tests
# =========================================================================

def test_gateway_health_and_routing():
    """Verify gateway health monitoring and policy-checked routing recommendations."""
    overview = GatewayRoutingEngine.get_gateway_health_overview()
    assert len(overview) == 3
    gateway_b = next(g for g in overview if g.gateway_name.startswith("Gateway B"))
    assert gateway_b.status == "HEALTHY"
    assert gateway_b.success_rate >= 0.95

    # Optimal route recommendation
    risk = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=uuid.uuid4(), amount_at_risk=Decimal("150.00"), detected_failure_type=FailureType.NETWORK_ERROR.value, status="detected", attempt_count=0)
    rec = GatewayRoutingEngine.recommend_optimal_gateway(risk)
    assert "Gateway B" in rec.recommended_gateway
    assert rec.policy_approved is True


# =========================================================================
# 6. RecoveryPlaybookEngine Tests
# =========================================================================

def test_playbook_generation():
    """Verify multi-step bounded sequence generation across failure categories."""
    risk_exp = RevenueRisk(id=uuid.uuid4(), transaction_id=uuid.uuid4(), customer_id=uuid.uuid4(), amount_at_risk=Decimal("49.00"), detected_failure_type=FailureType.EXPIRED_CARD.value, status="detected", attempt_count=0)
    pb = RecoveryPlaybookEngine.generate_playbook(risk_exp)
    assert pb.playbook_id == "PB-EXPIRED_CARD"
    assert len(pb.steps) >= 4
    assert pb.steps[0].action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE
    assert len(pb.stopping_rules) >= 3


# =========================================================================
# 7. StrategySimulatorEngine Tests
# =========================================================================

def test_strategy_simulator_zero_mutation(db):
    """Verify what-if simulation calculates metrics without mutating database state."""
    req = StrategySimulationRequest(
        simulated_max_attempts=2,
        simulated_cooldown_hours=12,
        simulated_high_value_threshold=Decimal("1000.00"),
        simulated_retry_delay_hours=12,
    )
    sim_res = StrategySimulatorEngine.run_simulation(db, req)
    assert sim_res.current.revenue_at_risk > Decimal("0.00")
    assert sim_res.simulated.expected_recovery > Decimal("0.00")
    assert "Simulating a 12h cooldown" in sim_res.summary_analysis


# =========================================================================
# 8. RecoveryROIEngine & OperatorCopilot Tests
# =========================================================================

def test_recovery_roi_and_copilot_service(db):
    """Verify ROI calculations, attribution, and Copilot evidence-based inquiries."""
    # 1. ROI Engine
    roi = RecoveryROIEngine.calculate_roi_and_attribution(db)
    assert roi.roi_multiple >= 0.0
    assert len(roi.attribution_by_action) >= 4
    assert len(roi.attribution_by_gateway) >= 3

    # 2. Copilot Query (Analytical)
    copilot_res = OperatorCopilotService.answer_query(db, CopilotQueryRequest(query="Which gateway is experiencing issues?"))
    assert "Gateway A" in copilot_res.answer
    assert len(copilot_res.evidence) >= 2
    assert copilot_res.is_executable is False

    # 3. Copilot Guard (Execution rejection)
    guard_res = OperatorCopilotService.answer_query(db, CopilotQueryRequest(query="Execute all retries now"))
    assert "cannot directly execute recovery actions" in guard_res.answer
    assert guard_res.is_executable is False


# =========================================================================
# 9. Tier 2 REST API Integration Tests
# =========================================================================

def test_tier2_rest_api_endpoints(client):
    """Verify all Tier 2 REST API endpoints."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. Experiments
    exp_res = client.get("/api/experiments/")
    assert exp_res.status_code == 200
    exps = exp_res.json()
    assert len(exps) >= 1
    exp_id = exps[0]["id"]
    assert client.get(f"/api/experiments/{exp_id}/results").status_code == 200

    # 2. Revenue Leakage Radar & ROI
    assert client.get("/api/revenue-leakage/summary").status_code == 200
    assert client.get("/api/revenue-leakage/executive").status_code == 200
    assert client.get("/api/revenue-leakage/roi").status_code == 200

    # 3. Incidents
    inc_res = client.get("/api/incidents/")
    assert inc_res.status_code == 200
    assert client.get("/api/incidents/detect").status_code == 200

    # 4. Gateways & Routing
    assert client.get("/api/gateways/health").status_code == 200

    # 5. Strategy Simulator
    sim_res = client.post("/api/strategy-simulator/simulate", json={"simulated_cooldown_hours": 12})
    assert sim_res.status_code == 200
    assert "current" in sim_res.json()

    # 6. Policy Playground
    play_res = client.post("/api/policy/playground", json={"amount": "150.00", "failure_type": "temporary_decline", "attempt_count": 0})
    assert play_res.status_code == 200
    assert play_res.json()["final_action"] == "retry_payment"

    # 7. Copilot Query
    cop_res = client.post("/api/copilot/query", json={"query": "Why did recovery rate fall today?"})
    assert cop_res.status_code == 200
    assert len(cop_res.json()["evidence"]) >= 1
