"""PolicyEngine for deterministic validation, safety bounds, and stopping rule enforcement."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.schemas.enums import RecoveryAction, StoppingReason
from app.schemas.policy import PolicyEvaluationResult


class PolicyEngine:
    """Deterministic guardian layer validating all AI-recommended actions against strict business bounds."""

    DEFAULT_MAX_ATTEMPTS = 3
    DEFAULT_COOLDOWN_SECONDS = 86400  # 24 hours
    DEFAULT_MAX_AUTO_AMOUNT = Decimal("1000.00")

    @classmethod
    def evaluate(
        cls,
        risk: RevenueRisk,
        customer: Customer,
        proposed_action: RecoveryAction,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
        policy: Optional[Policy] = None,
        ignore_cooldown_for_demo: bool = False,
    ) -> PolicyEvaluationResult:
        """Evaluate a proposed action against all deterministic safety policies."""
        past_attempts = past_attempts or []
        applied_rules: List[str] = []

        max_attempts = policy.max_attempts if policy else cls.DEFAULT_MAX_ATTEMPTS
        cooldown_seconds = policy.cooldown_seconds if policy else cls.DEFAULT_COOLDOWN_SECONDS
        max_auto_amount = policy.max_auto_recovery_amount if policy else cls.DEFAULT_MAX_AUTO_AMOUNT

        amount_at_risk = risk.amount_at_risk or Decimal("0.00")
        amount_recovered = risk.amount_recovered or Decimal("0.00")

        # -------------------------------------------------------------
        # RULE 1: SUCCESSFUL PAYMENT STOPPING RULE
        # -------------------------------------------------------------
        if risk.status == "recovered" or (amount_recovered >= amount_at_risk and amount_at_risk > Decimal("0.00")):
            applied_rules.append("RULE_SUCCESS_STOP: TRIGGERED")
            return PolicyEvaluationResult(
                is_approved=False,
                original_proposed_action=proposed_action,
                effective_action=RecoveryAction.STOP,
                applied_rules=applied_rules,
                rejection_reason="Payment has already been successfully recovered.",
                is_terminal_stop=True,
                stop_reason=StoppingReason.SUCCESS_STOP.value,
            )
        applied_rules.append("RULE_SUCCESS_STOP: PASS")

        # -------------------------------------------------------------
        # RULE 2: CUSTOMER OPT-OUT STOPPING RULE
        # -------------------------------------------------------------
        if customer.is_opted_out:
            applied_rules.append("RULE_OPT_OUT_STOP: TRIGGERED")
            return PolicyEvaluationResult(
                is_approved=False,
                original_proposed_action=proposed_action,
                effective_action=RecoveryAction.STOP,
                applied_rules=applied_rules,
                rejection_reason="Customer has opted out of automated recovery interventions.",
                is_terminal_stop=True,
                stop_reason=StoppingReason.CUSTOMER_OPT_OUT.value,
            )
        applied_rules.append("RULE_OPT_OUT_STOP: PASS")

        # -------------------------------------------------------------
        # RULE 3: HIGH-VALUE ESCALATION THRESHOLD
        # -------------------------------------------------------------
        if amount_at_risk > max_auto_amount:
            applied_rules.append(f"RULE_HIGH_VALUE_THRESHOLD: TRIGGERED (Amount ${amount_at_risk} > Limit ${max_auto_amount})")
            return PolicyEvaluationResult(
                is_approved=True,
                original_proposed_action=proposed_action,
                effective_action=RecoveryAction.ESCALATE_TO_HUMAN,
                applied_rules=applied_rules,
                rejection_reason=None,
                requires_escalation=True,
                is_terminal_stop=True,
                stop_reason=StoppingReason.ESCALATED_HIGH_VALUE.value,
            )
        applied_rules.append("RULE_HIGH_VALUE_THRESHOLD: PASS")

        # -------------------------------------------------------------
        # RULE 4: MAXIMUM ATTEMPTS STOPPING RULE
        # -------------------------------------------------------------
        current_attempt_count = len(past_attempts)
        if current_attempt_count >= max_attempts:
            applied_rules.append(f"RULE_MAX_ATTEMPTS: TRIGGERED ({current_attempt_count} >= {max_attempts})")
            if amount_at_risk >= Decimal("250.00"):
                # High-priority exhausted cases escalate to human
                return PolicyEvaluationResult(
                    is_approved=True,
                    original_proposed_action=proposed_action,
                    effective_action=RecoveryAction.ESCALATE_TO_HUMAN,
                    applied_rules=applied_rules,
                    rejection_reason=f"Exhausted maximum automated attempts ({max_attempts}). Escalating to human desk.",
                    requires_escalation=True,
                    is_terminal_stop=True,
                    stop_reason=StoppingReason.ESCALATED_EXHAUSTED.value,
                )
            else:
                return PolicyEvaluationResult(
                    is_approved=False,
                    original_proposed_action=proposed_action,
                    effective_action=RecoveryAction.STOP,
                    applied_rules=applied_rules,
                    rejection_reason=f"Exhausted maximum automated recovery attempts ({max_attempts}).",
                    is_terminal_stop=True,
                    stop_reason=StoppingReason.MAX_ATTEMPTS_EXCEEDED.value,
                )
        applied_rules.append(f"RULE_MAX_ATTEMPTS: PASS ({current_attempt_count}/{max_attempts})")

        # -------------------------------------------------------------
        # RULE 5: COOLDOWN WINDOW ENFORCEMENT
        # -------------------------------------------------------------
        if not ignore_cooldown_for_demo and past_attempts and risk.last_attempt_at:
            now = datetime.now(timezone.utc)
            last_attempt_time = risk.last_attempt_at
            if last_attempt_time.tzinfo is None:
                last_attempt_time = last_attempt_time.replace(tzinfo=timezone.utc)

            elapsed_seconds = (now - last_attempt_time).total_seconds()
            if elapsed_seconds < cooldown_seconds:
                remaining_seconds = int(cooldown_seconds - elapsed_seconds)
                applied_rules.append(f"RULE_COOLDOWN: BLOCKED ({remaining_seconds}s remaining)")
                return PolicyEvaluationResult(
                    is_approved=False,
                    original_proposed_action=proposed_action,
                    effective_action=RecoveryAction.STOP,
                    applied_rules=applied_rules,
                    rejection_reason=f"Cooldown active. {remaining_seconds} seconds remaining before next permitted attempt.",
                    is_terminal_stop=False,
                    stop_reason=StoppingReason.COOLDOWN_ACTIVE.value,
                )
        applied_rules.append("RULE_COOLDOWN: PASS")

        # -------------------------------------------------------------
        # RULE 6: ANTI-DUPLICATE ACTION GUARD
        # -------------------------------------------------------------
        if past_attempts:
            last_attempt = past_attempts[-1]
            if (
                last_attempt.executed_action == proposed_action.value
                and last_attempt.execution_status in ["declined", "failed"]
                and proposed_action == RecoveryAction.RETRY_PAYMENT
                and risk.detected_failure_type == "expired_card"
                and (not customer.card_expiry or customer.card_expiry <= "08/26")
            ):
                applied_rules.append("RULE_ANTI_DUPLICATE: OVERRIDDEN (Preventing repetitive retry on expired card)")
                return PolicyEvaluationResult(
                    is_approved=True,
                    original_proposed_action=proposed_action,
                    effective_action=RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE,
                    applied_rules=applied_rules,
                    rejection_reason="Duplicate retry prevented on expired card without credential update.",
                )
        applied_rules.append("RULE_ANTI_DUPLICATE: PASS")

        # -------------------------------------------------------------
        # RULE 7: CONTACT FATIGUE PROTECTION (FEATURE 9)
        # -------------------------------------------------------------
        if proposed_action in [RecoveryAction.SEND_PAYMENT_REMINDER, RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE]:
            from app.services.contact_policy_engine import ContactPolicyEngine
            fatigue_profile = ContactPolicyEngine.evaluate_contact_profile(
                db=None,
                customer=customer,
                past_attempts=past_attempts,
            )
            if not fatigue_profile.is_contact_allowed and not ignore_cooldown_for_demo:
                applied_rules.append(f"RULE_CONTACT_FATIGUE: BLOCKED ({fatigue_profile.rejection_reason})")
                return PolicyEvaluationResult(
                    is_approved=False,
                    original_proposed_action=proposed_action,
                    effective_action=RecoveryAction.STOP,
                    applied_rules=applied_rules,
                    rejection_reason=fatigue_profile.rejection_reason or "Customer contact frequency limit reached.",
                    is_terminal_stop=False,
                    stop_reason="CONTACT_FREQUENCY_LIMIT",
                )
            applied_rules.append("RULE_CONTACT_FATIGUE: PASS")

        # -------------------------------------------------------------
        # FINAL APPROVAL
        # -------------------------------------------------------------
        is_escalation = (proposed_action == RecoveryAction.ESCALATE_TO_HUMAN)
        applied_rules.append(f"RULE_FINAL_APPROVAL: APPROVED {proposed_action.value}")
        return PolicyEvaluationResult(
            is_approved=True,
            original_proposed_action=proposed_action,
            effective_action=proposed_action,
            applied_rules=applied_rules,
            rejection_reason=None,
            requires_escalation=is_escalation,
            is_terminal_stop=is_escalation,
            stop_reason="OPERATOR_ESCALATED" if is_escalation else None,
        )
