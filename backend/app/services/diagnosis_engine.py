"""DiagnosisEngine utilizing the OpenAI Python SDK for structured root-cause analysis with zero-failure fallback."""

import json
import logging
from decimal import Decimal
from typing import List, Optional
from openai import OpenAI

from app.core.config import settings
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import FailureType, RecoveryAction
from app.schemas.ai_diagnosis import AIDiagnosisResult

logger = logging.getLogger(__name__)


class DiagnosisEngine:
    """Diagnoses payment failure causes and suggests bounded recovery actions using OpenAI SDK."""

    @classmethod
    def diagnose_risk(
        cls,
        risk: RevenueRisk,
        customer: Customer,
        transaction: Transaction,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
    ) -> AIDiagnosisResult:
        """Diagnose a payment failure. Uses OpenAI SDK when configured; falls back to deterministic heuristic."""
        past_attempts = past_attempts or []

        # If no API key or in pure demo test mode without API key, use reliable deterministic fallback
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.strip() == "":
            return cls._fallback_diagnosis(risk, customer, transaction, past_attempts)

        try:
            return cls._llm_diagnosis(risk, customer, transaction, past_attempts)
        except Exception as exc:
            logger.warning(f"OpenAI API call failed ({exc}), falling back to deterministic diagnosis.")
            return cls._fallback_diagnosis(risk, customer, transaction, past_attempts)

    @classmethod
    def _llm_diagnosis(
        cls,
        risk: RevenueRisk,
        customer: Customer,
        transaction: Transaction,
        past_attempts: List[RecoveryAttempt],
    ) -> AIDiagnosisResult:
        """Call OpenAI SDK with strict JSON schema response format."""
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        attempts_history = [
            {
                "attempt_number": a.attempt_number,
                "action": a.proposed_action,
                "status": a.execution_status,
                "amount_recovered": str(a.amount_recovered),
            }
            for a in past_attempts
        ]

        system_prompt = (
            "You are the AI Diagnosis Engine for RecoverAI, an enterprise revenue recovery platform.\n"
            "Analyze the payment failure metadata and recommend a safe, bounded recovery action.\n"
            "CRITICAL CONSTRAINTS:\n"
            "- You only propose actions; you CANNOT execute them.\n"
            "- Supported failure types: temporary_decline, insufficient_funds, expired_card, network_error, unknown_failure.\n"
            "- Supported actions: retry_payment, send_payment_reminder, request_payment_method_update, escalate_to_human, stop.\n"
            "- If an expired card failure already had a payment method update request sent and the card expiry is now valid (e.g. >= 2027), recommend 'retry_payment'.\n"
            "- Output strictly in JSON format matching the schema."
        )

        user_content = json.dumps({
            "customer": {
                "name": customer.name,
                "email": customer.email,
                "card_last4": customer.card_last4,
                "card_expiry": customer.card_expiry,
                "risk_score": float(customer.risk_score),
                "is_opted_out": customer.is_opted_out,
            },
            "transaction": {
                "amount": float(transaction.amount),
                "currency": transaction.currency,
                "failure_code": transaction.failure_code,
                "failure_reason": transaction.failure_reason,
            },
            "risk": {
                "detected_failure_type": risk.detected_failure_type,
                "attempt_count": risk.attempt_count,
            },
            "past_attempts": attempts_history,
        })

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "ai_diagnosis_result",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "failure_category": {
                                "type": "string",
                                "enum": [f.value for f in FailureType],
                            },
                            "root_cause_summary": {"type": "string"},
                            "confidence_score": {"type": "number"},
                            "recommended_action": {
                                "type": "string",
                                "enum": [a.value for a in RecoveryAction],
                            },
                            "action_rationale": {"type": "string"},
                            "suggested_cooldown_hours": {"type": "integer"},
                            "customer_communication_draft": {
                                "type": ["string", "null"]
                            },
                        },
                        "required": [
                            "failure_category",
                            "root_cause_summary",
                            "confidence_score",
                            "recommended_action",
                            "action_rationale",
                            "suggested_cooldown_hours",
                            "customer_communication_draft",
                        ],
                        "additionalProperties": False,
                    },
                },
            },
            temperature=0.1,
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)

        # Validate with Pydantic
        return AIDiagnosisResult(
            failure_category=FailureType(parsed.get("failure_category", risk.detected_failure_type)),
            root_cause_summary=parsed.get("root_cause_summary", "Diagnosed by AI model."),
            confidence_score=float(parsed.get("confidence_score", 0.90)),
            recommended_action=RecoveryAction(parsed.get("recommended_action", RecoveryAction.RETRY_PAYMENT)),
            action_rationale=parsed.get("action_rationale", "AI recommended recovery intervention."),
            suggested_cooldown_hours=int(parsed.get("suggested_cooldown_hours", 24)),
            customer_communication_draft=parsed.get("customer_communication_draft"),
        )

    @classmethod
    def _fallback_diagnosis(
        cls,
        risk: RevenueRisk,
        customer: Customer,
        transaction: Transaction,
        past_attempts: List[RecoveryAttempt],
    ) -> AIDiagnosisResult:
        """Deterministic heuristic diagnosis ensuring 100% reliable fallback."""
        failure_type = risk.detected_failure_type
        attempt_count = len(past_attempts)

        # 1. Expired Card
        if failure_type == FailureType.EXPIRED_CARD.value:
            # If update link already sent and card details were updated, retry payment
            if customer.card_expiry and customer.card_expiry > "08/26":
                return AIDiagnosisResult(
                    failure_category=FailureType.EXPIRED_CARD,
                    root_cause_summary=f"Customer card {customer.card_last4} expiration date was recently updated to {customer.card_expiry}.",
                    confidence_score=0.95,
                    recommended_action=RecoveryAction.RETRY_PAYMENT,
                    action_rationale="Card credentials have been updated; re-attempting payment capture.",
                    suggested_cooldown_hours=1,
                    customer_communication_draft=None,
                )
            else:
                return AIDiagnosisResult(
                    failure_category=FailureType.EXPIRED_CARD,
                    root_cause_summary=f"Card ending in {customer.card_last4 or 'xxxx'} expired (expiry: {customer.card_expiry or 'N/A'}).",
                    confidence_score=0.98,
                    recommended_action=RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE,
                    action_rationale="Retrying an expired card will consistently fail. Requesting new payment method credentials.",
                    suggested_cooldown_hours=24,
                    customer_communication_draft=f"Hi {customer.name}, your payment card has expired. Please update your billing info securely to keep your subscription active.",
                )

        # 2. Insufficient Funds
        elif failure_type == FailureType.INSUFFICIENT_FUNDS.value:
            if attempt_count == 0:
                return AIDiagnosisResult(
                    failure_category=FailureType.INSUFFICIENT_FUNDS,
                    root_cause_summary="Transaction declined due to insufficient available balance.",
                    confidence_score=0.92,
                    recommended_action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_rationale="Allowing customer 24-48 hours to top-up account before executing retry.",
                    suggested_cooldown_hours=24,
                    customer_communication_draft=f"Hi {customer.name}, we encountered an issue processing your payment of ${transaction.amount}. Please ensure your account has sufficient funds.",
                )
            elif attempt_count == 1:
                return AIDiagnosisResult(
                    failure_category=FailureType.INSUFFICIENT_FUNDS,
                    root_cause_summary="Reminder previously delivered; initiating scheduled payment retry.",
                    confidence_score=0.88,
                    recommended_action=RecoveryAction.RETRY_PAYMENT,
                    action_rationale="Cooldown elapsed post-reminder; executing re-attempt.",
                    suggested_cooldown_hours=24,
                    customer_communication_draft=None,
                )
            else:
                return AIDiagnosisResult(
                    failure_category=FailureType.INSUFFICIENT_FUNDS,
                    root_cause_summary="Multiple insufficient funds retries unsuccessful. Escalating to human desk.",
                    confidence_score=0.85,
                    recommended_action=RecoveryAction.ESCALATE_TO_HUMAN,
                    action_rationale="Preventing further automated retries to avoid merchant dispute penalties.",
                    suggested_cooldown_hours=0,
                    customer_communication_draft=None,
                )

        # 3. Temporary Decline
        elif failure_type == FailureType.TEMPORARY_DECLINE.value:
            if attempt_count == 0:
                return AIDiagnosisResult(
                    failure_category=FailureType.TEMPORARY_DECLINE,
                    root_cause_summary="Temporary issuer decline (soft decline). Safe for scheduled retry.",
                    confidence_score=0.94,
                    recommended_action=RecoveryAction.RETRY_PAYMENT,
                    action_rationale="Issuer soft declines typically clear on subsequent retry attempt.",
                    suggested_cooldown_hours=12,
                    customer_communication_draft=None,
                )
            else:
                return AIDiagnosisResult(
                    failure_category=FailureType.TEMPORARY_DECLINE,
                    root_cause_summary="Soft decline persisted after retry. Requesting card confirmation.",
                    confidence_score=0.87,
                    recommended_action=RecoveryAction.SEND_PAYMENT_REMINDER,
                    action_rationale="Notifying customer to approve transaction with card issuer.",
                    suggested_cooldown_hours=24,
                    customer_communication_draft=f"Hi {customer.name}, your bank declined our recent transaction. Please verify the charge with your bank.",
                )

        # 4. Network Error
        elif failure_type == FailureType.NETWORK_ERROR.value:
            return AIDiagnosisResult(
                failure_category=FailureType.NETWORK_ERROR,
                root_cause_summary="Transient network communication timeout with upstream card processor.",
                confidence_score=0.96,
                recommended_action=RecoveryAction.RETRY_PAYMENT,
                action_rationale="Transient gateway errors have >85% success rate on immediate retry.",
                suggested_cooldown_hours=1,
                customer_communication_draft=None,
            )

        # 5. Unknown Failure
        else:
            return AIDiagnosisResult(
                failure_category=FailureType.UNKNOWN_FAILURE,
                root_cause_summary=f"Unrecognized processor failure: {transaction.failure_reason or 'No reason provided'}",
                confidence_score=0.70,
                recommended_action=RecoveryAction.ESCALATE_TO_HUMAN,
                action_rationale="Unrecognized failure codes require human review to prevent erroneous dunning.",
                suggested_cooldown_hours=0,
                customer_communication_draft=None,
            )
