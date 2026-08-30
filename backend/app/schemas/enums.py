"""Enumerations for RecoverAI domain entities and workflows."""

from enum import Enum


class FailureType(str, Enum):
    """Supported initial payment failure types."""
    TEMPORARY_DECLINE = "temporary_decline"
    INSUFFICIENT_FUNDS = "insufficient_funds"
    EXPIRED_CARD = "expired_card"
    NETWORK_ERROR = "network_error"
    UNKNOWN_FAILURE = "unknown_failure"


class RecoveryAction(str, Enum):
    """Supported bounded recovery interventions."""
    RETRY_PAYMENT = "retry_payment"
    SEND_PAYMENT_REMINDER = "send_payment_reminder"
    REQUEST_PAYMENT_METHOD_UPDATE = "request_payment_method_update"
    ESCALATE_TO_HUMAN = "escalate_to_human"
    STOP = "stop"


class RiskStatus(str, Enum):
    """Lifecycle status states for revenue risks."""
    DETECTED = "detected"
    DIAGNOSING = "diagnosing"
    ACTION_SELECTED = "action_selected"
    RECOVERING = "recovering"
    RECOVERED = "recovered"
    ESCALATED = "escalated"
    FAILED = "failed"
    STOPPED = "stopped"


class ExecutionStatus(str, Enum):
    """Outcome status for individual recovery execution attempts."""
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    DECLINED = "declined"
    NO_RESPONSE = "no_response"
    ESCALATED = "escalated"


class ActorType(str, Enum):
    """Actor identity in the audit trail."""
    SYSTEM = "system"
    RISK_ENGINE = "risk_engine"
    DIAGNOSIS_ENGINE = "diagnosis_engine"
    POLICY_ENGINE = "policy_engine"
    RECOVERY_ENGINE = "recovery_engine"
    GATEWAY_SIMULATOR = "gateway_simulator"
    HUMAN_OPERATOR = "human_operator"


class StoppingReason(str, Enum):
    """Explicit reasons for terminating the recovery workflow."""
    SUCCESS_STOP = "SUCCESS_STOP"
    CUSTOMER_OPT_OUT = "CUSTOMER_OPT_OUT"
    MAX_ATTEMPTS_EXCEEDED = "MAX_ATTEMPTS_EXCEEDED"
    COOLDOWN_ACTIVE = "COOLDOWN_ACTIVE"
    DUPLICATE_ACTION = "DUPLICATE_ACTION"
    ESCALATED_HIGH_VALUE = "ESCALATED_HIGH_VALUE"
    ESCALATED_EXHAUSTED = "ESCALATED_EXHAUSTED"
    UNRECOVERABLE_FAILURE = "UNRECOVERABLE_FAILURE"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"
