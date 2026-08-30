"""B2BReceivablesService managing overdue enterprise invoices, aging buckets, and Promise-to-Pay (PTP) tracking."""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.revenue_risk import RevenueRisk
from app.schemas.hackathon_usecases import (
    B2BReceivableInvoice,
    B2BReceivablesSummary,
    PromiseToPayRecord,
    PromiseToPayCreateRequest,
)
from app.services.audit_service import AuditService

# In-memory store for active Promise-to-Pay commitments (synced with db session)
_PTP_STORE: List[PromiseToPayRecord] = [
    PromiseToPayRecord(
        id="ptp_001",
        invoice_id="inv_corp_101",
        customer_id="cust_001",
        customer_name="TechMatrix Corp",
        promised_amount=Decimal("12500.00"),
        promised_date=(datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
        status="ACTIVE_PROMISE",
        channel_committed="VOICE_CALL",
        operator_notes="CFO confirmed NEFT transfer scheduled upon purchase order sign-off.",
        dunning_paused=True,
        created_at=(datetime.now(timezone.utc) - timedelta(hours=6)).isoformat(),
    ),
    PromiseToPayRecord(
        id="ptp_002",
        invoice_id="inv_corp_104",
        customer_id="cust_004",
        customer_name="Starlight Logistics Ltd",
        promised_amount=Decimal("4800.00"),
        promised_date=(datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d"),
        status="BROKEN",
        channel_committed="WHATSAPP",
        operator_notes="Customer committed to pay on the 28th. No settlement received. Flagged for escalation.",
        dunning_paused=False,
        created_at=(datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
    ),
]


class B2BReceivablesService:
    """Service handling B2B corporate receivables, multi-tier aging analysis, and promise-to-pay lifecycles."""

    @classmethod
    def get_summary(cls, db: Session) -> B2BReceivablesSummary:
        """Calculate B2B receivables overview across aging buckets (0-30d, 31-60d, 61-90d, 90d+)."""
        customers = db.query(Customer).limit(10).all()

        invoices: List[B2BReceivableInvoice] = [
            B2BReceivableInvoice(
                id="inv_corp_101",
                invoice_number="INV-2026-8801",
                po_number="PO-US-99120",
                customer_id=str(customers[0].id) if customers else "cust_001",
                customer_name=customers[0].name if customers else "Acme Global Systems",
                company_name="Acme Global Systems Inc.",
                amount_due=Decimal("18450.00"),
                currency="USD",
                due_date=(datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%d"),
                days_overdue=14,
                aging_bucket="CURRENT_0_30",
                status="PROMISE_TO_PAY",
                has_active_promise=True,
                active_promise_date=(datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d"),
                recommended_action="PAUSE_DUNNING_AWAIT_PTP",
                ai_risk_score=28,
                is_vip=True,
            ),
            B2BReceivableInvoice(
                id="inv_corp_102",
                invoice_number="INV-2026-8742",
                po_number="PO-EU-44018",
                customer_id=str(customers[1].id) if len(customers) > 1 else "cust_002",
                customer_name=customers[1].name if len(customers) > 1 else "CloudSphere Networks",
                company_name="CloudSphere Networks GmbH",
                amount_due=Decimal("34200.00"),
                currency="USD",
                due_date=(datetime.now(timezone.utc) - timedelta(days=42)).strftime("%Y-%m-%d"),
                days_overdue=42,
                aging_bucket="OVERDUE_31_60",
                status="ESCALATED_HUMAN",
                has_active_promise=False,
                recommended_action="WHITE_GLOVE_ACCOUNT_DIRECTOR_CALL",
                ai_risk_score=68,
                is_vip=True,
            ),
            B2BReceivableInvoice(
                id="inv_corp_103",
                invoice_number="INV-2026-8619",
                po_number="PO-APAC-3392",
                customer_id=str(customers[2].id) if len(customers) > 2 else "cust_003",
                customer_name=customers[2].name if len(customers) > 2 else "Apex Retail Solutions",
                company_name="Apex Retail Pvt Ltd",
                amount_due=Decimal("9800.00"),
                currency="USD",
                due_date=(datetime.now(timezone.utc) - timedelta(days=78)).strftime("%Y-%m-%d"),
                days_overdue=78,
                aging_bucket="CRITICAL_61_90",
                status="DISPUTED",
                dispute_reason="Customer requested PO line-item quantity re-validation",
                has_active_promise=False,
                recommended_action="ISSUE_REVISED_STATEMENT_SCHEDULE_SETTLEMENT",
                ai_risk_score=75,
                is_vip=False,
            ),
            B2BReceivableInvoice(
                id="inv_corp_104",
                invoice_number="INV-2026-8410",
                po_number="PO-US-11094",
                customer_id=str(customers[3].id) if len(customers) > 3 else "cust_004",
                customer_name=customers[3].name if len(customers) > 3 else "Starlight Logistics Ltd",
                company_name="Starlight Logistics Ltd",
                amount_due=Decimal("4800.00"),
                currency="USD",
                due_date=(datetime.now(timezone.utc) - timedelta(days=105)).strftime("%Y-%m-%d"),
                days_overdue=105,
                aging_bucket="DEFAULT_RISK_90_PLUS",
                status="UNPAID",
                has_active_promise=False,
                recommended_action="LEGAL_NOTICE_OR_COLLECTIONS_ESCALATION",
                ai_risk_score=92,
                is_vip=False,
            ),
            B2BReceivableInvoice(
                id="inv_corp_105",
                invoice_number="INV-2026-8902",
                po_number="PO-IN-88912",
                customer_id=str(customers[4].id) if len(customers) > 4 else "cust_005",
                customer_name=customers[4].name if len(customers) > 4 else "Bharat Infra Solutions",
                company_name="Bharat Infrastructure Tech Ltd",
                amount_due=Decimal("22000.00"),
                currency="USD",
                due_date=(datetime.now(timezone.utc) - timedelta(days=8)).strftime("%Y-%m-%d"),
                days_overdue=8,
                aging_bucket="CURRENT_0_30",
                status="UNPAID",
                has_active_promise=False,
                recommended_action="SEND_DISCOUNTED_EARLY_SETTLEMENT_LINK",
                ai_risk_score=35,
                is_vip=True,
            ),
        ]

        current_vol = sum((inv.amount_due for inv in invoices if inv.aging_bucket == "CURRENT_0_30"), Decimal("0"))
        overdue_vol = sum((inv.amount_due for inv in invoices if inv.aging_bucket == "OVERDUE_31_60"), Decimal("0"))
        crit_vol = sum((inv.amount_due for inv in invoices if inv.aging_bucket == "CRITICAL_61_90"), Decimal("0"))
        default_vol = sum((inv.amount_due for inv in invoices if inv.aging_bucket == "DEFAULT_RISK_90_PLUS"), Decimal("0"))
        total_risk = current_vol + overdue_vol + crit_vol + default_vol

        active_ptps = [p for p in _PTP_STORE if p.status == "ACTIVE_PROMISE"]
        broken_ptps = [p for p in _PTP_STORE if p.status == "BROKEN"]

        return B2BReceivablesSummary(
            total_receivables_at_risk=total_risk,
            total_invoices_count=len(invoices),
            current_bucket_amount=current_vol,
            overdue_bucket_amount=overdue_vol,
            critical_bucket_amount=crit_vol,
            default_risk_bucket_amount=default_vol,
            active_ptp_count=len(active_ptps),
            active_ptp_volume=sum((p.promised_amount for p in active_ptps), Decimal("0")),
            broken_ptp_count=len(broken_ptps),
            human_escalations_count=len([inv for inv in invoices if inv.status == "ESCALATED_HUMAN"]),
            invoices=invoices,
            recent_promises=_PTP_STORE,
        )

    @classmethod
    def record_promise_to_pay(
        cls,
        db: Session,
        req: PromiseToPayCreateRequest,
    ) -> PromiseToPayRecord:
        """Log a new promise-to-pay commitment, pause automated dunning sequences, and write to audit trail."""
        ptp_id = f"ptp_{uuid.uuid4().hex[:8]}"
        customer_uuid = None
        cname = "Enterprise Customer"
        try:
            customer_uuid = uuid.UUID(str(req.customer_id))
            customer = db.query(Customer).filter(Customer.id == customer_uuid).first()
            if customer:
                cname = customer.name
        except Exception:
            first_c = db.query(Customer).first()
            if first_c:
                cname = first_c.name
                customer_uuid = first_c.id

        record = PromiseToPayRecord(
            id=ptp_id,
            invoice_id=req.invoice_id,
            customer_id=req.customer_id,
            customer_name=cname,
            promised_amount=req.promised_amount,
            promised_date=req.promised_date,
            status="ACTIVE_PROMISE",
            channel_committed=req.channel,
            operator_notes=req.operator_notes,
            dunning_paused=True,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        _PTP_STORE.insert(0, record)

        AuditService.log_event(
            db=db,
            actor="B2B_RECEIVABLES_ENGINE",
            step_name="PROMISE_TO_PAY_RECORDED",
            customer_id=customer_uuid,
            recommended_action="PAUSE_DUNNING_AWAIT_PTP",
            decision_payload={
                "ptp_id": ptp_id,
                "invoice_id": req.invoice_id,
                "promised_amount": float(req.promised_amount),
                "promised_date": req.promised_date,
                "dunning_action": "PAUSED_UNTIL_DATE",
            },
        )

        return record

    @classmethod
    def fulfill_promise_to_pay(
        cls,
        db: Session,
        ptp_id: str,
    ) -> PromiseToPayRecord:
        """Mark a promise-to-pay commitment as successfully fulfilled/collected."""
        for p in _PTP_STORE:
            if p.id == ptp_id:
                p.status = "FULFILLED"
                p.dunning_paused = False
                AuditService.log_event(
                    db=db,
                    actor="B2B_RECEIVABLES_ENGINE",
                    step_name="PROMISE_TO_PAY_FULFILLED",
                    result="SUCCESS_COLLECTED",
                    amount_recovered=p.promised_amount,
                    decision_payload={"ptp_id": ptp_id, "amount": float(p.promised_amount)},
                )
                return p
        raise ValueError(f"PromiseToPay record {ptp_id} not found")
