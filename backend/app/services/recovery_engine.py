"""RecoveryEngine for state machine orchestration, simulated execution, and lifecycle termination."""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.recovery_attempt import RecoveryAttempt
from app.models.policy import Policy
from app.schemas.enums import RiskStatus, RecoveryAction, ExecutionStatus, ActorType, StoppingReason
from app.schemas.recovery import RecoveryStepResponse, RecoveryExecutionResult
from app.services.diagnosis_engine import DiagnosisEngine
from app.services.policy_engine import PolicyEngine
from app.services.gateway_simulator import GatewaySimulator
from app.services.audit_service import AuditService


class RecoveryEngine:
    """Orchestrates the revenue recovery state machine and executes bounded interventions."""

    @classmethod
    def execute_step(
        cls,
        db: Session,
        risk_id: uuid.UUID,
        force_cooldown_override: bool = True,  # Default True for interactive demonstration
        override_action: Optional[str] = None,
    ) -> RecoveryStepResponse:
        """Execute a single atomic step in the recovery workflow."""
        risk = db.query(RevenueRisk).filter_by(id=risk_id).with_for_update().first()
        if not risk:
            raise ValueError(f"RevenueRisk with ID {risk_id} not found.")

        customer = db.query(Customer).filter_by(id=risk.customer_id).first()
        transaction = db.query(Transaction).filter_by(id=risk.transaction_id).first()
        past_attempts = (
            db.query(RecoveryAttempt)
            .filter_by(revenue_risk_id=risk.id)
            .order_by(RecoveryAttempt.attempt_number.asc())
            .all()
        )
        active_policy = db.query(Policy).filter_by(is_active=True).first()

        previous_status = RiskStatus(risk.status)

        # Guard: Check if risk is already in terminal state
        if risk.status in [RiskStatus.RECOVERED.value, RiskStatus.STOPPED.value]:
            return RecoveryStepResponse(
                risk_id=risk.id,
                step_name="TERMINAL_STATE",
                previous_status=previous_status,
                current_status=previous_status,
                is_terminal=True,
                stop_reason=risk.stop_reason,
                amount_recovered=risk.amount_recovered,
            )

        # -------------------------------------------------------------
        # STEP 1: AI DIAGNOSIS
        # -------------------------------------------------------------
        risk.status = RiskStatus.DIAGNOSING.value
        risk.current_step = "DIAGNOSING"
        db.flush()

        diagnosis = DiagnosisEngine.diagnose_risk(
            risk=risk,
            customer=customer,
            transaction=transaction,
            past_attempts=past_attempts,
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

        # Determine effective proposed action (allowing operator candidate override)
        action_to_propose = diagnosis.recommended_action
        if override_action:
            try:
                norm_action = override_action.lower().strip()
                if norm_action in ("stop_workflow", "stop"):
                    action_to_propose = RecoveryAction.STOP
                elif norm_action in ("escalate_to_human", "escalate_to_human_desk"):
                    action_to_propose = RecoveryAction.ESCALATE_TO_HUMAN
                else:
                    action_to_propose = RecoveryAction(norm_action)
            except Exception as e:
                print(f"Invalid override action '{override_action}': {e}")

        # -------------------------------------------------------------
        # STEP 2: DETERMINISTIC POLICY ENGINE CHECK
        # -------------------------------------------------------------
        risk.status = RiskStatus.ACTION_SELECTED.value
        risk.current_step = "ACTION_SELECTED"
        db.flush()

        policy_eval = PolicyEngine.evaluate(
            risk=risk,
            customer=customer,
            proposed_action=action_to_propose,
            past_attempts=past_attempts,
            policy=active_policy,
            ignore_cooldown_for_demo=force_cooldown_override,
        )

        AuditService.log_event(
            db=db,
            actor="human_operator" if override_action else ActorType.POLICY_ENGINE.value,
            step_name="POLICY_CHECK",
            revenue_risk_id=risk.id,
            customer_id=customer.id,
            recommended_action=action_to_propose.value,
            policy_decision="APPROVED" if policy_eval.is_approved else "REJECTED",
            executed_action=policy_eval.effective_action.value,
            decision_payload=policy_eval.model_dump(),
        )

        # If policy rejected with terminal stop (e.g. opt-out or max attempts exceeded)
        if not policy_eval.is_approved and policy_eval.is_terminal_stop:
            risk.status = RiskStatus.STOPPED.value
            risk.current_step = "WORKFLOW_STOPPED"
            risk.stop_reason = policy_eval.stop_reason
            risk.resolved_at = datetime.now(timezone.utc)
            db.commit()

            return RecoveryStepResponse(
                risk_id=risk.id,
                step_name="POLICY_BLOCKED",
                previous_status=previous_status,
                current_status=RiskStatus.STOPPED,
                diagnosis=diagnosis,
                policy_evaluation=policy_eval,
                is_terminal=True,
                stop_reason=policy_eval.stop_reason,
                amount_recovered=risk.amount_recovered,
            )

        # If policy requires human escalation
        if policy_eval.requires_escalation:
            risk.status = RiskStatus.ESCALATED.value
            risk.current_step = "ESCALATED_TO_HUMAN"
            risk.stop_reason = policy_eval.stop_reason
            risk.resolved_at = datetime.now(timezone.utc)

            # Record escalation attempt
            attempt_num = len(past_attempts) + 1
            attempt = RecoveryAttempt(
                id=uuid.uuid4(),
                revenue_risk_id=risk.id,
                attempt_number=attempt_num,
                proposed_action=diagnosis.recommended_action.value,
                diagnosis_category=diagnosis.failure_category.value,
                ai_confidence=Decimal(str(round(diagnosis.confidence_score, 3))),
                ai_rationale=diagnosis.action_rationale,
                policy_approved=True,
                executed_action=RecoveryAction.ESCALATE_TO_HUMAN.value,
                execution_channel="human_operations_desk",
                execution_status=ExecutionStatus.ESCALATED.value,
                amount_recovered=Decimal("0.00"),
                outcome_details={"reason": policy_eval.stop_reason},
                completed_at=datetime.now(timezone.utc),
            )
            db.add(attempt)
            risk.attempt_count += 1
            risk.last_attempt_at = datetime.now(timezone.utc)
            db.commit()

            return RecoveryStepResponse(
                risk_id=risk.id,
                step_name="ESCALATED",
                previous_status=previous_status,
                current_status=RiskStatus.ESCALATED,
                diagnosis=diagnosis,
                policy_evaluation=policy_eval,
                is_terminal=True,
                stop_reason=policy_eval.stop_reason,
                amount_recovered=risk.amount_recovered,
            )

        # -------------------------------------------------------------
        # STEP 3: EXECUTE BOUNDED RECOVERY ACTION
        # -------------------------------------------------------------
        risk.status = RiskStatus.RECOVERING.value
        risk.current_step = "EXECUTING"
        db.flush()

        attempt_num = len(past_attempts) + 1
        execution_result = GatewaySimulator.execute_action(
            action=policy_eval.effective_action,
            risk=risk,
            customer=customer,
            attempt_number=attempt_num,
        )

        now = datetime.now(timezone.utc)
        attempt = RecoveryAttempt(
            id=uuid.uuid4(),
            revenue_risk_id=risk.id,
            attempt_number=attempt_num,
            proposed_action=diagnosis.recommended_action.value,
            diagnosis_category=diagnosis.failure_category.value,
            ai_confidence=Decimal(str(round(diagnosis.confidence_score, 3))),
            ai_rationale=diagnosis.action_rationale,
            policy_approved=policy_eval.is_approved,
            policy_rejection_reason=policy_eval.rejection_reason,
            executed_action=policy_eval.effective_action.value,
            execution_channel=execution_result.channel,
            execution_status=execution_result.status.value,
            amount_recovered=execution_result.amount_recovered,
            outcome_details=execution_result.outcome_details,
            completed_at=now,
        )
        db.add(attempt)
        db.flush()

        risk.attempt_count += 1
        risk.last_attempt_at = now

        # Evaluate execution outcome
        is_terminal = False
        final_stop_reason = None

        if execution_result.success:
            risk.status = RiskStatus.RECOVERED.value
            risk.current_step = "REVENUE_RECOVERED"
            risk.amount_recovered = execution_result.amount_recovered
            risk.resolved_at = now
            risk.stop_reason = StoppingReason.SUCCESS_STOP.value
            is_terminal = True
            final_stop_reason = StoppingReason.SUCCESS_STOP.value

            # Also update the source transaction status
            transaction.status = "succeeded"
        else:
            # Check if this was the final attempt
            max_limit = active_policy.max_attempts if active_policy else 3
            if risk.attempt_count >= max_limit:
                risk.status = RiskStatus.STOPPED.value
                risk.current_step = "WORKFLOW_STOPPED"
                risk.stop_reason = StoppingReason.MAX_ATTEMPTS_EXCEEDED.value
                risk.resolved_at = now
                is_terminal = True
                final_stop_reason = StoppingReason.MAX_ATTEMPTS_EXCEEDED.value
            else:
                risk.status = RiskStatus.DETECTED.value
                risk.current_step = "WAITING_NEXT_STEP"

        # Log execution and final state
        AuditService.log_event(
            db=db,
            actor=ActorType.RECOVERY_ENGINE.value,
            step_name="ACTION_EXECUTED",
            revenue_risk_id=risk.id,
            customer_id=customer.id,
            recovery_attempt_id=attempt.id,
            executed_action=policy_eval.effective_action.value,
            result=execution_result.status.value.upper(),
            amount_recovered=execution_result.amount_recovered,
            stop_reason=final_stop_reason,
            decision_payload=execution_result.model_dump(),
        )

        db.commit()
        db.refresh(risk)

        return RecoveryStepResponse(
            risk_id=risk.id,
            step_name=risk.current_step,
            previous_status=previous_status,
            current_status=RiskStatus(risk.status),
            diagnosis=diagnosis,
            policy_evaluation=policy_eval,
            execution_result=execution_result,
            is_terminal=is_terminal,
            stop_reason=final_stop_reason,
            amount_recovered=risk.amount_recovered,
        )

    @classmethod
    def execute_full_workflow(
        cls,
        db: Session,
        risk_id: uuid.UUID,
        max_steps: int = 5,
        force_cooldown_override: bool = True,
    ) -> List[RecoveryStepResponse]:
        """Execute recovery workflow iteratively until a terminal state is reached."""
        step_responses = []
        for _ in range(max_steps):
            step_res = cls.execute_step(
                db=db,
                risk_id=risk_id,
                force_cooldown_override=force_cooldown_override,
            )
            step_responses.append(step_res)
            if step_res.is_terminal:
                break
        return step_responses
