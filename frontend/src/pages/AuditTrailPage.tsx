import React, { useEffect, useState } from 'react';
import { Search, ScrollText, Eye, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getAuditLogs } from '../api/audit';
import { AuditLog } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { JsonDrawer } from '../components/common/JsonDrawer';
import { formatCurrency, formatDate } from '../utils/formatters';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
        page_size: 20,
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

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <ScrollText className="h-4 w-4" />
            <span>Immutable Observability Ledger</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            System Decisions & Audit Trail
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary">
            Append-only verifiable ledger recording every AI diagnosis, policy check, and gateway execution ({total} total entries).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={isLoading}
          onClick={fetchAuditLogs}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fintech-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagnosis summary or policy decision..."
            className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle pl-10 pr-4 py-2 text-xs text-fintech-primary placeholder-fintech-muted focus:border-brand-500 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Actor Filter */}
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-2 text-xs text-fintech-primary focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Actors</option>
            <option value="risk_engine">Risk Engine</option>
            <option value="diagnosis_engine">Diagnosis Engine</option>
            <option value="policy_engine">Policy Engine</option>
            <option value="recovery_engine">Recovery Engine</option>
            <option value="human_operator">Human Operator</option>
          </select>

          {/* Step Filter */}
          <select
            value={stepFilter}
            onChange={(e) => {
              setStepFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-2 text-xs text-fintech-primary focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Steps</option>
            <option value="DETECTED">DETECTED</option>
            <option value="DIAGNOSING">DIAGNOSING</option>
            <option value="POLICY_CHECK">POLICY_CHECK</option>
            <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
            <option value="POLICY_ACTIVATED">POLICY_ACTIVATED</option>
            <option value="MANUAL_RESOLUTION">MANUAL_RESOLUTION</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-fintech-lg border border-fintech-border bg-fintech-surface shadow-fintech-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-fintech-border bg-fintech-surface-subtle/80 text-fintech-muted uppercase font-semibold text-[11px]">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Step Name</th>
                <th className="px-5 py-3.5">Diagnosis / Policy Summary</th>
                <th className="px-5 py-3.5">Policy Decision</th>
                <th className="px-5 py-3.5">Result</th>
                <th className="px-5 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border font-medium">
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
                  <tr key={log.id} className="hover:bg-fintech-surface-subtle/60 transition-colors">
                    <td className="px-5 py-3 text-fintech-muted text-[11px] font-mono">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-fintech-primary">
                      <span className="rounded px-2 py-0.5 text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20">
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-fintech-primary text-xs">
                      {log.step_name}
                    </td>
                    <td className="px-5 py-3 text-fintech-secondary max-w-xs truncate text-xs">
                      {log.diagnosis_summary || log.recommended_action || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {log.policy_decision ? (
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-mono font-bold uppercase border ${
                            log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : log.policy_decision.includes('BLOCKED') || log.policy_decision === 'BLOCK'
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}
                        >
                          {log.policy_decision}
                        </span>
                      ) : (
                        <span className="text-fintech-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-fintech-secondary">
                      {log.result || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-fintech-border px-6 py-3 text-xs text-fintech-secondary bg-fintech-surface-subtle/30">
            <span>
              Page <strong className="text-fintech-primary">{page}</strong> of{' '}
              <strong className="text-fintech-primary">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* JSON Inspector Drawer */}
      <JsonDrawer
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Log Record (${selectedLog?.actor} - ${selectedLog?.step_name})`}
        data={selectedLog}
      />
    </div>
  );
};
