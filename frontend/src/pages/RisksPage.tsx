import React, { useEffect, useState } from 'react';
import { Search, PlayCircle, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpRight, UploadCloud, Zap } from 'lucide-react';
import { getRevenueRisks } from '../api/risks';
import { RevenueRisk } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate, getFailureTypeLabel, getActionLabel } from '../utils/formatters';
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
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6822CC]">
            <AlertTriangle className="h-4 w-4" />
            <span>Financial Operations Console</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl tracking-tight">
            Revenue at Risk
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            Monitor detected payment failures, review automated root-cause diagnoses, and trigger high-yield recovery playbooks ({total} active cases).
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
            Refresh Console
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or invoice ID..."
            className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/40 pl-10 pr-4 py-2 text-xs text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] focus:border-[#6822CC] focus:outline-none transition-colors"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/80 dark:bg-slate-800/40 p-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-white dark:bg-[#131824] text-[#6822CC] dark:text-[#B892FF] shadow-sm font-bold'
                    : 'text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-white'
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
            className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-2 text-xs text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
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
      <div className="overflow-hidden rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/70 dark:bg-slate-800/40 text-[#6B7280] uppercase font-semibold text-[11px]">
                <th className="px-6 py-3.5">Customer & Account</th>
                <th className="px-6 py-3.5">Failure Category</th>
                <th className="px-6 py-3.5">Amount at Risk</th>
                <th className="px-6 py-3.5">Recovered</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Attempts</th>
                <th className="px-6 py-3.5">Detected</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#242E42] font-medium">
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
                      title="No Revenue Risks Found"
                      description="No payment failure records matched the selected filters."
                    />
                  </td>
                </tr>
              ) : (
                risks.map((risk) => (
                  <tr
                    key={risk.id}
                    onClick={() => onSelectRisk(risk.id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-[#1A1A2E] dark:text-white group-hover:text-[#6822CC] dark:group-hover:text-[#B892FF] transition-colors">
                        {risk.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        {risk.customer?.email || risk.customer_id}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-[#1A1A2E] dark:text-white border border-[#E5E7EB] dark:border-slate-700">
                        {getFailureTypeLabel(risk.detected_failure_type)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-base text-[#DC2626]">
                      {formatCurrency(risk.amount_at_risk)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-semibold text-[#16A34A]">
                      {formatCurrency(risk.amount_recovered)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[#6B7280]">
                      {risk.attempt_count} / 3
                    </td>
                    <td className="px-6 py-3.5 text-[#6B7280]">
                      {formatDate(risk.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(risk.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-[#131824] px-3 py-1.5 text-xs font-semibold text-[#6822CC] dark:text-[#B892FF] hover:bg-[#F3EEFF] dark:hover:bg-purple-950/30 hover:border-[#D5BEFF] transition-all"
                      >
                        <span>Diagnose</span>
                        <ArrowUpRight className="h-3 w-3" />
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
          <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3.5 text-xs text-[#6B7280]">
            <div>
              Showing page <span className="font-bold text-[#1A1A2E] dark:text-white">{page}</span> of{' '}
              <span className="font-bold text-[#1A1A2E] dark:text-white">{totalPages}</span> ({total} total failures)
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
