import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  Database,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getIntelligenceSummary,
  getOpportunities,
  getOpportunityDetail,
} from '../api/intelligence';
import { seedDemoDatabase } from '../api/simulation';
import {
  RecoveryIntelligenceSummary,
  RecoveryOpportunityItem,
  PriorityBand,
} from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { ExpectedRecoveryByTypeChart } from '../components/charts/ExpectedRecoveryByTypeChart';
import { PriorityDistributionChart } from '../components/charts/PriorityDistributionChart';
import { RecoveryFunnelChart } from '../components/charts/RecoveryFunnelChart';
import { OpportunityDetailDrawer } from '../components/intelligence/OpportunityDetailDrawer';
import { BatchRunnerModal } from '../components/workflow/BatchRunnerModal';
import { Button } from '../components/ui/Button';

export const RecoveryIntelligencePage: React.FC = () => {
  const [summary, setSummary] = useState<RecoveryIntelligenceSummary | null>(null);
  const [opportunities, setOpportunities] = useState<RecoveryOpportunityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // View Mode: 'split' (Both Charts + Table) | 'table' (Focus on Queue) | 'charts' (Focus on Analytics)
  const [viewMode, setViewMode] = useState<'split' | 'table' | 'charts'>('split');

  // Filters & Sorting
  const [selectedBand, setSelectedBand] = useState<string>('all');
  const [selectedFailureType, setSelectedFailureType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority_score');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawer
  const [selectedOpportunity, setSelectedOpportunity] = useState<RecoveryOpportunityItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, oppsData] = await Promise.all([
        getIntelligenceSummary(),
        getOpportunities({
          priority_band: selectedBand !== 'all' ? selectedBand : undefined,
          failure_type: selectedFailureType !== 'all' ? selectedFailureType : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          sort_by: sortBy,
          page: 1,
          page_size: 50,
        }),
      ]);

      setSummary(sumData);
      setOpportunities(oppsData.items);
      setTotalCount(oppsData.total);
    } catch (err: any) {
      console.error('Failed to load recovery intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBand, selectedFailureType, selectedStatus, sortBy]);

  const handleSeedDemoData = async () => {
    try {
      setRecalculating(true);
      await seedDemoDatabase(true);
      await fetchData();
      setNotification('Demo intelligence personas seeded successfully.');
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleInspectOpportunity = async (opp: RecoveryOpportunityItem) => {
    try {
      const detailed = await getOpportunityDetail(opp.risk_id);
      setSelectedOpportunity(detailed);
      setIsDrawerOpen(true);
    } catch (err: any) {
      setSelectedOpportunity(opp);
      setIsDrawerOpen(true);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.customer_name.toLowerCase().includes(q) ||
      opp.customer_email.toLowerCase().includes(q) ||
      opp.failure_type_label.toLowerCase().includes(q) ||
      opp.recommended_action_label.toLowerCase().includes(q)
    );
  });

  const getPriorityBadge = (band: PriorityBand, score: number) => {
    switch (band) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{score} • CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>{score} • HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30">
            <span>{score} • MED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-fintech-muted bg-fintech-surface-subtle border border-fintech-border">
            <span>{score} • LOW</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fintech-fade pb-8">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs flex items-center gap-2 shadow-fintech-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
          <p className="font-semibold">{notification}</p>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-fintech-surface px-5 py-3.5 rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-fintech-sm bg-brand-500/10 border border-brand-500/20 text-brand-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-fintech-primary tracking-tight">Recovery Intelligence</h1>
              <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
                Multi-Engine
              </span>
            </div>
            <p className="text-xs text-fintech-secondary">
              Predictive yields, causal ranking, and deterministic policy execution.
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-fintech-surface-subtle p-1 rounded-fintech-md border border-fintech-border text-xs">
            <button
              onClick={() => setViewMode('split')}
              title="Split Matrix View"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-fintech-sm font-semibold transition-all text-xs ${
                viewMode === 'split'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Focus on Opportunities Queue"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-fintech-sm font-semibold transition-all text-xs ${
                viewMode === 'table'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table ({filteredOpportunities.length})</span>
            </button>
            <button
              onClick={() => setViewMode('charts')}
              title="Focus on Visual Analytics"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-fintech-sm font-semibold transition-all text-xs ${
                viewMode === 'charts'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Charts</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={loading}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            onClick={() => setIsBatchModalOpen(true)}
          >
            Batch Run
          </Button>
        </div>
      </div>

      {/* Compact 4-Metric KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Expected Recoverable */}
        <div className="p-3.5 rounded-fintech-lg bg-brand-500/5 border border-brand-500/25 shadow-fintech-sm space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-brand-600 dark:text-brand-400 font-bold uppercase">
            <span>Expected Recoverable</span>
            <DollarSign className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <p className="text-xl font-black text-fintech-primary font-mono tracking-tight">
            {formatCurrency(summary?.expected_recoverable_revenue || 0)}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>{formatPercent((summary?.average_recovery_probability || 0) * 100)} weighted yield</span>
          </div>
        </div>

        {/* KPI 2: Revenue At Risk */}
        <div className="p-3.5 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-[11px] font-bold text-fintech-muted uppercase font-mono block">
            Total Exposure at Risk
          </span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {formatCurrency(summary?.total_revenue_at_risk || 0)}
          </p>
          <span className="text-[10px] text-fintech-muted font-mono block">
            Across {summary?.total_risks || 0} failed transaction cases
          </span>
        </div>

        {/* KPI 3: Average Probability */}
        <div className="p-3.5 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-[11px] font-bold text-fintech-muted uppercase font-mono block">
            Portfolio Recovery Rate
          </span>
          <p className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight">
            {formatPercent((summary?.average_recovery_probability || 0) * 100)}
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${(summary?.average_recovery_probability || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* KPI 4: High / Critical Pipeline */}
        <div className="p-3.5 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-[11px] font-bold text-fintech-muted uppercase font-mono block">
            Urgent Priority Pipeline
          </span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {(summary?.critical_opportunities || 0) + (summary?.high_priority_opportunities || 0)} cases
          </p>
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
            <span className="text-rose-600 dark:text-rose-400">{summary?.critical_opportunities || 0} Critical</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 dark:text-amber-400">{summary?.high_priority_opportunities || 0} High</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Shown in 'split' or 'charts' mode) */}
      {(viewMode === 'split' || viewMode === 'charts') && (
        <div className={`grid grid-cols-1 ${viewMode === 'split' ? 'lg:grid-cols-3' : 'lg:grid-cols-3'} gap-4`}>
          {/* Chart 1: Expected Recovery Yield by Failure Type */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-2' : 'lg:col-span-2'} p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                  Expected Recovery Yield by Failure Type
                </h3>
                <p className="text-[11px] text-fintech-secondary">
                  Total exposure vs probabilistic recoverable amount.
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.2 rounded bg-fintech-surface-subtle text-fintech-muted font-mono border border-fintech-border">
                Recharts
              </span>
            </div>
            <div className="h-56">
              <ExpectedRecoveryByTypeChart data={summary?.expected_by_failure_type || []} />
            </div>
          </div>

          {/* Chart 2 & 3: Priority & Funnel */}
          <div className="space-y-4">
            {/* Priority Distribution */}
            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                  Priority Distribution
                </h3>
                {selectedBand !== 'all' && (
                  <button
                    onClick={() => setSelectedBand('all')}
                    className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              <PriorityDistributionChart
                data={summary?.priority_distribution || {}}
                selectedBand={selectedBand}
                onSelectBand={(band) => setSelectedBand(band === selectedBand ? 'all' : band)}
              />
            </div>

            {/* Recovery Funnel */}
            <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                  Recovery Value Funnel
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {summary?.recovery_funnel?.[3]?.amount
                    ? formatCurrency(summary.recovery_funnel[3].amount)
                    : '$0.00'}{' '}
                  settled
                </span>
              </div>
              <RecoveryFunnelChart data={summary?.recovery_funnel || []} />
            </div>
          </div>
        </div>
      )}

      {/* Priority Opportunities Table (Shown in 'split' or 'table' mode) */}
      {(viewMode === 'split' || viewMode === 'table') && (
        <div className="rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm p-4 space-y-3">
          {/* Table Header & Responsive Filter Strip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-fintech-border pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-fintech-primary tracking-tight">
                Opportunity Priority Queue
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono font-bold border border-brand-500/20">
                {filteredOpportunities.length} Active
              </span>
            </div>

            {/* Inline Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-fintech-muted" />
                <input
                  type="text"
                  placeholder="Search customer, failure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-primary placeholder-fintech-muted focus:outline-none focus:border-brand-500 w-44"
                />
              </div>

              {/* Priority Filter */}
              <select
                value={selectedBand}
                onChange={(e) => setSelectedBand(e.target.value)}
                className="px-2 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Failure Type Filter */}
              <select
                value={selectedFailureType}
                onChange={(e) => setSelectedFailureType(e.target.value)}
                className="px-2 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Failures</option>
                <option value="temporary_decline">Temporary Decline</option>
                <option value="insufficient_funds">Insufficient Funds</option>
                <option value="expired_card">Expired Card</option>
                <option value="network_error">Network Error</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
              >
                <option value="priority_score">Sort: Priority Score</option>
                <option value="expected_recovery_value">Sort: Expected Yield</option>
                <option value="recovery_probability">Sort: Probability</option>
                <option value="amount_at_risk">Sort: Failed Amount</option>
              </select>
            </div>
          </div>

          {/* Scroll-Contained Interactive Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[380px] rounded-fintech-md border border-fintech-border relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-fintech-surface-subtle text-fintech-muted font-bold border-b border-fintech-border uppercase tracking-wider text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Exposure</th>
                  <th className="py-2.5 px-3">Failure Reason</th>
                  <th className="py-2.5 px-3">Probability</th>
                  <th className="py-2.5 px-3 text-right">Expected Yield</th>
                  <th className="py-2.5 px-3">Next Best Action</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border text-fintech-secondary">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-fintech-muted">
                      No matching recovery opportunities found.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => (
                    <tr
                      key={opp.risk_id}
                      onClick={() => handleInspectOpportunity(opp)}
                      className="hover:bg-fintech-surface-subtle cursor-pointer transition group"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getPriorityBadge(opp.priority_band, opp.priority_score)}
                      </td>

                      <td className="py-2.5 px-3">
                        <div>
                          <p className="font-bold text-fintech-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition truncate max-w-[140px]">
                            {opp.customer_name}
                          </p>
                          <p className="text-[10px] text-fintech-muted font-mono truncate max-w-[140px]">
                            {opp.customer_email}
                          </p>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-fintech-primary whitespace-nowrap">
                        {formatCurrency(opp.transaction_amount)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-fintech-surface-subtle text-fintech-secondary border border-fintech-border font-mono">
                          {opp.failure_type_label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
                            {formatPercent(opp.recovery_probability * 100)}
                          </span>
                          <div className="w-10 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                opp.recovery_probability >= 0.75
                                  ? 'bg-emerald-500'
                                  : opp.recovery_probability >= 0.5
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${opp.recovery_probability * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(opp.expected_recovery_value)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-fintech-sm text-[10px] font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                          {opp.recommended_action_label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap text-fintech-muted font-mono text-[10px]">
                        {opp.recommended_delay_label}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                            opp.status === 'recovered'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : opp.status === 'stopped'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : opp.status === 'escalated'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30'
                              : 'bg-fintech-surface-subtle text-fintech-muted border border-fintech-border'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspectOpportunity(opp);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold text-fintech-secondary hover:text-fintech-primary bg-fintech-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 rounded-fintech-sm border border-fintech-border transition"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunity Detail Drawer */}
      <OpportunityDetailDrawer
        opportunity={selectedOpportunity}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onActionExecuted={() => fetchData()}
      />

      {/* Batch Runner Modal */}
      <BatchRunnerModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onComplete={() => fetchData()}
      />
    </div>
  );
};
