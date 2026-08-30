"""Unit and integration test suite for Tier 3 Predictive Revenue Protection, Forecast, Heatmap, Proactive Prevention, Value Protection, Margin Optimization & Contact Fatigue."""

import pytest
import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from starlette.testclient import TestClient

from app.main import app
from app.core.database import get_db
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine
from app.services.revenue_forecast_engine import RevenueForecastEngine
from app.services.revenue_risk_heatmap_service import RevenueRiskHeatmapService
from app.services.prevention_decision_engine import PreventionDecisionEngine
from app.services.proactive_recovery_service import ProactiveRecoveryService
from app.services.customer_value_engine import CustomerValueEngine
from app.services.recovery_cost_engine import RecoveryCostEngine
from app.services.contact_policy_engine import ContactPolicyEngine
from app.services.policy_engine import PolicyEngine
from app.services.next_best_action_engine import NextBestActionEngine
from app.services.channel_optimization_engine import ChannelOptimizationEngine
from app.services.personalized_communication_service import PersonalizedCommunicationService
from app.services.autonomy_service import AutonomyService
from app.services.control_center_service import ControlCenterService
from app.services.incident_response_engine import IncidentResponseEngine
from app.services.revenue_protection_score_engine import RevenueProtectionScoreEngine
from app.services.decision_replay_service import DecisionReplayService
from app.services.counterfactual_analysis_engine import CounterfactualAnalysisEngine
from app.services.executive_money_story_service import ExecutiveMoneyStoryService
from app.services.proactive_recommendations_engine import ProactiveRecommendationsEngine
from app.services.merchant_intelligence_engine import MerchantIntelligenceEngine
from app.services.monthly_report_service import MonthlyReportService
from app.services.recovery_leaderboard_service import RecoveryLeaderboardService
from app.services.system_health_service import SystemHealthService
from app.services.chaos_simulation_engine import ChaosSimulationEngine
from app.services.ai_policy_transparency_service import AiPolicyTransparencyService
from app.services.demo_lab_service import DemoLabService
from app.schemas.enums import RecoveryAction
from app.schemas.tier3_schemas import (
    ProactiveActionExecutionRequest,
    CommunicationDraftRequest,
    AutonomyMode,
    IncidentMitigationSimulationRequest,
    IncidentMitigationExecutionRequest,
)
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_predictive_revenue_risk_engine_analysis(client, db):
    """Verify pre-failure risk scoring, failure probability, and structured reasons."""
    client.post("/api/simulation/seed", json={"reset": True})

    customers = db.query(Customer).all()
    assert len(customers) >= 7

    # Analyze first customer
    item = PredictiveRevenueRiskEngine.analyze_customer(db, customers[0])

    assert item.customer_id == customers[0].id
    assert item.future_risk_score >= 0 and item.future_risk_score <= 100
    assert item.probability_of_failure >= 0.0 and item.probability_of_failure <= 1.0
    assert item.predicted_revenue_at_risk > Decimal("0.00")
    assert item.risk_horizon != ""
    assert item.risk_horizon_hours > 0
    assert len(item.risk_reasons) >= 1
    assert item.payment_method_health in ["HEALTHY", "DEGRADING", "CRITICAL"]
    assert item.recommended_proactive_action != ""


def test_predictive_risk_summary_aggregation(client, db):
    """Verify macro predictive summary totals and risk segmentation."""
    client.post("/api/simulation/seed", json={"reset": True})

    summary = PredictiveRevenueRiskEngine.get_summary(db)

    assert summary.total_upcoming_volume > Decimal("0.00")
    assert summary.total_predicted_revenue_at_risk > Decimal("0.00")
    assert summary.average_failure_probability > 0.0
    assert len(summary.predictive_accounts) >= 7
    assert (
        summary.high_risk_accounts_count
        + summary.moderate_risk_accounts_count
        + summary.low_risk_accounts_count
    ) == len(summary.predictive_accounts)
    assert summary.top_risk_merchant is not None


def test_revenue_forecast_engine_horizons_and_timeseries(client, db):
    """Verify multi-horizon forecasts (24h, 7d, 30d) and daily time-series points."""
    client.post("/api/simulation/seed", json={"reset": True})

    forecast = RevenueForecastEngine.generate_forecast(db)

    # 24h Horizon
    assert forecast.horizon_24h.expected_payment_volume > Decimal("0.00")
    assert forecast.horizon_24h.predicted_failure_exposure > Decimal("0.00")
    assert forecast.horizon_24h.expected_recoverable_revenue > Decimal("0.00")
    assert forecast.horizon_24h.predicted_failure_rate_pct > 0.0

    # 7d Horizon should be larger than 24h
    assert forecast.horizon_7d.expected_payment_volume > forecast.horizon_24h.expected_payment_volume
    assert forecast.horizon_7d.predicted_failure_exposure > forecast.horizon_24h.predicted_failure_exposure

    # 30d Horizon should be largest
    assert forecast.horizon_30d.expected_payment_volume > forecast.horizon_7d.expected_payment_volume

    # Daily time-series breakdown
    assert len(forecast.daily_forecasts) == 7
    for pt in forecast.daily_forecasts:
        assert pt.expected_payment_volume > Decimal("0.00")
        assert pt.predicted_failure_exposure > Decimal("0.00")
        assert pt.predicted_recoverable_revenue > Decimal("0.00")
        assert pt.confidence_percentage >= 70

    # Risk drivers
    assert len(forecast.top_risk_drivers) >= 3
    assert forecast.top_risk_drivers[0]["share_pct"] > 0


def test_revenue_risk_heatmap_service(client, db):
    """Verify Time x Failure Risk heatmap matrix calculations and windows."""
    client.post("/api/simulation/seed", json={"reset": True})

    heatmap = RevenueRiskHeatmapService.generate_heatmap(db)

    assert len(heatmap.days) == 5
    assert len(heatmap.time_slots) == 5
    assert len(heatmap.matrix) == 25  # 5x5

    for cell in heatmap.matrix:
        assert cell.day_of_week in ["MON", "TUE", "WED", "THU", "FRI"]
        assert cell.hour_label in ["10 AM", "12 PM", "2 PM", "4 PM", "6 PM"]
        assert cell.risk_level in ["LOW", "MEDIUM", "HIGH"]
        assert cell.color_indicator in ["GREEN", "YELLOW", "RED"]
        assert cell.failure_rate_pct >= 0.0

    assert "Wednesday" in heatmap.peak_failure_day or "WED" in heatmap.highest_risk_window
    assert heatmap.safest_window != ""


def test_prevention_decision_engine_3_way_comparison(client, db):
    """Verify Option A vs Option B vs Option C 3-way economics."""
    client.post("/api/simulation/seed", json={"reset": True})

    decisions = PreventionDecisionEngine.evaluate_all(db)
    assert len(decisions) >= 7

    top_dec = decisions[0]
    assert top_dec.option_a.expected_loss > Decimal("0.00")
    assert top_dec.option_b.expected_recovered > Decimal("0.00")
    assert top_dec.option_c.expected_prevented_loss > Decimal("0.00")
    assert top_dec.best_option in ["PROACTIVE_INTERVENTION", "RECOVER_AFTER_FAILURE", "DO_NOTHING"]
    assert "advantage" in top_dec.economic_rationale.lower() or "cost-effective" in top_dec.economic_rationale.lower()


def test_proactive_recovery_service_execution_and_policy(client, db):
    """Verify proactive intervention execution, audit trail, and opt-out policy blocking."""
    client.post("/api/simulation/seed", json={"reset": True})

    customers = db.query(Customer).all()
    active_cust = next(c for c in customers if not c.is_opted_out)
    opted_out_cust = next(c for c in customers if c.is_opted_out)

    # 1. Execute proactive action for active customer
    req_active = ProactiveActionExecutionRequest(
        customer_id=active_cust.id,
        action_type="PROACTIVE_PAYMENT_METHOD_CHECK",
        custom_notes="Automated pre-renewal check test",
    )
    res_active = ProactiveRecoveryService.execute_proactive_action(db, req_active)

    assert res_active.status == "SUCCESS"
    assert res_active.policy_approved is True
    assert res_active.expected_prevented_loss > Decimal("0.00")

    audit = db.query(AuditLog).filter(AuditLog.step_name == "PROACTIVE_PRE_DUNNING_DISPATCH").first()
    assert audit is not None
    assert audit.policy_decision == "APPROVED"

    # 2. Execute proactive action for opted-out customer
    req_blocked = ProactiveActionExecutionRequest(
        customer_id=opted_out_cust.id,
        action_type="SEND_PRE_RENEWAL_REMINDER",
    )
    res_blocked = ProactiveRecoveryService.execute_proactive_action(db, req_blocked)

    assert res_blocked.status == "BLOCKED_BY_POLICY"
    assert res_blocked.policy_approved is False
    assert res_blocked.expected_prevented_loss == Decimal("0.00")


def test_customer_value_engine_scoring_and_touch_level(client, db):
    """FEATURE 6: Verify Customer Lifetime Value score (0-100) and VIP high-touch routing."""
    client.post("/api/simulation/seed", json={"reset": True})

    customers = db.query(Customer).all()
    assert len(customers) >= 7

    for cust in customers:
        profile = CustomerValueEngine.calculate_profile(db, cust)
        assert profile.customer_value_score >= 10 and profile.customer_value_score <= 100
        assert profile.value_tier in ["VIP_ENTERPRISE", "HIGH_GROWTH", "STANDARD", "STARTER"]
        assert profile.recommended_touch_level in [
            "WHITE_GLOVE_HUMAN",
            "ACCOUNT_MANAGER_CONCIERGE",
            "AUTOMATED_BALANCED",
        ]
        assert profile.relationship_tenure_months >= 1


def test_recovery_cost_engine_and_margin_aware_recovery(client, db):
    """FEATURE 7 & 8: Verify intervention cost tracking and margin-aware disqualification."""
    # 1. Config costs
    cfg = RecoveryCostEngine.get_config()
    assert cfg.retry_payment_cost > Decimal("0.00")
    assert cfg.send_payment_reminder_cost > Decimal("0.00")
    assert cfg.request_payment_method_update_cost > Decimal("0.00")
    assert cfg.escalate_to_human_cost > Decimal("0.00")

    # 2. Viable intervention (High value ticket: $1,200)
    viable = RecoveryCostEngine.evaluate_cost_breakdown(
        action=RecoveryAction.ESCALATE_TO_HUMAN,
        amount_at_risk=Decimal("1200.00"),
        recovery_probability=0.75,
    )
    assert viable.is_margin_viable is True
    assert viable.expected_net_recovery > Decimal("800.00")
    assert viable.viability_status == "ECONOMICALLY_VIABLE"

    # 3. Unviable intervention (Low value ticket: $10 with human escalation cost)
    unviable = RecoveryCostEngine.evaluate_cost_breakdown(
        action=RecoveryAction.ESCALATE_TO_HUMAN,
        amount_at_risk=Decimal("10.00"),
        recovery_probability=0.50,  # $5 gross recovery - $15 cost = -$10 net
    )
    assert unviable.is_margin_viable is False
    assert unviable.expected_net_recovery < Decimal("0.00")
    assert unviable.viability_status == "MARGIN_NEGATIVE_REJECTED"
    assert "not economically justified" in unviable.rationale


def test_contact_fatigue_protection_policy_enforcement(client, db):
    """FEATURE 9: Verify contact frequency limits, 24h cap, and PolicyEngine blocking."""
    client.post("/api/simulation/seed", json={"reset": True})

    cust = db.query(Customer).filter(Customer.is_opted_out.is_(False)).first()
    risk = db.query(RevenueRisk).filter(RevenueRisk.customer_id == cust.id).first()

    now = datetime.now(timezone.utc)

    # Simulate 2 prior reminder contacts within last 2 hours
    past_attempts = [
        RecoveryAttempt(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            attempt_number=1,
            proposed_action="send_payment_reminder",
            executed_action="send_payment_reminder",
            execution_status="failed",
            policy_approved=True,
            initiated_at=now - timedelta(hours=2),
            completed_at=now - timedelta(hours=2),
        ),
        RecoveryAttempt(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            attempt_number=2,
            proposed_action="send_payment_reminder",
            executed_action="send_payment_reminder",
            execution_status="failed",
            policy_approved=True,
            initiated_at=now - timedelta(hours=1),
            completed_at=now - timedelta(hours=1),
        ),
    ]

    # Evaluate outbound reminder against PolicyEngine
    policy_res = PolicyEngine.evaluate(
        risk=risk,
        customer=cust,
        proposed_action=RecoveryAction.SEND_PAYMENT_REMINDER,
        past_attempts=past_attempts,
        ignore_cooldown_for_demo=False,
    )

    # Must be BLOCKED under Rule 7
    assert policy_res.is_approved is False
    assert policy_res.effective_action == RecoveryAction.STOP
    assert "CONTACT_FREQUENCY_LIMIT" in str(policy_res.stop_reason) or "RULE_CONTACT_FATIGUE" in str(policy_res.applied_rules)


def test_tier3_rest_api_endpoints(client, db):
    """Verify REST API routes for /api/predictive-risk, /api/forecast, /api/heatmap, /api/prevention, /api/unit-economics."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/predictive-risk/summary
    res_sum = client.get("/api/predictive-risk/summary")
    assert res_sum.status_code == 200
    sum_data = res_sum.json()
    assert float(sum_data["total_predicted_revenue_at_risk"]) > 0
    first_cust_id = sum_data["predictive_accounts"][0]["customer_id"]

    # 2. GET /api/heatmap/risk-matrix
    res_hm = client.get("/api/heatmap/risk-matrix")
    assert res_hm.status_code == 200
    assert len(res_hm.json()["matrix"]) == 25

    # 3. GET /api/prevention/decisions
    res_prev = client.get("/api/prevention/decisions")
    assert res_prev.status_code == 200

    # 4. GET /api/unit-economics/customer-value/{id}
    res_val = client.get(f"/api/unit-economics/customer-value/{first_cust_id}")
    assert res_val.status_code == 200
    val_data = res_val.json()
    assert val_data["customer_value_score"] >= 10
    assert val_data["value_tier"] != ""

    # 5. GET /api/unit-economics/costs
    res_costs = client.get("/api/unit-economics/costs")
    assert res_costs.status_code == 200
    assert float(res_costs.json()["escalate_to_human_cost"]) > 0.0

    # 6. GET /api/unit-economics/contact-fatigue/{id}
    res_fat = client.get(f"/api/unit-economics/contact-fatigue/{first_cust_id}")
    assert res_fat.status_code == 200
    assert res_fat.json()["contact_sensitivity"] in ["LOW", "MEDIUM", "HIGH"]

    # 7. GET /api/unit-economics/margin-evaluate
    res_margin = client.get(
        "/api/unit-economics/margin-evaluate",
        params={
            "action": "escalate_to_human",
            "amount_at_risk": "10.00",
            "recovery_probability": "0.50",
        },
    )
    assert res_margin.status_code == 200
    assert res_margin.json()["is_margin_viable"] is False


def test_channel_optimization_engine(db):
    """FEATURE 10: Verify multi-channel scoring across email, sms, push, in_app."""
    cust_phone = Customer(
        id=uuid.uuid4(),
        external_id="CUST_CHAN_PHONE",
        name="Elena Rostova",
        email="elena@test.com",
        phone="+1555019283",
        is_opted_out=False,
    )
    db.add(cust_phone)
    db.flush()

    res = ChannelOptimizationEngine.optimize_channel(cust_phone, amount=Decimal("600.00"))
    assert res.best_channel in ["sms", "in_app"]
    assert res.expected_response_probability >= 0.70
    assert len(res.channel_rankings) == 4
    assert "RecoverAI recommends" in res.selection_reason


def test_personalized_communication_service(db):
    """FEATURE 11: Verify deterministic factual customer communication drafting."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id="CUST_COMM_DRAFT",
        name="Marcus Sterling",
        email="marcus@test.com",
        card_last4="9912",
        card_expiry="04/24",
        is_opted_out=False,
    )
    db.add(cust)
    db.flush()

    req = CommunicationDraftRequest(
        customer_id=cust.id,
        failure_type="expired_card",
        amount=Decimal("250.00"),
        recommended_action="request_payment_method_update",
        payment_deadline="within 24 hours",
        preferred_channel="email",
    )

    draft = PersonalizedCommunicationService.generate_draft(db, req)
    assert "Marcus" in draft.body_text
    assert "$250.00" in draft.body_text
    assert "expired" in draft.body_text
    assert "9912" in draft.body_text
    assert "Update Payment Method" in draft.action_button_label
    assert len(draft.facts_grounding) >= 5


def test_autonomy_control_and_human_approval_queue(client, db):
    """FEATURE 12, 13, 14: Verify Autonomy modes, queue population, Approve/Reject/Escalate and Audit logs."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. Config endpoint
    res_cfg = client.get("/api/autonomy/config")
    assert res_cfg.status_code == 200
    assert res_cfg.json()["current_mode"] in ["AUTOMATIC", "ASSISTED", "MANUAL"]

    # 2. Update Mode to ASSISTED
    res_mode = client.post("/api/autonomy/mode", json={"mode": "ASSISTED"})
    assert res_mode.status_code == 200
    assert res_mode.json()["current_mode"] == "ASSISTED"

    # 3. Retrieve Human Approval Queue
    res_q = client.get("/api/autonomy/queue")
    assert res_q.status_code == 200
    queue_items = res_q.json()
    assert len(queue_items) > 0

    first_item = queue_items[0]
    risk_id = first_item["risk_id"]

    # 4. Approve queued item
    res_app = client.post(
        f"/api/autonomy/approve/{risk_id}",
        json={"action": "APPROVE", "operator_notes": "Operations lead sign-off."},
    )
    assert res_app.status_code == 200
    assert res_app.json()["audit_event_logged"] == "HUMAN_APPROVED"

    # 5. Verify audit log entry
    audit = db.query(AuditLog).filter(AuditLog.revenue_risk_id == uuid.UUID(risk_id), AuditLog.result == "HUMAN_APPROVED").first()
    assert audit is not None
    assert audit.actor == "HumanOperator"


def test_recovery_control_center_summary_and_live_events(client, db):
    """FEATURE 15 & 16: Verify Control Center macro KPIs, live queues, and real-time event telemetry."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/control-center/summary
    res = client.get("/api/control-center/summary")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert float(data["kpis"]["revenue_at_risk"]) > 0
    assert float(data["kpis"]["expected_recovery"]) > 0
    assert len(data["critical_revenue_risks"]) > 0
    assert len(data["payment_incidents"]) > 0
    assert len(data["active_playbooks"]) > 0
    assert len(data["recent_events"]) > 0

    # 2. GET /api/control-center/live-events
    res_events = client.get("/api/control-center/live-events?limit=10")
    assert res_events.status_code == 200
    ev_data = res_events.json()
    assert ev_data["total_events"] > 0
    first_ev = ev_data["events"][0]
    assert ":" in first_ev["timestamp_str"]
    assert first_ev["headline"] != ""


def test_incident_response_playbook_and_simulation(client, db):
    """FEATURE 17 & 18: Verify 8-stage incident playbooks, zero-mutation simulation, and mitigation execution."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/control-center/incident-playbooks
    res_pb = client.get("/api/control-center/incident-playbooks")
    assert res_pb.status_code == 200
    playbooks = res_pb.json()
    assert len(playbooks) > 0
    pb = playbooks[0]
    assert pb["severity"] == "CRITICAL"
    assert len(pb["steps"]) == 8

    inc_id = pb["incident_id"]

    # 2. POST /api/control-center/simulate-mitigation
    sim_req = {
        "incident_id": inc_id,
        "current_gateway_share_pct": 70,
        "proposed_gateway_share_pct": 30,
        "target_gateway_share_pct": 70,
    }
    res_sim = client.post("/api/control-center/simulate-mitigation", json=sim_req)
    assert res_sim.status_code == 200
    sim_res = res_sim.json()
    assert sim_res["expected_success_rate_pct"] > sim_res["current_success_rate_pct"]
    assert float(sim_res["expected_protected_revenue_hourly"]) > 0
    assert sim_res["estimated_latency_delta_ms"] > 0

    # 3. POST /api/control-center/execute-mitigation
    exec_req = {
        "incident_id": inc_id,
        "target_gateway": "Gateway Beta (Adyen)",
        "proposed_share_pct": 70,
        "operator_notes": "Operator applied mitigation from Control Center",
    }
    res_exec = client.post("/api/control-center/execute-mitigation", json=exec_req)
    assert res_exec.status_code == 200
    assert res_exec.json()["audit_event_logged"] == "INCIDENT_MITIGATION_EXECUTED"

    # 4. Verify audit event
    audit = db.query(AuditLog).filter(AuditLog.result == "INCIDENT_MITIGATION_EXECUTED").first()
    assert audit is not None


def test_revenue_protection_score_and_prediction_accuracy(client, db):
    """FEATURE 19 & 20: Verify 0-100 Executive Protection Score and Prediction Quality metrics."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/decision-intelligence/protection-score
    res_score = client.get("/api/decision-intelligence/protection-score")
    assert res_score.status_code == 200
    score_data = res_score.json()
    assert score_data["overall_score"] >= 80
    assert score_data["pillars"]["recovery"] >= 90
    assert score_data["pillars"]["policy_compliance"] == 100
    assert score_data["grade"] in ["EXCELLENT", "HEALTHY"]

    # 2. GET /api/decision-intelligence/accuracy-metrics
    res_acc = client.get("/api/decision-intelligence/accuracy-metrics")
    assert res_acc.status_code == 200
    acc_data = res_acc.json()
    assert acc_data["precision_pct"] >= 90.0
    assert acc_data["recall_pct"] >= 85.0
    assert acc_data["false_positive_rate_pct"] <= 10.0
    assert "Simulation" in acc_data["evaluation_label"]


def test_decision_explainability_and_decision_replay(client, db):
    """FEATURE 21 & 22: Verify factor weights, decision version, and 5-pillar forensic case replay."""
    client.post("/api/simulation/seed", json={"reset": True})

    # Find a sample risk
    risk = db.query(RevenueRisk).first()
    assert risk is not None

    # 1. GET /api/decision-intelligence/explainability/{risk_id}
    res_exp = client.get(f"/api/decision-intelligence/explainability/{risk.id}")
    assert res_exp.status_code == 200
    exp_data = res_exp.json()
    assert exp_data["failure_probability_pct"] > 0
    assert exp_data["confidence_pct"] > 0
    assert len(exp_data["top_factors"]) >= 3
    assert exp_data["decision_version"] == "v3.2.0-deterministic"

    # 2. GET /api/decision-intelligence/replay-cases
    res_cases = client.get("/api/decision-intelligence/replay-cases")
    assert res_cases.status_code == 200
    cases = res_cases.json()
    assert len(cases) > 0

    # 3. GET /api/decision-intelligence/replay/{risk_id}
    res_replay = client.get(f"/api/decision-intelligence/replay/{risk.id}")
    assert res_replay.status_code == 200
    rep_data = res_replay.json()
    assert "what_recoverai_knew" in rep_data
    assert "what_it_predicted" in rep_data
    assert "what_it_recommended" in rep_data
    assert "what_policy_decided" in rep_data
    assert "what_happened" in rep_data
    assert len(rep_data["timeline_events"]) == 6


def test_counterfactual_analysis_and_executive_money_story(client, db):
    """FEATURE 23 & 24: Verify Counterfactual calculations and Executive Money Story."""
    client.post("/api/simulation/seed", json={"reset": True})

    risk = db.query(RevenueRisk).first()
    assert risk is not None

    # 1. GET /api/executive-intelligence/counterfactual/{risk_id}
    res_count = client.get(f"/api/executive-intelligence/counterfactual/{risk.id}")
    assert res_count.status_code == 200
    c_data = res_count.json()
    assert float(c_data["without_recoverai_expected_loss"]) > 0
    assert float(c_data["with_recoverai_recovered"]) > 0
    assert float(c_data["strategy_recovery_difference"]) > 0
    assert "simulation" in c_data["counterfactual_disclaimer"].lower()

    # 2. GET /api/executive-intelligence/money-story
    res_story = client.get("/api/executive-intelligence/money-story")
    assert res_story.status_code == 200
    story_data = res_story.json()
    assert float(story_data["revenue_at_risk"]) > 0
    assert float(story_data["protected_before_failure"]) > 0
    assert float(story_data["recovered_so_far"]) > 0
    assert float(story_data["remaining_opportunity"]) > 0
    assert len(story_data["top_failure_causes"]) == 3
    assert story_data["primary_recommended_action"] != ""


def test_proactive_recommendations_feed_and_merchant_action_plans(client, db):
    """FEATURE 25, 26, 27: Verify Recommendations feed, Merchant Health score, and Action Plan."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/executive-intelligence/recommendations
    res_recs = client.get("/api/executive-intelligence/recommendations")
    assert res_recs.status_code == 200
    recs_data = res_recs.json()
    assert recs_data["total_recommendations"] >= 4
    assert recs_data["high_priority_count"] >= 1
    assert float(recs_data["estimated_total_addressable_revenue"]) > 0

    # 2. GET /api/executive-intelligence/merchants/health
    res_merch = client.get("/api/executive-intelligence/merchants/health")
    assert res_merch.status_code == 200
    merchants = res_merch.json()
    assert len(merchants) > 0
    m1 = merchants[0]
    assert m1["overall_health_score"] >= 80
    assert m1["pillars"]["payment_health"] >= 90

    m_id = m1["merchant_id"]

    # 3. GET /api/executive-intelligence/merchants/{id}/action-plan
    res_plan = client.get(f"/api/executive-intelligence/merchants/{m_id}/action-plan")
    assert res_plan.status_code == 200
    plan_data = res_plan.json()
    assert len(plan_data["top_3_opportunities"]) == 3
    assert float(plan_data["top_3_opportunities"][0]["potential_monthly_revenue"]) > 0
    assert len(plan_data["top_3_failure_causes"]) == 3
    assert len(plan_data["recommended_interventions"]) == 3


def test_monthly_report_and_recovery_leaderboards(client, db):
    """FEATURE 28 & 29: Verify Monthly Recovery Report, CSV payload, and 5-dimension leaderboards."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/governance-system/monthly-report
    res_rep = client.get("/api/governance-system/monthly-report")
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert float(rep_data["revenue_at_risk"]) > 0
    assert float(rep_data["recovered"]) > 0
    assert float(rep_data["prevented"]) > 0
    assert rep_data["recovery_rate_pct"] > 50.0
    assert "RecoverAI Revenue Recovery Report" in rep_data["csv_data"]

    # 2. GET /api/governance-system/monthly-report/csv
    res_csv = client.get("/api/governance-system/monthly-report/csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Revenue At Risk" in res_csv.text

    # 3. GET /api/governance-system/leaderboards
    res_lb = client.get("/api/governance-system/leaderboards?period=30d")
    assert res_lb.status_code == 200
    lb_data = res_lb.json()
    assert len(lb_data["top_strategies"]) >= 3
    assert len(lb_data["top_gateways"]) >= 3
    assert len(lb_data["top_customer_segments"]) >= 3
    assert len(lb_data["top_merchants"]) >= 3


def test_system_health_versioning_and_chaos_simulation(client, db):
    """FEATURE 30, 31, 32, 33: Verify System Health, Versioning metadata, and Controlled Chaos Sim."""
    client.post("/api/simulation/seed", json={"reset": True})

    # 1. GET /api/governance-system/versions
    res_ver = client.get("/api/governance-system/versions")
    assert res_ver.status_code == 200
    ver_data = res_ver.json()
    assert ver_data["recovery_intelligence_version"] == "v3.2.0"
    assert ver_data["policy_version"] == "v2.1.0"
    assert len(ver_data["active_audit_event_types"]) == 16

    # 2. GET /api/governance-system/health
    res_health = client.get("/api/governance-system/health")
    assert res_health.status_code == 200
    h_data = res_health.json()
    assert h_data["overall_system_status"] == "OPERATIONAL"
    assert h_data["is_resilient"] is True
    assert len(h_data["components"]) == 7

    # 3. POST /api/governance-system/simulate-chaos (OpenAI Failure)
    res_chaos = client.post(
        "/api/governance-system/simulate-chaos",
        json={"scenario": "OPENAI_FAILURE"},
    )
    assert res_chaos.status_code == 200
    c_data = res_chaos.json()
    assert c_data["fallback_activated"] is True
    assert "NORMAL_OPERATION" in c_data["recovery_workflow_status"]


def test_ai_vs_rules_transparency_and_policy_override_demo(client):
    """FEATURE 34 & 35: Verify 'AI Cannot Override Policy' live demo with ₹2,50,000 threshold."""
    # Scenario: AI recommends retry_payment on ₹2,50,000 transaction (> $1,000 threshold)
    payload = {
        "transaction_amount": 250000.00,
        "ai_proposed_action": "retry_payment",
        "ai_confidence_pct": 84,
        "customer_opted_out": False,
        "prior_attempts": 0,
    }
    res = client.post("/api/governance-system/ai-vs-rules-demo", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["policy_verdict"] == "BLOCK"
    assert data["final_decision"] == "ESCALATE_TO_HUMAN"
    assert "exceeds high-value threshold" in data["policy_violation_reason"].lower()
    assert "proves ai cannot override" in data["responsible_ai_summary"].lower()


def test_demo_lab_scenarios_and_reset(client, db):
    """FEATURE 36 & 37: Verify Demo Scenario Builder, 8 judge scenarios, and clean demo reset."""
    # 1. GET /api/demo-lab/scenarios
    res_sc = client.get("/api/demo-lab/scenarios")
    assert res_sc.status_code == 200
    scenarios = res_sc.json()
    assert len(scenarios) == 8
    sc_ids = [s["id"] for s in scenarios]
    assert "high_value_failure" in sc_ids
    assert "gateway_degradation" in sc_ids
    assert "openai_outage" in sc_ids

    # 2. GET /api/demo-lab/guided-scenes
    res_scenes = client.get("/api/demo-lab/guided-scenes")
    assert res_scenes.status_code == 200
    scenes = res_scenes.json()
    assert len(scenes) == 9
    assert scenes[0]["scene_number"] == 1
    assert "SHOW THE MONEY" in scenes[0]["title"]

    # 3. POST /api/demo-lab/run-scenario (High-value failure)
    res_run1 = client.post("/api/demo-lab/run-scenario", json={"scenario_id": "high_value_failure"})
    assert res_run1.status_code == 200
    r1 = res_run1.json()
    assert r1["final_status"] == "ESCALATED_TO_HUMAN"
    assert "PolicyEngine Rule 2" in r1["step_3_policy_gate"]
    assert "RecoverAI doesn't ask AI" in r1["differentiator_slogan"]

    # 4. POST /api/demo-lab/run-scenario (Gateway degradation)
    res_run2 = client.post("/api/demo-lab/run-scenario", json={"scenario_id": "gateway_degradation"})
    assert res_run2.status_code == 200
    r2 = res_run2.json()
    assert r2["final_status"] == "INCIDENT_MITIGATED"

    # 5. POST /api/demo-lab/reset
    res_reset = client.post("/api/demo-lab/reset")
    assert res_reset.status_code == 200
    reset_data = res_reset.json()
    assert reset_data["success"] is True
    assert reset_data["restored_customers"] > 0
    assert reset_data["restored_risks"] > 0






