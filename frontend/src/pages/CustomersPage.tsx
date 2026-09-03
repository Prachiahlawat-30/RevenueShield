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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
            <Users className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Account operations</span>
          </div>
          <h1 className="mt-1 text-[24px] sm:text-[28px] font-semibold text-slate-900 dark:text-[#F5F6FA] tracking-tight">
            Customers 360 & Opt-Out Policies
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-[#9CA3B0]">
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
      <div className="rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-4 shadow-sm dark:shadow-fintech-card transition-colors">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or external ID..."
            className="w-full rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-[#F5F6FA] placeholder-slate-400 dark:placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 transition-colors"
          />
        </form>
      </div>

      {/* Main Grid: Customer Table + Customer 360 Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Customer Table */}
        <div className="lg:col-span-7 rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-[#6B7280] uppercase text-[11px] font-medium tracking-[0.04em]">
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Payment method</th>
                  <th className="px-5 py-3.5 font-medium">Card expiry</th>
                  <th className="px-5 py-3.5 font-medium">Policy state</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
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
                      className={`cursor-pointer transition-colors ${
                        selectedCustomer?.id === c.id
                          ? 'bg-blue-50/70 dark:bg-[#3B82F6]/10'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-[#F5F6FA]">{c.name}</span>
                          <CustomerValueBadge customerId={c.id} />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-[#9CA3B0]">
                        •••• {c.card_last4 || '4242'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-[#9CA3B0] tabular-nums">
                        {c.card_expiry || '12/28'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => handleToggleOptOut(c, e)}
                          className={`h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium border cursor-pointer ${
                            c.is_opted_out
                              ? 'border-[#F0625A]/20 bg-[#F0625A]/10 text-[#E11D48] dark:text-[#F0625A]'
                              : 'border-[#10B981]/20 bg-[#10B981]/10 text-[#059669] dark:text-[#10B981]'
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
                        <span className="inline-flex items-center text-xs font-medium text-[#2563EB] dark:text-[#3B82F6] hover:underline">
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
        <div className="lg:col-span-5 rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-5 shadow-sm dark:shadow-fintech-card space-y-4 transition-colors">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-white/[0.06] pb-3">
                <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
                  Account profile
                </span>
                <h3 className="text-[18px] font-semibold text-slate-900 dark:text-[#F5F6FA] mt-0.5">{selectedCustomer.name}</h3>
                <span className="text-xs text-slate-500 dark:text-[#6B7280]">{selectedCustomer.external_id}</span>
              </div>

              {/* 360 Recovery Intelligence Profile */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Credential Status */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Payment method</span>
                <div className="rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#9CA3B0]">Card token</span>
                    <span className="font-semibold text-slate-900 dark:text-[#F5F6FA]">•••• {selectedCustomer.card_last4 || '4242'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#9CA3B0]">Expiry date</span>
                    <span className="text-slate-900 dark:text-[#F5F6FA] tabular-nums">{selectedCustomer.card_expiry || '12/28'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#9CA3B0]">Method</span>
                    <span className="font-medium text-slate-900 dark:text-[#F5F6FA]">{selectedCustomer.payment_method_type || 'Credit / Debit Card'}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Payment history timeline</span>
                  <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">{selectedCustomer.transactions.length} entries</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#6B7280] py-3 text-center">No transaction records found.</p>
                  ) : (
                    selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-3 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">
                              {formatCurrency(tx.amount)}
                            </span>
                            <span
                              className={`h-4.5 px-1.5 rounded-full inline-flex items-center text-[9px] font-medium uppercase border ${
                                tx.status === 'succeeded'
                                  ? 'bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] border-[#10B981]/20'
                                  : 'bg-[#F0625A]/10 text-[#E11D48] dark:text-[#F0625A] border-[#F0625A]/20'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-[#6B7280] block">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>

                        {tx.failure_reason && (
                          <span className="text-[11px] text-slate-600 dark:text-[#9CA3B0] max-w-[140px] truncate text-right">
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
              Select an account from the table to view the 360 payment profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
