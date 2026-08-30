"""RecoveryProbabilityEngine for deterministic, explainable recoverability scoring."""

from decimal import Decimal
from typing import List, Optional
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.transaction import Transaction
from app.schemas.enums import FailureType
from app.schemas.recovery_intelligence import RecoveryProbabilityResult


class RecoveryProbabilityEngine:
    """Calculates explainable recovery probability and recoverability scores."""

    BASELINE_PROBABILITIES = {
        FailureType.NETWORK_ERROR.value: 0.88,
        FailureType.TEMPORARY_DECLINE.value: 0.78,
        FailureType.INSUFFICIENT_FUNDS.value: 0.65,
        FailureType.EXPIRED_CARD.value: 0.55,
        FailureType.UNKNOWN_FAILURE.value: 0.30,
    }

    @classmethod
    def calculate_probability(
        cls,
        risk: RevenueRisk,
        customer: Optional[Customer] = None,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
        historical_transactions: Optional[List[Transaction]] = None,
    ) -> RecoveryProbabilityResult:
        """Calculate explainable recovery probability (0.0 - 1.0) and score (0 - 100)."""
        past_attempts = past_attempts or []
        positive_factors: List[str] = []
        negative_factors: List[str] = []

        # 1. Check Hard Terminal Constraints (Customer Opt-Out)
        if customer and customer.is_opted_out:
            negative_factors.append("Customer has explicitly opted out of automated recovery interventions.")
            return RecoveryProbabilityResult(
                probability=0.0,
                score=0,
                confidence=1.0,
                factors=negative_factors,
                positive_factors=[],
                negative_factors=negative_factors,
            )

        # 2. Check Baseline Probability by Failure Type
        failure_type = risk.detected_failure_type
        base_prob = cls.BASELINE_PROBABILITIES.get(failure_type, 0.40)

        if failure_type == FailureType.NETWORK_ERROR.value:
            positive_factors.append("Network gateway timeout has high autonomous retry recovery rate (88% baseline).")
        elif failure_type == FailureType.TEMPORARY_DECLINE.value:
            positive_factors.append("Temporary issuer soft decline is highly recoverable on follow-up attempt (78% baseline).")
        elif failure_type == FailureType.INSUFFICIENT_FUNDS.value:
            positive_factors.append("Insufficient funds responds well to timed payment reminders and smart retries (65% baseline).")
        elif failure_type == FailureType.EXPIRED_CARD.value:
            negative_factors.append("Expired card requires customer credential update before transaction can settle.")
        elif failure_type == FailureType.UNKNOWN_FAILURE.value:
            negative_factors.append("Unrecognized bank processor decline code indicates complex recovery requirement.")

        prob = base_prob

        # 3. Customer Profile and Risk Score Adjustments
        if customer:
            cust_risk = float(customer.risk_score or 0)
            if cust_risk <= 15.0:
                prob += 0.05
                positive_factors.append(f"Strong customer credit profile (risk score {cust_risk:.1f}/100).")
            elif cust_risk >= 40.0:
                prob -= 0.10
                negative_factors.append(f"Elevated customer churn risk score ({cust_risk:.1f}/100).")

            if historical_transactions:
                succeeded_txns = [t for t in historical_transactions if t.status == "succeeded"]
                if len(succeeded_txns) >= 2:
                    prob += 0.07
                    positive_factors.append(f"Customer has {len(succeeded_txns)} verified historical successful payments.")
                elif len(succeeded_txns) == 1:
                    prob += 0.03
                    positive_factors.append("Customer has prior successful payment history.")

        # 4. Attempt Progression & Retry Fatigue Adjustments
        attempt_count = len(past_attempts) if past_attempts else risk.attempt_count
        if attempt_count == 0:
            prob += 0.04
            positive_factors.append("First-time failure event with no prior retry fatigue.")
        elif attempt_count == 1:
            prob -= 0.12
            negative_factors.append("One previous recovery attempt failed.")
        elif attempt_count >= 2:
            prob -= 0.25
            negative_factors.append(f"Multiple previous recovery attempts failed ({attempt_count} attempts).")

        # 5. Transaction Amount Adjustments
        amount = float(risk.amount_at_risk or Decimal("0.00"))
        if amount > 1000.00:
            prob -= 0.10
            negative_factors.append(f"High transaction value (${amount:.2f}) requires human oversight.")
        elif amount <= 150.00:
            prob += 0.04
            positive_factors.append(f"Standard recurring payment amount (${amount:.2f}) within low-friction tier.")

        # 6. Clamp Strictly Between 0.05 and 0.98 (or 0.0 if opted out)
        final_probability = max(0.05, min(0.98, round(prob, 2)))
        score = int(round(final_probability * 100))

        confidence = 0.92 if attempt_count > 0 else 0.88
        if failure_type == FailureType.UNKNOWN_FAILURE.value:
            confidence = 0.75

        all_factors = positive_factors + negative_factors

        return RecoveryProbabilityResult(
            probability=final_probability,
            score=score,
            confidence=confidence,
            factors=all_factors,
            positive_factors=positive_factors,
            negative_factors=negative_factors,
        )
