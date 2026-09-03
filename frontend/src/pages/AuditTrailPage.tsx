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
      case 'risk_engine':
        return AlertTriangle;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase">
            <ScrollText className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Cryptographic verification ledger</span>
          </div>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold text-[#F5F6FA] tracking-tight">
            Immutable Audit Trail & Replay
          </h1>
          <p className="mt-1 text-xs text-[#9CA3B0]">
            Deterministic chain of custody logging every AI diagnosis, policy check, and gateway execution ({total} events recorded).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-[10px] border border-white/[0.06] bg-[#12161F] p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-[#9CA3B0] hover:text-[#F5F6FA]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#3B82F6] text-white'
                  : 'text-[#9CA3B0] hover:text-[#F5F6FA]'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[14px] border border-white/[0.06] bg-[#12161F] p-4 shadow-fintech-card">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagnosis summary or policy decision..."
            className="w-full rounded-[10px] border border-white/[0.08] bg-[#0E121A] pl-10 pr-4 py-2 text-xs text-[#F5F6FA] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
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
            className="rounded-[10px] border border-white/[0.08] bg-[#0E121A] px-3 py-2 text-xs text-[#F5F6FA] focus:outline-none cursor-pointer"
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
            className="rounded-[10px] border border-white/[0.08] bg-[#0E121A] px-3 py-2 text-xs text-[#F5F6FA] focus:outline-none cursor-pointer"
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

      {/* VIEW 1: Financial Event Timeline View */}
      {viewMode === 'timeline' && (
        <div className="rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 sm:p-8 shadow-fintech-card">
          {isLoading ? (
            <div className="p-8">
              <TableSkeleton rows={6} cols={4} />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="No audit records found"
              description="No events matched the selected filter criteria."
            />
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l border-white/[0.08] space-y-6">
              {logs.map((log) => {
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="relative group cursor-pointer"
                  >
                    {/* Subtle dot on timeline in brand blue */}
                    <span className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full border-2 border-[#12161F] bg-[#3B82F6] transition-transform" />

                    {/* Event Card */}
                    <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-4 sm:p-5 transition-colors hover:border-white/[0.12]">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold text-[#F5F6FA] tabular-nums">
                            {formatTimeOnly(log.created_at)}
                          </span>
                          <span className="text-[#6B7280]">•</span>
                          <span className="text-xs font-medium text-[#9CA3B0]">
                            {formatActorLabel(log.actor)}
                          </span>
                          <span className="h-4.5 px-1.5 rounded-full text-[10px] font-medium bg-white/[0.05] text-[#9CA3B0] border border-white/[0.08]">
                            {log.step_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {log.policy_decision && (
                            <span
                              className={`h-5 px-2 rounded-full text-[10px] font-medium border inline-flex items-center ${
                                log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                                  ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                                  : 'border-[#F0625A]/20 bg-[#F0625A]/10 text-[#F0625A]'
                              }`}
                            >
                              {log.policy_decision}
                            </span>
                          )}
                          <span className="text-[11px] text-[#6B7280] group-hover:text-[#F5F6FA] transition-colors">
                            Inspect ➔
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 flex items-baseline justify-between gap-4">
                        <p className="text-xs text-[#9CA3B0] leading-relaxed">
                          {log.diagnosis_summary || log.recommended_action || log.executed_action || 'System event recorded in ledger'}
                        </p>
                        {log.result && (
                          <span className="text-xs font-medium text-[#10B981] shrink-0">
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
        <div className="overflow-hidden rounded-[16px] border border-white/[0.06] bg-[#12161F] shadow-fintech-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#6B7280] uppercase text-[11px] font-medium tracking-[0.04em]">
                  <th className="px-5 py-3.5 font-medium">Timestamp</th>
                  <th className="px-5 py-3.5 font-medium">Actor</th>
                  <th className="px-5 py-3.5 font-medium">Step</th>
                  <th className="px-5 py-3.5 font-medium">Decision summary</th>
                  <th className="px-5 py-3.5 font-medium">Policy status</th>
                  <th className="px-5 py-3.5 font-medium">Result</th>
                  <th className="px-5 py-3.5 text-right font-medium">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
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
                        title="No audit records found"
                        description="No audit trail events matched the selected filter criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-[#6B7280] text-xs whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#F5F6FA] whitespace-nowrap">
                        {formatActorLabel(log.actor)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium text-[#F5F6FA]">
                          {log.step_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[#9CA3B0] max-w-xs truncate text-xs">
                        {log.diagnosis_summary || log.recommended_action || '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.policy_decision ? (
                          <span
                            className={`h-5 px-2 rounded-full text-[10px] font-medium border inline-flex items-center ${
                              log.policy_decision.includes('APPROVED') || log.policy_decision === 'ALLOW'
                                ? 'border-[#10B981]/20 bg-[#10B981]/10 text-[#10B981]'
                                : 'border-[#F0625A]/20 bg-[#F0625A]/10 text-[#F0625A]'
                            }`}
                          >
                            {log.policy_decision}
                          </span>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#9CA3B0] whitespace-nowrap">
                        {log.result || 'Logged'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.08] bg-[#171C28] hover:bg-[#1C2333] px-3 py-1.5 text-xs font-medium text-[#F5F6FA] transition-colors cursor-pointer shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9CA3B0]" />
                          <span>View JSON</span>
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
            <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3.5 text-xs text-[#6B7280]">
              <div>
                Page <span className="font-medium text-[#F5F6FA]">{page}</span> of{' '}
                <span className="font-medium text-[#F5F6FA]">{totalPages}</span> ({total} total ledger entries)
              </div>
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
      )}

      {/* JSON Payload Drawer for Audit Inspection */}
      {selectedLog && (
        <JsonDrawer
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={`Audit Ledger Entry: ${selectedLog.step_name}`}
          data={{
            id: selectedLog.id,
            revenue_risk_id: selectedLog.revenue_risk_id,
            actor: selectedLog.actor,
            step_name: selectedLog.step_name,
            policy_decision: selectedLog.policy_decision,
            diagnosis_summary: selectedLog.diagnosis_summary,
            recommended_action: selectedLog.recommended_action,
            executed_action: selectedLog.executed_action,
            result: selectedLog.result,
            input_payload: selectedLog.input_payload,
            decision_payload: selectedLog.decision_payload,
            created_at: selectedLog.created_at,
          }}
        />
      )}
    </div>
  );
};
