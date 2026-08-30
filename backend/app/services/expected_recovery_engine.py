"""ExpectedRecoveryEngine for safe Decimal monetary value calculations."""

from decimal import Decimal, ROUND_HALF_UP
from app.schemas.recovery_intelligence import ExpectedRecoveryResult


class ExpectedRecoveryEngine:
    """Calculates expected recovered revenue and expected loss using precise Decimal arithmetic."""

    @classmethod
    def calculate_expected_recovery(
        cls,
        transaction_amount: Decimal,
        recovery_probability: float,
    ) -> ExpectedRecoveryResult:
        """Compute expected recovery and expected loss values with 2-decimal monetary precision."""
        prob_dec = Decimal(str(round(recovery_probability, 4)))
        raw_expected = (transaction_amount * prob_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        expected_loss = (transaction_amount - raw_expected).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return ExpectedRecoveryResult(
            transaction_amount=transaction_amount,
            recovery_probability=recovery_probability,
            expected_recovery_value=raw_expected,
            expected_loss=expected_loss,
        )
