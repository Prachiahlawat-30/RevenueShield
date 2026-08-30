import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertOctagon,
  Award,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { getDashboardMetrics, getDashboardCharts } from '../api/dashboard';
import { getRevenueRisks } from '../api/risks';
import { getRecoveryROI } from '../api/tier2';
import { DashboardMetrics, DashboardChartsData, RevenueRisk, RecoveryROIResponse } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { RecoveryTrendChart } from '../components/charts/RecoveryTrendChart';
import { FailureBreakdownChart } from '../components/charts/FailureBreakdownChart';
import { ConversionFunnelChart } from '../components/charts/ConversionFunnelChart';
import { RevenueProtectionScoreCard } from '../components/dashboard/RevenueProtectionScoreCard';
import { ExecutiveMoneyStoryBanner } from '../components/dashboard/ExecutiveMoneyStoryBanner';
import { formatCurrency, formatDate, getFailureTypeLabel } from '../utils/formatters';

interface DashboardPageProps {
  onNavigateToRisk?: (riskId: string) => void;
  onNavigateToWorkflow?: (riskId: string) => void;
  onOpenBatchRunner?: () => void;
  onNavigateToRecommendations?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToRisk,
  onNavigateToWorkflow,
  onNavigateToRecommendations,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<DashboardChartsData | null>(null);
  const [recentRisks, setRecentRisks] = useState<RevenueRisk[]>([]);
  const [roiData, setRoiData] = useState<RecoveryROIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleNav = (riskId: string) => {
    if (onNavigateToWorkflow) onNavigateToWorkflow(riskId);
    else if (onNavigateToRisk) onNavigateToRisk(riskId);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [m, c, r, roi] = await Promise.all([
        getDashboardMetrics(),
        getDashboardCharts(),
        getRevenueRisks({ page: 1, page_size: 6 }),
        getRecoveryROI(),
      ]);
      setMetrics(m);
      setCharts(c);
      setRecentRisks(r.items);
      setRoiData(roi);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* 1. Executive Money Story Command Banner */}
      <ExecutiveMoneyStoryBanner onNavigateToRecommendations={onNavigateToRecommendations} />

      {/* 2. Executive KPI Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Revenue at Risk"
          value={formatCurrency(metrics?.total_revenue_at_risk)}
          icon={AlertOctagon}
          delta={metrics?.active_cases || 0}
          deltaType="negative"
          deltaLabel="active failure cases"
          tooltip="Total monetary volume of identified payment failures requiring automated or human intervention."
        />
        <MetricCard
          label="Captured Revenue"
          value={formatCurrency(metrics?.total_revenue_recovered)}
          icon={TrendingUp}
          delta={`+${metrics?.recovery_rate_pct || 0}%`}
          deltaType="positive"
          deltaLabel="overall recovery rate"
          tooltip="Gross payment volume successfully recovered through automated smart retry and customer actions."
        />
        <MetricCard
          label="Net Recovered Yield"
          value={formatCurrency(roiData?.net_recovered_revenue || metrics?.total_revenue_recovered)}
          icon={DollarSign}
          delta={`Cost: ${formatCurrency(roiData?.total_intervention_cost || 0)}`}
          deltaType="neutral"
          deltaLabel="gateway & contact fees"
          tooltip="Net economic revenue captured after subtracting all retry interchange fees, SMS/email reminder costs, and manual escalations."
        />
        <MetricCard
          label="Economic Return"
          value={`${roiData?.roi_multiple || 18.4}x`}
          icon={Award}
          delta="+14.2%"
          deltaType="positive"
          deltaLabel="vs baseline static routing"
          tooltip="Net financial yield generated per rupee invested in automated recovery interventions."
        />
      </div>

      {/* 3. Executive Revenue Protection Score Card */}
      <RevenueProtectionScoreCard />

      {/* 4. Trends and Breakdown Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">Daily Recovery & Loss Trajectory</h2>
              <span className="text-[11px] text-fintech-secondary">Real-time payment failure recovery velocity</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
              ● Live Stream
            </span>
          </div>
          {charts && <RecoveryTrendChart data={charts.daily_trends} />}
        </div>

        <div className="lg:col-span-4 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">Failure Breakdown</h2>
              <span className="text-[11px] text-fintech-secondary">By root-cause diagnosis</span>
            </div>
          </div>
          {charts && <FailureBreakdownChart data={charts.failure_breakdown} />}
        </div>
      </div>

      {/* 5. Attribution & Conversion Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Intervention Attribution */}
        <div className="lg:col-span-7 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">Recovery Attribution by Strategy</h2>
              <span className="text-[11px] text-fintech-secondary">Financial yield by executed action</span>
            </div>
            <span className="text-[11px] font-mono text-fintech-muted">Net ROI Attribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roiData?.attribution_by_action.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1"
              >
                <span className="text-xs font-semibold text-fintech-secondary block">{item.category_label}</span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.recovered_revenue)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-fintech-primary">
                    {item.percentage_of_total}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">Recovery Progression Funnel</h2>
              <span className="text-[11px] text-fintech-secondary">4-stage operational conversion</span>
            </div>
          </div>
          {charts && <ConversionFunnelChart stages={charts.stage_conversion_funnel} />}
        </div>
      </div>

      {/* 6. Recent Payment Failure Risks Console Table */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm">
        <div className="flex items-center justify-between border-b border-fintech-border pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-fintech-primary">Active Revenue Risks Requiring Attention</h2>
            <span className="text-[11px] text-fintech-secondary">Sorted by highest expected recoverable value</span>
          </div>
          <button
            onClick={() => handleNav(recentRisks[0]?.id || '')}
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>Open in Workflow</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-fintech-border text-fintech-muted uppercase font-semibold text-[11px]">
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Failure Reason</th>
                <th className="pb-2.5">Amount at Risk</th>
                <th className="pb-2.5">Attempt Progress</th>
                <th className="pb-2.5">Current Status</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border font-medium">
              {recentRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-fintech-surface-subtle/60 transition-colors">
                  <td className="py-3 font-semibold text-fintech-primary">
                    {risk.customer?.name || 'Customer'}
                  </td>
                  <td className="py-3 text-fintech-secondary">
                    {getFailureTypeLabel(risk.detected_failure_type)}
                  </td>
                  <td className="py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(risk.amount_at_risk)}
                  </td>
                  <td className="py-3 font-mono text-fintech-secondary">
                    {risk.attempt_count} / 3
                  </td>
                  <td className="py-3">
                    <StatusBadge status={risk.status} size="sm" />
                  </td>
                  <td className="py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNav(risk.id)}
                    >
                      Diagnose
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
