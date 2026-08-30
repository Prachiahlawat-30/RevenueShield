"""Pydantic schemas for Hackathon Specialized Recovery Directions:
1. B2B Receivables Chaser
2. Promise-to-Pay (PTP) Tracker
3. Mandate Retry Sequencer (UPI Autopay / eNACH)
4. Hinglish & Localized Conversational Recovery Studio
5. Checkout Drop-off & Subscription Recovery
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# 1. B2B Receivables & Promise-to-Pay Schemas
# -----------------------------------------------------------------------------

class PromiseToPayRecord(BaseModel):
    id: str
    invoice_id: str
    customer_id: str
    customer_name: str
    promised_amount: Decimal
    promised_date: str
    status: str  # 'ACTIVE_PROMISE' | 'FULFILLED' | 'BROKEN' | 'ESCALATED'
    channel_committed: str  # 'VOICE_CALL' | 'WHATSAPP' | 'PORTAL' | 'EMAIL'
    operator_notes: Optional[str] = None
    dunning_paused: bool
    created_at: str


class PromiseToPayCreateRequest(BaseModel):
    invoice_id: str
    customer_id: str
    promised_amount: Decimal
    promised_date: str
    channel: str = "VOICE_CALL"
    operator_notes: Optional[str] = "Customer committed payment date during phone call"


class B2BReceivableInvoice(BaseModel):
    id: str
    invoice_number: str
    po_number: str
    customer_id: str
    customer_name: str
    company_name: str
    amount_due: Decimal
    currency: str = "USD"
    due_date: str
    days_overdue: int
    aging_bucket: str  # 'CURRENT_0_30' | 'OVERDUE_31_60' | 'CRITICAL_61_90' | 'DEFAULT_RISK_90_PLUS'
    status: str  # 'UNPAID' | 'PROMISE_TO_PAY' | 'ESCALATED_HUMAN' | 'RECOVERED' | 'DISPUTED'
    dispute_reason: Optional[str] = None
    has_active_promise: bool = False
    active_promise_date: Optional[str] = None
    recommended_action: str
    ai_risk_score: int
    is_vip: bool


class B2BReceivablesSummary(BaseModel):
    total_receivables_at_risk: Decimal
    total_invoices_count: int
    current_bucket_amount: Decimal  # 0-30 days
    overdue_bucket_amount: Decimal  # 31-60 days
    critical_bucket_amount: Decimal  # 61-90 days
    default_risk_bucket_amount: Decimal  # 90+ days
    active_ptp_count: int
    active_ptp_volume: Decimal
    broken_ptp_count: int
    human_escalations_count: int
    invoices: List[B2BReceivableInvoice]
    recent_promises: List[PromiseToPayRecord]


# -----------------------------------------------------------------------------
# 2. Mandate Retry Sequencer (UPI Autopay & eNACH) Schemas
# -----------------------------------------------------------------------------

class MandateSequenceItem(BaseModel):
    id: str
    mandate_id: str
    mandate_type: str  # 'UPI_AUTOPAY' | 'ENACH' | 'DEBIT_CARD_MANDATE' | 'CREDIT_CARD_MANDATE'
    customer_name: str
    subscription_plan: str
    amount: Decimal
    currency: str = "USD"
    bank_name: str
    detected_failure_code: str
    failure_reason: str
    aligned_salary_day: int
    optimal_retry_window: str
    next_scheduled_retry: str
    retry_attempt_number: int
    max_mandate_attempts: int = 3
    expected_success_rate_pct: float
    sequence_status: str  # 'SCHEDULED' | 'WAITING_SALARY_CYCLE' | 'EXECUTED_SUCCESS' | 'MANDATE_EXPIRED'
    strategy_applied: str


class MandateSequencerSummary(BaseModel):
    total_mandates_at_risk: Decimal
    active_mandates_count: int
    upi_autopay_volume: Decimal
    enach_volume: Decimal
    card_mandate_volume: Decimal
    optimal_window_projected_lift_pct: float
    salary_cycle_aligned_count: int
    scheduled_sequences: List[MandateSequenceItem]


class MandateExecuteRequest(BaseModel):
    mandate_id: str
    override_window: Optional[str] = None


class MandateExecuteResponse(BaseModel):
    mandate_id: str
    status: str
    amount_recovered: Decimal
    execution_receipt: str
    bank_response_code: str
    settled_at: str
    audit_event_id: str


# -----------------------------------------------------------------------------
# 3. Hinglish & Localized Conversational Recovery Studio Schemas
# -----------------------------------------------------------------------------

class HinglishVoiceCallScript(BaseModel):
    call_id: str
    customer_name: str
    customer_phone: str
    amount_due_formatted: str
    language_mode: str  # 'HINGLISH' | 'HINDI' | 'ENGLISH'
    intent_detected: str  # 'INTENT_TO_PAY' | 'SEEKING_DISCOUNT' | 'DISPUTING_CHARGE' | 'REQUEST_DELAY'
    call_duration_est_sec: int
    opening_line: str
    audio_simulation_url: Optional[str] = None
    dialogue_turns: List[Dict[str, str]]
    recommended_settlement_offer: Optional[str] = None
    payment_link: str
    compliance_disclaimer: str


class WhatsAppRecoveryMessage(BaseModel):
    message_id: str
    customer_name: str
    customer_phone: str
    language: str  # 'HINGLISH' | 'HINDI' | 'ENGLISH'
    header_text: str
    body_text: str
    quick_reply_buttons: List[str]
    payment_cta_url: str
    opt_out_text: str
    delivery_status: str


class ConversationalStudioGenerateRequest(BaseModel):
    customer_id: str
    amount: Decimal
    failure_type: str = "insufficient_funds"
    preferred_language: str = "HINGLISH"  # 'HINGLISH' | 'HINDI' | 'ENGLISH'
    channel: str = "VOICE_CALL"  # 'VOICE_CALL' | 'WHATSAPP' | 'SMS'
    tone: str = "FRIENDLY_PROFESSIONAL"


class ConversationalStudioResponse(BaseModel):
    voice_script: Optional[HinglishVoiceCallScript] = None
    whatsapp_message: Optional[WhatsAppRecoveryMessage] = None
    facts_grounding: List[str]
    policy_compliance_check: str
    generated_at: str
