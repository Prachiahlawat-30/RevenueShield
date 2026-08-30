import React, { useEffect, useState } from 'react';
import {
  Download,
  Printer,
  Trophy,
  Award,
  Users,
  CreditCard,
  Zap,
  Building2,
} from 'lucide-react';
import { getMonthlyReport, getLeaderboards } from '../api/tier3';
import {
  MonthlyRecoveryReportResponse,
  RevenueLeaderboardResponse,
  LeaderboardRankingItem,
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const LeaderboardsAndReportsPage: React.FC = () => {
  const [report, setReport] = useState<MonthlyRecoveryReportResponse | null>(null);
  const [leaderboards, setLeaderboards] = useState<RevenueLeaderboardResponse | null>(null);
  const [period, setPeriod] = useState('30d');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<
    'strategies' | 'actions' | 'gateways' | 'segments' | 'merchants'
  >('strategies');
  const [loading, setLoading] = useState(true);

  const fetchData = async (p: string) => {
    try {
      setLoading(true);
      const [r, l] = await Promise.all([getMonthlyReport(), getLeaderboards(p)]);
      setReport(r);
      setLeaderboards(l);
    } catch (err) {
      console.error('Failed to load reports and leaderboards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const handleDownloadCsv = () => {
    if (!report?.csv_data) return;
    const blob = new Blob([report.csv_data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `RecoverAI_Monthly_Report_${report.period.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const getActiveItems = (): LeaderboardRankingItem[] => {
    if (!leaderboards) return [];
    switch (activeLeaderboardTab) {
      case 'strategies':
        return leaderboards.top_strategies;
      case 'actions':
        return leaderboards.top_actions;
      case 'gateways':
        return leaderboards.top_gateways;
      case 'segments':
        return leaderboards.top_customer_segments;
      case 'merchants':
        return leaderboards.top_merchants;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
            <Trophy className="h-4 w-4" />
            <span>EXECUTIVE REPORTS & RECOVERY LEADERBOARDS</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Monthly Recovery Report & Leaderboard
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            Exportable executive monthly statements, verified recovery metrics, and multi-dimensional performance rankings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownloadCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Feature 28: Monthly Executive Report Card */}
      {report && (
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-600 dark:text-brand-400 block tracking-wider font-mono">
                Official Monthly Statement
              </span>
              <h2 className="text-xl font-black text-fintech-primary mt-0.5">{report.report_title}</h2>
              <span className="text-xs font-mono text-fintech-muted">Billing Period: {report.period}</span>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
              Recovery Rate: {report.recovery_rate_pct}%
            </span>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <span className="text-[10px] uppercase font-bold text-fintech-muted block">Revenue At Risk</span>
              <span className="text-xl font-black font-mono text-fintech-primary block mt-1">
                {formatCurrency(report.revenue_at_risk)}
              </span>
              <span className="text-[10px] text-fintech-muted">Total volume exposed</span>
            </div>

            <div className="p-4 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Recovered Funds</span>
              <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
                {formatCurrency(report.recovered)}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500">Directly settled to accounts</span>
            </div>

            <div className="p-4 rounded-fintech-md bg-sky-500/10 border border-sky-500/30">
              <span className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400 block">Prevented Pre-Failure</span>
              <span className="text-xl font-black font-mono text-sky-700 dark:text-cyan-300 block mt-1">
                {formatCurrency(report.prevented)}
              </span>
              <span className="text-[10px] text-sky-600 dark:text-cyan-400">Pre-empted before decline</span>
            </div>

            <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <span className="text-[10px] uppercase font-bold text-fintech-muted block">Policy Violations</span>
              <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
                {report.policy_violations}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500">100% Deterministic Compliance</span>
            </div>
          </div>

          {/* Qualitative Attribution Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <span className="text-[10px] text-fintech-muted block uppercase font-bold">Top Failure Category</span>
              <span className="text-fintech-primary font-semibold block mt-1">{report.top_failure}</span>
            </div>

            <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <span className="text-[10px] text-brand-600 dark:text-brand-400 block uppercase font-bold">Best Performing Strategy</span>
              <span className="text-brand-700 dark:text-brand-200 font-semibold block mt-1">{report.best_strategy}</span>
            </div>

            <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase font-bold">Degraded Processor</span>
              <span className="text-rose-700 dark:text-rose-200 font-semibold block mt-1">{report.worst_gateway}</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature 29: Revenue Recovery Leaderboard */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider font-mono">
              Efficiency & Performance Rankings
            </span>
            <h3 className="text-lg font-bold text-fintech-primary mt-0.5">Revenue Recovery Leaderboards</h3>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 rounded-fintech-md bg-fintech-surface-subtle p-1 border border-fintech-border text-xs">
            {['7d', '30d', '90d', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-fintech-sm font-bold uppercase text-[10px] transition-all ${
                  period === p ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
                }`}
              >
                {p === 'all' ? 'All Time' : p}
              </button>
            ))}
          </div>
        </div>

        {/* 5 Leaderboard Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'strategies', label: 'Top Strategies', icon: Award },
            { id: 'actions', label: 'Top Actions', icon: Zap },
            { id: 'gateways', label: 'Top Gateways', icon: CreditCard },
            { id: 'segments', label: 'Customer Segments', icon: Users },
            { id: 'merchants', label: 'Top Merchants', icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeLeaderboardTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLeaderboardTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-fintech-md px-3.5 py-2 font-bold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-fintech-sm'
                    : 'bg-fintech-surface-subtle text-fintech-muted border border-fintech-border hover:text-fintech-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ranked Items List */}
        <div className="space-y-3">
          {getActiveItems().map((item) => (
            <div
              key={item.rank}
              className="flex flex-wrap items-center justify-between gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-fintech-sm font-black text-xs font-mono ${
                    item.rank === 1
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : item.rank === 2
                      ? 'bg-slate-300 dark:bg-slate-700/40 text-slate-800 dark:text-slate-300 border border-slate-400 dark:border-slate-600/40'
                      : item.rank === 3
                      ? 'bg-amber-800/20 text-amber-800 dark:text-amber-500 border border-amber-700/30'
                      : 'bg-fintech-surface text-fintech-muted border border-fintech-border'
                  }`}
                >
                  #{item.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-fintech-primary text-xs">{item.name}</h4>
                    {item.badge_label && (
                      <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-brand-700 dark:text-brand-300 border border-brand-500/20 font-mono">
                        {item.badge_label}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-fintech-muted">{item.secondary_info}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                  {item.metric_formatted}
                </span>
                <span className="text-[9px] text-fintech-muted uppercase font-mono">Captured Revenue</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
