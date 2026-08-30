"""Experiments API endpoints for A/B testing and strategy comparison."""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.recovery_experiment import RecoveryExperiment
from app.models.revenue_risk import RevenueRisk
from app.schemas.tier2_schemas import (
    RecoveryExperimentCreate,
    RecoveryExperimentResponse,
    ExperimentResultsResponse,
)
from app.services.recovery_experiment_engine import RecoveryExperimentEngine

router = APIRouter(prefix="/experiments", tags=["experiments"])


@router.get("/", response_model=List[RecoveryExperimentResponse], summary="List all recovery strategy experiments")
def list_experiments(db: Session = Depends(get_db)) -> List[RecoveryExperimentResponse]:
    """Retrieve all active and completed A/B recovery experiments."""
    return db.query(RecoveryExperiment).order_by(RecoveryExperiment.created_at.desc()).all()


@router.post("/", response_model=RecoveryExperimentResponse, summary="Create a new A/B recovery experiment")
def create_experiment(
    req: RecoveryExperimentCreate,
    db: Session = Depends(get_db),
) -> RecoveryExperimentResponse:
    """Create a new controlled A/B experiment comparing two recovery strategies."""
    experiment = RecoveryExperiment(
        id=uuid.uuid4(),
        name=req.name,
        description=req.description,
        strategy_a=req.strategy_a,
        strategy_b=req.strategy_b,
        traffic_percentage=req.traffic_percentage,
        status="ACTIVE",
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment


@router.get("/{experiment_id}/results", response_model=ExperimentResultsResponse, summary="Get experiment results and lift")
def get_experiment_results(
    experiment_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ExperimentResultsResponse:
    """Calculate statistical performance, lift, and net revenue difference between Control and Treatment."""
    experiment = db.query(RecoveryExperiment).filter_by(id=experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail=f"Experiment with ID {experiment_id} not found.")

    return RecoveryExperimentEngine.evaluate_experiment(db, experiment)


@router.post("/{experiment_id}/assign/{risk_id}", summary="Deterministically assign a risk to an experiment")
def assign_risk_to_experiment(
    experiment_id: uuid.UUID,
    risk_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Deterministically assign a revenue risk to Control or Treatment variant."""
    experiment = db.query(RecoveryExperiment).filter_by(id=experiment_id).first()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found.")

    risk = db.query(RevenueRisk).filter_by(id=risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="RevenueRisk not found.")

    assignment = RecoveryExperimentEngine.assign_risk_to_experiment(db, experiment, risk)
    return {
        "assignment_id": assignment.id,
        "variant": assignment.variant,
        "assigned_strategy": assignment.assigned_strategy,
    }
