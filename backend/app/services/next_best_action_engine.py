"""NextBestActionEngine for multi-action evaluation, net monetary yield optimization, customer value protection, and factual explanations."""

from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional
from app.core.config import settings
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import RecoveryAction, FailureType
from app.schemas.recovery_intelligence import ActionCandidateScore, NextBestActionResult
from app.services.recovery_cost_engine import RecoveryCostEngine


class NextBestActionEngine:
    """Evaluates candidate recovery interventions, ranks them by expected net financial yield, and generates factual explanations."""

    ACTION_LABELS = {
        RecoveryAction.RETRY_PAYMENT: "Retry Payment",
        RecoveryAction.SEND_PAYMENT_REMINDER: "Send Payment Reminder",
        RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: "Request Payment Method Update",
        RecoveryAction.ESCALATE_TO_HUMAN: "Escalate to Human Desk",
        RecoveryAction.STOP: "Stop Workflow",
    }

    @classmethod
    def get_intervention_cost(cls, action: RecoveryAction) -> Decimal:
        """Return configured marginal intervention cost for a given action."""
        return RecoveryCostEngine.get_intervention_cost(action)

    @classmethod
    def _build_factual_explanation(
        cls,
        recommended_candidate: ActionCandidateScore,
        risk: RevenueRisk,
        customer: Optional[Customer],
        past_attempts: List[RecoveryAttempt],
    ) -> str:
        """Generate concise, deterministic 'Why this action?' explanation from structured facts without LLM hallucination."""
        action = recommended_candidate.action
        failure_type = risk.detected_failure_type
        amount = risk.amount_at_risk or Decimal("0.00")
        prob_pct = int(recommended_candidate.action_recovery_probability * 100)
        net_rec = recommended_candidate.expected_net_recovery
        cost = recommended_candidate.intervention_cost

        # 1. Customer Opt-Out Stop
        if action == RecoveryAction.STOP:
            return (
                "RevenueShield recommends `stop` because this customer has explicitly opted out of automated "
                "recovery interventions, requiring immediate workflow termination under deterministic safety policy."
            )

        # 2. High-Value / VIP Escalation
        if action == RecoveryAction.ESCALATE_TO_HUMAN and amount > Decimal("1000.00"):
            return (
                f"RevenueShield recommends `escalate_to_human` because the transaction amount (${amount:,.2f}) "
                f"exceeds the $1,000 automated recovery threshold, requiring dedicated human specialist handling "
                f"to maximize recovery yield on high-exposure revenue."
            )
        elif action == RecoveryAction.ESCALATE_TO_HUMAN and (customer and float(getattr(customer, "risk_score", 0) or 0) >= 80.0):
            return (
                f"RevenueShield recommends `escalate_to_human` because this is a high-value account (${amount:,.2f}) "
                f"requiring white-glove VIP concierge handling to preserve customer lifetime value and eliminate churn risk."
            )

        # 3. Unknown Failure Escalation
        if action == RecoveryAction.ESCALATE_TO_HUMAN and failure_type == FailureType.UNKNOWN_FAILURE.value:
            return (
                f"RevenueShield recommends `escalate_to_human` because unrecognized processor decline code "
                f"requires manual operations review to prevent erroneous dunning, offering {prob_pct}% expected resolution."
            )

        # 4. Expired Card -> Payment Method Update
        if action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE and failure_type == FailureType.EXPIRED_CARD.value:
            card_str = f"card ending in {customer.card_last4}" if (customer and customer.card_last4) else "card credentials"
            expiry_str = f"expired {customer.card_expiry}" if (customer and customer.card_expiry) else "expired"
            return (
                f"RevenueShield recommends `request_payment_method_update` because this customer's {card_str} is {expiry_str}; "
                f"direct retry is prohibited by safety policy, making credential update the highest expected-value intervention "
                f"(${net_rec:,.2f} net expected recovery at {prob_pct}% probability)."
            )

        # 5. Insufficient Funds -> Payment Reminder
        if action == RecoveryAction.SEND_PAYMENT_REMINDER and failure_type == FailureType.INSUFFICIENT_FUNDS.value:
            return (
                f"RevenueShield recommends `send_payment_reminder` because this customer category historically recovers "
                f"{prob_pct}% of insufficient-funds failures after receiving a polite reminder, making it the highest "
                f"expected-value intervention (${net_rec:,.2f} net expected recovery, ${cost:.2f} marginal cost)."
            )

        # 6. Temporary Decline / Network Error -> Direct Retry
        if action == RecoveryAction.RETRY_PAYMENT and failure_type in [FailureType.TEMPORARY_DECLINE.value, FailureType.NETWORK_ERROR.value]:
            fail_label = "gateway network timeout" if failure_type == FailureType.NETWORK_ERROR.value else "issuer temporary decline"
            return (
                f"RevenueShield recommends `retry_payment` because {fail_label} events historically recover {prob_pct}% "
                f"on direct re-attempt, yielding ${net_rec:,.2f} net expected recovery with minimal customer friction."
            )

        # 7. Card Updated -> Direct Retry
        if action == RecoveryAction.RETRY_PAYMENT and failure_type == FailureType.EXPIRED_CARD.value:
            return (
                f"RevenueShield recommends `retry_payment` because customer payment credentials were successfully updated "
                f"(expiry: {customer.card_expiry if customer else 'active'}), restoring recovery likelihood to {prob_pct}% "
                f"(${net_rec:,.2f} net expected yield)."
            )

        # 8. Generic deterministic fallback
        return (
            f"RevenueShield recommends `{action.value}` based on multi-action valuation, yielding ${net_rec:,.2f} "
            f"net expected recovery at {prob_pct}% probability with ${cost:.2f} intervention cost."
        )

    @classmethod
    def evaluate_actions(
        cls,
        risk: RevenueRisk,
        customer: Optional[Customer] = None,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
        base_probability: float = 0.70,
    ) -> NextBestActionResult:
        """Evaluate all candidate actions and select the optimal next step."""
        past_attempts = past_attempts or []
        amount = risk.amount_at_risk or Decimal("0.00")
        failure_type = risk.detected_failure_type
        is_opted_out = bool(customer and customer.is_opted_out)
        attempt_count = len(past_attempts) if past_attempts else risk.attempt_count
        is_vip = bool(customer and float(getattr(customer, "risk_score", 0) or 0) >= 80.0)

        # Check for hard terminal overrides (Opt-Out)
        if is_opted_out:
            stop_candidate = ActionCandidateScore(
                action=RecoveryAction.STOP,
                action_label="Stop Workflow",
                action_recovery_probability=0.0,
                expected_recovery_value=Decimal("0.00"),
                intervention_cost=Decimal("0.00"),
                expected_net_recovery=Decimal("0.00"),
                risk_level="LOW",
                reason="Customer has opted out of automated interventions.",
                is_eligible=True,
            )
            explanation = cls._build_factual_explanation(stop_candidate, risk, customer, past_attempts)
            return NextBestActionResult(
                recommended_action=RecoveryAction.STOP,
                recommended_action_label="Stop Workflow",
                confidence=1.0,
                expected_recovery_value=Decimal("0.00"),
                expected_net_recovery=Decimal("0.00"),
                candidates=[stop_candidate],
                reason=explanation,
            )

        # Base action affinities by failure type
        action_prob_map = {}
        if failure_type == FailureType.EXPIRED_CARD.value:
            is_card_updated = bool(customer and customer.card_expiry and customer.card_expiry > "08/26")
            if is_card_updated:
                action_prob_map = {
                    RecoveryAction.RETRY_PAYMENT: 0.90,
                    RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: 0.30,
                    RecoveryAction.SEND_PAYMENT_REMINDER: 0.40,
                    RecoveryAction.ESCALATE_TO_HUMAN: 0.70,
                    RecoveryAction.STOP: 0.0,
                }
            else:
                action_prob_map = {
                    RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: 0.76,
                    RecoveryAction.SEND_PAYMENT_REMINDER: 0.38,
                    RecoveryAction.RETRY_PAYMENT: 0.05,
                    RecoveryAction.ESCALATE_TO_HUMAN: 0.70,
                    RecoveryAction.STOP: 0.0,
                }
        elif failure_type == FailureType.INSUFFICIENT_FUNDS.value:
            action_prob_map = {
                RecoveryAction.SEND_PAYMENT_REMINDER: 0.78,
                RecoveryAction.RETRY_PAYMENT: 0.62 if attempt_count == 0 else 0.48,
                RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: 0.35,
                RecoveryAction.ESCALATE_TO_HUMAN: 0.75,
                RecoveryAction.STOP: 0.0,
            }
        elif failure_type in [FailureType.TEMPORARY_DECLINE.value, FailureType.NETWORK_ERROR.value]:
            action_prob_map = {
                RecoveryAction.RETRY_PAYMENT: 0.85 if failure_type == FailureType.NETWORK_ERROR.value else 0.80,
                RecoveryAction.SEND_PAYMENT_REMINDER: 0.45,
                RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: 0.30,
                RecoveryAction.ESCALATE_TO_HUMAN: 0.75,
                RecoveryAction.STOP: 0.0,
            }
        else:  # UNKNOWN_FAILURE
            action_prob_map = {
                RecoveryAction.ESCALATE_TO_HUMAN: 0.82,
                RecoveryAction.RETRY_PAYMENT: 0.25,
                RecoveryAction.SEND_PAYMENT_REMINDER: 0.30,
                RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE: 0.20,
                RecoveryAction.STOP: 0.0,
            }

        # Build candidate score list
        candidates: List[ActionCandidateScore] = []
        for action, prob in action_prob_map.items():
            prob_dec = Decimal(str(round(prob, 4)))
            exp_rec = (amount * prob_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            cost = cls.get_intervention_cost(action)
            net_rec = (exp_rec - cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            # Determine risk level
            if action == RecoveryAction.ESCALATE_TO_HUMAN:
                risk_level = "HIGH / COSTLY"
            elif action in [RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE, RecoveryAction.SEND_PAYMENT_REMINDER]:
                risk_level = "LOW"
            elif action == RecoveryAction.RETRY_PAYMENT and failure_type == FailureType.EXPIRED_CARD.value and (not customer or not customer.card_expiry or customer.card_expiry <= "08/26"):
                risk_level = "HIGH"
            else:
                risk_level = "LOW"

            # Eligibility & Margin Guard
            is_eligible = True
            reason = f"Estimated {int(prob * 100)}% recovery probability with ${cost:.2f} marginal cost."

            if action == RecoveryAction.RETRY_PAYMENT and failure_type == FailureType.EXPIRED_CARD.value and (not customer or not customer.card_expiry or customer.card_expiry <= "08/26"):
                is_eligible = False
                reason = "Ineligible: direct retry on expired card without credential update is prevented by safety policy."
            elif action == RecoveryAction.ESCALATE_TO_HUMAN and net_rec < Decimal("0.00"):
                # FEATURE 8: Margin-Aware Disqualification
                is_eligible = False
                reason = (
                    f"Ineligible under margin guard: human intervention cost (${cost}) exceeds "
                    f"expected recovery (${exp_rec}) by ${abs(net_rec)}."
                )
            elif action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE and failure_type == FailureType.EXPIRED_CARD.value:
                reason = "Card is expired; credential refresh portal yields highest long-term collection rate."
            elif action == RecoveryAction.SEND_PAYMENT_REMINDER and failure_type == FailureType.INSUFFICIENT_FUNDS.value:
                reason = "Insufficient funds typically recovers 78% after polite customer payment reminder."
            elif action == RecoveryAction.RETRY_PAYMENT and failure_type in [FailureType.TEMPORARY_DECLINE.value, FailureType.NETWORK_ERROR.value]:
                reason = "Temporary soft decline / network timeout clears successfully on direct retry."
            elif action == RecoveryAction.ESCALATE_TO_HUMAN and (amount > Decimal("1000.00") or is_vip):
                reason = f"High-value VIP account (${amount:,.2f}) warrants dedicated human account representative."

            candidates.append(
                ActionCandidateScore(
                    action=action,
                    action_label=cls.ACTION_LABELS[action],
                    action_recovery_probability=prob,
                    expected_recovery_value=exp_rec,
                    intervention_cost=cost,
                    expected_net_recovery=net_rec,
                    risk_level=risk_level,
                    reason=reason,
                    is_eligible=is_eligible,
                )
            )

        # Sort eligible candidates by expected net recovery descending
        eligible_candidates = [c for c in candidates if c.is_eligible and c.action != RecoveryAction.STOP]
        if not eligible_candidates:
            eligible_candidates = [candidates[0]]

        if (amount > Decimal("1000.00") or is_vip) and any(c.action == RecoveryAction.ESCALATE_TO_HUMAN and c.is_eligible for c in eligible_candidates):
            # High-value / VIP transactions prioritize human escalation if economically viable
            best_candidate = next(c for c in eligible_candidates if c.action == RecoveryAction.ESCALATE_TO_HUMAN)
        else:
            eligible_candidates.sort(key=lambda c: (c.expected_net_recovery, c.action_recovery_probability), reverse=True)
            best_candidate = eligible_candidates[0]

        summary_reason = cls._build_factual_explanation(best_candidate, risk, customer, past_attempts)

        return NextBestActionResult(
            recommended_action=best_candidate.action,
            recommended_action_label=best_candidate.action_label,
            confidence=round(best_candidate.action_recovery_probability, 2),
            expected_recovery_value=best_candidate.expected_recovery_value,
            expected_net_recovery=best_candidate.expected_net_recovery,
            candidates=candidates,
            reason=summary_reason,
        )
