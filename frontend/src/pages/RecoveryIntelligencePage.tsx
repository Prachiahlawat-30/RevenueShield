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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-fintech-sm text-xs font-bold font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>{score} • CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-fintech-sm text-xs font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{score} • HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-fintech-sm text-xs font-bold font-mono bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30">
            <span>{score} • MEDIUM</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-fintech-sm text-xs font-medium font-mono bg-fintech-surface-subtle text-fintech-muted border border-fintech-border">
            <span>{score} • LOW</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade pb-12">
      {/* Top Banner / Notification */}
      {notification && (
        <div className="p-4 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs flex items-center justify-between shadow-fintech-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <p className="font-semibold">{notification}</p>
          </div>
        </div>
      )}

      {/* Header & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-fintech-surface p-6 rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-fintech-sm bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">Recovery Intelligence</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-fintech-secondary mt-1 max-w-2xl">
            Predict recovery probability, estimate expected financial yields, select next-best interventions, and execute under deterministic policy enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Database}
            isLoading={recalculating}
            onClick={handleSeedDemoData}
          >
            Reset Demo Personas
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={loading}
            onClick={() => fetchData()}
          >
            Recalculate
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            onClick={() => setIsBatchModalOpen(true)}
          >
            Run Priority Recovery
          </Button>
        </div>
      </div>

      {/* Hero KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Hero Card */}
        <div className="p-6 rounded-fintech-lg bg-brand-500/5 border border-brand-500/30 relative overflow-hidden shadow-fintech-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <DollarSign className="w-24 h-24 text-brand-500" />
          </div>
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-mono">
            Expected Recoverable Revenue
          </p>
          <p className="text-3xl font-black text-fintech-primary mt-2 font-mono tracking-tight">
            {formatCurrency(summary?.expected_recoverable_revenue || 0)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-fintech-muted">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              {formatPercent((summary?.average_recovery_probability || 0) * 100)}
            </span>
            <span>weighted yield across portfolio</span>
          </div>
        </div>

        {/* Revenue At Risk */}
        <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
          <p className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
            Total Revenue At Risk
          </p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono tracking-tight">
            {formatCurrency(summary?.total_revenue_at_risk || 0)}
          </p>
          <p className="text-xs text-fintech-muted mt-3">
            Across <span className="text-fintech-primary font-bold font-mono">{summary?.total_risks || 0}</span> failed transaction cases
          </p>
        </div>

        {/* Average Probability */}
        <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
          <p className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
            Portfolio Recovery Probability
          </p>
          <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-2 font-mono tracking-tight">
            {formatPercent((summary?.average_recovery_probability || 0) * 100)}
          </p>
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-1.5 rounded-full"
              style={{ width: `${(summary?.average_recovery_probability || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* High / Critical Opportunities */}
        <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
          <p className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
            High Priority Pipeline
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {(summary?.critical_opportunities || 0) + (summary?.high_priority_opportunities || 0)}
            </p>
            <span className="text-xs text-fintech-muted font-medium">urgent cases</span>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">
              {summary?.critical_opportunities || 0} Critical
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">
              {summary?.high_priority_opportunities || 0} High
            </span>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Expected Recovery by Failure Type */}
        <div className="lg:col-span-2 p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-fintech-primary uppercase tracking-wider">
                Expected Recovery Yield by Failure Type
              </h3>
              <p className="text-xs text-fintech-secondary mt-0.5">
                Comparison between total exposure and probabilistic recoverable revenue.
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded bg-fintech-surface-subtle text-fintech-muted font-mono border border-fintech-border font-semibold">
              Recharts Analytics
            </span>
          </div>
          <ExpectedRecoveryByTypeChart data={summary?.expected_by_failure_type || []} />
        </div>

        {/* Chart 2 & 3: Priority & Value Funnel */}
        <div className="space-y-6">
          {/* Priority Distribution Card */}
          <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-fintech-primary uppercase tracking-wider">
                Priority Distribution
              </h3>
              {selectedBand !== 'all' && (
                <button
                  onClick={() => setSelectedBand('all')}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  Clear filter
                </button>
              )}
            </div>
            <p className="text-xs text-fintech-secondary mb-2">Click a bar to filter opportunities table.</p>
            <PriorityDistributionChart
              data={summary?.priority_distribution || {}}
              selectedBand={selectedBand}
              onSelectBand={(band) => setSelectedBand(band === selectedBand ? 'all' : band)}
            />
          </div>

          {/* Recovery Funnel Card */}
          <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-fintech-primary uppercase tracking-wider">
                Recovery Value Funnel
              </h3>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
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

      {/* Priority Opportunities Table */}
      <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-5">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-fintech-primary tracking-tight flex items-center gap-2">
              <span>Top Recovery Opportunities</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fintech-surface-subtle text-fintech-muted font-mono font-semibold border border-fintech-border">
                {filteredOpportunities.length} opportunities
              </span>
            </h2>
            <p className="text-xs text-fintech-secondary mt-0.5">
              Ranked dynamically by Composite Priority Score (Probability + Value + Urgency + Customer Health).
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fintech-muted" />
              <input
                type="text"
                placeholder="Search customer, failure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-primary placeholder-fintech-muted focus:outline-none focus:border-brand-500 w-48"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="px-3 py-1.5 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
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
              className="px-3 py-1.5 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Failures</option>
              <option value="temporary_decline">Temporary Decline</option>
              <option value="insufficient_funds">Insufficient Funds</option>
              <option value="expired_card">Expired Card</option>
              <option value="network_error">Network Error</option>
              <option value="unknown_failure">Unknown Failure</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-xs text-fintech-secondary focus:outline-none focus:border-brand-500"
            >
              <option value="priority_score">Sort by Priority Score</option>
              <option value="expected_recovery_value">Sort by Expected Recovery</option>
              <option value="recovery_probability">Sort by Probability</option>
              <option value="amount_at_risk">Sort by Failed Amount</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-fintech-md border border-fintech-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-fintech-surface-subtle text-fintech-muted font-semibold border-b border-fintech-border uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Failure Category</th>
                <th className="py-3 px-4">Probability</th>
                <th className="py-3 px-4 text-right">Expected Recovery</th>
                <th className="py-3 px-4">Recommended Next Step</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
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
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getPriorityBadge(opp.priority_band, opp.priority_score)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-fintech-primary group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">
                          {opp.customer_name}
                        </p>
                        <p className="text-[11px] text-fintech-muted font-mono">{opp.customer_email}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-fintech-primary whitespace-nowrap">
                      {formatCurrency(opp.transaction_amount)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-fintech-surface-subtle text-fintech-secondary border border-fintech-border font-mono">
                        {opp.failure_type_label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                          {formatPercent(opp.recovery_probability * 100)}
                        </span>
                        <div className="w-12 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
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

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(opp.expected_recovery_value)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-fintech-sm text-[11px] font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                        {opp.recommended_action_label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-fintech-muted font-mono text-[11px]">
                      {opp.recommended_delay_label}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
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

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectOpportunity(opp);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-fintech-secondary hover:text-fintech-primary bg-fintech-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 rounded-fintech-sm border border-fintech-border transition"
                      >
                        Inspect
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
