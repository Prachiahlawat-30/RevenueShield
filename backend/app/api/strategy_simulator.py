"""Strategy Simulator API endpoints for zero-mutation what-if simulations."""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier2_schemas import StrategySimulationRequest, StrategySimulationResponse
from app.services.strategy_simulator_engine import StrategySimulatorEngine

router = APIRouter(prefix="/strategy-simulator", tags=["strategy-simulator"])


@router.post("/simulate", response_model=StrategySimulationResponse, summary="Run zero-mutation what-if recovery strategy simulation")
def run_strategy_simulation(
    req: StrategySimulationRequest = Body(default_factory=StrategySimulationRequest),
    db: Session = Depends(get_db),
) -> StrategySimulationResponse:
    """Simulate the financial impact of policy parameter changes against the real risk portfolio without mutating state."""
    return StrategySimulatorEngine.run_simulation(db, req)
