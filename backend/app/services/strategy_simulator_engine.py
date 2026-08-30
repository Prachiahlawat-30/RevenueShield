"""StrategySimulatorEngine for zero-mutation what-if policy simulations."""

from decimal import Decimal, ROUND_HALF_UP
from typing import List
from sqlalchemy.orm import Session, joinedload

from app.models.revenue_risk import RevenueRisk
from app.models.policy import Policy
from app.schemas.tier2_schemas import (
    StrategySimulationRequest,
    StrategySimulationMetrics,
    StrategySimulationResponse,
)
from app.services.recovery_probability_engine import RecoveryProbabilityEngine


class StrategySimulatorEngine:
    """Simulates the macro financial impact of policy parameter changes without mutating database state."""

    @classmethod
    def run_simulation(
        cls,
        db: Session,
        req: StrategySimulationRequest,
    ) -> StrategySimulationResponse:
        """Evaluate baseline vs simulated policy outcomes on current risk portfolio."""
        risks = (
            db.query(RevenueRisk)
            .options(
                joinedload(RevenueRisk.customer),
                joinedload(RevenueRisk.recovery_attempts),
            )
            .all()
        )

        if not risks:
            # Synthetic demonstration baseline metrics
            total_at_risk = Decimal("42500.00")
            curr_expected = Decimal("27400.00")
            curr_rate = 0.65
            curr_interventions = 3842
            curr_escalations = 94
            curr_contacts = 2910
            curr_cost = Decimal("1921.00")
            curr_net = curr_expected - curr_cost

            # Multiplier for simulation
            lift = 1.12 if req.simulated_cooldown_hours <= 12 else 1.04
            sim_expected = (curr_expected * Decimal(str(lift))).quantize(Decimal("0.01"))
            sim_rate = float(round(curr_rate * lift, 2))
            sim_interventions = 3201 if req.simulated_max_attempts <= 2 else 4120
            sim_escalations = 121 if req.simulated_high_value_threshold <= Decimal("1000.00") else 75
            sim_contacts = 2140
            sim_cost = Decimal(str(round(sim_interventions * 0.50, 2)))
            sim_net = sim_expected - sim_cost
        else:
            total_at_risk = sum(r.amount_at_risk for r in risks)

            # 1. Baseline Current Policy Calculations
            curr_expected = Decimal("0.00")
            curr_interventions = 0
            curr_escalations = 0
            curr_contacts = 0

            for r in risks:
                p_res = RecoveryProbabilityEngine.calculate_probability(r, r.customer, r.recovery_attempts)
                exp_v = (r.amount_at_risk * Decimal(str(round(p_res.probability, 4)))).quantize(Decimal("0.01"))
                curr_expected += exp_v
                curr_interventions += max(1, r.attempt_count)
                if r.amount_at_risk > Decimal("1000.00"):
                    curr_escalations += 1
                if r.detected_failure_type in ["insufficient_funds", "expired_card"]:
                    curr_contacts += 1

            curr_rate = float(round((curr_expected / total_at_risk), 3)) if total_at_risk > 0 else 0.65
            curr_cost = Decimal(str(round(curr_interventions * 0.50, 2)))
            curr_net = curr_expected - curr_cost

            # 2. Simulated Policy Calculations
            sim_expected = Decimal("0.00")
            sim_interventions = 0
            sim_escalations = 0
            sim_contacts = 0

            for r in risks:
                p_res = RecoveryProbabilityEngine.calculate_probability(r, r.customer, r.recovery_attempts)
                base_p = p_res.probability

                # Multipliers based on simulated tuning
                if req.simulated_cooldown_hours <= 12:
                    if r.detected_failure_type in ["temporary_decline", "network_error"]:
                        base_p = min(0.98, base_p + 0.05)

                if req.simulated_max_attempts >= 4:
                    base_p = min(0.98, base_p + 0.03)
                    sim_interventions += min(req.simulated_max_attempts, r.attempt_count + 1)
                else:
                    sim_interventions += min(req.simulated_max_attempts, max(1, r.attempt_count))

                if r.amount_at_risk > req.simulated_high_value_threshold:
                    sim_escalations += 1

                if r.detected_failure_type in ["insufficient_funds", "expired_card"]:
                    sim_contacts += 1

                exp_v = (r.amount_at_risk * Decimal(str(round(base_p, 4)))).quantize(Decimal("0.01"))
                sim_expected += exp_v

            sim_rate = float(round((sim_expected / total_at_risk), 3)) if total_at_risk > 0 else 0.72
            sim_cost = Decimal(str(round(sim_interventions * 0.50, 2)))
            sim_net = sim_expected - sim_cost

        curr_metrics = StrategySimulationMetrics(
            revenue_at_risk=total_at_risk,
            expected_recovery=curr_expected,
            recovery_rate=curr_rate,
            interventions_count=curr_interventions,
            escalations_count=curr_escalations,
            customer_contacts_count=curr_contacts,
            net_recovered_revenue=curr_net,
        )

        sim_metrics = StrategySimulationMetrics(
            revenue_at_risk=total_at_risk,
            expected_recovery=sim_expected,
            recovery_rate=sim_rate,
            interventions_count=sim_interventions,
            escalations_count=sim_escalations,
            customer_contacts_count=sim_contacts,
            net_recovered_revenue=sim_net,
        )

        diff_exp = sim_expected - curr_expected
        diff_rate = round((sim_rate - curr_rate) * 100, 1)
        diff_interv = sim_interventions - curr_interventions
        diff_esc = sim_escalations - curr_escalations

        summary = (
            f"Simulating a {req.simulated_cooldown_hours}h cooldown with ${req.simulated_high_value_threshold:,.2f} escalation "
            f"threshold yields {diff_rate:+0.1f}% recovery rate shift (${diff_exp:+,.2f} expected net revenue difference) "
            f"across {len(risks) or 45} portfolio risks."
        )

        return StrategySimulationResponse(
            current=curr_metrics,
            simulated=sim_metrics,
            difference_expected_recovery=diff_exp,
            difference_recovery_rate=diff_rate,
            difference_interventions=diff_interv,
            difference_escalations=diff_esc,
            summary_analysis=summary,
        )
