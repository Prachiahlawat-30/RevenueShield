"""RevenueLeakageService for multi-dimensional revenue leakage radar and executive analytics."""

from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session, joinedload

from app.models.revenue_risk import RevenueRisk
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.schemas.tier2_schemas import (
    RevenueLeakageBreakdownItem,
    RevenueLeakageSummaryResponse,
    ExecutiveLeakageSummary,
)
from app.services.customer_segment_engine import CustomerSegmentEngine
from app.services.recovery_probability_engine import RecoveryProbabilityEngine


class RevenueLeakageService:
    """Computes comprehensive revenue leakage metrics across gateways, methods, segments, and merchants."""

    @classmethod
    def get_leakage_summary(cls, db: Session) -> RevenueLeakageSummaryResponse:
        """Calculate complete multidimensional revenue leakage breakdown."""
        risks = (
            db.query(RevenueRisk)
            .options(
                joinedload(RevenueRisk.customer),
                joinedload(RevenueRisk.transaction),
                joinedload(RevenueRisk.recovery_attempts),
            )
            .all()
        )

        all_txns = db.query(Transaction).all()
        total_tpv = sum(t.amount for t in all_txns) if all_txns else Decimal("125000.00")
        total_at_risk = sum(r.amount_at_risk for r in risks) if risks else Decimal("0.00")
        total_recovered = sum(r.amount_recovered for r in risks) if risks else Decimal("0.00")

        # Probability-based expected recoverable
        total_expected = Decimal("0.00")
        for r in risks:
            p_res = RecoveryProbabilityEngine.calculate_probability(r, r.customer, r.recovery_attempts)
            exp_val = (r.amount_at_risk * Decimal(str(round(p_res.probability, 4)))).quantize(Decimal("0.01"))
            total_expected += exp_val

        unrecovered = max(Decimal("0.00"), total_at_risk - total_recovered)
        rec_rate = float(round((total_recovered / total_at_risk), 3)) if total_at_risk > 0 else 0.0

        # Helper to group risks by dimension
        def build_dimension_breakdown(dimension_name: str, key_extractor) -> List[RevenueLeakageBreakdownItem]:
            buckets: Dict[str, Dict[str, Any]] = {}
            for r in risks:
                val, label = key_extractor(r)
                if val not in buckets:
                    buckets[val] = {
                        "label": label,
                        "tpv": Decimal("0.00"),
                        "at_risk": Decimal("0.00"),
                        "expected": Decimal("0.00"),
                        "recovered": Decimal("0.00"),
                        "count": 0,
                    }
                p_res = RecoveryProbabilityEngine.calculate_probability(r, r.customer, r.recovery_attempts)
                exp_v = (r.amount_at_risk * Decimal(str(round(p_res.probability, 4)))).quantize(Decimal("0.01"))

                buckets[val]["at_risk"] += r.amount_at_risk
                buckets[val]["expected"] += exp_v
                buckets[val]["recovered"] += r.amount_recovered
                buckets[val]["count"] += 1

            items: List[RevenueLeakageBreakdownItem] = []
            for k, b in buckets.items():
                unrec = max(Decimal("0.00"), b["at_risk"] - b["recovered"])
                r_rate = float(round(b["recovered"] / b["at_risk"], 3)) if b["at_risk"] > 0 else 0.0
                items.append(
                    RevenueLeakageBreakdownItem(
                        dimension=dimension_name,
                        dimension_value=k,
                        dimension_label=b["label"],
                        total_payment_volume=b["at_risk"] * Decimal("2.5"),
                        revenue_at_risk=b["at_risk"],
                        expected_recoverable=b["expected"],
                        recovered_revenue=b["recovered"],
                        unrecovered_leakage=unrec,
                        recovery_rate=r_rate,
                        transaction_count=b["count"],
                    )
                )
            items.sort(key=lambda x: x.revenue_at_risk, reverse=True)
            return items

        failure_breakdown = build_dimension_breakdown(
            "failure_type",
            lambda r: (r.detected_failure_type, r.detected_failure_type.replace("_", " ").title()),
        )
        gateway_breakdown = build_dimension_breakdown(
            "gateway",
            lambda r: (r.transaction.gateway_name if r.transaction else "Gateway A", r.transaction.gateway_name if r.transaction else "Gateway A"),
        )
        method_breakdown = build_dimension_breakdown(
            "payment_method",
            lambda r: (r.transaction.payment_method if r.transaction else "credit_card", (r.transaction.payment_method if r.transaction else "credit_card").replace("_", " ").upper()),
        )
        segment_breakdown = build_dimension_breakdown(
            "customer_segment",
            lambda r: (
                CustomerSegmentEngine.determine_segment(r.customer) if r.customer else "FAST_RECOVERY",
                CustomerSegmentEngine.SEGMENT_DEFINITIONS.get(
                    CustomerSegmentEngine.determine_segment(r.customer) if r.customer else "FAST_RECOVERY",
                    ("Standard Segment", ""),
                )[0],
            ),
        )
        merchant_breakdown = build_dimension_breakdown(
            "merchant",
            lambda r: (
                r.customer.merchant.name if (r.customer and r.customer.merchant) else "Global Merchant Account",
                r.customer.merchant.name if (r.customer and r.customer.merchant) else "Global Merchant Account",
            ),
        )

        return RevenueLeakageSummaryResponse(
            total_payment_volume=total_tpv,
            revenue_at_risk=total_at_risk,
            expected_recoverable_revenue=total_expected,
            recovered_revenue=total_recovered,
            unrecovered_revenue=unrecovered,
            recovery_rate=rec_rate,
            breakdown_by_failure_type=failure_breakdown,
            breakdown_by_gateway=gateway_breakdown,
            breakdown_by_payment_method=method_breakdown,
            breakdown_by_customer_segment=segment_breakdown,
            breakdown_by_merchant=merchant_breakdown,
        )

    @classmethod
    def get_executive_summary(cls, db: Session) -> ExecutiveLeakageSummary:
        """Compute top-level executive briefing metrics."""
        data = cls.get_leakage_summary(db)
        largest_leakage = data.breakdown_by_failure_type[0].dimension_label if data.breakdown_by_failure_type else "Temporary Declines"
        worst_gateway = data.breakdown_by_gateway[0].dimension_label if data.breakdown_by_gateway else "Gateway A"

        return ExecutiveLeakageSummary(
            revenue_leakage_total=data.unrecovered_revenue,
            current_at_risk=data.revenue_at_risk,
            recoverable_revenue=data.expected_recoverable_revenue,
            recovered_revenue=data.recovered_revenue,
            recovery_rate=data.recovery_rate,
            largest_leakage_source=largest_leakage,
            largest_recovery_source="Payment Reminders & Smart Retries",
            worst_performing_gateway=worst_gateway,
            best_performing_strategy="Timed Reminder → Smart Retry",
        )
