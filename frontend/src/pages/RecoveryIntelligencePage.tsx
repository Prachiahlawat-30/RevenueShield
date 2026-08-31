import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import {
  getIntelligenceSummary,
  getOpportunities,
  getOpportunityDetail,
} from '../api/intelligence';
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
  const [loading, setLoading] = useState(true);

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
    } catch (err: any) {
      console.error('Failed to load recovery intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBand, selectedFailureType, selectedStatus, sortBy]);

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
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{score} CRIT</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>{score} HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30">
            <span>{score} MED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-fintech-muted bg-fintech-surface-subtle border border-fintech-border">
            <span>{score} LOW</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fintech-fade w-full min-w-0 max-w-full overflow-hidden pb-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-fintech-surface px-4 py-3 rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-fintech-sm bg-brand-500/10 border border-brand-500/20 text-brand-500 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-fintech-primary tracking-tight">Recovery Intelligence</h1>
              <span className="px-2 py-0.2 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono shrink-0">
                Live Intelligence
              </span>
            </div>
            <p className="text-[11px] text-fintech-secondary truncate">
              Predictive yields, causal ranking, and deterministic policy execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

      {/* 4-Metric Compact KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {/* KPI 1 */}
        <div className="p-3 rounded-fintech-lg bg-brand-500/5 border border-brand-500/25 shadow-fintech-sm space-y-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold uppercase">
            <span>Expected Recoverable</span>
            <DollarSign className="w-3.5 h-3.5 text-brand-500" />
          </div>
          <p className="text-lg font-black text-fintech-primary font-mono tracking-tight">
            {formatCurrency(summary?.expected_recoverable_revenue || 0)}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
            <TrendingUp className="w-3 h-3" />
            <span>{formatPercent((summary?.average_recovery_probability || 0) * 100)} weighted yield</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-3 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1 min-w-0">
          <span className="text-[10px] font-bold text-fintech-muted uppercase font-mono block">
            Total Exposure at Risk
          </span>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {formatCurrency(summary?.total_revenue_at_risk || 0)}
          </p>
          <span className="text-[10px] text-fintech-muted font-mono block truncate">
            Across {summary?.total_risks || 0} failed cases
          </span>
        </div>

        {/* KPI 3 */}
        <div className="p-3 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1 min-w-0">
          <span className="text-[10px] font-bold text-fintech-muted uppercase font-mono block">
            Recovery Probability
          </span>
          <p className="text-lg font-black text-brand-600 dark:text-brand-400 font-mono tracking-tight">
            {formatPercent((summary?.average_recovery_probability || 0) * 100)}
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${(summary?.average_recovery_probability || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-3 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1 min-w-0">
          <span className="text-[10px] font-bold text-fintech-muted uppercase font-mono block">
            Urgent Priority Pipeline
          </span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {(summary?.critical_opportunities || 0) + (summary?.high_priority_opportunities || 0)} cases
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
            <span className="text-rose-600 dark:text-rose-400">{summary?.critical_opportunities || 0} Critical</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 dark:text-amber-400">{summary?.high_priority_opportunities || 0} High</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Strip: Compact 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 w-full">
        {/* Left: Expected Recovery Yield by Failure Reason */}
        <div className="lg:col-span-7 p-3.5 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-2 min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fintech-border pb-2">
            <div>
              <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                Expected Recovery Yield by Failure Reason
              </h3>
              <p className="text-[11px] text-fintech-secondary">
                Total exposure vs probabilistic recoverable yield.
              </p>
            </div>
            {/* Inline Legend */}
            <div className="flex items-center gap-3 text-[10px] font-mono font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block shrink-0" />
                <span className="text-fintech-secondary">Exposure</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block shrink-0" />
                <span className="text-fintech-secondary">Expected Yield</span>
              </span>
            </div>
          </div>

          <div className="w-full min-w-0 pt-1">
            <ExpectedRecoveryByTypeChart data={summary?.expected_by_failure_type || []} height={200} />
          </div>
        </div>

        {/* Right: Priority Distribution & Recovery Funnel */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 min-w-0">
          {/* Priority Breakdown */}
          <div className="p-3 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-fintech-border pb-1.5">
              <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                Priority Distribution
              </h3>
              {selectedBand !== 'all' && (
                <button
                  onClick={() => setSelectedBand('all')}
                  className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="w-full min-w-0 pt-1">
              <PriorityDistributionChart
                data={summary?.priority_distribution || {}}
                selectedBand={selectedBand}
                onSelectBand={(band) => setSelectedBand(band === selectedBand ? 'all' : band)}
                height={100}
              />
            </div>
          </div>

          {/* Recovery Value Funnel */}
          <div className="p-3 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-fintech-border pb-1.5">
              <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
                Recovery Value Funnel
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {summary?.recovery_funnel?.[3]?.amount
                  ? formatCurrency(summary.recovery_funnel[3].amount)
                  : '$0.00'}{' '}
                settled
              </span>
            </div>
            <div className="w-full min-w-0 pt-1">
              <RecoveryFunnelChart data={summary?.recovery_funnel || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Screen-Fitted High-Density Opportunities Queue (Zero Horizontal Scroll) */}
      <div className="rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm p-3.5 space-y-2.5 w-full min-w-0 overflow-hidden">
        {/* Table Header & Inline Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-fintech-border pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-fintech-primary truncate">
              Recovery Opportunity Queue
            </h2>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono font-bold border border-brand-500/20 shrink-0">
              {filteredOpportunities.length} Ranked
            </span>
          </div>

          {/* Inline Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-fintech-muted" />
              <input
                type="text"
                placeholder="Search customer, failure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-primary placeholder-fintech-muted focus:outline-none focus:border-brand-500 w-36 sm:w-44"
              />
            </div>

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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
            >
              <option value="priority_score">Sort: Priority</option>
              <option value="expected_recovery_value">Sort: Yield</option>
              <option value="recovery_probability">Sort: Prob</option>
              <option value="amount_at_risk">Sort: Amount</option>
            </select>
          </div>
        </div>

        {/* 5-Column High Density Table (Strictly Contained, Zero Horizontal Scroll) */}
        <div className="overflow-y-auto max-h-[320px] rounded-fintech-md border border-fintech-border relative w-full overflow-x-hidden">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead className="bg-fintech-surface-subtle text-fintech-muted font-bold border-b border-fintech-border uppercase tracking-wider text-[10px] sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 w-[15%]">Priority</th>
                <th className="py-2 px-3 w-[30%]">Customer & Failure</th>
                <th className="py-2 px-3 w-[22%]">Exposure & Yield</th>
                <th className="py-2 px-3 w-[23%]">Recommended Action</th>
                <th className="py-2 px-3 w-[10%] text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border text-fintech-secondary">
              {filteredOpportunities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-fintech-muted">
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
                    {/* Col 1: Priority */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        {getPriorityBadge(opp.priority_band, opp.priority_score)}
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase block w-fit ${
                            opp.status === 'recovered'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : opp.status === 'stopped'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                              : 'bg-slate-200 dark:bg-slate-800 text-fintech-muted'
                          }`}
                        >
                          {opp.status}
                        </span>
                      </div>
                    </td>

                    {/* Col 2: Customer & Failure */}
                    <td className="py-2.5 px-3">
                      <div className="min-w-0">
                        <p className="font-bold text-fintech-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition truncate">
                          {opp.customer_name}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] px-1 py-0.2 rounded bg-fintech-surface border border-fintech-border text-fintech-secondary font-mono truncate">
                            {opp.failure_type_label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Col 3: Exposure & Yield */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-fintech-primary text-xs block">
                          {formatCurrency(opp.transaction_amount)}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold block truncate">
                          Yield: {formatCurrency(opp.expected_recovery_value)} ({formatPercent(opp.recovery_probability * 100)})
                        </span>
                      </div>
                    </td>

                    {/* Col 4: Action & Timing */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-brand-700 dark:text-brand-300 text-xs block truncate">
                          {opp.recommended_action_label}
                        </span>
                        <span className="text-[10px] text-fintech-muted font-mono block truncate">
                          {opp.recommended_delay_label}
                        </span>
                      </div>
                    </td>

                    {/* Col 5: Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectOpportunity(opp);
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 rounded-fintech-sm border border-brand-500/30 transition"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
