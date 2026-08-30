"""RecoveryIntelligenceService for aggregating intelligence metrics and logging audit decisions."""

import uuid
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session, joinedload

from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.schemas.enums import ActorType
from app.schemas.recovery_intelligence import (
    RecoveryProbabilityResult,
    RecoveryPriorityResult,
    ExpectedRecoveryResult,
    NextBestActionResult,
    RetryTimingResult,
    RecoveryOpportunityItem,
    RecoveryIntelligenceSummary,
)
from app.services.recovery_probability_engine import RecoveryProbabilityEngine
from app.services.recovery_priority_engine import RecoveryPriorityEngine
from app.services.expected_recovery_engine import ExpectedRecoveryEngine
from app.services.next_best_action_engine import NextBestActionEngine
from app.services.retry_timing_engine import RetryTimingEngine
from app.services.policy_engine import PolicyEngine
from app.services.audit_service import AuditService


class RecoveryIntelligenceService:
    """Service layer orchestrating all recovery intelligence engines."""

    @classmethod
    def evaluate_risk_intelligence(
        cls,
        risk: RevenueRisk,
        customer: Optional[Customer] = None,
        past_attempts: Optional[List[RecoveryAttempt]] = None,
        policy: Optional[Policy] = None,
    ) -> RecoveryOpportunityItem:
        """Run full intelligence pipeline on a RevenueRisk entity."""
        customer = customer or risk.customer
        past_attempts = past_attempts if past_attempts is not None else (risk.recovery_attempts or [])

        # 1. Probability Engine
        prob_res = RecoveryProbabilityEngine.calculate_probability(
            risk=risk,
            customer=customer,
            past_attempts=past_attempts,
        )

        # 2. Priority Engine
        prio_res = RecoveryPriorityEngine.calculate_priority(
            risk=risk,
            probability_result=prob_res,
            customer=customer,
            past_attempts=past_attempts,
        )

        # 3. Expected Recovery Engine
        exp_res = ExpectedRecoveryEngine.calculate_expected_recovery(
            transaction_amount=risk.amount_at_risk,
            recovery_probability=prob_res.probability,
        )

        # 4. Next Best Action Engine
        nba_res = NextBestActionEngine.evaluate_actions(
            risk=risk,
            customer=customer,
            past_attempts=past_attempts,
            base_probability=prob_res.probability,
        )

        # 5. Timing Engine
        timing_res = RetryTimingEngine.calculate_recommended_timing(
            risk=risk,
            customer=customer,
            past_attempts=past_attempts,
        )

        # 6. Policy Check Preview
        policy_preview = PolicyEngine.evaluate(
            risk=risk,
            customer=customer or Customer(id=uuid.uuid4(), external_id="", name="", email="", is_opted_out=False),
            proposed_action=nba_res.recommended_action,
            past_attempts=past_attempts,
            policy=policy,
            ignore_cooldown_for_demo=True,
        )

        failure_labels = {
            "temporary_decline": "Temporary Bank Decline",
            "insufficient_funds": "Insufficient Funds",
            "expired_card": "Expired Card",
            "network_error": "Network Gateway Timeout",
            "unknown_failure": "Unknown Failure Code",
        }

        return RecoveryOpportunityItem(
            risk_id=risk.id,
            customer_id=risk.customer_id,
            customer_name=customer.name if customer else "Unknown Customer",
            customer_email=customer.email if customer else "unknown@customer.com",
            customer_risk_score=customer.risk_score if customer else Decimal("0.00"),
            is_opted_out=customer.is_opted_out if customer else False,
            transaction_id=risk.transaction_id,
            transaction_amount=risk.amount_at_risk,
            currency=risk.currency,
            failure_type=risk.detected_failure_type,
            failure_type_label=failure_labels.get(risk.detected_failure_type, risk.detected_failure_type),
            failure_reason=risk.transaction.failure_reason if risk.transaction else None,
            status=risk.status,
            attempt_count=risk.attempt_count,
            created_at=risk.created_at.isoformat() if risk.created_at else "",
            recovery_probability=prob_res.probability,
            recoverability_score=prob_res.score,
            priority_score=prio_res.priority_score,
            priority_band=prio_res.priority_band,
            expected_recovery_value=exp_res.expected_recovery_value,
            expected_loss=exp_res.expected_loss,
            recommended_action=nba_res.recommended_action,
            recommended_action_label=nba_res.recommended_action_label,
            recommended_delay_hours=timing_res.recommended_delay_hours,
            recommended_delay_label=timing_res.recommended_delay_label,
            confidence=prob_res.confidence,
            reason=nba_res.reason,
            positive_factors=prob_res.positive_factors,
            negative_factors=prob_res.negative_factors,
            candidates=nba_res.candidates,
            policy_preview=policy_preview,
        )

    @classmethod
    def get_summary_metrics(cls, db: Session) -> RecoveryIntelligenceSummary:
        """Compute aggregated summary metrics from actual database risk cases."""
        risks = (
            db.query(RevenueRisk)
            .options(
                joinedload(RevenueRisk.customer),
                joinedload(RevenueRisk.transaction),
                joinedload(RevenueRisk.recovery_attempts),
            )
            .all()
        )

        active_policy = db.query(Policy).filter_by(is_active=True).first()

        total_at_risk = Decimal("0.00")
        total_expected_recovery = Decimal("0.00")
        total_expected_loss = Decimal("0.00")
        total_prob_sum = 0.0
        critical_count = 0
        high_count = 0

        action_counts: Dict[str, int] = {
            "retry_payment": 0,
            "send_payment_reminder": 0,
            "request_payment_method_update": 0,
            "escalate_to_human": 0,
            "stop": 0,
        }

        priority_counts: Dict[str, int] = {
            "CRITICAL": 0,
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0,
        }

        # By failure type
        type_stats: Dict[str, Dict[str, Any]] = {}

        for r in risks:
            total_at_risk += r.amount_at_risk
            opp = cls.evaluate_risk_intelligence(r, r.customer, r.recovery_attempts, active_policy)

            total_expected_recovery += opp.expected_recovery_value
            total_expected_loss += opp.expected_loss
            total_prob_sum += opp.recovery_probability

            if opp.priority_band == "CRITICAL":
                critical_count += 1
            elif opp.priority_band == "HIGH":
                high_count += 1

            action_key = opp.recommended_action.value
            if action_key in action_counts:
                action_counts[action_key] += 1

            if opp.priority_band in priority_counts:
                priority_counts[opp.priority_band] += 1

            # Accumulate by failure type
            ft = r.detected_failure_type
            if ft not in type_stats:
                type_stats[ft] = {
                    "failure_type": ft,
                    "failure_type_label": opp.failure_type_label,
                    "count": 0,
                    "amount_at_risk": Decimal("0.00"),
                    "expected_recovery": Decimal("0.00"),
                    "prob_sum": 0.0,
                }
            type_stats[ft]["count"] += 1
            type_stats[ft]["amount_at_risk"] += r.amount_at_risk
            type_stats[ft]["expected_recovery"] += opp.expected_recovery_value
            type_stats[ft]["prob_sum"] += opp.recovery_probability

        total_count = len(risks)
        avg_prob = round(total_prob_sum / total_count, 2) if total_count > 0 else 0.0

        expected_by_failure_type = []
        for ft, stats in type_stats.items():
            cnt = stats["count"]
            expected_by_failure_type.append({
                "failure_type": ft,
                "failure_type_label": stats["failure_type_label"],
                "count": cnt,
                "amount_at_risk": str(stats["amount_at_risk"]),
                "expected_recovery": str(stats["expected_recovery"]),
                "average_probability": round(stats["prob_sum"] / cnt, 2) if cnt > 0 else 0.0,
            })

        # Calculate actual recoverable, actionable, and recovered
        recovered_total = sum(r.amount_recovered for r in risks)
        actionable_total = sum(
            r.amount_at_risk for r in risks if r.status in ["detected", "diagnosing", "action_selected", "recovering"]
        )

        recovery_funnel = [
            {"stage": "Revenue At Risk", "amount": str(total_at_risk), "description": "Total failed transaction exposure identified"},
            {"stage": "Recoverable Revenue", "amount": str(total_expected_recovery), "description": "Probabilistically recoverable after intervention"},
            {"stage": "Actionable Target", "amount": str(actionable_total), "description": "Active pipeline unblocked by stopping rules"},
            {"stage": "Revenue Recovered", "amount": str(recovered_total), "description": "Actual settled recovery recorded by gateway"},
        ]

        return RecoveryIntelligenceSummary(
            total_revenue_at_risk=total_at_risk,
            expected_recoverable_revenue=total_expected_recovery,
            expected_loss_total=total_expected_loss,
            average_recovery_probability=avg_prob,
            high_priority_opportunities=high_count,
            critical_opportunities=critical_count,
            total_risks=total_count,
            action_distribution=action_counts,
            priority_distribution=priority_counts,
            expected_by_failure_type=expected_by_failure_type,
            recovery_funnel=recovery_funnel,
        )
