import React, { useEffect, useState } from 'react';
import {
  Search,
  ScrollText,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  List,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Zap,
} from 'lucide-react';
import { getAuditLogs } from '../api/audit';
import { AuditLog } from '../types';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { JsonDrawer } from '../components/common/JsonDrawer';
import { formatDate } from '../utils/formatters';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs({
        actor: actorFilter === 'all' ? undefined : actorFilter,
        step_name: stepFilter === 'all' ? undefined : stepFilter,
        search: searchQuery || undefined,
        page,
        page_size: 25,
      });
      setLogs(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actorFilter, stepFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs();
  };

  const formatActorLabel = (actor: string) => {
    switch (actor?.toLowerCase()) {
      case 'diagnosis_engine':
        return 'Diagnosis Engine';
      case 'policy_engine':
        return 'Policy Engine';
      case 'recovery_engine':
        return 'Recovery Engine';
      case 'risk_engine':
        return 'Risk Engine';
      case 'human_operator':
        return 'Human Operator';
      default:
        return actor?.replace(/_/g, ' ') || 'Engine';
    }
  };

  const formatTimeOnly = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return dateString;
    }
  };

  const getActorIcon = (actor: string) => {
    switch (actor?.toLowerCase()) {
      case 'diagnosis_engine':
        return Brain;
      case 'policy_engine':
        return ShieldCheck;
      case 'recovery_engine':
        return Zap;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <ScrollText className="h-4 w-4" />
            <span>IMMUTABLE OBSERVABILITY LEDGER</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
            System Decisions & Audit Trail
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Append-only verifiable ledger recording every AI diagnosis, policy check, and gateway execution ({total} total entries).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={fetchAuditLogs}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagnosis summary or policy decision..."
            className="w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Actors</option>
            <option value="diagnosis_engine">Diagnosis Engine</option>
            <option value="policy_engine">Policy Engine</option>
            <option value="recovery_engine">Recovery Engine</option>
            <option value="risk_engine">Risk Engine</option>
            <option value="human_operator">Human Operator</option>
          </select>

          {/* Step Filter */}
          <select
            value={stepFilter}
            onChange={(e) => {
              setStepFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Pipeline Stages</option>
            <option value="DETECTED">DETECTED</option>
            <option value="DIAGNOSING">DIAGNOSING</option>
            <option value="POLICY_CHECK">POLICY_CHECK</option>
            <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
            <option value="POLICY_ACTIVATED">POLICY_ACTIVATED</option>
            <option value="MANUAL_RESOLUTION">MANUAL_RESOLUTION</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: Financial Event Timeline View (User Specified) */}
      {viewMode === 'timeline' && (
        <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {isLoading ? (
            <div className="p-8">
              <TableSkeleton rows={6} cols={4} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No Audit Records Found"
              description="No events matched the selected filter criteria."
            />
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l border-slate-200 dark:border-white/10 space-y-6">
              {logs.map((log) => {
                const Icon = getActorIcon(log.actor);
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="relative group cursor-pointer"
                  >
                    {/* Subtle dot on timeline */}
                    <span className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[oklch(0.218_0.008_223.9)] bg-slate-900 dark:bg-white group-hover:scale-125 transition-transform" />

                    {/* Glass Event Card */}
                    <div className="rounded-2xl border border-slate-200/70 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-[1px] hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-glass-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/[0.05]">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                            {formatTimeOnly(log.created_at)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600 font-mono">•</span>
                          <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {formatActorLabel(log.actor)}
                          </span>
                          <span className="rounded-md px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-slate-500/[0.06] text-slate-700 dark:text-slate-300 border border-slate-500/15">
                            {log.step_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {log.policy_decision && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase border ${
                                log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                                  ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400'
                                  : 'border-rose-500/20 bg-rose-500/[0.08] text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {log.policy_decision}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                            Inspect ➔
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 flex items-baseline justify-between gap-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                          {log.diagnosis_summary || log.recommended_action || log.executed_action || 'System event recorded in ledger'}
                        </p>
                        {log.result && (
                          <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                            {log.result}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Tabular Ledger View */}
      {viewMode === 'table' && (
        <div className="overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                  <th className="px-5 py-3.5 font-medium">Timestamp</th>
                  <th className="px-5 py-3.5 font-medium">Actor</th>
                  <th className="px-5 py-3.5 font-medium">Step</th>
                  <th className="px-5 py-3.5 font-medium">Decision Summary</th>
                  <th className="px-5 py-3.5 font-medium">Policy Status</th>
                  <th className="px-5 py-3.5 font-medium">Result</th>
                  <th className="px-5 py-3.5 text-right font-medium">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-4">
                      <TableSkeleton rows={8} cols={7} />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8">
                      <EmptyState
                        title="No Audit Records Found"
                        description="No audit trail events matched the selected filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatActorLabel(log.actor)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-slate-900 dark:text-white">
                          {log.step_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate text-xs">
                        {log.diagnosis_summary || log.recommended_action || '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.policy_decision ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase border ${
                              log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                                ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400'
                                : 'border-rose-500/20 bg-rose-500/[0.08] text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {log.policy_decision}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {log.result || 'Success'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/[0.06] pt-4 px-2 text-xs text-slate-500">
          <span>
            Page <strong className="text-slate-900 dark:text-white">{page}</strong> of <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* JSON Inspector Drawer */}
      <JsonDrawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event: ${selectedLog?.step_name || 'Details'}`}
        data={selectedLog}
      />
    </div>
  );
};
