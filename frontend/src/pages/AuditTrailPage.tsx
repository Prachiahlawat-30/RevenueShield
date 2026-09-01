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

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6822CC]">
            <ScrollText className="h-4 w-4" />
            <span>Immutable Observability Ledger</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl tracking-tight">
            System Decisions & Audit Trail
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
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
          Refresh Ledger
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagnosis summary or policy decision..."
            className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/40 pl-10 pr-4 py-2 text-xs text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] focus:border-[#6822CC] focus:outline-none transition-colors"
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
            className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-2 text-xs text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
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
            className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-2 text-xs text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
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

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/70 dark:bg-slate-800/40 text-[#6B7280] uppercase font-semibold text-[11px]">
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action & Step</th>
                <th className="px-5 py-3.5">Decision Summary</th>
                <th className="px-5 py-3.5">Policy Status</th>
                <th className="px-5 py-3.5">Result</th>
                <th className="px-5 py-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#242E42] font-medium">
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
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-[#6B7280] text-[11px] font-mono whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#1A1A2E] dark:text-white">
                      <span className="rounded-md px-2 py-0.5 text-[11px] font-mono font-bold text-[#6822CC] dark:text-[#B892FF] bg-[#F3EEFF] dark:bg-purple-950/40 border border-[#D5BEFF] dark:border-purple-800/40 whitespace-nowrap">
                        {formatActorLabel(log.actor)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-[#1A1A2E] dark:text-white text-xs">
                        {log.step_name}
                      </div>
                      <div className="text-[10px] text-[#6B7280] font-mono mt-0.5 truncate max-w-[140px]">
                        {log.executed_action || log.revenue_risk_id || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280] max-w-xs truncate text-xs">
                      {log.diagnosis_summary || log.recommended_action || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {log.policy_decision ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${
                            log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                              : log.policy_decision.includes('BLOCKED') || log.policy_decision === 'BLOCK'
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                              : 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40'
                          }`}
                        >
                          {log.policy_decision}
                        </span>
                      ) : (
                        <span className="text-[#9CA3AF]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#16A34A] whitespace-nowrap">
                      {log.result || 'Success'}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#6822CC] dark:text-[#B892FF] hover:text-[#4B1A99] transition-colors"
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
          <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#242E42] px-6 py-3.5 text-xs text-[#6B7280] bg-slate-50/50 dark:bg-slate-800/30">
            <span>
              Page <strong className="text-[#1A1A2E] dark:text-white">{page}</strong> of <strong className="text-[#1A1A2E] dark:text-white">{totalPages}</strong>
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
      </div>

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
