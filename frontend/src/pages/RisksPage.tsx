import React, { useEffect, useState } from 'react';
import { Search, PlayCircle, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { getRevenueRisks } from '../api/risks';
import { RevenueRisk } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate, getFailureTypeLabel } from '../utils/formatters';

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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <AlertTriangle className="h-4 w-4" />
            <span>Payment Operations Console</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Revenue at Risk
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary">
            Monitor detected payment failures and prioritize interventions with highest recovery likelihood ({total} active cases).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={isLoading}
          onClick={fetchRisks}
        >
          Refresh Risks
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fintech-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, or ID..."
            className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle pl-10 pr-4 py-2 text-xs text-fintech-primary placeholder-fintech-muted focus:border-brand-500 focus:outline-none"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`rounded-fintech-sm px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
                  statusFilter === status
                    ? 'bg-fintech-surface text-brand-600 dark:text-brand-400 shadow-fintech-sm font-bold'
                    : 'text-fintech-secondary hover:text-fintech-primary'
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
            className="rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-2 text-xs text-fintech-primary focus:border-brand-500 focus:outline-none"
          >
            <option value="all">All Failure Categories</option>
            <option value="temporary_decline">Temporary Decline</option>
            <option value="insufficient_funds">Insufficient Funds</option>
            <option value="expired_card">Expired Card</option>
            <option value="network_error">Network Error</option>
            <option value="unknown_failure">Unknown Failure</option>
          </select>
        </div>
      </div>

      {/* Risks Data Table */}
      <div className="overflow-hidden rounded-fintech-lg border border-fintech-border bg-fintech-surface shadow-fintech-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs fintech-table-sticky-header">
            <thead>
              <tr className="border-b border-fintech-border bg-fintech-surface-subtle/80 text-fintech-muted uppercase font-semibold text-[11px]">
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
            <tbody className="divide-y divide-fintech-border font-medium">
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
                    className="hover:bg-fintech-surface-subtle/60 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-fintech-primary">
                        {risk.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-fintech-muted font-mono">
                        {risk.customer?.email || risk.customer_id}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-fintech-secondary font-medium">
                      {getFailureTypeLabel(risk.detected_failure_type)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(risk.amount_at_risk)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(risk.amount_recovered)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={risk.status} size="sm" />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-fintech-secondary">
                      {risk.attempt_count} / 3
                    </td>
                    <td className="px-6 py-3.5 text-fintech-muted">
                      {formatDate(risk.created_at)}
                    </td>
                    <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={PlayCircle}
                        onClick={() => onSelectRisk(risk.id)}
                      >
                        Inspect
                      </Button>
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
    </div>
  );
};
