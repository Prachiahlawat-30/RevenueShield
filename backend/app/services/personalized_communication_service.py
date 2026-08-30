"""PersonalizedCommunicationService generating factual, personalized customer dunning notifications."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.tier3_schemas import (
    CommunicationDraftRequest,
    CommunicationDraftResponse,
)


class PersonalizedCommunicationService:
    """Generates customer communication drafts grounded strictly in structured facts without LLM hallucinations."""

    @classmethod
    def generate_draft(
        cls,
        db: Session,
        req: CommunicationDraftRequest,
    ) -> CommunicationDraftResponse:
        """Create a personalized dunning notice tailored to the customer, channel, and failure context."""
        customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
        if not customer:
            raise ValueError("Customer not found")

        first_name = customer.name.split()[0] if customer.name else "Valued Customer"
        channel = req.preferred_channel or "email"
        amt_str = f"${req.amount:,.2f}"
        deadline = req.payment_deadline or "within 48 hours"

        facts = [
            f"Customer Name: {customer.name}",
            f"Payment Amount: {amt_str}",
            f"Failure Reason: {req.failure_type.replace('_', ' ').title()}",
            f"Action Required: {req.recommended_action.replace('_', ' ').title()}",
            f"Delivery Channel: {channel.upper()}",
            f"Resolution Deadline: {deadline}",
        ]

        if req.failure_type == "expired_card":
            card_info = f"ending in {customer.card_last4}" if customer.card_last4 else ""
            subject = f"Action Required: Update your payment method for {amt_str}"
            body = (
                f"Hi {first_name},\n\n"
                f"Your scheduled payment of {amt_str} could not be processed because your card {card_info} has expired. "
                f"To ensure uninterrupted service, please update your payment method {deadline}.\n\n"
                f"Thank you for being a valued customer."
            )
            btn_label = "Update Payment Method"
            action_url = f"https://billing.recoverai.io/portal/{customer.id}/update-card"

        elif req.failure_type == "insufficient_funds":
            subject = f"Friendly Reminder: Payment attempt for {amt_str}"
            body = (
                f"Hi {first_name},\n\n"
                f"We noticed that your scheduled payment of {amt_str} could not be completed due to insufficient funds. "
                f"We will re-attempt processing on your account shortly. Please ensure sufficient funds are available {deadline} "
                f"to avoid any service disruption.\n\n"
                f"Best regards,\nCustomer Accounts Team"
            )
            btn_label = "Review Invoice & Pay Now"
            action_url = f"https://billing.recoverai.io/portal/{customer.id}/pay-now"

        else:
            subject = f"Notice: Update regarding your scheduled payment of {amt_str}"
            body = (
                f"Hi {first_name},\n\n"
                f"Your recent payment of {amt_str} encountered a processing issue with the payment network. "
                f"Please review your billing preferences {deadline} to maintain active account status."
            )
            btn_label = "Check Billing Status"
            action_url = f"https://billing.recoverai.io/portal/{customer.id}/status"

        # If SMS, compact the body into a 160-char friendly message
        if channel.lower() == "sms":
            subject = "SMS Notification"
            body = (
                f"{first_name}, your payment of {amt_str} could not be completed. "
                f"Please visit {action_url} to update details and avoid interruption."
            )

        return CommunicationDraftResponse(
            customer_name=customer.name,
            channel=channel,
            subject_line=subject,
            body_text=body,
            action_button_label=btn_label,
            action_url=action_url,
            facts_grounding=facts,
            generated_at=datetime.now(timezone.utc),
        )
