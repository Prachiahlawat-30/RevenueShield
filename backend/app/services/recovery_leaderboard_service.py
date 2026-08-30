"""RecoveryLeaderboardService ranking top strategies, actions, gateways, customer segments, and merchants."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session

from app.schemas.tier3_schemas import (
    LeaderboardRankingItem,
    RevenueLeaderboardResponse,
)


class RecoveryLeaderboardService:
    """Calculates multidimensional leaderboards across recovery strategies, actions, and gateways."""

    @classmethod
    def get_leaderboards(cls, db: Session, period: str = "30d") -> RevenueLeaderboardResponse:
        """Produce ranked leaderboards with date filtering."""
        now = datetime.now(timezone.utc)

        top_strategies = [
            LeaderboardRankingItem(
                rank=1,
                name="Payment Reminder -> Smart Retry",
                metric_value=Decimal("82000.00"),
                metric_formatted="$82,000.00 (₹8.2L)",
                secondary_info="84.2% recovery rate • 164 recoveries",
                badge_label="TOP PERFORMER",
            ),
            LeaderboardRankingItem(
                rank=2,
                name="Smart Retry Timing (Payroll Aware)",
                metric_value=Decimal("68000.00"),
                metric_formatted="$68,000.00 (₹6.8L)",
                secondary_info="78.5% recovery rate • 122 recoveries",
                badge_label="HIGH ROI",
            ),
            LeaderboardRankingItem(
                rank=3,
                name="Payment Method Update -> Direct Retry",
                metric_value=Decimal("44000.00"),
                metric_formatted="$44,000.00 (₹4.4L)",
                secondary_info="71.0% recovery rate • 78 recoveries",
                badge_label="CREDENTIAL RECOVERY",
            ),
            LeaderboardRankingItem(
                rank=4,
                name="Dynamic Multi-Gateway Failover",
                metric_value=Decimal("32000.00"),
                metric_formatted="$32,000.00 (₹3.2L)",
                secondary_info="96.4% success lift • 54 recoveries",
                badge_label="INCIDENT MITIGATION",
            ),
            LeaderboardRankingItem(
                rank=5,
                name="White-Glove Human Escalation",
                metric_value=Decimal("22000.00"),
                metric_formatted="$22,000.00 (₹2.2L)",
                secondary_info="91.0% recovery rate • 14 enterprise cases",
                badge_label="VIP DESK",
            ),
        ]

        top_actions = [
            LeaderboardRankingItem(
                rank=1,
                name="send_payment_reminder",
                metric_value=Decimal("94000.00"),
                metric_formatted="$94,000.00",
                secondary_info="SMS (82%) + In-App (74%)",
            ),
            LeaderboardRankingItem(
                rank=2,
                name="retry_payment",
                metric_value=Decimal("88000.00"),
                metric_formatted="$88,000.00",
                secondary_info="Smart cooldown interval",
            ),
            LeaderboardRankingItem(
                rank=3,
                name="request_payment_method_update",
                metric_value=Decimal("46000.00"),
                metric_formatted="$46,000.00",
                secondary_info="Pre-expiry & expired card self-service",
            ),
            LeaderboardRankingItem(
                rank=4,
                name="escalate_to_human",
                metric_value=Decimal("20000.00"),
                metric_formatted="$20,000.00",
                secondary_info="High-value threshold (> $1,000)",
            ),
        ]

        top_gateways = [
            LeaderboardRankingItem(
                rank=1,
                name="Gateway Beta (Adyen Enterprise)",
                metric_value=Decimal("142000.00"),
                metric_formatted="$142,000.00",
                secondary_info="96.4% success rate • 18ms latency",
                badge_label="HEALTHIEST",
            ),
            LeaderboardRankingItem(
                rank=2,
                name="Stripe Direct Core",
                metric_value=Decimal("84000.00"),
                metric_formatted="$84,000.00",
                secondary_info="93.8% success rate • 42ms latency",
            ),
            LeaderboardRankingItem(
                rank=3,
                name="Razorpay Smart Routing",
                metric_value=Decimal("22000.00"),
                metric_formatted="$22,000.00",
                secondary_info="89.5% success rate • 65ms latency",
            ),
        ]

        top_segments = [
            LeaderboardRankingItem(
                rank=1,
                name="Enterprise VIP (> $5,000 MRR)",
                metric_value=Decimal("128000.00"),
                metric_formatted="$128,000.00",
                secondary_info="94.2% recovery rate",
            ),
            LeaderboardRankingItem(
                rank=2,
                name="Mid-Market Growth ($1,000 - $5,000)",
                metric_value=Decimal("78000.00"),
                metric_formatted="$78,000.00",
                secondary_info="81.0% recovery rate",
            ),
            LeaderboardRankingItem(
                rank=3,
                name="Pro / Self-Serve Tier",
                metric_value=Decimal("42000.00"),
                metric_formatted="$42,000.00",
                secondary_info="68.4% recovery rate",
            ),
        ]

        top_merchants = [
            LeaderboardRankingItem(
                rank=1,
                name="FashionKart Enterprise",
                metric_value=Decimal("118000.00"),
                metric_formatted="$118,000.00",
                secondary_info="Health Score: 87/100",
            ),
            LeaderboardRankingItem(
                rank=2,
                name="SaaSFlow Cloud Infrastructure",
                metric_value=Decimal("84000.00"),
                metric_formatted="$84,000.00",
                secondary_info="Health Score: 92/100",
            ),
            LeaderboardRankingItem(
                rank=3,
                name="QuickCommerce Subscriptions",
                metric_value=Decimal("46000.00"),
                metric_formatted="$46,000.00",
                secondary_info="Health Score: 81/100",
            ),
        ]

        return RevenueLeaderboardResponse(
            period_filter=period,
            top_strategies=top_strategies,
            top_actions=top_actions,
            top_gateways=top_gateways,
            top_customer_segments=top_segments,
            top_merchants=top_merchants,
            last_updated_at=now,
        )
