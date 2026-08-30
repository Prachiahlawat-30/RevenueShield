"""Pydantic schemas for AI diagnosis and recommendation."""

from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.enums import FailureType, RecoveryAction


class AIDiagnosisResult(BaseModel):
    """Structured output from the AI Diagnosis Engine."""
    failure_category: FailureType = Field(
        description="Diagnosed category of the payment failure."
    )
    root_cause_summary: str = Field(
        description="Concise analytical explanation of why the transaction failed."
    )
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence level in the diagnosis (0.0 to 1.0)."
    )
    recommended_action: RecoveryAction = Field(
        description="Proposed bounded recovery intervention."
    )
    action_rationale: str = Field(
        description="Justification for why this action is optimal for this scenario."
    )
    suggested_cooldown_hours: int = Field(
        ge=0,
        default=24,
        description="Suggested minimum wait time before executing this or next action."
    )
    customer_communication_draft: Optional[str] = Field(
        default=None,
        description="Optional suggested message copy if notifying or requesting update from the customer."
    )
