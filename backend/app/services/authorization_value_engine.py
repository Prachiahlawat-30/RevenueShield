"""AuthorizationValueEngine for calculating expected gross revenue, costs, and net monetary yields."""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any
from app.schemas.adaptive_authorization import TokenStrategy


class AuthorizationValueEngine:
    """Calculates unified monetary expected value, processing costs, and strategy ranking scores."""

    BASE_GATEWAY_FIXED_FEE = Decimal("0.30")
    BASE_VARIABLE_FEE_RATE = Decimal("0.0015")  # 0.15% interchange / gateway processing fee
    NETWORK_TOKEN_DISCOUNT_RATE = Decimal("0.0005")  # 0.05% discount for network tokenization
    NETWORK_TOKEN_AUTH_BOOST = 0.035  # +3.5% authorization rate lift for network tokens

    @classmethod
    def evaluate_strategy_value(
        cls,
        amount: Decimal,
        base_auth_probability: float,
        conversion_probability: float,
        customer_friction_score: int,
        authentication_cost: Decimal,
        token_strategy: TokenStrategy,
        gateway_latency_ms: int = 400,
        customer_risk_tier: str = "LOW",
    ) -> Dict[str, Any]:
        """Compute expected gross revenue, processing fees, net yield, and overall strategy score."""
        effective_auth_p = base_auth_probability

        # 1. Apply Network Token Optimization lift
        is_tokenized = token_strategy == TokenStrategy.NETWORK_TOKEN_SIMULATED
        if is_tokenized:
            effective_auth_p = min(effective_auth_p + cls.NETWORK_TOKEN_AUTH_BOOST, 0.992)

        # 2. Combined checkout-to-settlement conversion yield
        combined_rate = effective_auth_p * conversion_probability

        # 3. Gross expected monetary revenue
        gross_rev = (amount * Decimal(str(round(combined_rate, 4)))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 4. Processing & Authentication Cost
        fee_rate = (
            cls.BASE_VARIABLE_FEE_RATE - cls.NETWORK_TOKEN_DISCOUNT_RATE
            if is_tokenized
            else cls.BASE_VARIABLE_FEE_RATE
        )
        proc_cost = (cls.BASE_GATEWAY_FIXED_FEE + (amount * fee_rate)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total_cost = (proc_cost + authentication_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 5. Net expected revenue
        net_rev = (gross_rev - total_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # 6. Explanatory Penalties for Decision Ranking
        friction_pen = (customer_friction_score / 100.0) * float(amount) * 0.02
        risk_pen = (0.025 if customer_risk_tier.upper() == "HIGH" else 0.005) * float(amount)
        latency_pen = (gateway_latency_ms / 1000.0) * float(amount) * 0.002

        strategy_score = round(float(net_rev) - friction_pen - risk_pen - latency_pen, 2)

        return {
            "effective_auth_probability": round(effective_auth_p, 4),
            "conversion_probability": round(conversion_probability, 4),
            "expected_gross_revenue": gross_rev,
            "estimated_cost": total_cost,
            "expected_net_revenue": net_rev,
            "strategy_score": strategy_score,
            "friction_penalty": round(friction_pen, 2),
            "risk_penalty": round(risk_pen, 2),
        }
