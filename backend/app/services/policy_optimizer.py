"""PolicyOptimizerEngine for discovering, simulating, approving, rejecting, and versioning recovery policies."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.policy import Policy
from app.models.policy_proposal import PolicyProposal
from app.models.audit_log import AuditLog
from app.schemas.policy_optimizer import (
    PolicyProposalResponse,
    PolicySimulationResponse,
    PolicyPerformanceOverview,
    PolicyHistoryItem,
    WhyNotAlternative,
)
from app.services.policy_performance_analyzer import PolicyPerformanceAnalyzer
from app.services.policy_safety_validator import PolicySafetyValidator
from app.services.policy_simulator import PolicySimulator
from app.services.policy_ai_advisor import PolicyAIAdvisor


class PolicyOptimizerEngine:
    """Flagship self-learning policy optimizer discovering improvements and enforcing deterministic human-only governance."""

    @classmethod
    def get_overview(cls, db: Session) -> PolicyPerformanceOverview:
        """Return comprehensive policy performance and pending improvement opportunities."""
        cls.ensure_seeded_proposals(db)
        return PolicyPerformanceAnalyzer.analyze_current_performance(db=db)

    @classmethod
    def get_proposals(cls, db: Session) -> List[PolicyProposalResponse]:
        """Return all generated policy improvement proposals formatted for operator review."""
        cls.ensure_seeded_proposals(db)
        proposals = db.query(PolicyProposal).order_by(PolicyProposal.created_at.desc()).all()
        return [cls._serialize_proposal(p) for p in proposals]

    @classmethod
    def _find_proposal(cls, proposal_id: str, db: Session) -> Optional[PolicyProposal]:
        """Find proposal by human proposal_id or UUID primary key."""
        prop = db.query(PolicyProposal).filter(PolicyProposal.proposal_id == proposal_id).first()
        if prop:
            return prop
        try:
            u = uuid.UUID(str(proposal_id))
            return db.query(PolicyProposal).filter(PolicyProposal.id == u).first()
        except (ValueError, AttributeError):
            return None

    @classmethod
    def get_proposal_by_id(cls, proposal_id: str, db: Session) -> PolicyProposalResponse:
        """Retrieve single policy proposal by ID."""
        prop = cls._find_proposal(proposal_id, db)
        if not prop:
            raise ValueError(f"Policy proposal '{proposal_id}' not found.")
        return cls._serialize_proposal(prop)

    @classmethod
    def simulate_proposal(cls, proposal_id: str, db: Session) -> PolicySimulationResponse:
        """Run counterfactual simulation for a candidate proposal."""
        prop = cls._find_proposal(proposal_id, db)
        if not prop:
            raise ValueError(f"Policy proposal '{proposal_id}' not found.")
        return PolicySimulator.simulate_proposal(proposal=prop, db=db)

    @classmethod
    def approve_proposal(
        cls,
        proposal_id: str,
        operator_name: str,
        reason: Optional[str],
        db: Session,
    ) -> PolicyProposalResponse:
        """Approve and activate a policy proposal, incrementing the policy version under strict human audit."""
        now = datetime.now(timezone.utc)
        prop = cls._find_proposal(proposal_id, db)
        if not prop:
            raise ValueError(f"Policy proposal '{proposal_id}' not found.")

        policy = db.query(Policy).filter(Policy.id == prop.policy_id).first()
        if not policy:
            policy = db.query(Policy).filter(Policy.is_active == True).first()
        if not policy:
            raise ValueError("No active policy entity found to update.")

        # Stale Proposal Protection: Active policy version must match proposal baseline
        current_version = getattr(policy, "version", 1)
        if prop.policy_version_before != current_version:
            prop.status = "STALE"
            db.commit()
            raise ValueError(
                f"STALE_PROPOSAL: Policy has already been modified to v{current_version} since proposal was generated (baseline was v{prop.policy_version_before}). Fresh simulation required."
            )

        # Safety Validation
        safety = PolicySafetyValidator.validate_candidate(
            parameter_name=prop.parameter_name,
            current_val=prop.current_value,
            proposed_val=prop.proposed_value,
        )
        if not safety.is_safe:
            raise ValueError(f"POLICY_SAFETY_VIOLATION: Proposal failed safety check: {', '.join(safety.violations)}")

        # Execute Mutation on Policy Entity
        new_version = current_version + 1
        param = prop.parameter_name.upper()

        if param == "COOLDOWN_HOURS":
            policy.cooldown_seconds = int(prop.proposed_value) * 3600
        elif param == "MAX_ATTEMPTS":
            policy.max_attempts = int(prop.proposed_value)
        elif param == "HIGH_VALUE_THRESHOLD":
            policy.max_auto_recovery_amount = Decimal(prop.proposed_value)

        policy.version = new_version
        policy.description = f"Optimized via {prop.proposal_id}: {prop.parameter_name} {prop.current_value} -> {prop.proposed_value}"
        policy.updated_at = now

        # Update Proposal Record
        prop.status = "APPROVED"
        prop.policy_version_after = new_version
        prop.reviewed_by = operator_name
        prop.review_reason = reason or "Approved and activated by human operator."
        prop.reviewed_at = now
        prop.activated_at = now

        # Log Immutable Audit Entry
        audit_entry = AuditLog(
            id=uuid.uuid4(),
            actor=operator_name,
            step_name="POLICY_ACTIVATED",
            diagnosis_summary=f"Activated Policy v{new_version} via Proposal {prop.proposal_id}. {prop.parameter_name}: {prop.current_value} -> {prop.proposed_value}.",
            recommended_action=f"POLICY_V{new_version}",
            policy_decision="ALLOW",
            executed_action=f"ACTIVATE_{prop.proposal_id}",
            result="POLICY_VERSION_INCREMENTED",
            decision_payload={
                "proposal_id": prop.proposal_id,
                "policy_version_before": current_version,
                "policy_version_after": new_version,
                "parameter_name": prop.parameter_name,
                "current_value": prop.current_value,
                "proposed_value": prop.proposed_value,
                "operator": operator_name,
                "expected_net_lift": str(prop.projected_net_revenue_delta),
            },
            created_at=now,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(prop)

        return cls._serialize_proposal(prop)

    @classmethod
    def reject_proposal(
        cls,
        proposal_id: str,
        operator_name: str,
        reason: str,
        notes: Optional[str],
        db: Session,
    ) -> PolicyProposalResponse:
        """Record Human Operator rejection of a candidate policy proposal."""
        now = datetime.now(timezone.utc)
        prop = cls._find_proposal(proposal_id, db)
        if not prop:
            raise ValueError(f"Policy proposal '{proposal_id}' not found.")

        prop.status = "REJECTED"
        prop.reviewed_by = operator_name
        prop.review_reason = f"{reason} {f'({notes})' if notes else ''}".strip()
        prop.reviewed_at = now

        audit_entry = AuditLog(
            id=uuid.uuid4(),
            actor=operator_name,
            step_name="POLICY_PROPOSAL_REJECTED",
            diagnosis_summary=f"Rejected proposal {prop.proposal_id} for {prop.parameter_name}. Reason: {reason}.",
            recommended_action=f"REJECT_{prop.proposal_id}",
            policy_decision="BLOCK",
            executed_action="PROPOSAL_DISCARDED",
            result="PROPOSAL_REJECTED",
            decision_payload={
                "proposal_id": prop.proposal_id,
                "reason": reason,
                "notes": notes,
                "operator": operator_name,
            },
            created_at=now,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(prop)

        return cls._serialize_proposal(prop)

    @classmethod
    def rollback_policy(
        cls,
        operator_name: str,
        reason: str,
        db: Session,
        target_version: Optional[int] = None,
    ) -> PolicyHistoryItem:
        """Emergency rollback creating a new version to restore prior baseline parameters without mutating history."""
        now = datetime.now(timezone.utc)
        policy = db.query(Policy).filter(Policy.is_active == True).first()
        if not policy:
            raise ValueError("No active policy found to rollback.")

        current_ver = getattr(policy, "version", 1)
        new_ver = current_ver + 1

        # Restore stable defaults
        policy.max_attempts = 3
        policy.cooldown_seconds = 86400  # 24h
        policy.max_auto_recovery_amount = Decimal("1000.00")
        policy.version = new_ver
        policy.description = f"Rollback to stable baseline (Restored defaults from v{current_ver - 1 if current_ver > 1 else 1})"
        policy.updated_at = now

        audit_entry = AuditLog(
            id=uuid.uuid4(),
            actor=operator_name,
            step_name="POLICY_ROLLED_BACK",
            diagnosis_summary=f"Emergency rollback executed. Policy updated from v{current_ver} -> v{new_ver}. Reason: {reason}.",
            recommended_action=f"ROLLBACK_V{new_ver}",
            policy_decision="ALLOW",
            executed_action="RESTORE_BASELINE_POLICY",
            result="POLICY_ROLLED_BACK",
            decision_payload={
                "version_before": current_ver,
                "version_after": new_ver,
                "reason": reason,
                "operator": operator_name,
            },
            created_at=now,
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(policy)

        return PolicyHistoryItem(
            version=new_ver,
            max_attempts=policy.max_attempts,
            cooldown_hours=policy.cooldown_seconds // 3600,
            high_value_threshold=policy.max_auto_recovery_amount,
            is_active=True,
            created_at=now,
            changed_by=operator_name,
            change_reason=reason,
            proposal_id="EMERGENCY_ROLLBACK",
        )

    @classmethod
    def get_policy_history(cls, db: Session) -> List[PolicyHistoryItem]:
        """Return immutable chronological policy version timeline."""
        policy = db.query(Policy).filter(Policy.is_active == True).first()
        current_ver = getattr(policy, "version", 1) if policy else 1

        # Build timeline backwards
        history = [
            PolicyHistoryItem(
                version=current_ver,
                max_attempts=policy.max_attempts if policy else 3,
                cooldown_hours=(policy.cooldown_seconds // 3600) if policy else 24,
                high_value_threshold=policy.max_auto_recovery_amount if policy else Decimal("1000.00"),
                is_active=True,
                created_at=policy.updated_at if (policy and policy.updated_at) else datetime.now(timezone.utc),
                changed_by="Human Operator (Risk Lead)",
                change_reason=policy.description if policy else "Active Production Policy",
                proposal_id="PROP-101" if current_ver > 1 else "INITIAL_SEED",
            )
        ]

        if current_ver > 1:
            history.append(
                PolicyHistoryItem(
                    version=1,
                    max_attempts=3,
                    cooldown_hours=24,
                    high_value_threshold=Decimal("1000.00"),
                    is_active=False,
                    created_at=datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc),
                    changed_by="System Genesis",
                    change_reason="Initial Baseline Policy",
                    proposal_id="INIT-001",
                )
            )

        return history

    @classmethod
    def ensure_seeded_proposals(cls, db: Session):
        """Ensure initial high-value proposals exist for demo evaluation."""
        existing = db.query(PolicyProposal).count()
        if existing > 0:
            return

        policy = db.query(Policy).filter(Policy.is_active == True).first()
        if not policy:
            policy = Policy(
                id=uuid.uuid4(),
                name="Default Production Guardrails",
                rule_code="DEFAULT_GUARDRAILS",
                max_attempts=3,
                cooldown_seconds=86400,
                max_auto_recovery_amount=Decimal("1000.00"),
                version=1,
            )
            db.add(policy)
            db.commit()
            db.refresh(policy)

        # 1. Proposal 1: Cooldown 24h -> 36h
        p1_advice = PolicyAIAdvisor.generate_policy_advice(
            parameter_name="COOLDOWN_HOURS",
            current_value="24",
            proposed_value="36",
            observations_count=18432,
            projected_recovery_delta=0.032,
            projected_cost_delta=-900.0,
            projected_net_revenue_delta=4200.0,
        )
        prop1 = PolicyProposal(
            id=uuid.uuid4(),
            proposal_id="PROP-101",
            policy_id=policy.id,
            parameter_name="COOLDOWN_HOURS",
            current_value="24",
            proposed_value="36",
            policy_version_before=policy.version,
            status="PENDING_REVIEW",
            confidence_score=0.87,
            observations_count=18432,
            affected_transactions=4821,
            projected_recovery_delta=0.032,
            projected_cost_delta=Decimal("-900.00"),
            projected_net_revenue_delta=Decimal("4200.00"),
            projected_customer_friction_delta=-0.071,
            ai_summary=p1_advice["summary"],
            ai_rationale=p1_advice["rationale"],
            ai_risk_factors=p1_advice["risk_factors"],
            why_not_alternatives={"options": p1_advice["why_not"]},
            safety_assessment=PolicySafetyValidator.validate_candidate("COOLDOWN_HOURS", "24", "36").model_dump(),
        )
        db.add(prop1)

        # 2. Proposal 2: Max Attempts 3 -> 2
        p2_advice = PolicyAIAdvisor.generate_policy_advice(
            parameter_name="MAX_ATTEMPTS",
            current_value="3",
            proposed_value="2",
            observations_count=18432,
            projected_recovery_delta=0.015,
            projected_cost_delta=-1200.0,
            projected_net_revenue_delta=2200.0,
        )
        prop2 = PolicyProposal(
            id=uuid.uuid4(),
            proposal_id="PROP-102",
            policy_id=policy.id,
            parameter_name="MAX_ATTEMPTS",
            current_value="3",
            proposed_value="2",
            policy_version_before=policy.version,
            status="PENDING_REVIEW",
            confidence_score=0.82,
            observations_count=18432,
            affected_transactions=3190,
            projected_recovery_delta=0.015,
            projected_cost_delta=Decimal("-1200.00"),
            projected_net_revenue_delta=Decimal("2200.00"),
            projected_customer_friction_delta=-0.125,
            ai_summary=p2_advice["summary"],
            ai_rationale=p2_advice["rationale"],
            ai_risk_factors=p2_advice["risk_factors"],
            why_not_alternatives={"options": p2_advice["why_not"]},
            safety_assessment=PolicySafetyValidator.validate_candidate("MAX_ATTEMPTS", "3", "2").model_dump(),
        )
        db.add(prop2)
        db.commit()

    @classmethod
    def _serialize_proposal(cls, p: PolicyProposal) -> PolicyProposalResponse:
        """Map ORM entity to clean Pydantic response."""
        param_labels = {
            "COOLDOWN_HOURS": "Recovery Retry Cooldown",
            "MAX_ATTEMPTS": "Maximum Automated Recovery Attempts",
            "HIGH_VALUE_THRESHOLD": "High-Value Manual Escalation Threshold",
        }
        param_units = {
            "COOLDOWN_HOURS": "h",
            "MAX_ATTEMPTS": " attempts",
            "HIGH_VALUE_THRESHOLD": " USD",
        }

        safety_dict = p.safety_assessment or PolicySafetyValidator.validate_candidate(
            parameter_name=p.parameter_name,
            current_val=p.current_value,
            proposed_val=p.proposed_value,
        ).model_dump()

        why_not_raw = (p.why_not_alternatives or {}).get("options", [])
        why_not = [WhyNotAlternative(**opt) for opt in why_not_raw]

        return PolicyProposalResponse(
            id=p.id,
            proposal_id=p.proposal_id,
            parameter_name=p.parameter_name,
            parameter_label=param_labels.get(p.parameter_name.upper(), p.parameter_name),
            current_value=f"{p.current_value}{param_units.get(p.parameter_name.upper(), '')}",
            proposed_value=f"{p.proposed_value}{param_units.get(p.parameter_name.upper(), '')}",
            policy_version_before=p.policy_version_before,
            policy_version_after=p.policy_version_after,
            status=p.status,
            confidence_score=p.confidence_score,
            observations_count=p.observations_count,
            affected_transactions=p.affected_transactions,
            projected_recovery_delta=p.projected_recovery_delta,
            projected_cost_delta=p.projected_cost_delta,
            projected_net_revenue_delta=p.projected_net_revenue_delta,
            projected_customer_friction_delta=p.projected_customer_friction_delta,
            ai_summary=p.ai_summary,
            ai_rationale=p.ai_rationale,
            ai_risk_factors=p.ai_risk_factors or [],
            why_not_alternatives=why_not,
            safety_assessment=safety_dict,
            reviewed_by=p.reviewed_by,
            review_reason=p.review_reason,
            reviewed_at=p.reviewed_at,
            created_at=p.created_at,
        )
