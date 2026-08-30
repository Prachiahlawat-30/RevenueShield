"""Pydantic schemas for Policy Engine evaluation and rules."""

from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.enums import RecoveryAction


class PolicyEvaluationResult(BaseModel):
    """Deterministic evaluation verdict returned by the Policy Engine."""
    is_approved: bool = Field(
        description="Whether the proposed action is authorized to execute."
    )
    original_proposed_action: RecoveryAction = Field(
        description="The action initially suggested by AI or previous step."
    )
    effective_action: RecoveryAction = Field(
        description="The bound action authorized for execution (may override proposed action)."
    )
    applied_rules: List[str] = Field(
        default_factory=list,
        description="Detailed trace of all policy rules evaluated."
    )
    rejection_reason: Optional[str] = Field(
        default=None,
        description="Explanation if the action was rejected or blocked."
    )
    requires_escalation: bool = Field(
        default=False,
        description="Flag indicating if the case must be escalated to a human operator."
    )
    is_terminal_stop: bool = Field(
        default=False,
        description="Flag indicating if the workflow must permanently stop without further retry."
    )
    stop_reason: Optional[str] = Field(
        default=None,
        description="Explicit stopping rule identifier if workflow is terminating."
    )
