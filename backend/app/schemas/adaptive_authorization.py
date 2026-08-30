"""Pydantic schemas for Feature 2: Adaptive Authorization + Smart 3DS Optimization."""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AuthenticationStrategy(str, Enum):
    """Authentication pathways available for payment evaluation."""
    NO_3DS = "NO_3DS"
    FRICTIONLESS_3DS = "FRICTIONLESS_3DS"
    CHALLENGE_3DS = "CHALLENGE_3DS"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class TokenStrategy(str, Enum):
    """Credential tokenization strategies."""
    STANDARD_CREDENTIAL = "STANDARD_CREDENTIAL"
    NETWORK_TOKEN_SIMULATED = "NETWORK_TOKEN_SIMULATED"
    NOT_AVAILABLE = "NOT_AVAILABLE"


class AuthorizationStrategyCandidate(BaseModel):
    """Evaluation metrics for a candidate authorization pathway."""

    gateway_name: str
    authentication_method: str
    token_strategy: str
    authorization_probability: float = Field(..., ge=0.0, le=1.0)
    conversion_probability: float = Field(..., ge=0.0, le=1.0)
    customer_friction_score: int = Field(..., ge=0, le=100)
    customer_friction_label: str  # "LOW", "MEDIUM", "HIGH", "NONE"
    expected_gross_revenue: Decimal
    estimated_cost: Decimal
    expected_net_revenue: Decimal
    strategy_score: float
    is_recommended: bool = False
    rank: int = 1


class WhyThisPathFactor(BaseModel):
    """An explanatory bullet point explaining why RecoverAI chose this path."""

    factor: str
    impact: str  # "POSITIVE", "NEUTRAL", "WARNING"
    description: str


class WhatIfSimulationRequest(BaseModel):
    """Request schema for real-time 'What If?' authorization simulation."""

    amount: Decimal = Field(default=Decimal("2400.00"), description="Transaction amount in currency units")
    currency: str = Field(default="INR")
    selected_gateway: str = Field(default="Gateway B (Enterprise Direct)")
    selected_authentication: str = Field(default="FRICTIONLESS_3DS")
    selected_token_strategy: str = Field(default="NETWORK_TOKEN_SIMULATED")
    customer_risk_level: str = Field(default="LOW", description="LOW, MEDIUM, HIGH")
    is_opted_out: bool = Field(default=False)


class WhatIfSimulationResponse(BaseModel):
    """Response from real-time 'What If?' simulation."""

    selected_gateway: str
    selected_authentication: str
    selected_token_strategy: str
    authorization_probability: float
    conversion_probability: float
    customer_friction_score: int
    customer_friction_label: str
    expected_net_revenue: Decimal
    recommended_net_revenue: Decimal
    delta_vs_recommended: Decimal
    comparison_summary: str
    simulation_disclaimer: str = "Simulation estimate based on deterministic synthetic payment models."


class AuthorizationPolicyResult(BaseModel):
    """PolicyEngine evaluation for the pre-authorization strategy."""

    status: str  # "ALLOW", "BLOCK", "HUMAN_APPROVAL_REQUIRED"
    rules_evaluated: List[str]
    requires_escalation: bool = False
    rejection_reason: Optional[str] = None


class AuthorizationDecisionResponse(BaseModel):
    """Flagship response schema for Adaptive Authorization & Smart 3DS optimization."""

    decision_id: str
    transaction_id: uuid.UUID
    customer_id: Optional[uuid.UUID] = None
    customer_name: Optional[str] = None
    amount: Decimal
    currency: str = "USD"
    payment_method: str = "card"
    card_last4: Optional[str] = None

    # Recommended Winning Strategy
    recommended_strategy: Dict[str, Any]
    baseline_strategy: Dict[str, Any]

    # Metrics
    authorization_probability: float
    conversion_probability: float
    customer_friction_score: int
    customer_friction_label: str
    expected_gross_revenue: Decimal
    estimated_cost: Decimal
    expected_net_revenue: Decimal
    baseline_net_revenue: Decimal
    expected_revenue_lift: Decimal

    # Rationale & Multi-Path Matrix
    why_this_path: List[WhyThisPathFactor]
    alternatives: List[AuthorizationStrategyCandidate]

    # Governance
    policy_result: AuthorizationPolicyResult
    decision_version: str = "auth-v1.0.0-deterministic"
    evaluated_at: datetime
    simulation_disclaimer: str = (
        "Simulation estimate: Pre-auth intelligence calculates optimal conversion vs friction tradeoffs "
        "using synthetic issuer & network authorization probability models."
    )


# -------------------------------------------------------------------------
# Funnel & Loss Breakdown Schemas
# -------------------------------------------------------------------------

class AuthorizationFunnelStage(BaseModel):
    """Stage in the Pre-Auth to Settlement conversion funnel."""

    stage_name: str
    baseline_count: int
    optimized_count: int
    baseline_rate: float
    optimized_rate: float
    lift_pct: float


class AuthorizationFunnelResponse(BaseModel):
    """Overall pre-auth to completed payment funnel metrics."""

    total_transactions: int
    stages: List[AuthorizationFunnelStage]
    overall_conversion_lift_pct: float
    total_revenue_lift_formatted: str


class AuthorizationLossCategory(BaseModel):
    """Category of revenue loss occurring prior to recovery."""

    category: str
    lost_amount: Decimal
    lost_percentage: float
    preventable_by_recoverai: Decimal
    explanation: str


class AuthorizationLossBreakdownResponse(BaseModel):
    """Breakdown of revenue leakage occurring before payment recovery."""

    total_lost_revenue: Decimal
    preventable_total: Decimal
    categories: List[AuthorizationLossCategory]
