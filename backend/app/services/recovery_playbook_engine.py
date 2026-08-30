"""RecoveryPlaybookEngine for generating multi-step recovery sequence timelines."""

from typing import List, Optional
from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.schemas.enums import RecoveryAction, FailureType
from app.schemas.tier2_schemas import PlaybookStepItem, RecoveryPlaybookResponse


class RecoveryPlaybookEngine:
    """Generates and tracks bounded multi-step recovery sequence playbooks."""

    @classmethod
    def generate_playbook(
        cls,
        risk: RevenueRisk,
        customer: Optional[Customer] = None,
    ) -> RecoveryPlaybookResponse:
        """Generate structured recovery playbook tailored to failure type and customer profile."""
        failure_type = risk.detected_failure_type
        attempt_count = risk.attempt_count

        if failure_type == FailureType.EXPIRED_CARD.value:
            playbook_name = "Expired Card Lifecycle Playbook"
            steps = [
                PlaybookStepItem(
                    step_number=1,
                    time_offset_label="T+0",
                    action=RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE,
                    action_label="Detect & Dispatch Update Portal Link",
                    status="COMPLETED" if attempt_count >= 1 else "CURRENT",
                    expected_recovery_rate=0.76,
                    policy_guardrail="Direct retry blocked until credentials update",
                    description="Deliver branded self-serve credential refresh link to customer via email.",
                ),
                PlaybookStepItem(
                    step_number=2,
                    time_offset_label="T+24h",
                    action=RecoveryAction.RETRY_PAYMENT,
                    action_label="Verify Credentials & Execute Scheduled Retry",
                    status="COMPLETED" if (attempt_count >= 2 and risk.status == "recovered") else ("CURRENT" if attempt_count == 1 else "SCHEDULED"),
                    expected_recovery_rate=0.88,
                    policy_guardrail="Requires valid expiration date > 08/26",
                    description="Confirm card expiry updated and submit transaction to payment gateway.",
                ),
                PlaybookStepItem(
                    step_number=3,
                    time_offset_label="T+48h",
                    action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_label="Follow-up Courtesy Reminder",
                    status="SCHEDULED",
                    expected_recovery_rate=0.45,
                    policy_guardrail="Maximum 1 reminder per 24 hours",
                    description="Send SMS/Email notification if card update remains pending.",
                ),
                PlaybookStepItem(
                    step_number=4,
                    time_offset_label="T+72h",
                    action=RecoveryAction.ESCALATE_TO_HUMAN,
                    action_label="Account Desk Escalation",
                    status="SCHEDULED",
                    expected_recovery_rate=0.70,
                    policy_guardrail="Auto-escalate before final cancellation",
                    description="Route to customer success team for direct phone outreach.",
                ),
            ]
        elif failure_type == FailureType.INSUFFICIENT_FUNDS.value:
            playbook_name = "Balance Refresh & Timed Dunning Playbook"
            steps = [
                PlaybookStepItem(
                    step_number=1,
                    time_offset_label="T+0",
                    action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_label="Send Discreet Payment Notice",
                    status="COMPLETED" if attempt_count >= 1 else "CURRENT",
                    expected_recovery_rate=0.78,
                    policy_guardrail="No immediate aggressive retries",
                    description="Send polite notification allowing 24-48h balance top-up window.",
                ),
                PlaybookStepItem(
                    step_number=2,
                    time_offset_label="T+48h",
                    action=RecoveryAction.RETRY_PAYMENT,
                    action_label="First Payroll Cycle Retry",
                    status="COMPLETED" if (attempt_count >= 2 and risk.status == "recovered") else ("CURRENT" if attempt_count == 1 else "SCHEDULED"),
                    expected_recovery_rate=0.68,
                    policy_guardrail="Cooldown check: >= 48 hours elapsed",
                    description="Execute payment re-attempt during optimal banking settlement window.",
                ),
                PlaybookStepItem(
                    step_number=3,
                    time_offset_label="T+72h",
                    action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_label="Secondary Grace Period Notice",
                    status="SCHEDULED",
                    expected_recovery_rate=0.52,
                    policy_guardrail="Max attempt count = 3",
                    description="Inform customer of upcoming final attempt before service pause.",
                ),
                PlaybookStepItem(
                    step_number=4,
                    time_offset_label="T+96h",
                    action=RecoveryAction.RETRY_PAYMENT,
                    action_label="Final Settlement Re-Attempt",
                    status="SCHEDULED",
                    expected_recovery_rate=0.40,
                    policy_guardrail="Final automated attempt limit",
                    description="Submit final automated recovery attempt.",
                ),
            ]
        else:
            playbook_name = "Rapid Gateway Soft Decline Playbook"
            steps = [
                PlaybookStepItem(
                    step_number=1,
                    time_offset_label="T+1h",
                    action=RecoveryAction.RETRY_PAYMENT,
                    action_label="Transient Network Re-Attempt",
                    status="COMPLETED" if attempt_count >= 1 else "CURRENT",
                    expected_recovery_rate=0.85,
                    policy_guardrail="Safe for automated instant retry",
                    description="Immediate retry on alternative gateway route.",
                ),
                PlaybookStepItem(
                    step_number=2,
                    time_offset_label="T+12h",
                    action=RecoveryAction.RETRY_PAYMENT,
                    action_label="Next Business Window Re-Attempt",
                    status="COMPLETED" if (attempt_count >= 2 and risk.status == "recovered") else ("CURRENT" if attempt_count == 1 else "SCHEDULED"),
                    expected_recovery_rate=0.72,
                    policy_guardrail="Cooldown check satisfied",
                    description="Re-attempt transaction during standard issuer business hours.",
                ),
                PlaybookStepItem(
                    step_number=3,
                    time_offset_label="T+24h",
                    action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_label="Bank Verification Prompt",
                    status="SCHEDULED",
                    expected_recovery_rate=0.55,
                    policy_guardrail="Max 1 reminder per day",
                    description="Prompt customer to approve charge with bank.",
                ),
            ]

        current_idx = min(attempt_count, len(steps) - 1)

        return RecoveryPlaybookResponse(
            playbook_id=f"PB-{failure_type.upper()}",
            playbook_name=playbook_name,
            target_failure_type=failure_type,
            customer_segment="FAST_RECOVERY",
            total_steps=len(steps),
            current_step_index=current_idx,
            stopping_rules=[
                "Payment successfully settled at gateway",
                "Customer explicitly opts out of recovery outreach",
                "Maximum policy attempts (3 attempts) reached",
                "High-value threshold (> $1,000) forces human escalation",
            ],
            steps=steps,
        )
