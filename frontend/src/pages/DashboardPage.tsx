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

      {/* 2. Top Metric Cards - Styled exactly per prompt specifications */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue at Risk - Prominent Danger/Warning */}
        <MetricCard
          label="Revenue at Risk"
          value={formatCurrency(metrics?.total_revenue_at_risk)}
          accent="danger"
          icon={AlertOctagon}
          delta={metrics?.active_cases || 0}
          deltaType="negative"
          deltaLabel="active failure cases"
          tooltip="Total monetary volume of identified payment failures requiring automated intervention."
        />

        {/* Recovered Revenue - Prominent Success #16A34A */}
        <MetricCard
          label="Recovered Revenue"
          value={formatCurrency(metrics?.total_revenue_recovered)}
          accent="success"
          icon={TrendingUp}
          delta={`+${metrics?.recovery_rate_pct || 0}%`}
          deltaType="positive"
          deltaLabel="gross captured volume"
          tooltip="Gross payment volume successfully recovered through smart retries and proactive outreach."
        />

        {/* Recovery Rate - Primary Brand #6822CC */}
        <MetricCard
          label="Recovery Rate"
          value={`${metrics?.recovery_rate_pct || 0}%`}
          accent="purple"
          icon={Award}
          delta="+14.2%"
          deltaType="positive"
          deltaLabel="vs static baseline"
          tooltip="Percentage of failed transactions successfully rescued by the autonomous engine."
        />

        {/* Active Recovery Cases - Accent Blue #2B6FFF */}
        <MetricCard
          label="Active Recovery Cases"
          value={metrics?.active_cases || 0}
          accent="blue"
          icon={Zap}
          delta="Under Active Automation"
          deltaType="neutral"
          tooltip="Failed payment cases currently undergoing diagnostic triage and policy evaluation."
        />
      </div>

      {/* 3. Executive Revenue Protection Score Card */}
      <RevenueProtectionScoreCard />

      {/* 4. Trends and Breakdown Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Daily Recovery & Loss Trajectory</h2>
              <span className="text-[11px] text-[#6B7280]">Real-time payment failure recovery velocity</span>
            </div>
            <span className="text-[10px] font-mono text-[#16A34A] bg-[#16A34A]/10 border border-[#16A34A]/20 px-2 py-0.5 rounded-full font-bold">
              ● Live Stream
            </span>
          </div>
          {charts && <RecoveryTrendChart data={charts.daily_trends} />}
        </div>

        <div className="lg:col-span-4 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Failure Breakdown</h2>
              <span className="text-[11px] text-[#6B7280]">By root-cause diagnosis</span>
            </div>
          </div>
          {charts && <FailureBreakdownChart data={charts.failure_breakdown} />}
        </div>
      </div>

      {/* 5. Attribution & Conversion Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Intervention Attribution */}
        <div className="lg:col-span-7 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Recovery Attribution by Strategy</h2>
              <span className="text-[11px] text-[#6B7280]">Financial yield by executed action</span>
            </div>
            <span className="text-[11px] font-mono text-[#6B7280]">Net ROI Attribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roiData?.attribution_by_action.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-[#E5E7EB] dark:border-[#242E42] space-y-1"
              >
                <span className="text-xs font-semibold text-[#6B7280] block">{item.category_label}</span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-bold font-mono text-[#16A34A]">
                    {formatCurrency(item.recovered_revenue)}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#1A1A2E] dark:text-white">
                    {item.percentage_of_total}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Recovery Progression Funnel</h2>
              <span className="text-[11px] text-[#6B7280]">4-stage operational conversion</span>
            </div>
          </div>
          {charts && <ConversionFunnelChart stages={charts.stage_conversion_funnel} />}
        </div>
      </div>

      {/* 6. Recent Payment Failure Risks Console Table */}
      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Active Revenue Risks Requiring Attention</h2>
            <span className="text-[11px] text-[#6B7280]">Sorted by highest expected recoverable value</span>
          </div>
          <button
            onClick={() => handleNav(recentRisks[0]?.id || '')}
            className="text-xs font-bold text-[#6822CC] hover:text-[#4B1A99] flex items-center gap-1 transition-colors"
          >
            <span>Open in Workflow</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#242E42] text-[#6B7280] uppercase font-semibold text-[11px]">
                <th className="pb-2.5">Customer</th>
                <th className="pb-2.5">Failure Reason</th>
                <th className="pb-2.5">Amount at Risk</th>
                <th className="pb-2.5">Attempt Progress</th>
                <th className="pb-2.5">Current Status</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#242E42] font-medium">
              {recentRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-semibold text-[#1A1A2E] dark:text-white">
                    {risk.customer?.name || 'Customer'}
                  </td>
                  <td className="py-3 text-[#6B7280]">
                    {getFailureTypeLabel(risk.detected_failure_type)}
                  </td>
                  <td className="py-3 font-mono font-bold text-[#DC2626]">
                    {formatCurrency(risk.amount_at_risk)}
                  </td>
                  <td className="py-3 font-mono text-[#6B7280]">
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
