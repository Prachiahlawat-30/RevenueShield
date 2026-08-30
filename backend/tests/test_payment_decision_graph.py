"""Unit & Integration tests for Flagship Feature 1: Payment Decision Graph."""

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
from app.models.policy import Policy
from app.models.audit_log import AuditLog
from app.schemas.enums import FailureType, RiskStatus, RecoveryAction
from app.services.payment_decision_graph_engine import PaymentDecisionGraphEngine


@pytest.fixture
def client(db):
    """FastAPI TestClient configured with the test database dependency override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_decision_graph_generation(db):
    """Verify complete 15-node graph generation with edges, factors, and audit logging."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_GRAPH_01",
        name="Elena Rostova",
        email="elena@enterprise.io",
        is_opted_out=False,
        card_last4="4242",
        card_expiry="08/29",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("420.00"),
        currency="USD",
        status="FAILED",
        failure_code="05",
        failure_reason="Temporary Decline",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=txn.id,
        amount_at_risk=Decimal("420.00"),
        amount_recovered=Decimal("0.00"),
        detected_failure_type=FailureType.TEMPORARY_DECLINE.value,
        status=RiskStatus.DETECTED.value,
        attempt_count=0,
    )
    db.add(risk)
    db.commit()

    # Build graph
    res = PaymentDecisionGraphEngine.build_graph_for_risk(risk_id=risk.id, db=db)

    # Assertions on nodes
    assert len(res.nodes) == 15
    node_types = [n.type for n in res.nodes]
    expected_types = [
        "customer",
        "transaction",
        "payment_method",
        "failure",
        "customer_risk",
        "gateway_health",
        "recovery_probability",
        "retry_timing",
        "expected_recovery",
        "recovery_cost",
        "ai_proposal",
        "policy_engine",
        "final_decision",
        "execution",
        "outcome",
    ]
    for et in expected_types:
        assert et in node_types, f"Missing node type: {et}"

    # Assertions on edges
    assert len(res.edges) >= 14
    edge_sources = [e.source for e in res.edges]
    assert "node_customer" in edge_sources
    assert "node_ai_proposal" in edge_sources
    assert "node_policy_engine" in edge_sources

    # Assertions on factors & versions
    assert len(res.factors) >= 4
    assert res.decision_version == "v3.2.0-deterministic"
    assert res.policy_version == "v2.1.0"
    assert "doesn't ask AI how to move money" in res.differentiator_slogan

    # Audit log check
    audit = db.query(AuditLog).filter(AuditLog.revenue_risk_id == risk.id, AuditLog.step_name == "DECISION_GRAPH_GENERATED").first()
    assert audit is not None


def test_decision_graph_policy_allow_and_api_endpoint(client, db):
    """Verify normal recovery graph via REST API with ALLOW verdict."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_GRAPH_02",
        name="Marcus Vance",
        email="marcus@vance.io",
        is_opted_out=False,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("150.00"),
        currency="USD",
        status="FAILED",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=txn.id,
        amount_at_risk=Decimal("150.00"),
        detected_failure_type=FailureType.TEMPORARY_DECLINE.value,
        status=RiskStatus.DETECTED.value,
    )
    db.add(risk)
    db.commit()

    response = client.get(f"/api/recovery/{risk.id}/decision-graph")
    assert response.status_code == 200
    data = response.json()

    assert data["policy_result"]["verdict"] == "ALLOW"
    assert data["ai_vs_policy"]["policy_verdict"] == "ALLOW"
    assert data["ai_vs_policy"]["is_ai_overridden"] is False
    assert data["final_decision"]["status"] == "ALLOWED"


def test_decision_graph_high_value_override(client, db):
    """Verify high-value ($2,500.00 / ₹2,50,000) transaction triggers PolicyEngine Rule 2 and overrides AI."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_GRAPH_HIGH_01",
        name="Global Corp Enterprise",
        email="treasury@globalcorp.io",
        is_opted_out=False,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("2500.00"),
        currency="USD",
        status="FAILED",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=txn.id,
        amount_at_risk=Decimal("2500.00"),  # > $1,000 threshold
        detected_failure_type=FailureType.TEMPORARY_DECLINE.value,
        status=RiskStatus.DETECTED.value,
    )
    db.add(risk)
    db.commit()

    response = client.get(f"/api/recovery/{risk.id}/decision-graph")
    assert response.status_code == 200
    data = response.json()

    # AI proposed retry_payment, but PolicyEngine Rule 2 strictly escalated
    assert data["ai_proposal"]["action"] == "retry_payment"
    assert data["policy_result"]["verdict"] == "ESCALATE"
    assert data["final_decision"]["action"] == "escalate_to_human"
    assert data["ai_vs_policy"]["is_ai_overridden"] is True
    assert "BLOCKED by PolicyEngine Rule 2" in data["ai_vs_policy"]["summary"]


def test_decision_graph_opt_out_stop(client, db):
    """Verify opted-out customer causes PolicyEngine Rule 1 to block and halt workflow."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_GRAPH_OPTOUT_01",
        name="Privacy First User",
        email="privacy@user.io",
        is_opted_out=True,
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("200.00"),
        currency="USD",
        status="FAILED",
        gateway_name="Gateway A",
        payment_method="card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=txn.id,
        amount_at_risk=Decimal("200.00"),
        detected_failure_type=FailureType.EXPIRED_CARD.value,
        status=RiskStatus.DETECTED.value,
    )
    db.add(risk)
    db.commit()

    response = client.get(f"/api/recovery/{risk.id}/decision-graph")
    assert response.status_code == 200
    data = response.json()

    assert data["policy_result"]["verdict"] == "BLOCK"
    assert data["final_decision"]["action"] == "stop"
    assert data["ai_vs_policy"]["policy_verdict"] == "BLOCK"
    assert "Customer has opted out" in data["policy_result"]["rejection_reason"]


def test_decision_graph_recovered_outcome(client, db):
    """Verify recovered risk produces RECOVERED outcome node with actual funds settled."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_GRAPH_REC_01",
        name="Happy Subscriber",
        email="subscriber@saas.io",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("350.00"),
        currency="USD",
        status="SUCCESS",
        gateway_name="Gateway B",
        payment_method="card",
    )
    db.add(txn)
    db.flush()

    risk = RevenueRisk(
        id=uuid.uuid4(),
        customer_id=cust.id,
        transaction_id=txn.id,
        amount_at_risk=Decimal("350.00"),
        amount_recovered=Decimal("350.00"),
        detected_failure_type=FailureType.TEMPORARY_DECLINE.value,
        status=RiskStatus.RECOVERED.value,
    )
    db.add(risk)
    db.commit()

    response = client.get(f"/api/recovery/{risk.id}/decision-graph")
    assert response.status_code == 200
    data = response.json()

    assert data["outcome"]["status"] == "RECOVERED"
    assert data["outcome"]["amount_recovered"] == 350.0
    outcome_node = next(n for n in data["nodes"] if n["type"] == "outcome")
    assert outcome_node["status"] == "SUCCESS"


def test_decision_graph_missing_risk_404(client):
    """Verify 404 response for non-existent risk."""
    random_id = uuid.uuid4()
    response = client.get(f"/api/recovery/{random_id}/decision-graph")
    assert response.status_code == 404
