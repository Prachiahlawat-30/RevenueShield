"""Payment Gateway Webhook Ingestion Router (Razorpay TEST MODE & Multi-Gateway)."""

import json
import uuid
import random
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.config import settings
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.models.webhook_event import WebhookEvent
from app.services.risk_engine import RiskEngine
from app.services.diagnosis_engine import DiagnosisEngine
from app.services.policy_engine import PolicyEngine
from app.services.razorpay_service import RazorpayService
from app.services.event_broadcaster import EventBroadcaster
from app.schemas.enums import FailureType, RiskStatus, ActorType, ExecutionStatus, StoppingReason, RecoveryAction
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Payment Gateway Webhooks"])


class SimulateRazorpayRequest(BaseModel):
    scenario: Optional[str] = Field(
        default="insufficient_funds",
        description="Scenario to simulate: insufficient_funds, temporary_decline, expired_card, network_error",
    )
    amount_inr: Optional[Decimal] = Field(
        default=Decimal("2499.00"),
        description="Amount in INR to simulate",
    )
    customer_name: Optional[str] = Field(
        default=None,
        description="Customer name",
    )
    customer_email: Optional[str] = Field(
        default=None,
        description="Customer email",
    )


def _extract_payment_entity(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Safely extract the payment entity dictionary from various Razorpay webhook structures."""
    if not isinstance(payload, dict):
        return {}
    p_dict = payload.get("payload")
    if isinstance(p_dict, dict):
        p_obj = p_dict.get("payment")
        if isinstance(p_obj, dict):
            e_obj = p_obj.get("entity")
            if isinstance(e_obj, dict):
                return e_obj
        pl_obj = p_dict.get("payment_link")
        if isinstance(pl_obj, dict):
            e_obj = pl_obj.get("entity")
            if isinstance(e_obj, dict):
                return e_obj
        order_obj = p_dict.get("order")
        if isinstance(order_obj, dict):
            e_obj = order_obj.get("entity")
            if isinstance(e_obj, dict):
                return e_obj
    root_entity = payload.get("entity")
    if isinstance(root_entity, dict):
        return root_entity
    return {}


def process_razorpay_payment_failed(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """
    Extract payment.failed entity, create Customer, Transaction, RevenueRisk,
    evaluate AI Diagnosis + PolicyEngine, and generate a real Razorpay TEST MODE Payment Link if approved.
    """
    payment_entity = _extract_payment_entity(payload)

    razorpay_payment_id = payment_entity.get("id") or f"pay_{uuid.uuid4().hex[:14]}"
    order_id = payment_entity.get("order_id") or f"order_{uuid.uuid4().hex[:12]}"
    raw_amount = payment_entity.get("amount", 0)
    currency = payment_entity.get("currency", "INR")

    # Razorpay amounts are in smallest currency units (paise / cents)
    amount = Decimal(str(raw_amount)) / Decimal("100") if raw_amount else Decimal("999.00")

    email = payment_entity.get("email") or f"customer_{uuid.uuid4().hex[:6]}@example.com"
    phone = payment_entity.get("contact") or "+919876543210"

    card_info = payment_entity.get("card") or {}
    card_last4 = card_info.get("last4") or "4242"
    exp_month = card_info.get("expiry_month", 12)
    exp_year = str(card_info.get("expiry_year", 2028))[-2:]
    card_expiry = f"{exp_month:02d}/{exp_year}" if isinstance(exp_month, int) else "12/28"

    card_name = card_info.get("name")
    customer_name = (
        card_name
        or payment_entity.get("notes", {}).get("customer_name")
        or email.split("@")[0].replace(".", " ").title()
    )

    # 1. Resolve or Create Customer
    customer = db.query(Customer).filter_by(email=email).first()
    if not customer:
        customer = Customer(
            id=uuid.uuid4(),
            external_id=f"CUST_RZP_{uuid.uuid4().hex[:6].upper()}",
            name=customer_name,
            email=email,
            phone=phone,
            payment_method_type=payment_entity.get("method", "card"),
            card_last4=card_last4,
            card_expiry=card_expiry,
            is_opted_out=False,
            risk_score=Decimal("15.00"),
        )
        db.add(customer)
        db.flush()

    # 2. Extract failure reason details
    error_code = payment_entity.get("error_code") or "PAYMENT_FAILED"
    error_desc = payment_entity.get("error_description") or "Transaction declined by issuing bank."
    error_reason = payment_entity.get("error_reason") or "bank_decline"

    # 3. Create Failed Transaction
    transaction = Transaction(
        id=uuid.uuid4(),
        customer_id=customer.id,
        amount=amount,
        currency=currency,
        status="failed",
        failure_code=error_code,
        failure_reason=error_desc,
        gateway_name="Razorpay",
        payment_method=payment_entity.get("method", "card"),
        razorpay_payment_id=razorpay_payment_id,
        razorpay_order_id=order_id,
        gateway_payload=payment_entity,
    )
    db.add(transaction)
    db.flush()

    # 4. Trigger RevenueShield Risk Engine
    risk = RiskEngine.process_failed_transaction(db=db, transaction_id=transaction.id)
    risk.source = "razorpay"

    # 5. Log Webhook Ingestion into Immutable Audit Ledger
    AuditService.log_event(
        db=db,
        actor="razorpay_webhook",
        step_name="RAZORPAY_WEBHOOK_INGESTED",
        revenue_risk_id=risk.id,
        customer_id=customer.id,
        diagnosis_summary=f"Razorpay payment.failed: {error_desc}",
        policy_decision="INGESTED",
        result=f"Amount: {currency} {amount} | Code: {error_code}",
        input_payload={"razorpay_payment_id": razorpay_payment_id, "error_reason": error_reason},
    )

    # 6. Execute AI Diagnosis & Policy Engine Guardrails
    diagnosis = DiagnosisEngine.diagnose_risk(
        risk=risk,
        customer=customer,
        transaction=transaction,
        past_attempts=[],
    )

    AuditService.log_event(
        db=db,
        actor=ActorType.DIAGNOSIS_ENGINE.value,
        step_name="DIAGNOSING",
        revenue_risk_id=risk.id,
        customer_id=customer.id,
        diagnosis_summary=diagnosis.root_cause_summary,
        recommended_action=diagnosis.recommended_action.value,
        decision_payload=diagnosis.model_dump(),
    )

    active_policy = db.query(Policy).filter_by(is_active=True).first()
    policy_eval = PolicyEngine.evaluate(
        risk=risk,
        customer=customer,
        proposed_action=diagnosis.recommended_action,
        past_attempts=[],
        policy=active_policy,
        ignore_cooldown_for_demo=True,
    )

    AuditService.log_event(
        db=db,
        actor=ActorType.POLICY_ENGINE.value,
        step_name="POLICY_CHECK",
        revenue_risk_id=risk.id,
        customer_id=customer.id,
        recommended_action=diagnosis.recommended_action.value,
        policy_decision="APPROVED" if policy_eval.is_approved else "REJECTED",
        executed_action=policy_eval.effective_action.value,
        decision_payload=policy_eval.model_dump(),
    )

    # 7. Execute Recovery Action (Create Razorpay Test Mode Payment Link if Approved)
    payment_link_data = None
    if policy_eval.is_approved and not policy_eval.requires_escalation:
        risk.status = RiskStatus.RECOVERING.value
        risk.current_step = "PAYMENT_LINK_CREATED"

        payment_link_data = RazorpayService.create_payment_link(
            amount=amount,
            currency=currency,
            customer_name=customer.name,
            customer_email=customer.email,
            customer_phone=customer.phone,
            description=f"RevenueShield Recovery: {diagnosis.failure_category.value.replace('_', ' ').title()}",
            notes={
                "revenue_risk_id": str(risk.id),
                "transaction_id": str(transaction.id),
                "customer_id": str(customer.id),
                "failure_code": error_code,
            },
        )
        risk.payment_link_id = payment_link_data.get("payment_link_id")
        risk.payment_link_url = payment_link_data.get("payment_link_url")

        attempt = RecoveryAttempt(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            attempt_number=1,
            proposed_action=diagnosis.recommended_action.value,
            diagnosis_category=diagnosis.failure_category.value,
            ai_confidence=Decimal(str(round(diagnosis.confidence_score, 3))),
            ai_rationale=diagnosis.action_rationale,
            policy_approved=True,
            executed_action="send_payment_link",
            execution_channel="razorpay_payment_link",
            execution_status=ExecutionStatus.PENDING.value,
            amount_recovered=Decimal("0.00"),
            outcome_details={
                "payment_link_id": risk.payment_link_id,
                "payment_link_url": risk.payment_link_url,
                "is_live_test_api": payment_link_data.get("is_live_test_api", False),
            },
        )
        db.add(attempt)
        risk.attempt_count = 1
        risk.last_attempt_at = datetime.now(timezone.utc)

        AuditService.log_event(
            db=db,
            actor="recovery_engine",
            step_name="PAYMENT_LINK_CREATED",
            revenue_risk_id=risk.id,
            customer_id=customer.id,
            recommended_action=diagnosis.recommended_action.value,
            executed_action="send_payment_link",
            result=f"Generated Razorpay TEST Payment Link: {risk.payment_link_url}",
            decision_payload={"payment_link_id": risk.payment_link_id, "url": risk.payment_link_url},
        )
    elif policy_eval.requires_escalation:
        risk.status = RiskStatus.ESCALATED.value
        risk.current_step = "ESCALATED_TO_HUMAN"
        risk.stop_reason = policy_eval.stop_reason
    elif policy_eval.is_terminal_stop:
        risk.status = RiskStatus.STOPPED.value
        risk.current_step = "WORKFLOW_STOPPED"
        risk.stop_reason = policy_eval.stop_reason

    db.commit()

    # 8. Broadcast Real-Time SSE Event
    EventBroadcaster.broadcast(
        "PAYMENT_FAILED",
        {
            "risk_id": str(risk.id),
            "amount_at_risk": float(risk.amount_at_risk),
            "currency": risk.currency,
            "customer_name": customer.name,
            "status": risk.status,
            "failure_type": risk.detected_failure_type,
            "payment_link_url": risk.payment_link_url,
        },
    )

    return {
        "status": "success",
        "message": "Razorpay payment failure successfully ingested and analyzed by RevenueShield",
        "event": "payment.failed",
        "razorpay_payment_id": razorpay_payment_id,
        "transaction_id": str(transaction.id),
        "revenue_risk_id": str(risk.id),
        "detected_failure_type": risk.detected_failure_type,
        "amount": float(amount),
        "currency": currency,
        "payment_link_url": risk.payment_link_url,
        "customer": {
            "id": str(customer.id),
            "name": customer.name,
            "email": customer.email,
        },
    }


def process_razorpay_payment_success(
    payload: Dict[str, Any], db: Session, event_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Process payment.captured or order.paid webhooks.
    Matches the payment to the active RevenueRisk, verifies settlement, marks the risk as RECOVERED,
    and logs the closing of the recovery loop.
    """
    if not event_name:
        event_name = payload.get("event") or "payment.captured"
    payment_entity = _extract_payment_entity(payload)

    raw_amount = payment_entity.get("amount", 0)
    currency = payment_entity.get("currency", "INR")
    amount = Decimal(str(raw_amount)) / Decimal("100") if raw_amount else Decimal("0.00")
    razorpay_payment_id = payment_entity.get("id")
    order_id = payment_entity.get("order_id")
    notes = payment_entity.get("notes") or {}

    payment_link_entity = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
    plink_id = payment_link_entity.get("id") or notes.get("payment_link_id")

    # Match associated RevenueRisk
    risk: Optional[RevenueRisk] = None

    # 1. By notes.revenue_risk_id
    if notes.get("revenue_risk_id"):
        try:
            risk_uuid = uuid.UUID(notes["revenue_risk_id"])
            risk = db.query(RevenueRisk).filter_by(id=risk_uuid).first()
        except Exception:
            pass

    # 2. By payment_link_id
    if not risk and plink_id:
        risk = db.query(RevenueRisk).filter_by(payment_link_id=plink_id).first()

    # 3. By transaction razorpay_order_id or razorpay_payment_id
    if not risk and order_id:
        txn = db.query(Transaction).filter_by(razorpay_order_id=order_id).first()
        if txn:
            risk = db.query(RevenueRisk).filter_by(transaction_id=txn.id).first()

    if not risk and razorpay_payment_id:
        txn = db.query(Transaction).filter_by(razorpay_payment_id=razorpay_payment_id).first()
        if txn:
            risk = db.query(RevenueRisk).filter_by(transaction_id=txn.id).first()

    # 4. Fallback: match most recent active risk for this customer email
    email = payment_entity.get("email")
    if not risk and email:
        cust = db.query(Customer).filter_by(email=email).first()
        if cust:
            risk = (
                db.query(RevenueRisk)
                .filter(RevenueRisk.customer_id == cust.id, RevenueRisk.status.in_(["detected", "recovering"]))
                .order_by(RevenueRisk.created_at.desc())
                .first()
            )

    if risk:
        now = datetime.now(timezone.utc)
        risk.status = RiskStatus.RECOVERED.value
        risk.current_step = "REVENUE_RECOVERED"
        risk.amount_recovered = amount if amount > Decimal("0.00") else risk.amount_at_risk
        risk.resolved_at = now
        risk.stop_reason = StoppingReason.SUCCESS_STOP.value

        # Update source transaction
        if risk.transaction:
            risk.transaction.status = "captured"
            if razorpay_payment_id:
                risk.transaction.razorpay_payment_id = razorpay_payment_id
            if order_id:
                risk.transaction.razorpay_order_id = order_id

        # Update latest attempt or create terminal attempt
        latest_attempt = (
            db.query(RecoveryAttempt)
            .filter_by(revenue_risk_id=risk.id)
            .order_by(RecoveryAttempt.attempt_number.desc())
            .first()
        )
        if latest_attempt:
            latest_attempt.execution_status = ExecutionStatus.SUCCEEDED.value
            latest_attempt.amount_recovered = risk.amount_recovered
            latest_attempt.completed_at = now
        else:
            new_att = RecoveryAttempt(
                id=uuid.uuid4(),
                revenue_risk_id=risk.id,
                attempt_number=1,
                proposed_action="retry_payment",
                policy_approved=True,
                executed_action="razorpay_captured",
                execution_channel="razorpay_checkout",
                execution_status=ExecutionStatus.SUCCEEDED.value,
                amount_recovered=risk.amount_recovered,
                completed_at=now,
            )
            db.add(new_att)

        # Audit logging
        AuditService.log_event(
            db=db,
            actor="razorpay_webhook",
            step_name="PAYMENT_CAPTURED",
            revenue_risk_id=risk.id,
            customer_id=risk.customer_id,
            result=f"Payment captured via Razorpay ({currency} {amount}). Authorization verified.",
            input_payload={"payment_id": razorpay_payment_id, "order_id": order_id},
        )
        AuditService.log_event(
            db=db,
            actor="recovery_engine",
            step_name="REVENUE_RECOVERED",
            revenue_risk_id=risk.id,
            customer_id=risk.customer_id,
            policy_decision="CLOSED",
            result=f"Revenue recovery loop closed. {currency} {risk.amount_recovered:,.2f} settled to ledger.",
        )

        db.commit()

        # Broadcast SSE event for real-time dashboard and workflow update
        EventBroadcaster.broadcast(
            "REVENUE_RECOVERED",
            {
                "risk_id": str(risk.id),
                "amount_recovered": float(risk.amount_recovered),
                "currency": risk.currency,
                "customer_name": risk.customer.name if risk.customer else "Customer",
                "status": "recovered",
                "razorpay_payment_id": razorpay_payment_id,
            },
        )

        return {
            "status": "success",
            "message": f"Payment captured and RevenueRisk {risk.id} marked as RECOVERED.",
            "event": event_name,
            "revenue_risk_id": str(risk.id),
            "amount_recovered": float(risk.amount_recovered),
            "currency": currency,
        }

    db.commit()
    return {
        "status": "acknowledged",
        "message": f"Payment {razorpay_payment_id} captured without matching active recovery risk.",
        "event": event_name,
        "amount": float(amount),
        "currency": currency,
    }


@router.post("/razorpay", summary="Ingest real-time Razorpay webhook events")
async def razorpay_webhook_handler(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    """
    Ingest live Razorpay webhooks (payment.failed, payment.captured, order.paid, etc.).
    Verifies HMAC signature, enforces event idempotency, triggers recovery or settlement, and broadcasts SSE.
    """
    raw_body = await request.body()

    # Validate HMAC signature
    if not RazorpayService.verify_webhook_signature(raw_body, x_razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature verification failed.",
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON webhook body.")

    event_name = payload.get("event")
    RazorpayService.mark_webhook_received()

    # Idempotency Check: prevent duplicate operations
    payment_entity = _extract_payment_entity(payload)
    payment_id = payment_entity.get("id") or ""
    event_id = payload.get("event_id") or payload.get("id") or f"{event_name}_{payment_id}_{payload.get('created_at', '')}"

    existing_event = db.query(WebhookEvent).filter_by(event_id=event_id).first()
    if existing_event:
        logger.info(f"Duplicate webhook event '{event_id}' skipped.")
        return {
            "status": "duplicate",
            "message": f"Webhook event '{event_id}' has already been processed.",
            "event": event_name,
            "event_id": event_id,
            "duplicate": True,
        }

    # Record WebhookEvent for audit & idempotency
    webhook_event = WebhookEvent(
        id=uuid.uuid4(),
        event_id=event_id,
        event_type=event_name or "unknown",
        resource_id=payment_id,
        status="processed",
        payload=payload,
    )
    db.add(webhook_event)
    db.commit()

    # Handle payment failure event
    if event_name == "payment.failed":
        return process_razorpay_payment_failed(payload, db)

    # Handle payment success events (closure of recovery loop)
    if event_name in ("payment.captured", "payment_link.paid", "order.paid"):
        return process_razorpay_payment_success(payload, db, event_name=event_name)

    # Handle payment authorized
    if event_name == "payment.authorized":
        return {
            "status": "acknowledged",
            "event": event_name,
            "message": f"Payment {payment_id} authorized.",
        }

    # Acknowledge other events gracefully
    return {
        "status": "acknowledged",
        "event": event_name,
        "message": f"Event '{event_name}' received and acknowledged without action.",
    }


@router.post("/razorpay/simulate", summary="Simulate a Razorpay payment failure event")
def simulate_razorpay_webhook(
    req: SimulateRazorpayRequest,
    db: Session = Depends(get_db),
):
    """Simulate a realistic Razorpay payment.failed webhook event for testing and evaluation."""
    scenario = req.scenario or "insufficient_funds"
    amount_inr = req.amount_inr or Decimal("2499.00")
    amount_paise = int(amount_inr * 100)

    name = req.customer_name or "Priya Sharma"
    email = req.customer_email or f"priya.sharma_{random.randint(100, 999)}@razorpayer.in"
    phone = f"+9198{random.randint(10000000, 99999999)}"

    scenario_map = {
        "insufficient_funds": {
            "error_code": "BAD_REQUEST_ERROR",
            "error_description": "Payment failed due to insufficient funds in customer bank account.",
            "error_reason": "payment_failed_insufficient_funds",
            "method": "card",
            "card_last4": "5512",
        },
        "temporary_decline": {
            "error_code": "GATEWAY_ERROR",
            "error_description": "Bank temporary decline: Issuer authorization velocity limit reached.",
            "error_reason": "bank_velocity_decline",
            "method": "card",
            "card_last4": "4242",
        },
        "expired_card": {
            "error_code": "BAD_REQUEST_ERROR",
            "error_description": "Card has expired: Check expiry date on physical card.",
            "error_reason": "card_expired",
            "method": "card",
            "card_last4": "8899",
            "expiry_month": 5,
            "expiry_year": 2026,
        },
        "network_error": {
            "error_code": "SERVER_ERROR",
            "error_description": "Issuer bank network timeout during 3D-Secure authentication handshake.",
            "error_reason": "issuer_timeout_91",
            "method": "upi",
            "card_last4": "1234",
        },
    }

    sc = scenario_map.get(scenario, scenario_map["insufficient_funds"])

    mock_payload = {
        "entity": "event",
        "account_id": "acc_RevenueShieldRazorpay01",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": f"pay_{uuid.uuid4().hex[:14]}",
                    "entity": "payment",
                    "amount": amount_paise,
                    "currency": "INR",
                    "status": "failed",
                    "order_id": f"order_{uuid.uuid4().hex[:12]}",
                    "method": sc.get("method", "card"),
                    "description": "Monthly SaaS Plan Billing",
                    "card": {
                        "id": f"card_{uuid.uuid4().hex[:12]}",
                        "entity": "card",
                        "name": name,
                        "last4": sc.get("card_last4", "4242"),
                        "network": "Visa",
                        "type": "credit",
                        "issuer": "HDFC",
                        "expiry_month": sc.get("expiry_month", 12),
                        "expiry_year": sc.get("expiry_year", 2028),
                    },
                    "email": email,
                    "contact": phone,
                    "error_code": sc["error_code"],
                    "error_description": sc["error_description"],
                    "error_source": "bank",
                    "error_step": "payment_authorization",
                    "error_reason": sc["error_reason"],
                    "created_at": int(datetime.now().timestamp()),
                }
            }
        },
    }

    return process_razorpay_payment_failed(mock_payload, db)
