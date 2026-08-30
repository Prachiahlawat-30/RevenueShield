"""Prevention Decision Engine comparing Do Nothing vs Reactive Recovery vs Proactive Intervention."""

import uuid
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.tier3_schemas import (
    PreventionOptionA,
    PreventionOptionB,
    PreventionOptionC,
    PreventionDecisionResult,
    PredictiveRiskItem,
)
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine


class PreventionDecisionEngine:
    """Evaluates 3-way economic trade-offs between Do Nothing, Reactive Recovery, and Proactive Intervention."""

    REACTIVE_RECOVERY_RATE = Decimal("0.65")        # ~65% empirical reactive recovery
    REACTIVE_INTERVENTION_COST = Decimal("12.00")   # Retries + dunning fees
    PROACTIVE_PREVENTION_EFFICIENCY = Decimal("0.85") # ~85% pre-emptive prevention
    PROACTIVE_INTERVENTION_COST = Decimal("4.00")    # Proactive check / pre-dunning email

    @classmethod
    def evaluate_account(
        cls,
        risk_item: PredictiveRiskItem,
    ) -> PreventionDecisionResult:
        """Perform 3-way economic decision analysis for a single pre-failure account."""
        amt = risk_item.upcoming_amount
        prob = Decimal(str(risk_item.probability_of_failure))

        predicted_exposure = (amt * prob).quantize(Decimal("0.01"))

        # 1. OPTION A: Do Nothing
        loss_a = predicted_exposure
        net_a = (-loss_a).quantize(Decimal("0.01"))
        opt_a = PreventionOptionA(
            expected_loss=loss_a,
            intervention_cost=Decimal("0.00"),
            net_financial_outcome=net_a,
            customer_churn_risk="High (Decline leads to service interruption)",
        )

        # 2. OPTION B: Recover After Failure (Reactive)
        recovered_b = (predicted_exposure * cls.REACTIVE_RECOVERY_RATE).quantize(Decimal("0.01"))
        cost_b = cls.REACTIVE_INTERVENTION_COST
        net_b = (recovered_b - cost_b).quantize(Decimal("0.01"))
        opt_b = PreventionOptionB(
            expected_recovered=recovered_b,
            intervention_cost=cost_b,
            net_financial_yield=net_b,
            expected_recovery_rate_pct=float(cls.REACTIVE_RECOVERY_RATE * 100),
            customer_churn_risk="Medium (Customer experiences failure notification)",
        )

        # 3. OPTION C: Proactive Intervention (Preventive)
        prevented_c = (predicted_exposure * cls.PROACTIVE_PREVENTION_EFFICIENCY).quantize(Decimal("0.01"))
        cost_c = cls.PROACTIVE_INTERVENTION_COST
        net_c = (prevented_c - cost_c).quantize(Decimal("0.01"))
        opt_c = PreventionOptionC(
            recommended_action=risk_item.recommended_proactive_action,
            expected_prevented_loss=prevented_c,
            intervention_cost=cost_c,
            net_financial_yield=net_c,
            expected_prevention_efficiency_pct=float(cls.PROACTIVE_PREVENTION_EFFICIENCY * 100),
            customer_churn_risk="Low (Seamless renewal, no customer friction)",
        )

        # 4. Compare Net Outcomes & Determine Best Option
        if net_c >= net_b and net_c > Decimal("0.00"):
            best_opt = "PROACTIVE_INTERVENTION"
            best_label = "Option C: Proactive Intervention"
            net_advantage = (net_c - max(net_b, Decimal("0.00"))).quantize(Decimal("0.01"))
            rationale = (
                f"Preventing the failure is expected to yield ${net_c} vs ${net_b} in reactive recovery "
                f"(+${net_advantage} net advantage) while eliminating customer churn friction."
            )
        elif net_b > Decimal("0.00"):
            best_opt = "RECOVER_AFTER_FAILURE"
            best_label = "Option B: Recover After Failure"
            net_advantage = (net_b - max(net_c, Decimal("0.00"))).quantize(Decimal("0.01"))
            rationale = "Low exposure makes automated reactive recovery more cost-effective than proactive intervention."
        else:
            best_opt = "DO_NOTHING"
            best_label = "Option A: Do Nothing"
            net_advantage = Decimal("0.00")
            rationale = "Intervention costs exceed expected recoverable value."

        return PreventionDecisionResult(
            customer_id=risk_item.customer_id,
            customer_name=risk_item.customer_name,
            customer_email=risk_item.customer_email,
            merchant_name=risk_item.merchant_name,
            upcoming_amount=amt,
            probability_of_failure=risk_item.probability_of_failure,
            predicted_exposure=predicted_exposure,
            risk_horizon=risk_item.risk_horizon,
            option_a=opt_a,
            option_b=opt_b,
            option_c=opt_c,
            best_option=best_opt,
            best_option_label=best_label,
            net_value_advantage=net_advantage,
            economic_rationale=rationale,
        )

    @classmethod
    def evaluate_all(cls, db: Session) -> List[PreventionDecisionResult]:
        """Compute 3-way prevention decisions across all pre-failure accounts."""
        summary = PredictiveRevenueRiskEngine.get_summary(db)
        results: List[PreventionDecisionResult] = []

        for item in summary.predictive_accounts:
            results.append(cls.evaluate_account(item))

        # Sort by predicted exposure descending
        results.sort(key=lambda x: x.predicted_exposure, reverse=True)
        return results
