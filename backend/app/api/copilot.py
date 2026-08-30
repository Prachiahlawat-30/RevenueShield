"""Operator Copilot API endpoints for read-only merchant and payment team analytics assistance."""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier2_schemas import CopilotQueryRequest, CopilotQueryResponse
from app.services.operator_copilot_service import OperatorCopilotService

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/query", response_model=CopilotQueryResponse, summary="Query the Operator Copilot with natural language")
def query_operator_copilot(
    req: CopilotQueryRequest = Body(...),
    db: Session = Depends(get_db),
) -> CopilotQueryResponse:
    """Query the read-only AI analytics assistant backed by live database metrics and structured evidence."""
    return OperatorCopilotService.answer_query(db, req)
