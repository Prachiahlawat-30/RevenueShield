import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  TrendingUp,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';
import { HeroMoneyRecoveredCard } from '../components/dashboard/HeroMoneyRecoveredCard';
import { ExecutiveMoneyStoryBanner } from '../components/dashboard/ExecutiveMoneyStoryBanner';
import { MainWorkflowVisualizer } from '../components/workflow/MainWorkflowVisualizer';
import { AIVsPolicyComparisonCard } from '../components/workflow/AIVsPolicyComparisonCard';
import { RevenueProtectionScoreCard } from '../components/dashboard/RevenueProtectionScoreCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { RecoveryTrendChart } from '../components/charts/RecoveryTrendChart';
import { FailureBreakdownChart } from '../components/charts/FailureBreakdownChart';
import { ConversionFunnelChart } from '../components/charts/ConversionFunnelChart';
import { getDashboardMetrics, getDashboardCharts } from '../api/dashboard';
import { getRevenueRisks } from '../api/risks';
import { getRecoveryROI } from '../api/tier2';
import { DashboardMetrics, DashboardChartsData, RevenueRisk, RecoveryROIResponse } from '../types';
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [m, c, risksData, roi] = await Promise.all([
          getDashboardMetrics(),
          getDashboardCharts(),
          getRevenueRisks({ page: 1, page_size: 5 }),
          getRecoveryROI().catch(() => null),
        ]);
        setMetrics(m);
        setCharts(c);
        setRecentRisks(risksData.items);
        setRoiData(roi);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNav = (riskId: string) => {
    if (onNavigateToWorkflow) {
      onNavigateToWorkflow(riskId);
    } else if (onNavigateToRisk) {
      onNavigateToRisk(riskId);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-[16px] bg-[#12161F] border border-white/[0.06]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-[16px] bg-[#12161F] border border-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Hero Money Recovered Card */}
      <HeroMoneyRecoveredCard
        recoveredAmount={metrics?.total_revenue_recovered || 57200}
        atRiskAmount={metrics?.total_revenue_at_risk || 86000}
        recoveryRatePct={metrics?.recovery_rate_pct || 72.4}
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

      {/* 5. Top Metric Cards - 20px Gap, Clean Typography */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue at Risk */}
        <MetricCard
          label="Revenue at risk"
          value={formatCurrency(metrics?.total_revenue_at_risk || 86000)}
          icon={AlertOctagon}
          delta={metrics?.active_cases || 14}
          deltaType="neutral"
          deltaLabel="active failure cases"
          tooltip="Money associated with failed or potentially recoverable transactions."
        />

        {/* Recovered Revenue */}
        <MetricCard
          label="Recovered revenue"
          value={formatCurrency(metrics?.total_revenue_recovered || 57200)}
          icon={TrendingUp}
          delta={`+${metrics?.recovery_rate_pct || 72.4}%`}
          deltaType="positive"
          deltaLabel="gross captured volume"
          tooltip="Gross payment volume successfully recovered through smart retries and proactive outreach."
        />

        {/* Recovery Rate */}
        <MetricCard
          label="Recovery rate"
          value={`${metrics?.recovery_rate_pct || 72.4}%`}
          icon={Award}
          delta="+14.2%"
          deltaType="positive"
          deltaLabel="vs static baseline"
          tooltip="Percentage of failed transactions successfully rescued by the autonomous engine."
        />

        {/* Active Recovery Cases */}
        <MetricCard
          label="Active recovery cases"
          value={metrics?.active_cases || 14}
          icon={Zap}
          delta="Active operations"
          deltaType="neutral"
          tooltip="Failed payment cases currently undergoing diagnostic triage and policy evaluation."
        />
      </div>

      {/* 6. Executive Revenue Protection Score Card */}
      <RevenueProtectionScoreCard />

      {/* 7. Trends and Breakdown Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#F5F6FA]">Daily Recovery & Loss Trajectory</h2>
              <span className="text-[12px] text-[#9CA3B0]">Real-time payment failure recovery velocity</span>
            </div>
            <span className="h-5 px-2 rounded-full inline-flex items-center gap-1.5 text-[10px] font-medium text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Live stream
            </span>
          </div>
          {charts && <RecoveryTrendChart data={charts.daily_trends} />}
        </div>

        <div className="lg:col-span-4 rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#F5F6FA]">Failure Breakdown</h2>
              <span className="text-[12px] text-[#9CA3B0]">By root-cause diagnosis</span>
            </div>
          </div>
          {charts && <FailureBreakdownChart data={charts.failure_breakdown} />}
        </div>
      </div>

      {/* 8. Attribution & Conversion Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Intervention Attribution */}
        <div className="lg:col-span-7 rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
            <div>
              <h2 className="text-[18px] font-semibold text-[#F5F6FA]">Recovery Attribution by Strategy</h2>
              <span className="text-[12px] text-[#9CA3B0]">Financial yield by executed action</span>
            </div>
            <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase">Net ROI Attribution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roiData?.attribution_by_action?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-[12px] bg-[#0E121A] border border-white/[0.04] space-y-1"
              >
                <span className="text-xs text-[#9CA3B0] block">{item.category_label || item.action}</span>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[16px] font-semibold text-[#F5F6FA] tabular-nums">
                    {formatCurrency(item.recovered_revenue || item.revenue)}
                  </span>
                  <span className="text-xs text-[#9CA3B0] tabular-nums">
                    {item.percentage_of_total || item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="lg:col-span-5 rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#F5F6FA]">Recovery Progression Funnel</h2>
              <span className="text-[12px] text-[#9CA3B0]">Operational stage conversion</span>
            </div>
          </div>
          {charts && <ConversionFunnelChart stages={charts.stage_conversion_funnel} />}
        </div>
      </div>

      {/* 9. Recent Payment Failure Risks Console Table */}
      <div className="rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5 mb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#F5F6FA]">Active Revenue Risks Requiring Attention</h2>
            <span className="text-[12px] text-[#9CA3B0]">Sorted by highest expected recoverable value</span>
          </div>
          <button
            onClick={() => handleNav(recentRisks[0]?.id || '')}
            className="text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open in workflow</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#6B7280] uppercase text-[11px] font-medium tracking-[0.04em]">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Failure reason</th>
                <th className="pb-3 font-medium">Amount at risk</th>
                <th className="pb-3 font-medium">Attempts</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recentRisks.map((risk) => (
                <tr key={risk.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-medium text-[#F5F6FA]">
                    {risk.customer?.name || 'Customer'}
                  </td>
                  <td className="py-3.5 text-[#9CA3B0]">
                    {getFailureTypeLabel(risk.detected_failure_type)}
                  </td>
                  <td className="py-3.5 font-medium text-[#F5F6FA] tabular-nums">
                    {formatCurrency(risk.amount_at_risk)}
                  </td>
                  <td className="py-3.5 text-[#9CA3B0] tabular-nums">
                    {risk.attempt_count} / 3
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={risk.status} size="sm" />
                  </td>
                  <td className="py-3.5 text-right">
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
