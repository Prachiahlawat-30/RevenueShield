"""CustomerValueEngine calculating explainable relative Customer Lifetime Value Scores."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.schemas.tier3_schemas import CustomerValueProfile


class CustomerValueEngine:
    """Computes explainable relative Customer Value Scores (0-100) and touch-level recommendations."""

    @classmethod
    def calculate_profile(
        cls,
        db: Session,
        customer: Customer,
        current_amount: Optional[Decimal] = None,
    ) -> CustomerValueProfile:
        """Calculate the relative Customer Value Score and tier classification."""
        # 1. Fetch transaction history for this customer
        txs = db.query(Transaction).filter(Transaction.customer_id == customer.id).all()

        total_vol = sum((tx.amount for tx in txs if tx.amount), Decimal("0.00"))
        tx_count = len(txs)
        avg_ticket = (total_vol / tx_count).quantize(Decimal("0.01")) if tx_count > 0 else Decimal("100.00")

        # If current_amount not passed, use avg_ticket
        curr_amt = current_amount if current_amount is not None else avg_ticket

        # 2. Relationship Tenure in Months
        now = datetime.now(timezone.utc)
        created_at = customer.created_at or now
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        tenure_days = max((now - created_at).days, 30)
        tenure_months = max(int(tenure_days / 30), 1)

        # 3. Calculate Normalized Score Components (Total: 100)
        # A. Historical Volume Score (Max 35 pts)
        vol_float = float(total_vol)
        if vol_float >= 5000:
            vol_score = 35
        elif vol_float >= 2000:
            vol_score = 28
        elif vol_float >= 500:
            vol_score = 20
        else:
            vol_score = max(int((vol_float / 500) * 20), 5)

        # B. Average Ticket Size Score (Max 25 pts)
        ticket_float = float(avg_ticket)
        if ticket_float >= 1000:
            ticket_score = 25
        elif ticket_float >= 300:
            ticket_score = 20
        elif ticket_float >= 100:
            ticket_score = 15
        else:
            ticket_score = max(int((ticket_float / 100) * 15), 5)

        # C. Relationship Tenure Score (Max 20 pts)
        if tenure_months >= 12:
            tenure_score = 20
        elif tenure_months >= 6:
            tenure_score = 15
        elif tenure_months >= 3:
            tenure_score = 10
        else:
            tenure_score = 5

        # D. Payment Reliability Score (Max 20 pts)
        success_count = sum(1 for tx in txs if tx.status == "succeeded")
        success_rate = (success_count / tx_count) if tx_count > 0 else 0.8
        rel_score = int(success_rate * 20)

        # Total Value Score
        value_score = min(max(vol_score + ticket_score + tenure_score + rel_score, 10), 100)

        # VIP / Touch Tier
        if value_score >= 80:
            value_tier = "VIP_ENTERPRISE"
            touch_level = "WHITE_GLOVE_HUMAN"
            explanation = (
                f"High-value VIP account (Score: {value_score}/100) with ${total_vol} lifetime volume and "
                f"{tenure_months}mo tenure. Should receive higher-touch recovery strategies to protect customer relationship."
            )
        elif value_score >= 60:
            value_tier = "HIGH_GROWTH"
            touch_level = "ACCOUNT_MANAGER_CONCIERGE"
            explanation = (
                f"High-growth customer (Score: {value_score}/100). Balance personalized concierge outreach "
                f"with automated payment reminders."
            )
        elif value_score >= 35:
            value_tier = "STANDARD"
            touch_level = "AUTOMATED_BALANCED"
            explanation = (
                f"Standard account (Score: {value_score}/100). Standard automated retry and dunning sequencing."
            )
        else:
            value_tier = "STARTER"
            touch_level = "AUTOMATED_BALANCED"
            explanation = (
                f"Starter account (Score: {value_score}/100). Execute low-cost automated digital recovery."
            )

        return CustomerValueProfile(
            customer_id=customer.id,
            customer_name=customer.name,
            customer_email=customer.email,
            current_transaction_amount=curr_amt,
            historical_volume=total_vol,
            average_transaction_amount=avg_ticket,
            relationship_tenure_months=tenure_months,
            customer_value_score=value_score,
            value_tier=value_tier,
            recommended_touch_level=touch_level,
            explanation=explanation,
        )
