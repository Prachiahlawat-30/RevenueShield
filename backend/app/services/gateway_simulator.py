"""GatewaySimulator for simulating payment gateway and notification channel outcomes."""

from decimal import Decimal
from typing import Optional
from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.schemas.enums import RecoveryAction, ExecutionStatus
from app.schemas.recovery import RecoveryExecutionResult


class GatewaySimulator:
    """Simulates payment gateway (ISO 8583) and customer communication channels."""

    @staticmethod
    def execute_action(
        action: RecoveryAction,
        risk: RevenueRisk,
        customer: Customer,
        attempt_number: int,
    ) -> RecoveryExecutionResult:
        """Execute simulated recovery action and return structured outcome."""
        failure_type = risk.detected_failure_type

        # 1. RETRY PAYMENT
        if action == RecoveryAction.RETRY_PAYMENT:
            # Expired card can never clear on retry unless updated
            if failure_type == "expired_card" and (not customer.card_expiry or customer.card_expiry <= "08/26"):
                return RecoveryExecutionResult(
                    success=False,
                    status=ExecutionStatus.DECLINED,
                    amount_recovered=Decimal("0.00"),
                    channel="simulated_payment_gateway",
                    raw_gateway_code="54",
                    outcome_details={
                        "response_code": "54",
                        "response_message": "Expired card",
                        "attempt": attempt_number,
                    },
                    message="Card retry failed: Card is expired.",
                )

            # Network errors or temporary declines succeed on retry
            if failure_type in ("network_error", "temporary_decline"):
                return RecoveryExecutionResult(
                    success=True,
                    status=ExecutionStatus.SUCCEEDED,
                    amount_recovered=risk.amount_at_risk,
                    channel="simulated_payment_gateway",
                    raw_gateway_code="00",
                    outcome_details={
                        "response_code": "00",
                        "response_message": "Approved",
                        "authorization_code": f"AUTH_{risk.id.hex[:6].upper()}",
                        "attempt": attempt_number,
                    },
                    message="Payment successfully authorized and captured.",
                )

            # Insufficient funds succeeds on subsequent attempt (e.g. attempt >= 2 or after reminder)
            if failure_type == "insufficient_funds":
                if attempt_number >= 2:
                    return RecoveryExecutionResult(
                        success=True,
                        status=ExecutionStatus.SUCCEEDED,
                        amount_recovered=risk.amount_at_risk,
                        channel="simulated_payment_gateway",
                        raw_gateway_code="00",
                        outcome_details={
                            "response_code": "00",
                            "response_message": "Approved",
                            "authorization_code": f"AUTH_{risk.id.hex[:6].upper()}",
                            "attempt": attempt_number,
                        },
                        message="Payment cleared successfully after customer account top-up.",
                    )
                else:
                    return RecoveryExecutionResult(
                        success=False,
                        status=ExecutionStatus.DECLINED,
                        amount_recovered=Decimal("0.00"),
                        channel="simulated_payment_gateway",
                        raw_gateway_code="51",
                        outcome_details={
                            "response_code": "51",
                            "response_message": "Insufficient funds",
                            "attempt": attempt_number,
                        },
                        message="Payment retry declined: Insufficient funds.",
                    )

            # Card updated successfully or general success
            if failure_type == "expired_card" and customer.card_expiry and customer.card_expiry > "08/26":
                return RecoveryExecutionResult(
                    success=True,
                    status=ExecutionStatus.SUCCEEDED,
                    amount_recovered=risk.amount_at_risk,
                    channel="simulated_payment_gateway",
                    raw_gateway_code="00",
                    outcome_details={
                        "response_code": "00",
                        "response_message": "Approved with updated credentials",
                        "authorization_code": f"AUTH_{risk.id.hex[:6].upper()}",
                        "attempt": attempt_number,
                    },
                    message="Payment authorized successfully using updated payment method.",
                )

            # Unknown failure default decline
            return RecoveryExecutionResult(
                success=False,
                status=ExecutionStatus.DECLINED,
                amount_recovered=Decimal("0.00"),
                channel="simulated_payment_gateway",
                raw_gateway_code="05",
                outcome_details={
                    "response_code": "05",
                    "response_message": "Do not honor",
                    "attempt": attempt_number,
                },
                message="Payment retry declined: Unknown gateway error.",
            )

        # 2. SEND PAYMENT REMINDER
        elif action == RecoveryAction.SEND_PAYMENT_REMINDER:
            return RecoveryExecutionResult(
                success=False,  # Sending reminder does not directly collect funds yet
                status=ExecutionStatus.SUCCEEDED,
                amount_recovered=Decimal("0.00"),
                channel="simulated_email_sms_channel",
                outcome_details={
                    "recipient": customer.email,
                    "phone": customer.phone,
                    "template": "payment_failure_friendly_reminder",
                    "delivered": True,
                    "attempt": attempt_number,
                },
                message=f"Dispatched automated payment reminder notification to {customer.email}.",
            )

        # 3. REQUEST PAYMENT METHOD UPDATE
        elif action == RecoveryAction.REQUEST_PAYMENT_METHOD_UPDATE:
            # Simulate customer updating card details upon receiving link
            customer.card_expiry = "12/29"
            customer.card_last4 = "8899"
            customer.payment_method_type = "credit_card"

            return RecoveryExecutionResult(
                success=False,  # Method updated, ready for subsequent charge
                status=ExecutionStatus.SUCCEEDED,
                amount_recovered=Decimal("0.00"),
                channel="simulated_customer_portal",
                outcome_details={
                    "recipient": customer.email,
                    "action": "card_updated",
                    "new_expiry": "12/29",
                    "new_last4": "8899",
                    "attempt": attempt_number,
                },
                message=f"Customer updated billing credentials to valid card (exp: 12/29).",
            )

        # 4. ESCALATE TO HUMAN
        elif action == RecoveryAction.ESCALATE_TO_HUMAN:
            return RecoveryExecutionResult(
                success=False,
                status=ExecutionStatus.ESCALATED,
                amount_recovered=Decimal("0.00"),
                channel="human_operations_queue",
                outcome_details={
                    "queue": "high_priority_revenue_recovery",
                    "assigned_to": "Finance Ops Desk",
                    "risk_amount": str(risk.amount_at_risk),
                    "attempt": attempt_number,
                },
                message="Case escalated to Human Finance Desk for high-touch customer outreach.",
            )

        # 5. STOP
        elif action == RecoveryAction.STOP:
            return RecoveryExecutionResult(
                success=False,
                status=ExecutionStatus.FAILED,
                amount_recovered=Decimal("0.00"),
                channel="system_policy",
                outcome_details={
                    "action": "workflow_terminated",
                    "reason": risk.stop_reason or "Policy termination",
                    "attempt": attempt_number,
                },
                message="Recovery workflow stopped by policy.",
            )

        raise ValueError(f"Unsupported recovery action: {action}")
