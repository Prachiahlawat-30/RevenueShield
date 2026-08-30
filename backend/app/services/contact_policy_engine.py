"""ContactPolicyEngine enforcing customer communication limits, cooldowns, and contact fatigue protection."""

import uuid
from decimal import Decimal
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import RecoveryAction
from app.schemas.tier3_schemas import ContactFatigueProfile


class ContactPolicyEngine:
    """Tracks customer communication velocity and enforces anti-fatigue frequency caps and cooldowns."""

    MAX_CONTACTS_24H = 2
    MAX_CONTACTS_7D = 5
    COOLDOWN_HOURS = 6

    COMMUNICATION_ACTIONS = {
        RecoveryAction.SEND_PAYMENT_REMINDER,
        RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE,
        "SEND_PAYMENT_REMINDER",
        "REQUEST_PAYMENT_METHOD_UPDATE",
        "SEND_PRE_RENEWAL_REMINDER",
        "CARD_EXPIRY_UPDATE_NOTIFICATION",
    }

    @classmethod
    def evaluate_contact_profile(
        cls,
        db: Session,
        customer: Customer,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
    ) -> ContactFatigueProfile:
        """Evaluate customer contact history and determine whether outbound notification is safe."""
        now = datetime.now(timezone.utc)
        since_24h = now - timedelta(hours=24)
        since_7d = now - timedelta(days=7)

        # 1. Fetch past recovery attempts for this customer if not provided
        if past_attempts is None:
            past_attempts = (
                db.query(RecoveryAttempt)
                .join(RecoveryAttempt.revenue_risk)
                .filter(RecoveryAttempt.revenue_risk.has(customer_id=customer.id))
                .all()
            )

        # Filter for communicative actions
        comm_actions_lower = {
            a.value.lower() if hasattr(a, "value") else str(a).lower()
            for a in cls.COMMUNICATION_ACTIONS
        }
        comm_attempts = []
        for att in past_attempts:
            act_val = getattr(att, "executed_action", None) or getattr(att, "proposed_action", None) or ""
            if str(act_val).lower() in comm_actions_lower:
                comm_attempts.append(att)

        # 2. Count 24h and 7d communications
        count_24h = 0
        count_7d = 0
        last_contact_dt: Optional[datetime] = None

        for att in comm_attempts:
            att_time = getattr(att, "initiated_at", None) or getattr(att, "completed_at", None) or getattr(att, "created_at", None)
            if att_time:
                if att_time.tzinfo is None:
                    att_time = att_time.replace(tzinfo=timezone.utc)

                if att_time >= since_24h:
                    count_24h += 1
                if att_time >= since_7d:
                    count_7d += 1

                if last_contact_dt is None or att_time > last_contact_dt:
                    last_contact_dt = att_time

        # 3. Sensitivity & Limits
        risk_val = float(customer.risk_score or Decimal("0.00"))
        if risk_val >= 70.0:
            sensitivity = "HIGH"
            limit_24h = 1
        elif risk_val >= 40.0:
            sensitivity = "MEDIUM"
            limit_24h = cls.MAX_CONTACTS_24H
        else:
            sensitivity = "LOW"
            limit_24h = cls.MAX_CONTACTS_24H

        # Hours since last contact & Cooldown
        hours_since = None
        cooldown_remaining = 0
        if last_contact_dt:
            diff = (now - last_contact_dt).total_seconds() / 3600.0
            hours_since = int(diff)
            if diff < cls.COOLDOWN_HOURS:
                cooldown_remaining = int(cls.COOLDOWN_HOURS - diff)

        # 4. Enforce Fatigue Guardrails
        is_allowed = True
        rejection_reason = None

        if count_24h >= limit_24h:
            is_allowed = False
            rejection_reason = f"CONTACT_FREQUENCY_LIMIT: Customer has received {count_24h} contacts in 24h (limit: {limit_24h})."
        elif count_7d >= cls.MAX_CONTACTS_7D:
            is_allowed = False
            rejection_reason = f"WEEKLY_CONTACT_LIMIT: Customer has received {count_7d} contacts in 7d (limit: {cls.MAX_CONTACTS_7D})."
        elif cooldown_remaining > 0:
            is_allowed = False
            rejection_reason = f"MESSAGE_COOLDOWN: Communication cooldown active. {cooldown_remaining}h remaining before next contact."

        # Success rate on past communications
        success_count = sum(
            1 for att in comm_attempts
            if (getattr(att, "execution_status", None) == "succeeded" or getattr(att, "status", None) == "succeeded")
        )
        success_rate = (success_count / len(comm_attempts) * 100) if comm_attempts else 80.0

        return ContactFatigueProfile(
            customer_id=customer.id,
            customer_name=customer.name,
            messages_sent_24h=count_24h,
            messages_limit_24h=limit_24h,
            messages_sent_7d=count_7d,
            messages_limit_7d=cls.MAX_CONTACTS_7D,
            last_contact_time=last_contact_dt,
            hours_since_last_contact=hours_since,
            contact_sensitivity=sensitivity,
            contact_success_rate_pct=round(success_rate, 1),
            is_contact_allowed=is_allowed,
            rejection_reason=rejection_reason,
            cooldown_remaining_hours=cooldown_remaining,
        )
