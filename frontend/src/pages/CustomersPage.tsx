import React, { useEffect, useState } from 'react';
import { Search, User, CreditCard, CheckCircle, XCircle, ChevronRight, Users, RefreshCw, Clock, AlertOctagon } from 'lucide-react';
import { getCustomers, getCustomerDetail, toggleCustomerOptOut, CustomerDetail } from '../api/customers';
import { Customer } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
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
  const [isDetailLoading, setIsDetailLoading] = useState(false);

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
    setIsDetailLoading(true);
    try {
      const detail = await getCustomerDetail(customerId);
      setSelectedCustomer(detail);
    } catch (err) {
      console.error('Failed to load customer detail', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6822CC]">
            <Users className="h-4 w-4" />
            <span>Account Operations</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl tracking-tight">
            Customers 360 & Opt-Out Policies
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
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
      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or external ID..."
            className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/40 pl-10 pr-4 py-2 text-xs text-[#1A1A2E] dark:text-white placeholder-[#9CA3AF] focus:border-[#6822CC] focus:outline-none transition-colors"
          />
        </form>
      </div>

      {/* Main Grid: Customer Table + Customer 360 Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Customer Table */}
        <div className="lg:col-span-7 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/70 dark:bg-slate-800/40 text-[#6B7280] uppercase font-semibold text-[11px]">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Card Expiry</th>
                  <th className="px-5 py-3.5">Policy State</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#242E42] font-medium">
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
                          ? 'bg-[#F3EEFF]/80 dark:bg-purple-950/30'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1A1A2E] dark:text-white">{c.name}</span>
                          <CustomerValueBadge customerId={c.id} />
                        </div>
                        <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B7280] font-mono">
                        •••• {c.card_last4 || '4242'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-mono text-xs ${
                            c.card_expiry && c.card_expiry <= '08/26'
                              ? 'text-[#DC2626] font-bold'
                              : 'text-[#6B7280]'
                          }`}
                        >
                          {c.card_expiry || '12/28'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => handleToggleOptOut(c, e)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-all border ${
                            c.is_opted_out
                              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
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
                        <span className="inline-flex items-center text-xs font-bold text-[#6822CC] dark:text-[#B892FF]">
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
        <div className="lg:col-span-5 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-[#E5E7EB] dark:border-[#242E42] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6822CC]">
                  Account Profile
                </span>
                <h3 className="text-base font-bold text-[#1A1A2E] dark:text-white mt-0.5">{selectedCustomer.name}</h3>
                <span className="text-xs text-[#6B7280] font-mono">{selectedCustomer.external_id}</span>
              </div>

              {/* 360 Recovery Intelligence Profile */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Credential Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#6B7280]">Payment Method</span>
                <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/40 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Card Token</span>
                    <span className="font-mono font-semibold text-[#1A1A2E] dark:text-white">•••• {selectedCustomer.card_last4 || '4242'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Expiry Date</span>
                    <span className="font-mono text-[#1A1A2E] dark:text-white">{selectedCustomer.card_expiry || '12/28'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Method</span>
                    <span className="font-medium text-[#1A1A2E] dark:text-white">{selectedCustomer.payment_method_type || 'Credit / Debit Card'}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Payment History Timeline</span>
                  <span className="text-[10px] text-[#9CA3AF] font-mono">{selectedCustomer.transactions.length} entries</span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF] py-3 text-center">No transaction records found.</p>
                  ) : (
                    selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-3 text-xs flex items-center justify-between shadow-none hover:border-[#D1D5DB] transition-all"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#1A1A2E] dark:text-white">
                              {formatCurrency(tx.amount)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono ${
                                tx.status === 'succeeded'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#6B7280] block font-mono">
                            {formatDate(tx.created_at)}
                          </span>
                        </div>

                        {tx.failure_reason && (
                          <span className="text-[10px] text-[#DC2626] font-mono max-w-[140px] truncate text-right">
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
            <div className="flex h-64 items-center justify-center text-center text-[#9CA3AF] text-xs">
              Select an account from the table to view the 360 payment profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
