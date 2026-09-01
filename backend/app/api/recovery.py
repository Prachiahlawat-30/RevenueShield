"""Recovery API endpoints for stepping, full-workflow execution, batch processing, and manual overrides."""

import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.revenue_risk import RevenueRisk
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.recovery_attempt import RecoveryAttempt
from app.schemas.enums import RiskStatus, StoppingReason, ActorType
from app.schemas.ai_diagnosis import AIDiagnosisResult
from app.schemas.recovery import RecoveryStepResponse
from app.schemas.revenue_risk import RevenueRiskResponse
from app.schemas.payment_decision_graph import PaymentDecisionGraphResponse
from app.services.diagnosis_engine import DiagnosisEngine
from app.services.recovery_engine import RecoveryEngine
from app.services.audit_service import AuditService
from app.services.recovery_probability_engine import RecoveryProbabilityEngine
from app.services.recovery_priority_engine import RecoveryPriorityEngine
from app.services.payment_decision_graph_engine import PaymentDecisionGraphEngine

router = APIRouter(prefix="/recovery", tags=["recovery"])


class BatchRecoveryRequest(BaseModel):
    """Request schema for batch recovery execution."""
    batch_size: int = Field(default=10, ge=1, le=50, description="Max number of active risks to process")
    force_cooldown_override: bool = Field(default=True, description="Override cooldown window for demo processing")
    mode: str = Field(default="priority", description="Execution ordering: 'priority' or 'fifo'")


class BatchRecoveryResultItem(BaseModel):
    risk_id: uuid.UUID
    customer_name: str
    amount_at_risk: Decimal
    amount_recovered: Decimal
    detected_failure_type: str
    final_status: str
    step_count: int
    priority_score: Optional[int] = None
    stop_reason: Optional[str] = None


class BatchRecoveryResponse(BaseModel):
    """Aggregated outcome of a batch recovery run."""
    processed_count: int
    recovered_count: int
    escalated_count: int
    stopped_count: int
    total_amount_recovered: Decimal
    execution_mode: str
    results: List[BatchRecoveryResultItem]


class ManualResolveRequest(BaseModel):
    """Request schema for operator resolution of escalated risks."""
    action: str = Field(description="'mark_recovered' or 'write_off'")
    notes: Optional[str] = Field(default=None, description="Operator notes explaining the manual resolution")


@router.post("/{risk_id}/diagnose", response_model=AIDiagnosisResult, summary="Run AI diagnosis on a specific risk")
def run_ai_diagnosis(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AIDiagnosisResult:
    """Trigger AI root-cause analysis and return structured diagnosis without executing interventions."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    customer = db.query(Customer).filter_by(id=risk.customer_id).first()
    transaction = db.query(Transaction).filter_by(id=risk.transaction_id).first()
    past_attempts = db.query(RecoveryAttempt).filter_by(revenue_risk_id=risk.id).all()

    return DiagnosisEngine.diagnose_risk(
        risk=risk,
        customer=customer,
        transaction=transaction,
        past_attempts=past_attempts,
    )


class StepExecutionRequest(BaseModel):
    force_cooldown_override: bool = True
    override_action: Optional[str] = None


@router.post("/{risk_id}/step", response_model=RecoveryStepResponse, summary="Execute single atomic state machine step")
def execute_single_recovery_step(
    risk_id: uuid.UUID,
    payload: Optional[StepExecutionRequest] = None,
    db: Session = Depends(get_db),
) -> RecoveryStepResponse:
    """Execute the next atomic step (Diagnose -> Policy Check -> Execute Intervention) for a risk case."""
    cooldown = payload.force_cooldown_override if payload else True
    action_override = payload.override_action if payload else None
    try:
        return RecoveryEngine.execute_step(
            db=db,
            risk_id=risk_id,
            force_cooldown_override=cooldown,
            override_action=action_override,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{risk_id}/run-full", response_model=List[RecoveryStepResponse], summary="Run complete recovery workflow until terminal state")
def run_full_recovery_workflow(
    risk_id: uuid.UUID,
    max_steps: int = Body(5, embed=True),
    force_cooldown_override: bool = Body(True, embed=True),
    db: Session = Depends(get_db),
) -> List[RecoveryStepResponse]:
    """Iteratively execute recovery steps until a terminal condition (Recovered/Escalated/Stopped) is met."""
    try:
        return RecoveryEngine.execute_full_workflow(
            db=db,
            risk_id=risk_id,
            max_steps=max_steps,
            force_cooldown_override=force_cooldown_override,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/run-batch", response_model=BatchRecoveryResponse, summary="Execute recovery workflow on all active/detected risks")
def run_batch_recovery(
    mode: Optional[str] = Query(None, description="Execution ordering: 'priority' (default) or 'fifo'"),
    request: BatchRecoveryRequest = Body(default_factory=BatchRecoveryRequest),
    db: Session = Depends(get_db),
) -> BatchRecoveryResponse:
    """Batch-process pending/active payment failures, optionally prioritized by opportunity score."""
    effective_mode = mode or request.mode or "priority"

    # Find active / actionable risks
    actionable_risks = (
        db.query(RevenueRisk)
        .options(
            joinedload(RevenueRisk.customer),
            joinedload(RevenueRisk.recovery_attempts),
        )
        .filter(RevenueRisk.status.in_(["detected", "diagnosing", "action_selected", "recovering"]))
        .all()
    )

    # If priority mode, score and rank risks before processing
    scored_risks = []
    for risk in actionable_risks:
        if effective_mode == "priority":
            prob_res = RecoveryProbabilityEngine.calculate_probability(risk, risk.customer, risk.recovery_attempts)
            prio_res = RecoveryPriorityEngine.calculate_priority(risk, prob_res, risk.customer, risk.recovery_attempts)
            score = prio_res.priority_score
        else:
            score = 0
        scored_risks.append((risk, score))

    if effective_mode == "priority":
        scored_risks.sort(key=lambda item: item[1], reverse=True)
    else:
        scored_risks.sort(key=lambda item: item[0].created_at, reverse=True)

    # Slice to batch size
    batch_targets = scored_risks[:request.batch_size]

    results: List[BatchRecoveryResultItem] = []
    recovered_count = 0
    escalated_count = 0
    stopped_count = 0
    total_recovered = Decimal("0.00")

    for risk, priority_score in batch_targets:
        customer_name = risk.customer.name if risk.customer else "Unknown"
        step_responses = RecoveryEngine.execute_full_workflow(
            db=db,
            risk_id=risk.id,
            max_steps=5,
            force_cooldown_override=request.force_cooldown_override,
        )

        db.refresh(risk)

        if risk.status == RiskStatus.RECOVERED.value:
            recovered_count += 1
            total_recovered += risk.amount_recovered
        elif risk.status == RiskStatus.ESCALATED.value:
            escalated_count += 1
        elif risk.status == RiskStatus.STOPPED.value:
            stopped_count += 1

        results.append(
            BatchRecoveryResultItem(
                risk_id=risk.id,
                customer_name=customer_name,
                amount_at_risk=risk.amount_at_risk,
                amount_recovered=risk.amount_recovered,
                detected_failure_type=risk.detected_failure_type,
                final_status=risk.status,
                step_count=len(step_responses),
                priority_score=priority_score,
                stop_reason=risk.stop_reason,
            )
        )

    return BatchRecoveryResponse(
        processed_count=len(batch_targets),
        recovered_count=recovered_count,
        escalated_count=escalated_count,
        stopped_count=stopped_count,
        total_amount_recovered=total_recovered,
        execution_mode=effective_mode,
        results=results,
    )


@router.post("/{risk_id}/manual-resolve", response_model=RevenueRiskResponse, summary="Operator manually resolves escalated case")
def manual_resolve_risk(
    risk_id: uuid.UUID,
    request: ManualResolveRequest,
    db: Session = Depends(get_db),
) -> RevenueRiskResponse:
    """Manually resolve an escalated risk case by human operator action."""
    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail=f"RevenueRisk with ID {risk_id} not found.")

    if request.action == "mark_recovered":
        risk.status = RiskStatus.RECOVERED.value
        risk.amount_recovered = risk.amount_at_risk
        risk.stop_reason = StoppingReason.MANUAL_OVERRIDE.value
        risk.current_step = "MANUALLY_RESOLVED"
    elif request.action == "write_off":
        risk.status = RiskStatus.STOPPED.value
        risk.stop_reason = "MANUAL_WRITE_OFF"
        risk.current_step = "MANUALLY_WRITTEN_OFF"
    else:
        raise HTTPException(status_code=400, detail="Invalid resolution action. Use 'mark_recovered' or 'write_off'.")

    # Record manual operator audit log
    AuditService.log_event(
        db=db,
        actor=ActorType.HUMAN_OPERATOR.value,
        step_name="MANUAL_RESOLUTION",
        revenue_risk_id=risk.id,
        customer_id=risk.customer_id,
        policy_decision="MANUAL_OVERRIDE",
        executed_action=request.action,
        result="RESOLVED",
        amount_recovered=risk.amount_recovered,
        stop_reason=risk.stop_reason,
        decision_payload={"action": request.action, "notes": request.notes},
    )

    db.commit()
    db.refresh(risk)
    return RevenueRiskResponse.model_validate(risk)


@router.get("/{risk_id}/decision-graph", response_model=PaymentDecisionGraphResponse, summary="Generate structured Payment Decision Graph")
def get_payment_decision_graph(
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> PaymentDecisionGraphResponse:
    """Generate the complete 15-node causal decision graph explaining why RecoverAI made this recovery decision."""
    try:
        return PaymentDecisionGraphEngine.build_graph_for_risk(risk_id=risk_id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

