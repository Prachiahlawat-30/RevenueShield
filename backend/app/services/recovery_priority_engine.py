"""RecoveryPriorityEngine for multi-factor ranking and opportunity prioritization."""

from decimal import Decimal
from typing import Optional, List
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.recovery_intelligence import RecoveryProbabilityResult, RecoveryPriorityResult


class RecoveryPriorityEngine:
    """Calculates composite priority scores (0-100) and classifications (CRITICAL, HIGH, MEDIUM, LOW)."""

    WEIGHT_PROBABILITY = 0.35
    WEIGHT_VALUE = 0.30
    WEIGHT_URGENCY = 0.20
    WEIGHT_CUSTOMER = 0.15

    @classmethod
    def calculate_priority(
        cls,
        risk: RevenueRisk,
        probability_result: RecoveryProbabilityResult,
        customer: Optional[Customer] = None,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
    ) -> RecoveryPriorityResult:
        """Compute transparent priority score and priority classification band."""
        # 1. Terminal / Opt-Out override
        if customer and customer.is_opted_out:
            return RecoveryPriorityResult(
                priority_score=0,
                priority_band="LOW",
                components={"probability": 0.0, "value": 0.0, "urgency": 0.0, "customer": 0.0},
                reason="Customer is opted out of recovery interventions.",
            )

        if risk.status == "recovered":
            return RecoveryPriorityResult(
                priority_score=0,
                priority_band="LOW",
                components={"probability": 100.0, "value": 0.0, "urgency": 0.0, "customer": 100.0},
                reason="Payment already successfully recovered.",
            )

        # 2. Component 1: Probability Contribution (0 - 100)
        prob_score = probability_result.score

        # 3. Component 2: Normalized Transaction Value (0 - 100)
        amount = float(risk.amount_at_risk or Decimal("0.00"))
        # $1,000 maps to 100 points, scaling smoothly for small and large amounts
        val_score = min(100.0, (amount / 1000.0) * 100.0)

        # 4. Component 3: Urgency (0 - 100 based on remaining attempt runway)
        attempt_count = len(past_attempts) if past_attempts else risk.attempt_count
        if attempt_count == 0:
            urgency_score = 100.0
        elif attempt_count == 1:
            urgency_score = 75.0
        elif attempt_count == 2:
            urgency_score = 45.0
        else:
            urgency_score = 15.0

        # 5. Component 4: Customer Recoverability (0 - 100)
        cust_risk = float(customer.risk_score or 0) if customer else 20.0
        cust_score = max(0.0, min(100.0, 100.0 - cust_risk))

        # 6. Composite Calculation
        raw_score = (
            cls.WEIGHT_PROBABILITY * prob_score
            + cls.WEIGHT_VALUE * val_score
            + cls.WEIGHT_URGENCY * urgency_score
            + cls.WEIGHT_CUSTOMER * cust_score
        )

        final_priority = max(1, min(100, int(round(raw_score))))

        # 7. Map to Bands
        if final_priority >= 80:
            band = "CRITICAL"
            reason = "High recoverable value with immediate intervention window."
        elif final_priority >= 60:
            band = "HIGH"
            reason = "Strong recovery probability and actionable customer profile."
        elif final_priority >= 40:
            band = "MEDIUM"
            reason = "Moderate recoverability requiring standard automated workflow."
        else:
            band = "LOW"
            reason = "Lower probability or lower financial yield relative to retry costs."

        return RecoveryPriorityResult(
            priority_score=final_priority,
            priority_band=band,
            components={
                "recovery_probability_weight": round(prob_score * cls.WEIGHT_PROBABILITY, 2),
                "transaction_value_weight": round(val_score * cls.WEIGHT_VALUE, 2),
                "urgency_weight": round(urgency_score * cls.WEIGHT_URGENCY, 2),
                "customer_health_weight": round(cust_score * cls.WEIGHT_CUSTOMER, 2),
            },
            reason=reason,
        )
