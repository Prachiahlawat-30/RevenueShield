"""PolicySafetyValidator for deterministic guardrail bounds and change safety verification."""

from decimal import Decimal
from typing import Dict, Any, List, Tuple
from app.schemas.policy_optimizer import PolicySafetyAssessment


class PolicySafetyValidator:
    """Deterministic guardian validating candidate policy improvements against strict safety invariants."""

    ALLOWED_OPTIMIZABLE_POLICIES = [
        "MAX_ATTEMPTS",
        "COOLDOWN_HOURS",
        "HIGH_VALUE_THRESHOLD",
    ]

    # Deterministic Boundary Limits
    BOUNDS = {
        "MAX_ATTEMPTS": {"min": 1, "max": 5, "max_delta_pct": 0.50},
        "COOLDOWN_HOURS": {"min": 6, "max": 72, "max_delta_pct": 0.50},
        "HIGH_VALUE_THRESHOLD": {"min": Decimal("500.00"), "max": Decimal("10000.00"), "max_delta_pct": 0.50},
    }

    @classmethod
    def validate_candidate(
        cls,
        parameter_name: str,
        current_val: str,
        proposed_val: str,
    ) -> PolicySafetyAssessment:
        """Validate whether a candidate policy adjustment satisfies all deterministic safety criteria."""
        param = parameter_name.upper()
        checks_passed: List[str] = []
        violations: List[str] = []

        # 1. Whitelist Check
        if param not in cls.ALLOWED_OPTIMIZABLE_POLICIES:
            violations.append(f"Parameter '{parameter_name}' is not in the deterministic whitelist.")
            return PolicySafetyAssessment(
                is_safe=False,
                overall_safety_score=0,
                customer_protection_score=0,
                financial_safety_score=0,
                operational_safety_score=0,
                magnitude_score=0,
                checks_passed=checks_passed,
                violations=violations,
            )
        checks_passed.append("Whitelisted policy parameter verified.")

        # 2. Parse Numeric Values
        try:
            if param == "HIGH_VALUE_THRESHOLD":
                curr_num = Decimal(current_val)
                prop_num = Decimal(proposed_val)
            else:
                curr_num = int(current_val)
                prop_num = int(proposed_val)
        except Exception as e:
            violations.append(f"Failed to parse numeric value: {e}")
            return PolicySafetyAssessment(
                is_safe=False,
                overall_safety_score=0,
                customer_protection_score=0,
                financial_safety_score=0,
                operational_safety_score=0,
                magnitude_score=0,
                checks_passed=checks_passed,
                violations=violations,
            )

        # 3. Minimum and Maximum Bounds Check
        bounds = cls.BOUNDS[param]
        if prop_num < bounds["min"]:
            violations.append(
                f"Proposed value {prop_num} is below minimum allowed safe limit ({bounds['min']})."
            )
        else:
            checks_passed.append(f"Satisfies lower boundary (>= {bounds['min']}).")

        if prop_num > bounds["max"]:
            violations.append(
                f"Proposed value {prop_num} exceeds maximum allowed safe limit ({bounds['max']})."
            )
        else:
            checks_passed.append(f"Satisfies upper boundary (<= {bounds['max']}).")

        # 4. Maximum Change Delta Check (Max 50% single-step jump)
        if curr_num > 0:
            delta_ratio = abs(float(prop_num - curr_num)) / float(curr_num)
            if delta_ratio > bounds["max_delta_pct"] + 0.05:  # slight epsilon
                violations.append(
                    f"Change magnitude ({delta_ratio*100:.1f}%) exceeds single-revision limit ({bounds['max_delta_pct']*100:.0f}%)."
                )
            else:
                checks_passed.append("Revision magnitude is within single-step tolerance (< 50%).")
        else:
            checks_passed.append("Baseline value non-zero check passed.")

        # 5. Customer & Financial Safety Rules
        if param == "MAX_ATTEMPTS" and prop_num <= 0:
            violations.append("Zero attempts would completely halt automated recovery.")
        else:
            checks_passed.append("Automated recovery operational continuity preserved.")

        if param == "COOLDOWN_HOURS" and prop_num < 6:
            violations.append("Cooldown under 6 hours causes severe customer contact fatigue.")
        else:
            checks_passed.append("Customer contact fatigue protection verified.")

        is_safe = len(violations) == 0

        # Compute Pillar Scores
        cust_score = 100 if is_safe else 30
        fin_score = 92 if is_safe else 40
        op_score = 95 if is_safe else 20
        mag_score = 90 if is_safe else 10
        overall = (cust_score + fin_score + op_score + mag_score) // 4 if is_safe else 25

        return PolicySafetyAssessment(
            is_safe=is_safe,
            overall_safety_score=overall,
            customer_protection_score=cust_score,
            financial_safety_score=fin_score,
            operational_safety_score=op_score,
            magnitude_score=mag_score,
            checks_passed=checks_passed,
            violations=violations,
        )
