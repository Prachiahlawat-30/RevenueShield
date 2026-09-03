import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronRight,
  Users,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CreditCard,
  Clock,
  Filter,
  Lock,
} from 'lucide-react';
import { getCustomers, getCustomerDetail, toggleCustomerOptOut, CustomerDetail } from '../api/customers';
import { Customer } from '../types';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { CustomerRecoveryProfileCard } from '../components/customers/CustomerRecoveryProfileCard';
import { CustomerValueBadge } from '../components/customers/CustomerValueBadge';
import { formatCurrency, formatDate, getFailureTypeLabel } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'OPTED_OUT'>('ALL');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers({ search: searchQuery || undefined, page: 1, page_size: 50 });
      setCustomers(data.items);
      if (data.items.length > 0 && !selectedCustomer) {
        handleSelectCustomer(data.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleToggleOptOut = async (customer: Customer | CustomerDetail, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await toggleCustomerOptOut(customer.id, !customer.is_opted_out);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (selectedCustomer && selectedCustomer.id === updated.id) {
        setSelectedCustomer({ ...selectedCustomer, is_opted_out: updated.is_opted_out });
      }
    } catch (err) {
      console.error('Failed to toggle opt out', err);
    }
  };

  const handleSelectCustomer = async (customerId: string) => {
    try {
      const detail = await getCustomerDetail(customerId);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error('Failed to load customer detail', err);
    }
  };

  // KPI Metrics
  const activeCount = useMemo(() => customers.filter((c) => !c.is_opted_out).length, [customers]);
  const optedOutCount = useMemo(() => customers.filter((c) => c.is_opted_out).length, [customers]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterMode === 'ACTIVE') return !c.is_opted_out;
      if (filterMode === 'OPTED_OUT') return c.is_opted_out;
      return true;
    });
  }, [customers, filterMode]);

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
            <Users className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Account Operations</span>
          </div>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold text-slate-900 dark:text-[#F5F6FA] tracking-tight">
            Customers
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-[#9CA3B0]">
            Deterministic policy states, vaulted payment credentials, and behavioral recovery profiles.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={isLoading}
          onClick={fetchCustomers}
        >
          Refresh Accounts
        </Button>
      </div>

      {/* KPI Quick-Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="p-4 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#6B7280] text-xs mb-1">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F6FA]">{customers.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">Monitored portfolios</div>
        </div>

        {/* Active Policy State */}
        <div className="p-4 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#6B7280] text-xs mb-1">
            <span>Active Guardrails</span>
            <ShieldCheck className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#059669] dark:text-[#10B981]">{activeCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">Automated recovery enabled</div>
        </div>

        {/* Opt-Out Compliance */}
        <div className="p-4 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#6B7280] text-xs mb-1">
            <span>Opt-Out Protected</span>
            <ShieldAlert className="w-4 h-4 text-[#E11D48] dark:text-[#F0625A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F6FA]">{optedOutCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">Policy Rule 1 enforced</div>
        </div>

        {/* Avg Recoverability */}
        <div className="p-4 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-[#6B7280] text-xs mb-1">
            <span>Avg Health Score</span>
            <Activity className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-[#F5F6FA]">91 / 100</div>
          <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">High solvency profile</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-3.5 shadow-sm dark:shadow-fintech-card transition-colors">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name, email, or external ID..."
            className="w-full rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-[#F5F6FA] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
          />
        </form>

        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('ACTIVE')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'ACTIVE'
                ? 'bg-[#059669] dark:bg-[#10B981] text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('OPTED_OUT')}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'OPTED_OUT'
                ? 'bg-[#E11D48] dark:bg-[#F0625A] text-white shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Opted Out ({optedOutCount})
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Table + Customer Dossier */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Customer Table */}
        <div className="lg:col-span-7 rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card overflow-hidden transition-colors flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F5F6FA]">Account Directory</h2>
              <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">
                Showing {filteredCustomers.length} of {customers.length} customer records
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#6B7280] px-2 py-0.5 rounded bg-slate-50 dark:bg-[#0E121A] border border-slate-200 dark:border-white/[0.06]">
              Vaulted ISO-8583
            </span>
          </div>

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto fintech-table-sticky-header">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-[#6B7280] uppercase text-[10px] font-semibold tracking-[0.04em] bg-slate-50/80 dark:bg-[#0E121A]/80 backdrop-blur-sm">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Payment Method</th>
                  <th className="px-4 py-3 font-semibold">Expiry</th>
                  <th className="px-4 py-3 font-semibold">Policy State</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4">
                      <TableSkeleton rows={6} cols={5} />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-[#6B7280]">
                      No customers match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const initials = c.name
                      ? c.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'AC';

                    return (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectCustomer(c.id)}
                        className={`cursor-pointer transition-all border-l-4 ${
                          isSelected
                            ? 'border-l-[#3B82F6] bg-blue-50/70 dark:bg-[#3B82F6]/10'
                            : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] truncate max-w-[150px]">
                                  {c.name}
                                </span>
                                <CustomerValueBadge customerId={c.id} />
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#6B7280] truncate max-w-[180px]">
                                {c.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 dark:text-[#9CA3B0] font-mono whitespace-nowrap">
                          •••• {c.card_last4 || '4242'}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 dark:text-[#9CA3B0] tabular-nums font-mono whitespace-nowrap">
                          {c.card_expiry || '12/28'}
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={(e) => handleToggleOptOut(c, e)}
                            className={`h-5 px-2.5 rounded-full inline-flex items-center gap-1 text-[10px] font-semibold border transition-colors cursor-pointer ${
                              c.is_opted_out
                                ? 'border-[#F0625A]/30 bg-[#F0625A]/15 text-[#E11D48] dark:text-[#F0625A] hover:bg-[#F0625A]/25'
                                : 'border-[#10B981]/30 bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] hover:bg-[#10B981]/25'
                            }`}
                            title="Click to toggle compliance opt-out state"
                          >
                            {c.is_opted_out ? (
                              <>
                                <XCircle className="h-3 w-3" />
                                <span>Opted Out</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span>Active</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-xs font-semibold ${
                              isSelected
                                ? 'text-[#2563EB] dark:text-[#3B82F6]'
                                : 'text-slate-400 dark:text-[#6B7280] hover:text-[#2563EB] dark:hover:text-[#3B82F6]'
                            }`}
                          >
                            Inspect
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Dossier - Sticky */}
        <div className="lg:col-span-5 sticky top-6 self-start rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-5 shadow-sm dark:shadow-fintech-card space-y-4 transition-colors">
          {selectedCustomer ? (
            <div className="space-y-4">
              {/* Profile Card Header */}
              <div className="border-b border-slate-200 dark:border-white/[0.06] pb-3.5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-sm font-bold text-[#2563EB] dark:text-[#3B82F6] shrink-0">
                    {selectedCustomer.name
                      ? selectedCustomer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'AC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-[#F5F6FA]">
                        {selectedCustomer.name}
                      </h3>
                      <CustomerValueBadge customerId={selectedCustomer.id} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#6B7280] mt-0.5">
                      <span className="font-mono">{selectedCustomer.external_id}</span>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{selectedCustomer.email}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Opt-Out Button */}
                <button
                  type="button"
                  onClick={() => handleToggleOptOut(selectedCustomer)}
                  className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold border transition-all cursor-pointer ${
                    selectedCustomer.is_opted_out
                      ? 'bg-[#F0625A]/15 text-[#E11D48] dark:text-[#F0625A] border-[#F0625A]/30'
                      : 'bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] border-[#10B981]/30'
                  }`}
                  title="Toggle customer opt-out status"
                >
                  {selectedCustomer.is_opted_out ? 'Opted Out' : 'Active Policy'}
                </button>
              </div>

              {/* Recovery Intelligence Profile Card */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Vaulted Payment Method Card */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
                  Vaulted Payment Credentials
                </span>
                <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E121A] p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                      <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] font-mono">
                        •••• {selectedCustomer.card_last4 || '4242'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                      Network Tokenized
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-white/[0.04] text-[11px]">
                    <div>
                      <span className="text-slate-500 dark:text-[#6B7280] block">Expiry</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-[#F5F6FA]">
                        {selectedCustomer.card_expiry || '12/28'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-[#6B7280] block">Method Type</span>
                      <span className="font-semibold text-slate-900 dark:text-[#F5F6FA]">
                        {selectedCustomer.payment_method_type || 'Credit / Debit Card'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
                    Payment History Timeline
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#6B7280] font-mono">
                    {selectedCustomer.transactions.length} entries
                  </span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#6B7280] py-4 text-center">
                      No transaction records found for this account.
                    </p>
                  ) : (
                    selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-3 text-xs flex items-center justify-between transition-colors hover:border-slate-300 dark:hover:border-white/[0.08]"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-[#F5F6FA] tabular-nums font-mono">
                              {formatCurrency(tx.amount)}
                            </span>
                            <span
                              className={`h-4.5 px-1.5 rounded-full inline-flex items-center text-[9px] font-semibold uppercase border ${
                                tx.status === 'succeeded'
                                  ? 'bg-[#10B981]/15 text-[#059669] dark:text-[#10B981] border-[#10B981]/25'
                                  : 'bg-[#F0625A]/15 text-[#E11D48] dark:text-[#F0625A] border-[#F0625A]/25'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-[#6B7280] block font-mono">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>

                        {tx.failure_reason && (
                          <span className="text-[11px] text-slate-600 dark:text-[#9CA3B0] max-w-[140px] truncate text-right font-medium">
                            {getFailureTypeLabel(tx.failure_reason)}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center text-slate-400 dark:text-[#6B7280] text-xs">
              Select an account from the directory to inspect its payment profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
