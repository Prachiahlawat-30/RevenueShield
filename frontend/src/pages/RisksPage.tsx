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
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <AlertTriangle className="h-4 w-4" />
            <span>OPERATIONAL TRIAGE CONSOLE</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
            Revenue at Risk
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or invoice ID..."
            className="w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
            className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
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
      <div className="overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                <th className="px-6 py-3.5 font-medium">Customer & Account</th>
                <th className="px-6 py-3.5 font-medium">Failure Category</th>
                <th className="px-6 py-3.5 font-medium">Amount at Risk</th>
                <th className="px-6 py-3.5 font-medium">Recovered</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Attempts</th>
                <th className="px-6 py-3.5 font-medium">Detected</th>
                <th className="px-6 py-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-medium">
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
                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-all duration-150 group"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white transition-colors">
                        {risk.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {risk.customer?.email || risk.customer_id}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-500/[0.06] px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-500/15">
                        {getFailureTypeLabel(risk.detected_failure_type)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(risk.amount_at_risk)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(risk.amount_recovered)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                      {risk.attempt_count} / 3
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {formatDate(risk.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRisk(risk.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] hover:-translate-y-[1px] transition-all cursor-pointer shadow-xs"
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
          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-white/[0.06] bg-transparent px-6 py-3.5 text-xs text-slate-500">
            <div>
              Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span> ({total} total failures)
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
