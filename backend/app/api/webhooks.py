"""Payment Gateway Webhook Ingestion Router (Razorpay & Multi-Gateway)."""

import hmac
import hashlib
import json
import uuid
import random
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
from app.services.risk_engine import RiskEngine
from app.schemas.enums import FailureType, RiskStatus, ActorType
from app.services.audit_service import AuditService

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


def verify_razorpay_signature(raw_body: bytes, signature: Optional[str], secret: str) -> bool:
    """Verify HMAC SHA256 webhook signature if secret is configured."""
    if not secret:
        # Development / Sandbox mode: allow webhook without enforcing secret
        return True
    if not signature:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def process_razorpay_payment_failed(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
    """Extract payment.failed entity and create Customer, Transaction, and RevenueRisk."""
    payment_entity = (
        payload.get("payload", {})
        .get("payment", {})
        .get("entity", {})
    )
    if not payment_entity:
        # Fallback if payload root is the entity itself
        payment_entity = payload.get("entity", payload)

    razorpay_payment_id = payment_entity.get("id") or f"pay_{uuid.uuid4().hex[:14]}"
    raw_amount = payment_entity.get("amount", 0)
    currency = payment_entity.get("currency", "INR")

    # Razorpay amounts are in smallest currency units (paise / cents)
    amount = Decimal(str(raw_amount)) / Decimal("100") if raw_amount else Decimal("999.00")

    email = payment_entity.get("email") or f"customer_{uuid.uuid4().hex[:6]}@example.com"
    phone = payment_entity.get("contact") or "+919876543210"
    
    # Extract card details if available
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
        gateway_payload=payment_entity,
    )
    db.add(transaction)
    db.flush()

    # 4. Trigger RecoverAI Risk Engine
    risk = RiskEngine.process_failed_transaction(db=db, transaction_id=transaction.id)

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

    db.commit()

    return {
        "status": "success",
        "message": "Razorpay payment failure successfully ingested and analyzed by RecoverAI",
        "event": "payment.failed",
        "razorpay_payment_id": razorpay_payment_id,
        "transaction_id": str(transaction.id),
        "revenue_risk_id": str(risk.id),
        "detected_failure_type": risk.detected_failure_type,
        "amount": float(amount),
        "currency": currency,
        "customer": {
            "id": str(customer.id),
            "name": customer.name,
            "email": customer.email,
        },
    }


@router.post("/razorpay", summary="Ingest real-time Razorpay webhook events")
async def razorpay_webhook_handler(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
):
    """
    Ingest live Razorpay webhooks (payment.failed, order.paid, etc.).
    Automatically validates signature if RAZORPAY_WEBHOOK_SECRET is set.
    """
    raw_body = await request.body()

    # Validate HMAC signature
    if not verify_razorpay_signature(raw_body, x_razorpay_signature, settings.RAZORPAY_WEBHOOK_SECRET):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature verification failed.",
        )

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON webhook body.")

    event_name = payload.get("event")

    # Handle payment failure event
    if event_name == "payment.failed":
        return process_razorpay_payment_failed(payload, db)

    # Acknowledge other non-failure events gracefully (e.g. payment.captured, order.paid)
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

    name = req.customer_name or f"Priya Sharma"
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
        "account_id": "acc_RecoverAIRazorpay01",
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
                    "created_at": 1725200000,
                }
            }
        },
    }

    return process_razorpay_payment_failed(mock_payload, db)
