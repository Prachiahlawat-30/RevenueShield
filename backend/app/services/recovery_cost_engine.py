"""RecoveryCostEngine for unit cost tracking, net recovery calculation, and margin-aware guardrails."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional
from app.core.config import settings
from app.schemas.enums import RecoveryAction
from app.schemas.tier3_schemas import (
    InterventionCostBreakdown,
    InterventionCostConfigResponse,
)


class RecoveryCostEngine:
    """Calculates unit intervention costs, expected net financial recoveries, and margin viability constraints."""

    # Baseline configurable intervention costs
    DEFAULT_COSTS = {
        RecoveryAction.RETRY_PAYMENT: settings.RETRY_PAYMENT_COST,              # $2.00
        RecoveryAction.SEND_PAYMENT_REMINDER: settings.PAYMENT_REMINDER_COST,    # $1.00
        RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: settings.METHOD_UPDATE_COST, # $3.00
        RecoveryAction.ESCALATE_TO_HUMAN: settings.HUMAN_ESCALATION_COST,      # $25.00
        RecoveryAction.STOP: Decimal("0.00"),
    }

    MINIMUM_EXPECTED_NET_RECOVERY = Decimal("0.00")

    @classmethod
    def get_intervention_cost(cls, action: RecoveryAction) -> Decimal:
        """Return configured marginal cost for executing an intervention action."""
        return cls.DEFAULT_COSTS.get(action, Decimal("0.00"))

    @classmethod
    def evaluate_cost_breakdown(
        cls,
        action: RecoveryAction,
        amount_at_risk: Decimal,
        recovery_probability: float,
        action_label: str = "",
    ) -> InterventionCostBreakdown:
        """Evaluate the margin viability and net financial yield for a proposed candidate action."""
        cost = cls.get_intervention_cost(action)
        prob = Decimal(str(recovery_probability))

        gross_recovery = (amount_at_risk * prob).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        net_recovery = (gross_recovery - cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        roi_mult = float(gross_recovery / cost) if cost > Decimal("0.00") else 99.0

        is_viable = net_recovery >= cls.MINIMUM_EXPECTED_NET_RECOVERY

        if is_viable:
            status = "ECONOMICALLY_VIABLE"
            rationale = (
                f"Action '{action.value}' is economically viable with expected gross recovery of ${gross_recovery} "
                f"against ${cost} intervention cost (expected net yield: +${net_recovery})."
            )
        else:
            status = "MARGIN_NEGATIVE_REJECTED"
            if action == RecoveryAction.ESCALATE_TO_HUMAN:
                rationale = (
                    f"Human intervention is not economically justified because intervention cost (${cost}) "
                    f"exceeds expected gross recovery (${gross_recovery}) by ${abs(net_recovery)}."
                )
            else:
                rationale = (
                    f"Action '{action.value}' rejected under margin guard: expected net recovery (${net_recovery}) "
                    f"falls below minimum threshold (${cls.MINIMUM_EXPECTED_NET_RECOVERY})."
                )

        return InterventionCostBreakdown(
            action=action.value,
            action_label=action_label or action.value,
            intervention_cost=cost,
            expected_gross_recovery=gross_recovery,
            expected_net_recovery=net_recovery,
            roi_multiple=round(roi_mult, 2),
            is_margin_viable=is_viable,
            viability_status=status,
            rationale=rationale,
        )

    @classmethod
    def get_config(cls) -> InterventionCostConfigResponse:
        """Return the current active unit costs and margin constraints."""
        return InterventionCostConfigResponse(
            retry_payment_cost=cls.get_intervention_cost(RecoveryAction.RETRY_PAYMENT),
            send_payment_reminder_cost=cls.get_intervention_cost(RecoveryAction.SEND_PAYMENT_REMINDER),
            request_payment_method_update_cost=cls.get_intervention_cost(RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE),
            escalate_to_human_cost=cls.get_intervention_cost(RecoveryAction.ESCALATE_TO_HUMAN),
            minimum_expected_net_recovery=cls.MINIMUM_EXPECTED_NET_RECOVERY,
        )
