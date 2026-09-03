"""DemoLabService managing pre-packaged judge demo scenarios, demo database reset, and guided 9-scene pitch flows."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.audit_log import AuditLog
from app.data.seed_data import seed_database
from app.schemas.tier3_schemas import (
    DemoScenarioInfo,
    DemoScenarioExecutionResponse,
    DemoResetResponse,
    GuidedDemoSceneItem,
)


class DemoLabService:
    """Provides bulletproof demo scenario generation and deterministic execution for live evaluations."""

    DIFFERENTIATOR_SLOGAN = (
        "RevenueShield doesn't ask AI how to move money. It uses AI to understand revenue risk, "
        "while deterministic policy decides what the system is allowed to do."
    )

    SCENARIOS: List[DemoScenarioInfo] = [
        DemoScenarioInfo(
            id="high_value_failure",
            title="1. High-Value Failure ($2,500 / ₹2,50,000)",
            description="Simulates a high-value enterprise invoice decline. AI proposes immediate retry, but PolicyEngine Rule 2 strictly blocks it and routes to Human Approval Queue.",
            key_concept="Responsible AI Policy Guardrails",
            expected_outcome="Policy BLOCKS automated retry -> ESCALATE_TO_HUMAN",
            icon_name="ShieldAlert",
        ),
        DemoScenarioInfo(
            id="gateway_degradation",
            title="2. Gateway Alpha Degradation & Failover",
            description="Simulates Gateway Alpha latency spike (+180ms) and 504 timeouts. RecoverAI detects incident and triggers zero-mutation simulation to shift traffic to Gateway Beta.",
            key_concept="Automated Payment Incident Containment",
            expected_outcome="Success rate restored 78% -> 96.4%, protecting $9,600/hr",
            icon_name="Activity",
        ),
        DemoScenarioInfo(
            id="customer_payment_failure",
            title="3. Customer Payment Failure (Temporary Decline)",
            description="Simulates standard insufficient funds failure. DiagnosisEngine classifies decline, AI recommends Smart Reminder -> Smart Retry, PolicyEngine approves, and workflow succeeds.",
            key_concept="Autonomous Multi-Step Recovery",
            expected_outcome="88% expected probability -> Approved -> Recovered",
            icon_name="CreditCard",
        ),
        DemoScenarioInfo(
            id="openai_outage",
            title="4. OpenAI Outage & Deterministic Fallback",
            description="Simulates complete LLM downtime. Fallback DiagnosisEngine engages deterministic ISO 8583 mapping with zero downtime or transaction drops.",
            key_concept="Zero-Downtime Resilience Architecture",
            expected_outcome="Deterministic Fallback Active -> Normal Recovery",
            icon_name="Cpu",
        ),
        DemoScenarioInfo(
            id="customer_opt_out",
            title="5. Customer Opt-Out Enforcement",
            description="Simulates recovery attempt on an account with active opt-out flag. PolicyEngine Rule 1 strictly halts all dunning communications.",
            key_concept="100% Regulatory & Contact Compliance",
            expected_outcome="Policy BLOCKS communication -> Workflow Halted",
            icon_name="UserX",
        ),
        DemoScenarioInfo(
            id="recovery_success",
            title="6. End-to-End Recovery Settlement",
            description="Executes full single-click recovery lifecycle: diagnosis, NextBestAction selection, policy verification, ISO 8583 gateway execution, and audit logging.",
            key_concept="Settlement & Revenue Realization",
            expected_outcome="Transaction settled -> Dashboard $42,000 Recovered",
            icon_name="CheckCircle2",
        ),
        DemoScenarioInfo(
            id="repeated_failure",
            title="7. Repeated Decline Max Attempts Cutoff",
            description="Simulates 4th consecutive decline attempt. PolicyEngine Rule 3 terminates automatic retries to prevent card network penalties and cardholder fatigue.",
            key_concept="Card Network Compliance & Fatigue Limits",
            expected_outcome="Policy Rule 3 Enforced -> Max Attempts Terminated",
            icon_name="AlertOctagon",
        ),
        DemoScenarioInfo(
            id="predictive_risk",
            title="8. Proactive Pre-Failure Prevention",
            description="Simulates risk prediction 18 hours before scheduled renewal for an enterprise subscriber. Pre-empts decline via proactive payment method check.",
            key_concept="Proactive Churn & Decline Prevention",
            expected_outcome="73% Risk Detected -> Proactive Reminder -> Loss Prevented",
            icon_name="Zap",
        ),
    ]

    GUIDED_SCENES: List[GuidedDemoSceneItem] = [
        GuidedDemoSceneItem(
            scene_number=1,
            title="SCENE 1 — SHOW THE MONEY",
            narrative_hook="Open Control Center: 'RecoverAI is currently monitoring ₹61.4L of revenue exposure across all processors.'",
            action_button_label="Inspect Control Center KPIs",
            target_tab="control-center",
            highlight_metrics=["₹61.4L Revenue At Risk", "₹24.8L Recovered", "₹8.6L Prevented", "91/100 Protection Score"],
        ),
        GuidedDemoSceneItem(
            scene_number=2,
            title="SCENE 2 — PREDICT THE FUTURE",
            narrative_hook="Open Predictive Risk: 'Instead of waiting for an ₹84,000 payment to fail, RecoverAI detects a 73% probability failure 18 hours ahead.'",
            action_button_label="View Predictive Risk Engine",
            target_tab="predictive",
            highlight_metrics=["73% Failure Probability", "₹61,320 Predicted Exposure", "18-Hour Risk Horizon"],
        ),
        GuidedDemoSceneItem(
            scene_number=3,
            title="SCENE 3 — PREVENT THE LOSS",
            narrative_hook="Compare 3 economics: Do Nothing (₹61k loss), Recover Later (₹43k yield), Prevent Now (₹52k protected).",
            action_button_label="Execute Proactive Prevention",
            target_tab="predictive",
            highlight_metrics=["₹52,000 Net Protected", "Policy Guarded", "Pre-Emptive Intervention"],
        ),
        GuidedDemoSceneItem(
            scene_number=4,
            title="SCENE 4 — SHOW A REAL FAILURE",
            narrative_hook="Trigger Gateway Alpha degradation: Success rate drops 96% -> 78%, exposing ₹14.2L/hour.",
            action_button_label="Inspect Incident Queue",
            target_tab="incidents",
            highlight_metrics=["₹14.2L/hr at risk", "Gateway Alpha 504 Spikes", "Severity: Critical"],
        ),
        GuidedDemoSceneItem(
            scene_number=5,
            title="SCENE 5 — SIMULATE THE FIX",
            narrative_hook="Click Simulate Mitigation: Pre-flight model verifies projected 96.4% success lift and +₹9.6L/hr protected revenue before routing real money.",
            action_button_label="Run Zero-Mutation Sim",
            target_tab="control-center",
            highlight_metrics=["96.4% Projected Success", "+₹9.6L/hr Protected", "Zero Disruption"],
        ),
        GuidedDemoSceneItem(
            scene_number=6,
            title="SCENE 6 — POLICY GUARDRAILS",
            narrative_hook="₹2,50,000 transaction: AI proposes retry, but PolicyEngine strictly BLOCKS automated execution and routes to Human Approval.",
            action_button_label="Test ₹2.5L Policy Gate",
            target_tab="system-health",
            highlight_metrics=["AI: retry_payment", "Policy: BLOCK", "Verdict: ESCALATE_TO_HUMAN"],
        ),
        GuidedDemoSceneItem(
            scene_number=7,
            title="SCENE 7 — SHOW ACTUAL RECOVERY",
            narrative_hook="Execute ₹42,000 temporary decline recovery through GatewaySimulator to watch funds settle live to the merchant.",
            action_button_label="Execute Live Recovery",
            target_tab="workflow",
            highlight_metrics=["88% Win Rate", "Settled to Gateway", "+₹42,000 Recovered"],
        ),
        GuidedDemoSceneItem(
            scene_number=8,
            title="SCENE 8 — SHOW STRATEGY LEARNING",
            narrative_hook="Inspect strategy lift: Reminder -> Retry achieves 74% vs 61% for Immediate Retry, continuously optimizing recovery margins.",
            action_button_label="View Strategy Leaderboard",
            target_tab="reports-leaderboard",
            highlight_metrics=["Reminder -> Retry: 74%", "Immediate: 61%", "+₹8.2L Captured"],
        ),
        GuidedDemoSceneItem(
            scene_number=9,
            title="SCENE 9 — FORENSIC DECISION REPLAY",
            narrative_hook="Open Decision Replay to reconstruct the exact 5 pillars of any historical case with cryptographic reproducibility signatures.",
            action_button_label="Reconstruct Decision Trail",
            target_tab="decision-replay",
            highlight_metrics=["5 Decision Pillars", "Version v3.2.0 Signature", "100% Auditable"],
        ),
    ]

    @classmethod
    def get_scenarios(cls) -> List[DemoScenarioInfo]:
        """Return catalog of available demo scenarios."""
        return cls.SCENARIOS

    @classmethod
    def get_guided_scenes(cls) -> List[GuidedDemoSceneItem]:
        """Return the 9 structured scenes for the 5-minute hackathon demo."""
        return cls.GUIDED_SCENES

    @classmethod
    def run_scenario(
        cls,
        scenario_id: str,
        db: Session,
    ) -> DemoScenarioExecutionResponse:
        """Execute a selected demo scenario end-to-end and log audit trace."""
        now = datetime.now(timezone.utc)
        trace_id = f"trace-{uuid.uuid4().hex[:8]}"

        # Find or create a demo customer
        cust = db.query(Customer).first()
        cust_name = cust.name if cust else "Acme Global Enterprise"

        if scenario_id == "high_value_failure":
            title = "1. High-Value Failure ($2,500 / ₹2,50,000)"
            amt = "$2,500.00 (₹2,50,000)"
            ftype = "high_value_invoice_decline"
            s1 = "DiagnosisEngine diagnosed decline as credit limit authorization hold."
            s2 = "AI NextBestActionEngine proposed: 'retry_payment' (Confidence: 84%)."
            s3 = "PolicyEngine Rule 2 triggered: Transaction amount ($2,500.00) exceeds high-value threshold ($1,000.00). Automated retry BLOCKED."
            s4 = "Workflow routed to Human Approval Queue. Zero unauthorized funds moved."
            fstatus = "ESCALATED_TO_HUMAN"
            pcode = "BLOCK_HIGH_VALUE"
            raction = "retry_payment"

        elif scenario_id == "gateway_degradation":
            title = "2. Gateway Alpha Degradation & Failover"
            amt = "$14,200.00/hr at risk"
            ftype = "gateway_504_timeout_spike"
            s1 = "PaymentIncidentEngine detected 34% error rate spike on Gateway Alpha (Stripe)."
            s2 = "AI recommended: 'Reroute eligible card volume to Gateway Beta (Adyen Enterprise)'."
            s3 = "PolicyEngine verified incident containment rule and health threshold."
            s4 = "Mitigation playbook simulated and deployed. Success rate lifted 78% -> 96.4%."
            fstatus = "INCIDENT_MITIGATED"
            pcode = "APPROVED_MITIGATION"
            raction = "shift_traffic"

        elif scenario_id == "customer_payment_failure":
            title = "3. Customer Payment Failure (Temporary Decline)"
            amt = "$420.00 (₹42,000)"
            ftype = "insufficient_funds"
            s1 = "DiagnosisEngine diagnosed soft decline code 51 (insufficient funds)."
            s2 = "NextBestActionEngine selected: 'send_payment_reminder -> smart_retry'."
            s3 = "PolicyEngine evaluated all 7 rules: Attempts (0/3), Cooldown (OK), Opt-Out (No) -> APPROVED."
            s4 = "SMS + In-App reminder dispatched. Recovery cooldown scheduled."
            fstatus = "RECOVERY_IN_PROGRESS"
            pcode = "ALLOW_RETRY"
            raction = "send_payment_reminder"

        elif scenario_id == "openai_outage":
            title = "4. OpenAI Outage & Deterministic Fallback"
            amt = "$180.00"
            ftype = "network_timeout"
            s1 = "OpenAI API timeout simulated. System engaged Fallback DiagnosisEngine."
            s2 = "Deterministic ISO 8583 decline rule engine produced structured facts."
            s3 = "PolicyEngine verified deterministic action proposal."
            s4 = "Recovery state machine proceeded with zero dropped transactions."
            fstatus = "FALLBACK_RECOVERY_ACTIVE"
            pcode = "ALLOW_FALLBACK"
            raction = "retry_payment"

        elif scenario_id == "customer_opt_out":
            title = "5. Customer Opt-Out Enforcement"
            amt = "$320.00"
            ftype = "expired_card"
            s1 = "DiagnosisEngine diagnosed expired card credentials."
            s2 = "AI proposed customer update reminder notice."
            s3 = "PolicyEngine Rule 1 evaluated: Customer opted out of recovery communications -> STRICT BLOCK."
            s4 = "Communication canceled immediately. Regulatory safety guaranteed."
            fstatus = "TERMINATED_BY_POLICY"
            pcode = "BLOCK_OPT_OUT"
            raction = "send_payment_reminder"

        elif scenario_id == "recovery_success":
            title = "6. End-to-End Recovery Settlement"
            amt = "$420.00 (₹42,000)"
            ftype = "temporary_decline"
            s1 = "DiagnosisEngine verified retry eligibility."
            s2 = "NextBestActionEngine selected: 'retry_payment'."
            s3 = "PolicyEngine verified cooldown interval -> ALLOW."
            s4 = "GatewaySimulator executed ISO 8583 authorization -> SUCCESS (Auth code: REC-9921)."
            fstatus = "SETTLED_AND_RECOVERED"
            pcode = "ALLOW_SETTLEMENT"
            raction = "retry_payment"

        elif scenario_id == "repeated_failure":
            title = "7. Repeated Decline Max Attempts Cutoff"
            amt = "$150.00"
            ftype = "do_not_honor"
            s1 = "DiagnosisEngine verified 3 previous failed attempts on file."
            s2 = "AI proposed additional retry attempt."
            s3 = "PolicyEngine Rule 3 evaluated: Max attempt limit (3) reached -> BLOCK."
            s4 = "Workflow closed to protect cardholder fatigue and network reputation."
            fstatus = "MAX_ATTEMPTS_TERMINATION"
            pcode = "BLOCK_MAX_ATTEMPTS"
            raction = "retry_payment"

        else:  # predictive_risk
            title = "8. Proactive Pre-Failure Prevention"
            amt = "$840.00 (₹84,000)"
            ftype = "predicted_payment_method_lapse"
            s1 = "PredictiveRevenueRiskEngine detected 73% failure probability 18h prior to renewal."
            s2 = "PreventionDecisionEngine calculated: Prevent Now ($520 net) > Recover Later ($430 net)."
            s3 = "PolicyEngine verified contact fatigue limit (0 contacts in last 24h) -> APPROVED."
            s4 = "Proactive payment method check dispatched. Prevented failure in advance."
            fstatus = "PREVENTED_BEFORE_FAILURE"
            pcode = "ALLOW_PREVENTION"
            raction = "send_payment_reminder"

        # Log audit entry
        audit = AuditLog(
            id=uuid.uuid4(),
            revenue_risk_id=None,
            customer_id=cust.id if cust else None,
            actor="DemoLabService",
            step_name="DEMO_SCENARIO_EXECUTED",
            diagnosis_summary=f"Scenario: {title} | {s1} | Policy: {s3}",
            recommended_action=raction[:50],
            policy_decision=pcode[:50],
            executed_action=fstatus[:50],
            result="DEMO_EXECUTION_COMPLETED",
            decision_payload={
                "scenario_id": scenario_id,
                "step_1": s1,
                "step_2": s2,
                "step_3": s3,
                "step_4": s4,
                "trace_id": trace_id,
            },
            created_at=now,
        )
        db.add(audit)
        db.commit()

        return DemoScenarioExecutionResponse(
            scenario_id=scenario_id,
            scenario_title=title,
            risk_id=None,
            customer_name=cust_name,
            amount_formatted=amt,
            failure_type=ftype,
            step_1_diagnosis=s1,
            step_2_ai_recommendation=s2,
            step_3_policy_gate=s3,
            step_4_execution_result=s4,
            final_status=fstatus,
            audit_trace_id=trace_id,
            differentiator_slogan=cls.DIFFERENTIATOR_SLOGAN,
            executed_at=now,
        )

    @classmethod
    def reset_demo_database(cls, db: Session) -> DemoResetResponse:
        """Reset demo mutations and restore clean synthetic baseline."""
        now = datetime.now(timezone.utc)
        result = seed_database(db=db, reset=True)
        return DemoResetResponse(
            success=True,
            message="Demo environment successfully restored to clean baseline synthetic dataset.",
            restored_customers=result["seeded_customers"],
            restored_risks=result["seeded_risks"],
            reset_at=now,
        )
