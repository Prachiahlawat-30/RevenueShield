"""REST API router for Revenue Risk Forecasting."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tier3_schemas import (
    RevenueForecastResponse,
    DailyForecastPoint,
)
from app.services.revenue_forecast_engine import RevenueForecastEngine

router = APIRouter(prefix="/forecast", tags=["Revenue Risk Forecast"])


@router.get("/summary", response_model=RevenueForecastResponse)
def get_revenue_forecast_summary(db: Session = Depends(get_db)):
    """Retrieve multi-horizon revenue risk forecasts (24h, 7d, 30d) and time-series curve."""
    return RevenueForecastEngine.generate_forecast(db)


@router.get("/timeseries", response_model=List[DailyForecastPoint])
def get_forecast_timeseries(db: Session = Depends(get_db)):
    """Retrieve daily granular forecast points formatted for Recharts time-series visualization."""
    forecast = RevenueForecastEngine.generate_forecast(db)
    return forecast.daily_forecasts
