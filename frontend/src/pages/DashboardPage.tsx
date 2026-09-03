import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertOctagon,
  Award,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { getDashboardMetrics, getDashboardCharts } from '../api/dashboard';
import { getRevenueRisks } from '../api/risks';
import { getRecoveryROI } from '../api/tier2';
import { DashboardMetrics, DashboardChartsData, RevenueRisk, RecoveryROIResponse } from '../types';
import { MetricCard } from '../components/ui/MetricCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { RecoveryTrendChart } from '../components/charts/RecoveryTrendChart';
import { FailureBreakdownChart } from '../components/charts/FailureBreakdownChart';
import { ConversionFunnelChart } from '../components/charts/ConversionFunnelChart';
import { RevenueProtectionScoreCard } from '../components/dashboard/RevenueProtectionScoreCard';
import { ExecutiveMoneyStoryBanner } from '../components/dashboard/ExecutiveMoneyStoryBanner';
import { MainWorkflowVisualizer } from '../components/workflow/MainWorkflowVisualizer';
import { HeroMoneyRecoveredCard } from '../components/dashboard/HeroMoneyRecoveredCard';
import { AIVsPolicyComparisonCard } from '../components/workflow/AIVsPolicyComparisonCard';
import { formatCurrency, getFailureTypeLabel } from '../utils/formatters';
import { NavTab } from '../components/layout/Sidebar';

interface DashboardPageProps {
  onNavigateToRisk?: (riskId: string) => void;
  onNavigateToWorkflow?: (riskId: string) => void;
  onOpenBatchRunner?: () => void;
  onNavigateToRecommendations?: () => void;
  onNavigateToTab?: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToRisk,
  onNavigateToWorkflow,
  onOpenBatchRunner,
  onNavigateToRecommendations,
  onNavigateToTab,
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
    <div className="space-y-8 animate-fintech-fade">
      {/* 1. THE HERO METRIC: MONEY RECOVERED */}
      <HeroMoneyRecoveredCard
        recoveredAmount={metrics?.total_revenue_recovered}
        atRiskAmount={metrics?.total_revenue_at_risk}
        recoveryRatePct={metrics?.recovery_rate_pct}
        onNavigateToTab={onNavigateToTab}
        onOpenBatchRunner={onOpenBatchRunner}
      />

      {/* 2. Executive Money Story Command Banner */}
      <ExecutiveMoneyStoryBanner onNavigateToRecommendations={onNavigateToRecommendations} />

      {/* 3. Primary 7-Step Recovery Workflow Visualizer */}
      <MainWorkflowVisualizer onNavigateToTab={onNavigateToTab} />

      {/* 4. Architecture Spotlight: AI RECOMMENDATION vs POLICY ENGINE */}
      <AIVsPolicyComparisonCard
        activeRiskId={recentRisks[0]?.id}
        onNavigateToWorkflow={onNavigateToWorkflow}
        onNavigateToTab={onNavigateToTab}
      />

      {/* 5. Top Metric Cards - Clean, Neutral, Glassmorphic Hierarchy */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue at Risk */}
        <MetricCard
          label="Revenue at Risk"
          value={formatCurrency(metrics?.total_revenue_at_risk)}
          icon={AlertOctagon}
          delta={metrics?.active_cases || 0}
          deltaType="neutral"
          deltaLabel="active failure cases"
          tooltip="Money associated with failed or potentially recoverable transactions."
        />

        {/* Recovered Revenue */}
        <MetricCard
          label="Recovered Revenue"
          value={formatCurrency(metrics?.total_revenue_recovered)}
          icon={TrendingUp}
          delta={`+${metrics?.recovery_rate_pct || 0}%`}
          deltaType="positive"
          deltaLabel="gross captured volume"
          tooltip="Gross payment volume successfully recovered through smart retries and proactive outreach."
        />

        {/* Recovery Rate */}
        <MetricCard
          label="Recovery Rate"
          value={`${metrics?.recovery_rate_pct || 0}%`}
          icon={Award}
          delta="+14.2%"
          deltaType="positive"
          deltaLabel="vs static baseline"
          tooltip="Percentage of failed transactions successfully rescued by the autonomous engine."
        />

        {/* Active Recovery Cases */}
        <MetricCard
          label="Active Recovery Cases"
          value={metrics?.active_cases || 0}
          icon={Zap}
          delta="Active Operations"
          deltaType="neutral"
          tooltip="Failed payment cases currently undergoing diagnostic triage and policy evaluation."
        />
      </div>

      {/* 6. Executive Revenue Protection Score Card */}
      <RevenueProtectionScoreCard />

      {/* 7. Trends and Breakdown Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Daily Recovery & Loss Trajectory</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Real-time payment failure recovery velocity</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
              ● Live Stream
            </span>
          </div>
          {charts && <RecoveryTrendChart data={charts.daily_trends} />}
        </div>

        <div className="lg:col-span-4 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Failure Breakdown</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">By root-cause diagnosis</span>
            </div>
          </div>
          {charts && <FailureBreakdownChart data={charts.failure_breakdown} />}
        </div>
      </div>

      {/* 8. Attribution & Conversion Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Intervention Attribution */}
        <div className="lg:col-span-7 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recovery Attribution by Strategy</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Financial yield by executed action</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Net ROI Attribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roiData?.attribution_by_action.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] space-y-1 hover:-translate-y-[1px] transition-all"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">{item.category_label}</span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrency(item.recovered_revenue)}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                    {item.percentage_of_total}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recovery Progression Funnel</h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Operational stage conversion</span>
            </div>
          </div>
          {charts && <ConversionFunnelChart stages={charts.stage_conversion_funnel} />}
        </div>
      </div>

      {/* 9. Recent Payment Failure Risks Console Table */}
      <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Active Revenue Risks Requiring Attention</h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Sorted by highest expected recoverable value</span>
          </div>
          <button
            onClick={() => handleNav(recentRisks[0]?.id || '')}
            className="text-xs font-semibold text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open in Workflow</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                <th className="pb-2.5 font-medium">Customer</th>
                <th className="pb-2.5 font-medium">Failure Reason</th>
                <th className="pb-2.5 font-medium">Amount at Risk</th>
                <th className="pb-2.5 font-medium">Attempt Progress</th>
                <th className="pb-2.5 font-medium">Current Status</th>
                <th className="pb-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-medium">
              {recentRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    {risk.customer?.name || 'Customer'}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {getFailureTypeLabel(risk.detected_failure_type)}
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(risk.amount_at_risk)}
                  </td>
                  <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
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
