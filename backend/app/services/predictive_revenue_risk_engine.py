"""Predictive Revenue Risk Engine for pre-failure risk identification and explainable diagnosis."""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.merchant import Merchant
from app.models.payment_incident import PaymentIncident
from app.schemas.tier3_schemas import PredictiveRiskItem, PredictiveRiskSummaryResponse


class PredictiveRevenueRiskEngine:
    """Predicts potential payment failures and revenue exposure BEFORE failure occurs."""

    @classmethod
    def analyze_customer(
        cls,
        db: Session,
        customer: Customer,
        active_incidents: Optional[List[PaymentIncident]] = None,
    ) -> PredictiveRiskItem:
        """Evaluate pre-failure risk signals for an individual customer account."""
        now = datetime.now(timezone.utc)

        # 1. Fetch customer transactions history
        transactions = (
            db.query(Transaction)
            .filter(Transaction.customer_id == customer.id)
            .order_by(Transaction.created_at.desc())
            .all()
        )

        total_tx = len(transactions)
        failed_tx = [t for t in transactions if t.status == "failed"]
        recent_failures = failed_tx[:3]
        recent_fail_count = len(recent_failures)

        # 2. Determine upcoming payment amount & renewal schedule
        if transactions:
            typical_amount = transactions[0].amount
        else:
            typical_amount = Decimal("240.00")

        # Deterministic renewal offset (12 to 72 hours based on customer hash)
        hash_val = int(str(customer.id).replace("-", "")[:4], 16)
        hours_offset = 12 + (hash_val % 60)
        renewal_time = now + timedelta(hours=hours_offset)

        # 3. Calculate Failure Probability & Structured Evidence Checklist
        reasons: List[str] = []
        base_prob = 0.12

        # Factor A: Recent payment failures
        if recent_fail_count >= 2:
            base_prob += 0.35
            reasons.append(f"{recent_fail_count} recent payment failures in transaction history")
        elif recent_fail_count == 1:
            base_prob += 0.18
            reasons.append("1 recent payment decline in last billing cycle")

        # Factor B: Card expiry check
        card_expiring = False
        if customer.card_expiry:
            try:
                parts = customer.card_expiry.split("/")
                if len(parts) == 2:
                    exp_month = int(parts[0])
                    exp_year = 2000 + int(parts[1]) if len(parts[1]) == 2 else int(parts[1])
                    current_year = now.year
                    current_month = now.month
                    if exp_year < current_year or (exp_year == current_year and exp_month <= current_month + 1):
                        card_expiring = True
            except Exception:
                pass

        if card_expiring:
            base_prob += 0.28
            reasons.append(f"Payment credential expiring soon ({customer.card_expiry})")

        # Factor C: Baseline customer risk score
        risk_score_float = float(customer.risk_score or 0.0)
        if risk_score_float > 50:
            base_prob += 0.15
            reasons.append(f"Customer churn & delinquency risk score elevated ({risk_score_float:.1f}/100)")
        elif risk_score_float > 25:
            base_prob += 0.08
            reasons.append(f"Moderate risk score profile ({risk_score_float:.1f}/100)")

        # Factor D: Active incident on merchant / payment rail
        if active_incidents is None:
            active_incidents = db.query(PaymentIncident).filter(PaymentIncident.status == "ACTIVE").all()

        matching_incident = next(
            (
                inc
                for inc in active_incidents
                if inc.affected_gateway == "Gateway A"
                or (customer.payment_method_type and inc.affected_payment_method == customer.payment_method_type)
            ),
            None,
        )
        if matching_incident:
            base_prob += 0.15
            reasons.append(f"Active processor incident: {matching_incident.title}")

        # Factor E: Renewal proximity
        if hours_offset <= 24:
            reasons.append(f"Renewal scheduled in {hours_offset} hours")

        if not reasons:
            reasons.append("Account in good standing; standard recurring billing profile")

        # Clamp probability
        final_prob = min(0.96, max(0.04, base_prob))
        future_risk_score = int(round(final_prob * 100))

        # Predicted revenue at risk
        prob_dec = Decimal(str(round(final_prob, 4)))
        predicted_at_risk = (typical_amount * prob_dec).quantize(Decimal("0.01"))

        # Health & recommended proactive action
        if final_prob >= 0.65 or card_expiring:
            health = "CRITICAL"
            if card_expiring:
                action = "Trigger proactive payment method update email 24h prior to renewal"
            else:
                action = "Pre-route renewal via optimal secondary gateway & dispatch reminder"
        elif final_prob >= 0.35:
            health = "DEGRADING"
            action = "Dispatch pre-dunning calendar notification to ensure sufficient balance"
        else:
            health = "HEALTHY"
            action = "Maintain automated standard execution route"

        merchant_name = customer.merchant.name if customer.merchant else "Primary Merchant"

        return PredictiveRiskItem(
            customer_id=customer.id,
            customer_name=customer.name,
            customer_email=customer.email,
            merchant_id=customer.merchant_id,
            merchant_name=merchant_name,
            upcoming_amount=typical_amount,
            upcoming_renewal_at=renewal_time,
            future_risk_score=future_risk_score,
            probability_of_failure=round(final_prob, 3),
            predicted_revenue_at_risk=predicted_at_risk,
            risk_horizon=f"{hours_offset} hours" if hours_offset < 48 else f"{hours_offset // 24} days",
            risk_horizon_hours=hours_offset,
            risk_reasons=reasons,
            recommended_proactive_action=action,
            payment_method_health=health,
        )

    @classmethod
    def get_summary(cls, db: Session) -> PredictiveRiskSummaryResponse:
        """Compute macro predictive revenue risk summary across all customer accounts."""
        customers = db.query(Customer).all()
        active_incidents = db.query(PaymentIncident).filter(PaymentIncident.status == "ACTIVE").all()

        items: List[PredictiveRiskItem] = []
        for cust in customers:
            items.append(cls.analyze_customer(db, cust, active_incidents=active_incidents))

        # Sort descending by future_risk_score
        items.sort(key=lambda x: (x.future_risk_score, x.predicted_revenue_at_risk), reverse=True)

        total_volume = sum((item.upcoming_amount for item in items), Decimal("0.00"))
        total_risk = sum((item.predicted_revenue_at_risk for item in items), Decimal("0.00"))

        avg_prob = sum(item.probability_of_failure for item in items) / len(items) if items else 0.0

        high_risk = sum(1 for item in items if item.future_risk_score >= 65)
        mod_risk = sum(1 for item in items if 35 <= item.future_risk_score < 65)
        low_risk = sum(1 for item in items if item.future_risk_score < 35)

        # Top risk merchant
        merchant_risk_map: Dict[str, Decimal] = {}
        for item in items:
            merchant_risk_map[item.merchant_name] = (
                merchant_risk_map.get(item.merchant_name, Decimal("0.00")) + item.predicted_revenue_at_risk
            )

        top_merchant = max(merchant_risk_map.items(), key=lambda x: x[1])[0] if merchant_risk_map else "None"

        return PredictiveRiskSummaryResponse(
            total_upcoming_volume=total_volume,
            total_predicted_revenue_at_risk=total_risk,
            average_failure_probability=round(avg_prob, 3),
            high_risk_accounts_count=high_risk,
            moderate_risk_accounts_count=mod_risk,
            low_risk_accounts_count=low_risk,
            top_risk_merchant=top_merchant,
            predictive_accounts=items,
        )
