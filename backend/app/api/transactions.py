"""Transaction Ingestion Router (CSV Import & Batch Processing)."""

import csv
import io
import uuid
from decimal import Decimal, InvalidOperation
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.revenue_risk import RevenueRisk
from app.services.risk_engine import RiskEngine
from app.schemas.enums import FailureType, RiskStatus, ActorType
from app.services.audit_service import AuditService

router = APIRouter(prefix="/transactions", tags=["Transaction Operations & CSV Import"])


class TransactionImportRow(BaseModel):
    customer_name: str
    email: str
    amount: Decimal
    currency: str = "INR"
    failure_type: Optional[str] = "temporary_decline"
    failure_reason: Optional[str] = None
    card_last4: Optional[str] = "4242"
    gateway_name: Optional[str] = "Razorpay"
    payment_method: Optional[str] = "card"


class BatchImportResponse(BaseModel):
    imported_count: int
    failed_count: int
    total_amount_imported: Decimal
    currency: str
    errors: List[str]
    sample_records: List[Dict[str, Any]]
    message: str


@router.get("/sample-csv", summary="Download sample CSV template for transaction failures")
def download_sample_csv():
    """Return a formatted sample CSV file with standard columns and realistic failure rows."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Standard headers
    headers = [
        "customer_name",
        "email",
        "phone",
        "amount",
        "currency",
        "failure_type",
        "failure_reason",
        "card_last4",
        "gateway_name",
        "payment_method",
    ]
    writer.writerow(headers)

    # Sample rows showcasing various failure modes
    rows = [
        [
            "Aditi Sen",
            "aditi.sen@fintech.co",
            "+919876543210",
            "3499.00",
            "INR",
            "insufficient_funds",
            "Declined: Insufficient account balance on savings account",
            "5521",
            "Razorpay",
            "card",
        ],
        [
            "Rohan Verma",
            "rohan.v@techcorp.in",
            "+919812345678",
            "12500.00",
            "INR",
            "temporary_decline",
            "Bank soft decline: Suspicious transaction rule triggered",
            "4242",
            "Razorpay",
            "card",
        ],
        [
            "Kavita Patel",
            "kavita@patelconsulting.com",
            "+919923456789",
            "890.00",
            "INR",
            "expired_card",
            "Card credential expired 05/26",
            "8833",
            "Razorpay",
            "card",
        ],
        [
            "Siddharth Rao",
            "siddharth@raomedia.net",
            "+919734567890",
            "4500.00",
            "INR",
            "network_error",
            "Gateway error: Issuer 3DS timeout",
            "1190",
            "Razorpay",
            "upi",
        ],
    ]
    writer.writerows(rows)

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=revenueshield_transactions_template.csv"},
    )


@router.post(
    "/import-csv",
    response_model=BatchImportResponse,
    summary="Bulk import failed transactions from a CSV file",
)
async def import_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> BatchImportResponse:
    """
    Parse a CSV file containing transaction failure rows, create Customer records,
    persist failed Transactions, and run RevenueShield Risk Engine to calculate revenue at risk.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a .csv file.",
        )

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8-sig")  # handles potential BOM
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    reader = csv.DictReader(io.StringIO(content_str))
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is empty or missing header row.",
        )

    # Normalize fieldnames to lowercase trimmed
    field_map = {name.strip().lower(): name for name in reader.fieldnames if name}

    def get_val(row: Dict[str, str], *keys: str) -> Optional[str]:
        for k in keys:
            normalized_key = field_map.get(k.lower())
            if normalized_key and row.get(normalized_key):
                val = row[normalized_key].strip()
                if val:
                    return val
        return None

    imported_count = 0
    failed_count = 0
    total_amount = Decimal("0.00")
    errors: List[str] = []
    sample_records: List[Dict[str, Any]] = []

    for idx, row in enumerate(reader, start=1):
        try:
            # Extract fields with forgiving aliases
            name = get_val(row, "customer_name", "name", "customer") or f"Customer {idx}"
            email = get_val(row, "email", "customer_email")
            if not email:
                email = f"cust_{uuid.uuid4().hex[:6]}@imported.recoverai.io"

            phone = get_val(row, "phone", "contact", "mobile") or "+919876500000"

            amount_str = get_val(row, "amount", "transaction_amount", "amount_at_risk")
            if not amount_str:
                errors.append(f"Row {idx}: Missing amount. Skipped.")
                failed_count += 1
                continue

            try:
                # Clean amount string (strip $, ₹, commas)
                clean_amount = amount_str.replace("$", "").replace("₹", "").replace(",", "").strip()
                amount = Decimal(clean_amount)
                if amount <= 0:
                    raise InvalidOperation("Amount must be positive.")
            except (InvalidOperation, ValueError):
                errors.append(f"Row {idx}: Invalid numeric amount '{amount_str}'. Skipped.")
                failed_count += 1
                continue

            currency = get_val(row, "currency") or "INR"
            failure_type_raw = get_val(row, "failure_type", "type", "failure_category") or "temporary_decline"
            failure_reason = get_val(row, "failure_reason", "reason", "description") or f"Imported failure: {failure_type_raw}"
            card_last4 = get_val(row, "card_last4", "last4", "card") or "4242"
            gateway_name = get_val(row, "gateway_name", "gateway") or "Razorpay"
            payment_method = get_val(row, "payment_method", "method") or "card"

            # 1. Resolve or Create Customer
            customer = db.query(Customer).filter_by(email=email).first()
            if not customer:
                customer = Customer(
                    id=uuid.uuid4(),
                    external_id=f"CUST_CSV_{uuid.uuid4().hex[:6].upper()}",
                    name=name,
                    email=email,
                    phone=phone,
                    payment_method_type=payment_method,
                    card_last4=card_last4,
                    card_expiry="12/28",
                    is_opted_out=False,
                    risk_score=Decimal("18.00"),
                )
                db.add(customer)
                db.flush()

            # 2. Create Transaction
            transaction = Transaction(
                id=uuid.uuid4(),
                customer_id=customer.id,
                amount=amount,
                currency=currency,
                status="failed",
                failure_code=failure_type_raw,
                failure_reason=failure_reason,
                gateway_name=gateway_name,
                payment_method=payment_method,
                gateway_payload={"source": "csv_import", "filename": file.filename, "row_index": idx},
            )
            db.add(transaction)
            db.flush()

            # 3. Trigger Risk Engine
            risk = RiskEngine.process_failed_transaction(db=db, transaction_id=transaction.id)

            total_amount += amount
            imported_count += 1

            if len(sample_records) < 5:
                sample_records.append({
                    "id": str(transaction.id),
                    "customer_name": customer.name,
                    "email": customer.email,
                    "amount": float(amount),
                    "currency": currency,
                    "failure_type": risk.detected_failure_type,
                    "risk_id": str(risk.id),
                })

        except Exception as e:
            errors.append(f"Row {idx}: Error processing row: {str(e)}")
            failed_count += 1

    # Commit all successful rows
    if imported_count > 0:
        AuditService.log_event(
            db=db,
            actor="csv_importer",
            step_name="CSV_TRANSACTIONS_IMPORTED",
            diagnosis_summary=f"Imported {imported_count} failed transactions via CSV upload.",
            policy_decision="IMPORTED",
            result=f"Total Volume: INR {total_amount} | {imported_count} risks registered",
            input_payload={"filename": file.filename, "imported_count": imported_count},
        )
        db.commit()

    return BatchImportResponse(
        imported_count=imported_count,
        failed_count=failed_count,
        total_amount_imported=total_amount,
        currency="INR",
        errors=errors,
        sample_records=sample_records,
        message=f"Successfully imported {imported_count} failed transactions from CSV.",
    )
