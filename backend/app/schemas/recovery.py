"""Pydantic schemas for recovery execution outcomes and step transitions."""

import uuid
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.enums import RiskStatus, ExecutionStatus
from app.schemas.ai_diagnosis import AIDiagnosisResult
from app.schemas.policy import PolicyEvaluationResult


class RecoveryExecutionResult(BaseModel):
    """Result of an executed recovery action from simulated gateway/channel."""
    success: bool = Field(description="Whether the simulated action recovered the payment.")
    status: ExecutionStatus = Field(description="Detailed execution status.")
    amount_recovered: Decimal = Field(default=Decimal("0.00"), description="Recovered amount in transaction currency.")
    channel: str = Field(description="Channel through which the action was dispatched.")
    outcome_details: Dict[str, Any] = Field(default_factory=dict, description="Metadata payload from the gateway simulator.")
    raw_gateway_code: Optional[str] = Field(default=None, description="Simulated gateway response code (e.g. ISO 00, 51, 54).")
    message: str = Field(description="Human-readable outcome description.")


class RecoveryStepResponse(BaseModel):
    """Detailed response for a single step execution in the recovery state machine."""
    risk_id: uuid.UUID
    step_name: str
    previous_status: RiskStatus
    current_status: RiskStatus
    diagnosis: Optional[AIDiagnosisResult] = None
    policy_evaluation: Optional[PolicyEvaluationResult] = None
    execution_result: Optional[RecoveryExecutionResult] = None
    is_terminal: bool = False
    stop_reason: Optional[str] = None
    amount_recovered: Decimal = Decimal("0.00")
