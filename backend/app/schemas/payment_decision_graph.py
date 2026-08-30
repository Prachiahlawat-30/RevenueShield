"""Pydantic schemas for the Flagship Payment Decision Graph explanation & observability engine."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DecisionGraphNode(BaseModel):
    """A node in the Payment Decision Graph representing a key contextual or decision stage."""

    id: str = Field(description="Unique node identifier in graph (e.g. 'node_customer')")
    type: str = Field(
        description="Type category: 'customer', 'transaction', 'payment_method', 'failure', "
        "'customer_risk', 'gateway_health', 'recovery_probability', 'retry_timing', "
        "'expected_recovery', 'recovery_cost', 'ai_proposal', 'policy_engine', "
        "'final_decision', 'execution', 'outcome'"
    )
    label: str = Field(description="Display header for node")
    subtitle: Optional[str] = Field(default=None, description="Short summary caption")
    status: str = Field(
        default="NEUTRAL",
        description="Visual state: 'HEALTHY', 'DEGRADED', 'PASS', 'BLOCK', 'ALLOW', 'ESCALATE', 'SUCCESS', 'FAILED', 'PENDING', 'ACTIVE', 'NEUTRAL'",
    )
    data: Dict[str, Any] = Field(default_factory=dict, description="Key attributes summarized on the node face")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detailed attributes revealed in the drilldown inspector")
    tooltip: str = Field(default="", description="Quick hover tooltip text summarizing critical takeaways")
    stage_index: int = Field(default=0, description="0-indexed position for left-to-right sequential rendering")


class DecisionGraphEdge(BaseModel):
    """A directional edge in the Payment Decision Graph describing why one node influenced another."""

    id: str = Field(description="Unique edge identifier (e.g. 'edge_cust_to_risk')")
    source: str = Field(description="Source node identifier")
    target: str = Field(description="Target node identifier")
    label: str = Field(description="Causality label (e.g. 'historical payment behavior', 'validated by')")
    style: str = Field(default="solid", description="Line style: 'solid', 'dashed', 'blocked', 'approved', 'highlight'")


class DecisionFactor(BaseModel):
    """An explanatory factor influencing the decision outcome."""

    category: str = Field(
        description="Factor category: 'customer_history', 'transaction_amount', 'failure_type', 'gateway_health', 'recovery_probability', 'retry_timing', 'customer_value', 'intervention_cost', 'policy_constraint'"
    )
    factor: str = Field(description="Specific factor name")
    value: Any = Field(description="Observed value")
    impact: str = Field(description="Impact direction: 'positive', 'negative', 'neutral'")
    weight: float = Field(description="Relative explanatory weight (0.0 to 1.0)")
    explanation: str = Field(description="Plain-English explanation of how this factor swayed the decision")
    tag: str = Field(default="explanatory factor", description="Clarity label distinguishing explanatory factors from model internals")


class PolicyEvaluationSummary(BaseModel):
    """Evaluation summary for a specific deterministic rule."""

    rule_name: str
    status: str  # "PASS", "BLOCK", "TRIGGERED"
    description: str
    impact: str


class AiVsPolicyComparison(BaseModel):
    """Prominent comparison of AI proposal vs deterministic PolicyEngine guardrail."""

    ai_proposed_action: str
    ai_confidence_pct: int
    ai_rationale: str
    ai_source: str  # "OPENAI_MODEL" or "RULE_BASED_FALLBACK"
    policy_rules: List[PolicyEvaluationSummary]
    policy_verdict: str  # "ALLOW", "BLOCK", "ESCALATE"
    policy_reason: Optional[str] = None
    final_decision_action: str
    final_decision_status: str
    is_ai_overridden: bool
    summary: str


class DecisionTimelineEvent(BaseModel):
    """A chronological event step in the lifecycle of this payment decision."""

    step_name: str
    actor: str
    timestamp: datetime
    summary: str
    status: str


class PaymentDecisionGraphResponse(BaseModel):
    """Complete structured response representing the Payment Decision Graph for a recovery case."""

    decision_id: str
    risk_id: uuid.UUID
    transaction_id: Optional[uuid.UUID] = None
    customer_id: Optional[uuid.UUID] = None
    timestamp: datetime
    decision_version: str = "v3.2.0-deterministic"
    policy_version: str = "v2.1.0"
    strategy_version: str = "v4.0.0"

    # Graph Structure
    nodes: List[DecisionGraphNode]
    edges: List[DecisionGraphEdge]
    factors: List[DecisionFactor]

    # Structured Pillar Payloads
    ai_proposal: Dict[str, Any]
    policy_result: Dict[str, Any]
    final_decision: Dict[str, Any]
    execution_result: Dict[str, Any]
    outcome: Dict[str, Any]

    # Specialized Highlights
    ai_vs_policy: AiVsPolicyComparison
    timeline: List[DecisionTimelineEvent]
    differentiator_slogan: str = (
        "RecoverAI doesn't ask AI how to move money. It uses AI to understand revenue risk, "
        "while deterministic policy decides what the system is allowed to do."
    )
