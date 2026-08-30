"""RetryTimingEngine for calculating optimal intervention intervals and retry windows."""

from typing import Optional, List
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import FailureType
from app.schemas.recovery_intelligence import RetryTimingResult


class RetryTimingEngine:
    """Calculates deterministic smart retry delay and optimal customer outreach timing."""

    TIMING_MAP = {
        FailureType.NETWORK_ERROR.value: (
            1.0,
            "1 hour",
            "Transient gateway network timeouts clear rapidly upon issuer network reconnect.",
        ),
        FailureType.TEMPORARY_DECLINE.value: (
            12.0,
            "12 hours",
            "Card issuer soft decline flags typically reset within the next business processing window.",
        ),
        FailureType.EXPIRED_CARD.value: (
            24.0,
            "24 hours",
            "Provides customer adequate time to open email, click portal link, and submit updated card credentials.",
        ),
        FailureType.INSUFFICIENT_FUNDS.value: (
            48.0,
            "48 hours",
            "Aligns with customer cash deposit cycles and standard banking balance refresh intervals.",
        ),
        FailureType.UNKNOWN_FAILURE.value: (
            0.0,
            "Immediate Human Queue",
            "Unrecognized decline code requires immediate human operations review.",
        ),
    }

    @classmethod
    def calculate_recommended_timing(
        cls,
        risk: RevenueRisk,
        customer: Optional[Customer] = None,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
    ) -> RetryTimingResult:
        """Determine the recommended delay hours and explanation based on failure category and attempt history."""
        failure_type = risk.detected_failure_type
        default_delay, default_label, default_reason = cls.TIMING_MAP.get(
            failure_type,
            (24.0, "24 hours", "Standard recovery window."),
        )

        # If customer already attempted once with insufficient funds, slightly extend delay for second retry
        attempt_count = len(past_attempts) if past_attempts else risk.attempt_count
        if failure_type == FailureType.INSUFFICIENT_FUNDS.value and attempt_count >= 1:
            return RetryTimingResult(
                recommended_delay_hours=72.0,
                recommended_delay_label="72 hours (Day 3 Balance Follow-up)",
                reason="Second insufficient funds attempt spaced out to capture upcoming payroll deposit cycle.",
            )

        return RetryTimingResult(
            recommended_delay_hours=default_delay,
            recommended_delay_label=default_label,
            reason=default_reason,
        )
