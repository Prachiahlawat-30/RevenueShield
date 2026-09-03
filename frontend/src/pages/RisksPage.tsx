import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpRight, UploadCloud, Zap } from 'lucide-react';
import { getRevenueRisks } from '../api/risks';
import { RevenueRisk } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate, getFailureTypeLabel } from '../utils/formatters';
import { ImportCsvModal } from '../components/transactions/ImportCsvModal';
import { RazorpayWebhookModal } from '../components/transactions/RazorpayWebhookModal';

interface RisksPageProps {
  onSelectRisk: (riskId: string) => void;
}

export const RisksPage: React.FC<RisksPageProps> = ({ onSelectRisk }) => {
  const [risks, setRisks] = useState<RevenueRisk[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  const fetchRisks = async () => {
    setIsLoading(true);
    try {
      const data = await getRevenueRisks({
        status: statusFilter === 'all' ? undefined : statusFilter,
        failure_type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchQuery || undefined,
        page,
        page_size: 15,
      });
      setRisks(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to fetch risks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRisks();
  };

  const statusOptions = ['all', 'detected', 'recovering', 'recovered', 'escalated', 'stopped'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
            <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] dark:text-[#E8A33D]" />
            <span>Operational triage console</span>
          </div>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold text-slate-900 dark:text-[#F5F6FA] tracking-tight">
            Revenue at Risk
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-[#9CA3B0]">
            Active failed transactions undergoing diagnostic triage and policy evaluation ({total} active cases).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={UploadCloud}
            onClick={() => setIsImportModalOpen(true)}
          >
            Import CSV
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Zap}
            onClick={() => setIsRazorpayModalOpen(true)}
          >
            Razorpay Webhook
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={fetchRisks}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-4 shadow-sm dark:shadow-fintech-card transition-colors">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or invoice ID..."
            className="w-full rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-[#F5F6FA] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-[10px] border border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-[#0E121A] p-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded-[8px] px-2.5 py-1 text-xs font-medium uppercase tracking-[0.02em] transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-600 dark:text-[#9CA3B0] hover:text-slate-900 dark:hover:text-[#F5F6FA]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Failure Type Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-xs text-slate-800 dark:text-[#F5F6FA] focus:outline-none cursor-pointer"
          >
            <option value="all">All Failure Categories</option>
            <option value="temporary_decline">Temporary Bank Decline</option>
            <option value="insufficient_funds">Insufficient Funds</option>
            <option value="expired_card">Expired Card</option>
            <option value="network_error">Network Error</option>
            <option value="unknown_failure">Unknown Failure</option>
          </select>
        </div>
      </div>

      {/* Risks Data Table */}
      <div className="overflow-hidden rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-[#6B7280] uppercase text-[11px] font-medium tracking-[0.04em]">
                <th className="px-6 py-3.5 font-medium">Customer & account</th>
                <th className="px-6 py-3.5 font-medium">Failure category</th>
                <th className="px-6 py-3.5 font-medium">Amount at risk</th>
                <th className="px-6 py-3.5 font-medium">Recovered</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Attempts</th>
                <th className="px-6 py-3.5 font-medium">Detected</th>
                <th className="px-6 py-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-4">
                    <TableSkeleton rows={6} cols={8} />
                  </td>
                </tr>
              ) : risks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <EmptyState
                      title="No revenue risks found"
                      description="No payment failure records matched the selected filters."
                    />
                  </td>
                </tr>
              ) : (
                risks.map((risk) => (
                  <tr
                    key={risk.id}
                    onClick={() => onSelectRisk(risk.id)}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900 dark:text-[#F5F6FA]">
                        {risk.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#6B7280]">
                        {risk.customer?.email || risk.customer_id}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
                        {getFailureTypeLabel(risk.detected_failure_type)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-[#F5F6FA] tabular-nums">
                      {formatCurrency(risk.amount_at_risk)}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-[#059669] dark:text-[#10B981] tabular-nums">
                      {formatCurrency(risk.amount_recovered)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-[#9CA3B0] tabular-nums">
                      {risk.attempt_count} / 3
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-[#6B7280]">
                      {formatDate(risk.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(risk.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200 dark:bg-[#171C28] dark:hover:bg-[#1C2333] px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-[#F5F6FA] transition-colors cursor-pointer shadow-sm"
                      >
                        <span>Diagnose</span>
                        <ArrowUpRight className="h-3 w-3 text-slate-500 dark:text-[#9CA3B0]" />
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
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.06] px-6 py-3.5 text-xs text-slate-500 dark:text-[#6B7280]">
            <div>
              Page <span className="font-medium text-slate-900 dark:text-[#F5F6FA]">{page}</span> of{' '}
              <span className="font-medium text-slate-900 dark:text-[#F5F6FA]">{totalPages}</span> ({total} total failures)
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

      {/* Import Transactions CSV Modal */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchRisks();
        }}
      />

      {/* Razorpay Webhook Modal */}
      <RazorpayWebhookModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        onSuccess={() => {
          fetchRisks();
        }}
      />
    </div>
  );
};
