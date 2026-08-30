"""SmartAuthenticationEngine for evaluating 3DS authorization vs friction vs conversion tradeoffs."""

from decimal import Decimal
from typing import Dict, Any, List
from app.schemas.adaptive_authorization import AuthenticationStrategy


class SmartAuthenticationEngine:
    """Evaluates Smart 3DS authentication pathways, calculating authorization vs drop-off tradeoffs."""

    @classmethod
    def evaluate_authentication_candidate(
        cls,
        strategy: AuthenticationStrategy,
        payment_method: str,
        amount: Decimal,
        customer_risk_tier: str = "LOW",
        is_returning_customer: bool = True,
        has_prior_3ds_success: bool = True,
    ) -> Dict[str, Any]:
        """Calculate authorization probability, conversion probability, friction score, and authentication cost."""
        norm_method = (payment_method or "card").lower()

        # Non-card payment methods (UPI, Wallet, Netbanking) bypass card 3DS
        if norm_method not in ["card", "credit_card", "debit_card", "visa", "mastercard"]:
            return {
                "strategy": AuthenticationStrategy.NOT_APPLICABLE.value,
                "authorization_probability": 0.978,
                "conversion_probability": 0.955,
                "customer_friction_score": 5,
                "customer_friction_label": "NONE",
                "authentication_cost": Decimal("0.00"),
                "reason": f"Payment method '{payment_method}' utilizes native authorization protocol (3DS not applicable).",
            }

        risk_tier = customer_risk_tier.upper()

        if strategy == AuthenticationStrategy.NO_3DS:
            if risk_tier == "LOW":
                auth_p = 0.942
                conv_p = 0.965
                friction = 10
            elif risk_tier == "MEDIUM":
                auth_p = 0.840
                conv_p = 0.940
                friction = 12
            else:  # HIGH
                auth_p = 0.612
                conv_p = 0.920
                friction = 15

            return {
                "strategy": AuthenticationStrategy.NO_3DS.value,
                "authorization_probability": auth_p,
                "conversion_probability": conv_p,
                "customer_friction_score": friction,
                "customer_friction_label": "LOW",
                "authentication_cost": Decimal("0.00"),
                "reason": "Direct authorization without 3DS step. Maximizes checkout conversion for low-risk transactions.",
            }

        elif strategy == AuthenticationStrategy.FRICTIONLESS_3DS:
            if risk_tier == "LOW":
                auth_p = 0.965
                conv_p = 0.945
                friction = 20
            elif risk_tier == "MEDIUM":
                auth_p = 0.932
                conv_p = 0.925
                friction = 22
            else:  # HIGH
                auth_p = 0.745
                conv_p = 0.880
                friction = 25

            # Returning customer with prior 3DS success gets a slight conversion lift
            if is_returning_customer and has_prior_3ds_success:
                conv_p = min(conv_p + 0.015, 0.98)

            return {
                "strategy": AuthenticationStrategy.FRICTIONLESS_3DS.value,
                "authorization_probability": auth_p,
                "conversion_probability": conv_p,
                "customer_friction_score": friction,
                "customer_friction_label": "LOW",
                "authentication_cost": Decimal("0.05"),
                "reason": "Passive 3DS2 risk data sharing without user OTP prompt. Balances higher issuer trust with low friction.",
            }

        elif strategy == AuthenticationStrategy.CHALLENGE_3DS:
            if risk_tier == "LOW":
                auth_p = 0.975
                conv_p = 0.792
                friction = 75
            elif risk_tier == "MEDIUM":
                auth_p = 0.968
                conv_p = 0.781
                friction = 75
            else:  # HIGH
                auth_p = 0.955
                conv_p = 0.768
                friction = 78

            return {
                "strategy": AuthenticationStrategy.CHALLENGE_3DS.value,
                "authorization_probability": auth_p,
                "conversion_probability": conv_p,
                "customer_friction_score": friction,
                "customer_friction_label": "HIGH",
                "authentication_cost": Decimal("0.12"),
                "reason": "Active OTP / biometric step-up challenge. Provides highest issuer authorization at the cost of cart drop-off.",
            }

        else:
            return {
                "strategy": AuthenticationStrategy.NOT_APPLICABLE.value,
                "authorization_probability": 0.90,
                "conversion_probability": 0.90,
                "customer_friction_score": 10,
                "customer_friction_label": "LOW",
                "authentication_cost": Decimal("0.00"),
                "reason": "Standard authorization default.",
            }

    @classmethod
    def get_supported_strategies_for_method(cls, payment_method: str) -> List[AuthenticationStrategy]:
        """Return list of candidate authentication strategies applicable to the given payment method."""
        norm_method = (payment_method or "card").lower()
        if norm_method in ["card", "credit_card", "debit_card", "visa", "mastercard"]:
            return [
                AuthenticationStrategy.NO_3DS,
                AuthenticationStrategy.FRICTIONLESS_3DS,
                AuthenticationStrategy.CHALLENGE_3DS,
            ]
        return [AuthenticationStrategy.NOT_APPLICABLE]
