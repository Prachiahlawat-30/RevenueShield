"""Synthetic database seeder creating realistic customer failure personas across multiple merchants, gateways, and failure categories."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.models.audit_log import AuditLog
from app.models.merchant import Merchant
from app.models.payment_incident import PaymentIncident
from app.models.recovery_experiment import RecoveryExperiment, RecoveryExperimentAssignment
from app.services.risk_engine import RiskEngine


DETERMINISTIC_NAMESPACE = uuid.UUID("a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d")

MERCHANT_IDS = {
    "techcorp": uuid.uuid5(DETERMINISTIC_NAMESPACE, "merchant.techcorp"),
    "fashionkart": uuid.uuid5(DETERMINISTIC_NAMESPACE, "merchant.fashionkart"),
    "cloudstream": uuid.uuid5(DETERMINISTIC_NAMESPACE, "merchant.cloudstream"),
}
POLICY_ID = uuid.uuid5(DETERMINISTIC_NAMESPACE, "policy.default")
INCIDENT_ID = uuid.uuid5(DETERMINISTIC_NAMESPACE, "incident.0")
EXPERIMENT_ID = uuid.uuid5(DETERMINISTIC_NAMESPACE, "experiment.0")


def seed_database(db: Session, reset: bool = False) -> Dict[str, int]:
    """Populate database with default policies, merchants, customers, incidents, experiments, and payment failure scenarios."""
    if reset:
        db.query(RecoveryExperimentAssignment).delete()
        db.query(RecoveryExperiment).delete()
        db.query(PaymentIncident).delete()
        db.query(AuditLog).delete()
        db.query(RecoveryAttempt).delete()
        db.query(RevenueRisk).delete()
        db.query(Transaction).delete()
        db.query(Customer).delete()
        db.query(Merchant).delete()
        db.query(Policy).delete()
        db.flush()

    # 1. Ensure Default Policy exists
    default_policy = db.query(Policy).filter_by(rule_code="DEFAULT_PAYMENT_FAILURE_POLICY").first()
    if not default_policy:
        default_policy = Policy(
            id=POLICY_ID,
            name="Default SaaS Payment Failure Policy",
            rule_code="DEFAULT_PAYMENT_FAILURE_POLICY",
            max_attempts=3,
            cooldown_seconds=86400,  # 24 hours
            max_auto_recovery_amount=Decimal("1000.00"),
            is_active=True,
        )
        db.add(default_policy)
        db.flush()

    # 2. Seed Merchants
    merchant_defs = {
        "techcorp": {
            "id": MERCHANT_IDS["techcorp"],
            "external_id": "MERCH_TECHCORP",
            "name": "TechCorp Cloud Solutions",
            "code": "TECHCORP",
            "tier": "enterprise",
            "industry": "B2B SaaS",
        },
        "fashionkart": {
            "id": MERCHANT_IDS["fashionkart"],
            "external_id": "MERCH_FASHIONKART",
            "name": "FashionKart Retail",
            "code": "FASHIONKART",
            "tier": "growth",
            "industry": "E-Commerce",
        },
        "cloudstream": {
            "id": MERCHANT_IDS["cloudstream"],
            "external_id": "MERCH_CLOUDSTREAM",
            "name": "CloudStream Media",
            "code": "CLOUDSTREAM",
            "tier": "enterprise",
            "industry": "Digital Media",
        },
    }

    merchants = {}
    for key, cfg in merchant_defs.items():
        existing = db.query(Merchant).filter(
            (Merchant.id == cfg["id"]) | (Merchant.code == cfg["code"]) | (Merchant.external_id == cfg["external_id"])
        ).first()
        if not existing:
            existing = Merchant(**cfg)
            db.add(existing)
            db.flush()
        merchants[key] = existing

    # 3. Seed 7 Distinct Customer & Failure Scenarios
    scenarios = [
        # Case 1: Temporary Bank Decline ($120.00 - Resolves on 1st Retry)
        {
            "merchant_id": merchants["techcorp"].id,
            "customer": {
                "name": "TechCorp Solutions",
                "email": "billing@techcorp.io",
                "phone": "+1-415-555-0101",
                "payment_method_type": "credit_card",
                "card_last4": "4242",
                "card_expiry": "12/28",
                "is_opted_out": False,
                "risk_score": Decimal("12.00"),
            },
            "transaction": {
                "amount": Decimal("120.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "temporary_decline",
                "failure_reason": "Bank soft decline: Suspicious activity flag temporarily triggered",
                "gateway_name": "Gateway A",
                "payment_method": "credit_card",
            },
        },
        # Case 2: Insufficient Funds Progression ($89.00 - Day 1 Decline, Day 3 Success)
        {
            "merchant_id": merchants["fashionkart"].id,
            "customer": {
                "name": "Sarah Jenkins",
                "email": "sarah.jenkins@designco.agency",
                "phone": "+1-312-555-0144",
                "payment_method_type": "credit_card",
                "card_last4": "1881",
                "card_expiry": "04/27",
                "is_opted_out": False,
                "risk_score": Decimal("28.00"),
            },
            "transaction": {
                "amount": Decimal("89.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "insufficient_funds",
                "failure_reason": "Cardholder account balance below required transaction threshold",
                "gateway_name": "Gateway A",
                "payment_method": "upi",
            },
        },
        # Case 3: Expired Card ($49.00 - Requires Card Update)
        {
            "merchant_id": merchants["cloudstream"].id,
            "customer": {
                "name": "Marcus Vance",
                "email": "marcus.vance@gmail.com",
                "phone": "+1-206-555-0199",
                "payment_method_type": "credit_card",
                "card_last4": "3321",
                "card_expiry": "05/26",
                "is_opted_out": False,
                "risk_score": Decimal("45.00"),
            },
            "transaction": {
                "amount": Decimal("49.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "expired_card",
                "failure_reason": "Payment method expiration date (05/26) has lapsed",
                "gateway_name": "Gateway B",
                "payment_method": "credit_card",
            },
        },
        # Case 4: Network Gateway Timeout ($199.00 - Recovers on Retry)
        {
            "merchant_id": merchants["techcorp"].id,
            "customer": {
                "name": "Apex Logistics Global",
                "email": "finance@apexlogistics.com",
                "phone": "+1-713-555-0182",
                "payment_method_type": "ach",
                "card_last4": "9012",
                "card_expiry": "09/29",
                "is_opted_out": False,
                "risk_score": Decimal("8.00"),
            },
            "transaction": {
                "amount": Decimal("199.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "network_error",
                "failure_reason": "HTTP 504 Gateway Timeout during processor transaction settlement",
                "gateway_name": "Gateway A",
                "payment_method": "ach",
            },
        },
        # Case 5: High Value Invoice ($1,500.00 - Human Escalation Triggered)
        {
            "merchant_id": merchants["techcorp"].id,
            "customer": {
                "name": "Global Horizon Ventures",
                "email": "accounts@globalhorizon.vc",
                "phone": "+1-212-555-0110",
                "payment_method_type": "credit_card",
                "card_last4": "7733",
                "card_expiry": "11/27",
                "is_opted_out": False,
                "risk_score": Decimal("18.00"),
            },
            "transaction": {
                "amount": Decimal("1500.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "temporary_decline",
                "failure_reason": "High-value velocity check triggered by issuing bank",
                "gateway_name": "Gateway B",
                "payment_method": "credit_card",
            },
        },
        # Case 6: Opted-Out Customer ($250.00 - Policy Stop Enforced)
        {
            "merchant_id": merchants["fashionkart"].id,
            "customer": {
                "name": "Elena Rostova",
                "email": "elena.rostova@consulting.org",
                "phone": "+1-617-555-0167",
                "payment_method_type": "credit_card",
                "card_last4": "5512",
                "card_expiry": "08/28",
                "is_opted_out": True,
                "risk_score": Decimal("65.00"),
            },
            "transaction": {
                "amount": Decimal("250.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "insufficient_funds",
                "failure_reason": "Cardholder requested exclusion from automated billing retries",
                "gateway_name": "Gateway A",
                "payment_method": "credit_card",
            },
        },
        # Case 7: Unknown Error Code ($320.00 - Diagnostic Fallback Desk)
        {
            "merchant_id": merchants["cloudstream"].id,
            "customer": {
                "name": "QuantPulse Analytics",
                "email": "billing@quantpulse.ai",
                "phone": "+1-408-555-0133",
                "payment_method_type": "credit_card",
                "card_last4": "6644",
                "card_expiry": "01/30",
                "is_opted_out": False,
                "risk_score": Decimal("35.00"),
            },
            "transaction": {
                "amount": Decimal("320.00"),
                "currency": "USD",
                "status": "failed",
                "failure_code": "unknown_failure",
                "failure_reason": "Processor ISO 8583 response code 99: Unclassified issuer rejection",
                "gateway_name": "Gateway C",
                "payment_method": "credit_card",
            },
        },
    ]

    created_risks = []
    for idx, sc in enumerate(scenarios):
        cust_data = sc["customer"]
        cust_id = uuid.uuid5(DETERMINISTIC_NAMESPACE, f"customer.{idx}")
        tx_id = uuid.uuid5(DETERMINISTIC_NAMESPACE, f"transaction.{idx}")
        risk_id = uuid.uuid5(DETERMINISTIC_NAMESPACE, f"risk.{idx}")

        cust = db.query(Customer).filter_by(id=cust_id).first()
        if not cust:
            cust = db.query(Customer).filter_by(external_id=f"CUST_EXT_{idx+1:03d}").first()
        if not cust:
            cust = Customer(
                id=cust_id,
                merchant_id=sc["merchant_id"],
                external_id=f"CUST_EXT_{idx+1:03d}",
                name=cust_data["name"],
                email=cust_data["email"],
                phone=cust_data["phone"],
                payment_method_type=cust_data["payment_method_type"],
                card_last4=cust_data["card_last4"],
                card_expiry=cust_data["card_expiry"],
                is_opted_out=cust_data["is_opted_out"],
                risk_score=cust_data["risk_score"],
            )
            db.add(cust)
            db.flush()

        tx_data = sc["transaction"]
        tx = db.query(Transaction).filter_by(id=tx_id).first()
        if not tx:
            tx = Transaction(
                id=tx_id,
                customer_id=cust.id,
                amount=tx_data["amount"],
                currency=tx_data["currency"],
                status=tx_data["status"],
                failure_code=tx_data["failure_code"],
                failure_reason=tx_data["failure_reason"],
                gateway_name=tx_data["gateway_name"],
                payment_method=tx_data["payment_method"],
                gateway_payload={"issuer_response": tx_data["failure_code"]},
            )
            db.add(tx)
            db.flush()

        risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
        if not risk:
            risk = db.query(RevenueRisk).filter_by(transaction_id=tx.id).first()
        if not risk:
            risk = RiskEngine.process_failed_transaction(db, tx.id, risk_id=risk_id)
        created_risks.append(risk)

    # 4. Seed Active Payment Incident
    incident = db.query(PaymentIncident).filter_by(id=INCIDENT_ID).first()
    if not incident:
        incident = PaymentIncident(
            id=INCIDENT_ID,
            incident_code="INC-20260901-01",
            title="Payment Gateway Degradation — Gateway A Timeout Spike",
            severity="HIGH",
            status="ACTIVE",
            affected_gateway="Gateway A",
            affected_payment_method="UPI",
            failure_types=["network_error", "temporary_decline"],
            estimated_revenue_impact=Decimal("870000.00"),
            root_cause_summary="Upstream processor network communication timeout surge on Gateway A (North India routing cluster).",
            confidence=Decimal("0.780"),
            evidence_list=[
                "Failure rate increased 4.8× in the last 30 minutes (current: 18.2% vs baseline: 3.8%)",
                "Timeout failures +340% concentrated in Gateway A",
                "Gateway B and Razorpay rails remain unaffected (<1.1% timeout rates)",
                "Anomaly started 31 minutes ago during peak business transaction window",
            ],
            detected_at=datetime.now(timezone.utc),
        )
        db.add(incident)
        db.flush()

    # 5. Seed A/B Experiment & Assignments
    experiment = db.query(RecoveryExperiment).filter_by(id=EXPERIMENT_ID).first()
    if not experiment:
        experiment = RecoveryExperiment(
            id=EXPERIMENT_ID,
            name="Retry Timing Optimization — Immediate vs 6-Hour Smart Delay",
            description="Comparing immediate re-attempt against 6-hour intelligent delayed retry for transient declines.",
            strategy_a="immediate_retry",
            strategy_b="timed_retry_6h",
            traffic_percentage=50,
            status="ACTIVE",
        )
        db.add(experiment)
        db.flush()

    # Assign risks to experiment
    for idx, r in enumerate(created_risks):
        assign_id = uuid.uuid5(DETERMINISTIC_NAMESPACE, f"assignment.{idx}")
        assignment = db.query(RecoveryExperimentAssignment).filter_by(id=assign_id).first()
        if not assignment:
            variant = "treatment" if idx % 2 == 0 else "control"
            strat = experiment.strategy_b if variant == "treatment" else experiment.strategy_a
            assignment = RecoveryExperimentAssignment(
                id=assign_id,
                experiment_id=experiment.id,
                revenue_risk_id=r.id,
                assigned_strategy=strat,
                variant=variant,
            )
            db.add(assignment)

    db.commit()

    return {
        "seeded_customers": len(scenarios),
        "seeded_transactions": len(scenarios),
        "seeded_risks": len(created_risks),
        "merchants": len(merchants),
        "customers": len(scenarios),
        "transactions": len(scenarios),
        "revenue_risks": len(created_risks),
        "policies": 1,
        "incidents": 1,
        "experiments": 1,
    }


if __name__ == "__main__":
    from app.core.database import SessionLocal
    with SessionLocal() as session:
        print("Seeding RecoverAI Tier 2 database...")
        res = seed_database(session, reset=True)
        print(f"Seeding completed successfully: {res}")
