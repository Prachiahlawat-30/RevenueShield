"""Tests for RiskEngine failure mapping, revenue at risk calculation, and detection."""

import uuid
from decimal import Decimal
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.models.audit_log import AuditLog
from app.schemas.enums import FailureType, RiskStatus
from app.services.risk_engine import RiskEngine


def test_failure_type_mapping():
    """Verify raw gateway codes and strings map accurately to FailureType enums."""
    assert RiskEngine.map_failure_type("expired_card") == FailureType.EXPIRED_CARD
    assert RiskEngine.map_failure_type(None, "Card expired 04/26") == FailureType.EXPIRED_CARD
    assert RiskEngine.map_failure_type("54") == FailureType.EXPIRED_CARD

    assert RiskEngine.map_failure_type("insufficient_funds") == FailureType.INSUFFICIENT_FUNDS
    assert RiskEngine.map_failure_type(None, "Low balance in checking") == FailureType.INSUFFICIENT_FUNDS
    assert RiskEngine.map_failure_type("51") == FailureType.INSUFFICIENT_FUNDS

    assert RiskEngine.map_failure_type("network_error") == FailureType.NETWORK_ERROR
    assert RiskEngine.map_failure_type("gateway_timeout") == FailureType.NETWORK_ERROR
    assert RiskEngine.map_failure_type("91") == FailureType.NETWORK_ERROR

    assert RiskEngine.map_failure_type("temporary_decline") == FailureType.TEMPORARY_DECLINE
    assert RiskEngine.map_failure_type("05") == FailureType.TEMPORARY_DECLINE

    assert RiskEngine.map_failure_type("random_unknown_code_999") == FailureType.UNKNOWN_FAILURE


def test_process_failed_transaction(db):
    """Verify RiskEngine creates RevenueRisk and logs DETECTED audit event."""
    cust = Customer(
        id=uuid.uuid4(),
        external_id=f"CUST_RISK_{uuid.uuid4().hex[:6]}",
        name="Test Company",
        email="test@company.com",
    )
    db.add(cust)
    db.flush()

    txn = Transaction(
        id=uuid.uuid4(),
        customer_id=cust.id,
        amount=Decimal("350.00"),
        currency="USD",
        status="failed",
        failure_code="insufficient_funds",
        failure_reason="Account balance insufficient",
    )
    db.add(txn)
    db.flush()

    risk = RiskEngine.process_failed_transaction(db, txn.id)

    assert risk is not None
    assert risk.amount_at_risk == Decimal("350.00")
    assert risk.amount_recovered == Decimal("0.00")
    assert risk.detected_failure_type == FailureType.INSUFFICIENT_FUNDS.value
    assert risk.status == RiskStatus.DETECTED.value

    # Verify audit trail creation
    logs = db.query(AuditLog).filter_by(revenue_risk_id=risk.id).all()
    assert len(logs) == 1
    assert logs[0].step_name == "DETECTED"
    assert logs[0].actor == "risk_engine"
    assert logs[0].result == "DETECTED"
