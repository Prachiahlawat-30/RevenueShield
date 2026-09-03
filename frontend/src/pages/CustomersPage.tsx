import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, ChevronRight, Users, RefreshCw } from 'lucide-react';
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

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers({ search: searchQuery || undefined, page: 1, page_size: 20 });
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

  const handleToggleOptOut = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users className="h-4 w-4" />
            <span>ACCOUNT OPERATIONS</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl tracking-tight">
            Customers 360 & Opt-Out Policies
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage customer payment credentials, risk profiles, and deterministic contact policies.
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

      {/* Search Bar */}
      <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or external ID..."
            className="w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </form>
      </div>

      {/* Main Grid: Customer Table + Customer 360 Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Customer Table */}
        <div className="lg:col-span-7 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Payment Method</th>
                  <th className="px-5 py-3.5 font-medium">Card Expiry</th>
                  <th className="px-5 py-3.5 font-medium">Policy State</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4">
                      <TableSkeleton rows={6} cols={5} />
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`cursor-pointer transition-all duration-150 ${
                        selectedCustomer?.id === c.id
                          ? 'bg-slate-900/[0.05] dark:bg-white/[0.08]'
                          : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                          <CustomerValueBadge customerId={c.id} />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        •••• {c.card_last4 || '4242'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {c.card_expiry || '12/28'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => handleToggleOptOut(c, e)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase transition-all border cursor-pointer ${
                            c.is_opted_out
                              ? 'border-rose-500/20 bg-rose-500/[0.08] text-rose-700 dark:text-rose-400'
                              : 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400'
                          }`}
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
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center text-xs font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white">
                          Inspect
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer 360 Side Dossier */}
        <div className="lg:col-span-5 rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200/60 dark:border-white/[0.06] pb-3">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ACCOUNT PROFILE
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{selectedCustomer.name}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedCustomer.external_id}</span>
              </div>

              {/* 360 Recovery Intelligence Profile */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Credential Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment Method</span>
                <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Card Token</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">•••• {selectedCustomer.card_last4 || '4242'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Expiry Date</span>
                    <span className="font-mono text-slate-900 dark:text-white">{selectedCustomer.card_expiry || '12/28'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Method</span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedCustomer.payment_method_type || 'Credit / Debit Card'}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment History Timeline</span>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedCustomer.transactions.length} entries</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No transaction records found.</p>
                  ) : (
                    selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-3 text-xs flex items-center justify-between shadow-xs hover:-translate-y-[1px] transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(tx.amount)}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[9px] font-mono font-medium uppercase border ${
                                tx.status === 'succeeded'
                                  ? 'bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>

                        {tx.failure_reason && (
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono max-w-[140px] truncate text-right">
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
            <div className="flex h-64 items-center justify-center text-center text-slate-400 text-xs">
              Select an account from the table to view the 360 payment profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
