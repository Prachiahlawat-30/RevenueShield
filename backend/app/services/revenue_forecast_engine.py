"""Revenue Forecast Engine for multi-horizon pre-failure exposure estimation."""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.transaction import Transaction
from app.schemas.tier3_schemas import (
    RevenueForecastResponse,
    RevenueForecastHorizon,
    DailyForecastPoint,
)
from app.services.predictive_revenue_risk_engine import PredictiveRevenueRiskEngine


class RevenueForecastEngine:
    """Calculates forward-looking revenue risk projections across 24h, 7d, and 30d windows."""

    @classmethod
    def generate_forecast(cls, db: Session) -> RevenueForecastResponse:
        """Compute time-series forward risk and recoverable revenue estimates."""
        now = datetime.now(timezone.utc)
        predictive_summary = PredictiveRevenueRiskEngine.get_summary(db)

        base_upcoming_volume = predictive_summary.total_upcoming_volume
        base_predicted_risk = predictive_summary.total_predicted_revenue_at_risk

        if base_upcoming_volume == Decimal("0.00"):
            base_upcoming_volume = Decimal("4800.00")
            base_predicted_risk = Decimal("1240.00")

        # 1. Compute 24h Horizon
        vol_24h = (base_upcoming_volume * Decimal("0.35")).quantize(Decimal("0.01"))
        risk_24h = (base_predicted_risk * Decimal("0.32")).quantize(Decimal("0.01"))
        recoverable_24h = (risk_24h * Decimal("0.72")).quantize(Decimal("0.01"))
        fail_rate_24h = float((risk_24h / vol_24h * 100).quantize(Decimal("0.1"))) if vol_24h > 0 else 0.0

        h_24h = RevenueForecastHorizon(
            horizon_label="Next 24 Hours",
            expected_payment_volume=vol_24h,
            predicted_failure_exposure=risk_24h,
            expected_recoverable_revenue=recoverable_24h,
            predicted_failure_rate_pct=fail_rate_24h,
            predicted_net_retention_pct=round(100.0 - fail_rate_24h + (float(recoverable_24h / vol_24h * 100) if vol_24h > 0 else 0.0), 1),
        )

        # 2. Compute 7d Horizon
        vol_7d = (base_upcoming_volume * Decimal("2.40")).quantize(Decimal("0.01"))
        risk_7d = (base_predicted_risk * Decimal("2.10")).quantize(Decimal("0.01"))
        recoverable_7d = (risk_7d * Decimal("0.70")).quantize(Decimal("0.01"))
        fail_rate_7d = float((risk_7d / vol_7d * 100).quantize(Decimal("0.1"))) if vol_7d > 0 else 0.0

        h_7d = RevenueForecastHorizon(
            horizon_label="Next 7 Days",
            expected_payment_volume=vol_7d,
            predicted_failure_exposure=risk_7d,
            expected_recoverable_revenue=recoverable_7d,
            predicted_failure_rate_pct=fail_rate_7d,
            predicted_net_retention_pct=round(100.0 - fail_rate_7d + (float(recoverable_7d / vol_7d * 100) if vol_7d > 0 else 0.0), 1),
        )

        # 3. Compute 30d Horizon
        vol_30d = (base_upcoming_volume * Decimal("9.50")).quantize(Decimal("0.01"))
        risk_30d = (base_predicted_risk * Decimal("8.20")).quantize(Decimal("0.01"))
        recoverable_30d = (risk_30d * Decimal("0.68")).quantize(Decimal("0.01"))
        fail_rate_30d = float((risk_30d / vol_30d * 100).quantize(Decimal("0.1"))) if vol_30d > 0 else 0.0

        h_30d = RevenueForecastHorizon(
            horizon_label="Next 30 Days",
            expected_payment_volume=vol_30d,
            predicted_failure_exposure=risk_30d,
            expected_recoverable_revenue=recoverable_30d,
            predicted_failure_rate_pct=fail_rate_30d,
            predicted_net_retention_pct=round(100.0 - fail_rate_30d + (float(recoverable_30d / vol_30d * 100) if vol_30d > 0 else 0.0), 1),
        )

        # 4. Generate 7-day granular daily forecast curve points
        daily_points: List[DailyForecastPoint] = []
        day_multipliers = [
            ("Today", 0.35, 95),
            ("Tomorrow", 0.40, 92),
            ("Day 3", 0.32, 88),
            ("Day 4", 0.38, 85),
            ("Day 5", 0.28, 81),
            ("Day 6", 0.30, 78),
            ("Day 7", 0.37, 75),
        ]

        for i, (label, mult, conf) in enumerate(day_multipliers):
            point_date = now + timedelta(days=i)
            day_vol = (base_upcoming_volume * Decimal(str(mult))).quantize(Decimal("0.01"))
            day_risk = (base_predicted_risk * Decimal(str(mult * 0.9))).quantize(Decimal("0.01"))
            day_recov = (day_risk * Decimal("0.70")).quantize(Decimal("0.01"))

            daily_points.append(
                DailyForecastPoint(
                    day_label=label,
                    date_str=point_date.strftime("%Y-%m-%d"),
                    expected_payment_volume=day_vol,
                    predicted_failure_exposure=day_risk,
                    predicted_recoverable_revenue=day_recov,
                    confidence_percentage=conf,
                )
            )

        # 5. Risk Driver Breakdown
        risk_drivers: List[Dict[str, Any]] = [
            {
                "category": "Gateway A Timeout Spikes",
                "exposure_amount": str((risk_7d * Decimal("0.34")).quantize(Decimal("0.01"))),
                "share_pct": 34.0,
                "urgency": "HIGH",
            },
            {
                "category": "Expiring Payment Methods",
                "exposure_amount": str((risk_7d * Decimal("0.28")).quantize(Decimal("0.01"))),
                "share_pct": 28.0,
                "urgency": "MEDIUM",
            },
            {
                "category": "Customer Churn Delinquencies",
                "exposure_amount": str((risk_7d * Decimal("0.22")).quantize(Decimal("0.01"))),
                "share_pct": 22.0,
                "urgency": "MEDIUM",
            },
            {
                "category": "Soft Decline Renewal Bursts",
                "exposure_amount": str((risk_7d * Decimal("0.16")).quantize(Decimal("0.01"))),
                "share_pct": 16.0,
                "urgency": "LOW",
            },
        ]

        return RevenueForecastResponse(
            horizon_24h=h_24h,
            horizon_7d=h_7d,
            horizon_30d=h_30d,
            daily_forecasts=daily_points,
            top_risk_drivers=risk_drivers,
            model_calibration_timestamp=now,
            is_simulated_forecast=True,
        )
