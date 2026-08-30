"""Unit & Integration tests for Flagship Feature: Self-Learning Policy Optimizer."""

import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.models.policy import Policy
from app.models.policy_proposal import PolicyProposal
from app.models.audit_log import AuditLog
from app.services.policy_performance_analyzer import PolicyPerformanceAnalyzer
from app.services.policy_safety_validator import PolicySafetyValidator
from app.services.policy_simulator import PolicySimulator
from app.services.policy_optimizer import PolicyOptimizerEngine


@pytest.fixture
def client(db):
    """FastAPI TestClient configured with test database override."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def active_policy(db):
    """Seed initial baseline active policy."""
    policy = db.query(Policy).filter(Policy.is_active == True).first()
    if not policy:
        policy = Policy(
            id=uuid.uuid4(),
            name="Baseline Guardrails",
            rule_code="BASELINE_GUARDRAILS",
            max_attempts=3,
            cooldown_seconds=86400,  # 24h
            max_auto_recovery_amount=Decimal("1000.00"),
            version=1,
            is_active=True,
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy


def test_policy_performance_analysis(db, active_policy):
    """Verify performance analyzer computes attempt incremental yield, cooldown curves, and policy scores."""
    overview = PolicyPerformanceAnalyzer.analyze_current_performance(db=db, policy=active_policy)

    assert overview.current_policy.version == 1
    assert overview.current_policy.max_attempts == 3
    assert overview.current_policy.cooldown_hours == 24
    assert len(overview.attempts_breakdown) == 3
    assert overview.attempts_breakdown[0].attempt_number == 1
    assert overview.attempts_breakdown[0].incremental_recovery_rate >= 0.40
    # Attempt 3 has low incremental yield
    assert overview.attempts_breakdown[2].incremental_recovery_rate < 0.05
    assert overview.policy_performance_score > 0
    assert len(overview.cooldown_breakdown) >= 5


def test_policy_safety_validator_bounds():
    """Verify deterministic safety validator blocks unsafe/out-of-bounds parameters."""
    # 1. Valid proposal: 24h -> 36h
    v1 = PolicySafetyValidator.validate_candidate("COOLDOWN_HOURS", "24", "36")
    assert v1.is_safe is True
    assert v1.overall_safety_score >= 90
    assert len(v1.violations) == 0

    # 2. Unsafe: zero cooldown (< 6h)
    v2 = PolicySafetyValidator.validate_candidate("COOLDOWN_HOURS", "24", "0")
    assert v2.is_safe is False
    assert any("below minimum" in err.lower() or "fatigue" in err.lower() for err in v2.violations)

    # 3. Unsafe: zero max attempts
    v3 = PolicySafetyValidator.validate_candidate("MAX_ATTEMPTS", "3", "0")
    assert v3.is_safe is False
    assert any("below minimum" in err.lower() or "halt" in err.lower() for err in v3.violations)

    # 4. Non-whitelisted parameter
    v4 = PolicySafetyValidator.validate_candidate("ARBITRARY_AI_FIELD", "10", "20")
    assert v4.is_safe is False
    assert any("not in the deterministic whitelist" in err.lower() for err in v4.violations)


def test_counterfactual_policy_simulation(db, active_policy):
    """Verify counterfactual simulation calculates projected net revenue lift."""
    prop = PolicyProposal(
        id=uuid.uuid4(),
        proposal_id="TEST-PROP-01",
        policy_id=active_policy.id,
        parameter_name="COOLDOWN_HOURS",
        current_value="24",
        proposed_value="36",
        policy_version_before=1,
        observations_count=18432,
        affected_transactions=4821,
    )
    db.add(prop)
    db.commit()

    sim = PolicySimulator.simulate_proposal(proposal=prop, db=db)
    assert sim.proposed_recovery_rate > sim.current_recovery_rate
    assert sim.net_revenue_delta > Decimal("0.00")
    assert sim.confidence_score >= 0.80
    assert sim.safety_assessment.is_safe is True


def test_policy_proposal_approval_and_version_increment(client, db, active_policy):
    """Verify Human Operator approval increments Policy version from v1 -> v2 and creates audit log."""
    prop = PolicyProposal(
        id=uuid.uuid4(),
        proposal_id="TEST-PROP-APPROVAL",
        policy_id=active_policy.id,
        parameter_name="COOLDOWN_HOURS",
        current_value="24",
        proposed_value="36",
        policy_version_before=active_policy.version,
        status="PENDING_REVIEW",
        confidence_score=0.87,
        observations_count=18432,
        affected_transactions=4821,
        projected_recovery_delta=0.032,
        projected_cost_delta=Decimal("-900.00"),
        projected_net_revenue_delta=Decimal("4200.00"),
    )
    db.add(prop)
    db.commit()

    res = client.post(
        f"/api/policy-optimizer/{prop.proposal_id}/approve",
        json={"operator_name": "Risk Lead Analyst", "reason": "Approved based on 36h simulation yield."},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "APPROVED"
    assert data["policy_version_after"] == 2
    assert data["reviewed_by"] == "Risk Lead Analyst"

    # Verify policy in DB updated
    db.refresh(active_policy)
    assert active_policy.version == 2
    assert active_policy.cooldown_seconds == 36 * 3600

    # Verify audit entry
    audit = db.query(AuditLog).filter(AuditLog.step_name == "POLICY_ACTIVATED").first()
    assert audit is not None
    assert "Policy v2" in audit.diagnosis_summary


def test_stale_proposal_protection(client, db, active_policy):
    """Verify proposal generated against v1 cannot be approved once policy is already on v2."""
    active_policy.version = 2
    db.commit()

    stale_prop = PolicyProposal(
        id=uuid.uuid4(),
        proposal_id="TEST-STALE-PROP",
        policy_id=active_policy.id,
        parameter_name="MAX_ATTEMPTS",
        current_value="3",
        proposed_value="2",
        policy_version_before=1,  # Stale baseline
        status="PENDING_REVIEW",
    )
    db.add(stale_prop)
    db.commit()

    res = client.post(
        f"/api/policy-optimizer/{stale_prop.proposal_id}/approve",
        json={"operator_name": "Risk Lead", "reason": "Attempting stale approval."},
    )
    assert res.status_code == 400
    assert "STALE_PROPOSAL" in res.json()["detail"]


def test_policy_proposal_rejection(client, db, active_policy):
    """Verify Human Operator rejection transitions proposal to REJECTED with reason recorded."""
    prop = PolicyProposal(
        id=uuid.uuid4(),
        proposal_id="TEST-REJECT-PROP",
        policy_id=active_policy.id,
        parameter_name="MAX_ATTEMPTS",
        current_value="3",
        proposed_value="2",
        policy_version_before=active_policy.version,
        status="PENDING_REVIEW",
    )
    db.add(prop)
    db.commit()

    res = client.post(
        f"/api/policy-optimizer/{prop.proposal_id}/reject",
        json={"operator_name": "Compliance Lead", "reason": "Customer experience concern", "notes": "Need more data on tier 3 VIPs"},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "REJECTED"
    assert "Customer experience concern" in data["review_reason"]

    # Verify active policy version remained unchanged
    db.refresh(active_policy)
    assert active_policy.version == prop.policy_version_before


def test_policy_rollback_creates_new_version(client, db, active_policy):
    """Verify emergency rollback increments to new version restoring prior baseline without mutating history."""
    active_policy.version = 2
    active_policy.cooldown_seconds = 36 * 3600
    db.commit()

    res = client.post(
        "/api/policy-optimizer/rollback",
        json={"operator_name": "Emergency Lead", "reason": "Rollback to restore 24h baseline."},
    )
    assert res.status_code == 200
    data = res.json()

    assert data["version"] == 3
    assert data["cooldown_hours"] == 24
    assert data["max_attempts"] == 3

    db.refresh(active_policy)
    assert active_policy.version == 3
    assert active_policy.cooldown_seconds == 24 * 3600


def test_security_llm_cannot_directly_modify_policy(db, active_policy):
    """Security Invariant: Verify direct LLM JSON/mutations cannot bypass PolicySafetyValidator or Human Approval."""
    # Attempting to call validator with arbitrary non-whitelisted mutation
    malicious_attempt = PolicySafetyValidator.validate_candidate(
        parameter_name="EXECUTE_ARBITRARY_MUTATION",
        current_val="false",
        proposed_val="true",
    )
    assert malicious_attempt.is_safe is False

    # Verify active policy remains untouched
    db.refresh(active_policy)
    assert active_policy.max_attempts == 3
    assert active_policy.is_active is True
