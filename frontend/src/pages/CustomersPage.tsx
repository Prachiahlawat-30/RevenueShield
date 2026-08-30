import React, { useEffect, useState } from 'react';
import { Search, User, CreditCard, CheckCircle, XCircle, ChevronRight, Users, RefreshCw } from 'lucide-react';
import { getCustomers, getCustomerDetail, toggleCustomerOptOut, CustomerDetail } from '../api/customers';
import { Customer } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <Users className="h-4 w-4" />
            <span>Account Operations</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Customers 360 & Opt-Out Policies
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary">
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
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-fintech-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, or external ID..."
            className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle pl-10 pr-4 py-2 text-xs text-fintech-primary placeholder-fintech-muted focus:border-brand-500 focus:outline-none"
          />
        </form>
      </div>

      {/* Main Grid: Customer Table + Customer 360 Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Customer Table */}
        <div className="lg:col-span-7 rounded-fintech-lg border border-fintech-border bg-fintech-surface shadow-fintech-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs fintech-table-sticky-header">
              <thead>
                <tr className="border-b border-fintech-border bg-fintech-surface-subtle/80 text-fintech-muted uppercase font-semibold text-[11px]">
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Card Expiry</th>
                  <th className="px-5 py-3.5">Policy State</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border font-medium">
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
                          ? 'bg-brand-500/10'
                          : 'hover:bg-fintech-surface-subtle/60'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-fintech-primary">{c.name}</span>
                          <CustomerValueBadge customerId={c.id} />
                        </div>
                        <div className="text-[11px] text-fintech-muted font-mono mt-0.5">{c.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-fintech-secondary font-mono">
                        •••• {c.card_last4 || '4242'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-mono text-xs ${
                            c.card_expiry && c.card_expiry <= '08/26'
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-fintech-secondary'
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
                              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
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
                        <span className="inline-flex items-center text-xs font-bold text-brand-600 dark:text-brand-400">
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
        <div className="lg:col-span-5 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-fintech-border pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500">
                  Account Dossier
                </span>
                <h3 className="text-base font-bold text-fintech-primary mt-0.5">{selectedCustomer.name}</h3>
                <span className="text-xs text-fintech-muted font-mono">{selectedCustomer.external_id}</span>
              </div>

              {/* 360 Recovery Intelligence Profile */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Credential Status */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-fintech-secondary">Payment Method</span>
                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-fintech-muted">Card Credential:</span>
                    <span className="font-mono text-fintech-primary">•••• {selectedCustomer.card_last4 || '4242'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fintech-muted">Expiry:</span>
                    <span className="font-mono font-semibold text-fintech-primary">{selectedCustomer.card_expiry || '12/28'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fintech-muted">Risk Score:</span>
                    <span className="font-mono text-amber-500 font-bold">{selectedCustomer.risk_score}</span>
                  </div>
                </div>
              </div>

              {/* Linked Revenue Risks */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-fintech-secondary">Linked Revenue Risks</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.revenue_risks && selectedCustomer.revenue_risks.length > 0 ? (
                    selectedCustomer.revenue_risks.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-2.5 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-fintech-primary">
                            {getFailureTypeLabel(r.detected_failure_type)}
                          </p>
                          <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                            {formatCurrency(r.amount_at_risk)}
                          </span>
                        </div>
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-fintech-muted">No linked revenue risks.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-xs text-fintech-muted">
              <User className="h-8 w-8 text-fintech-muted mb-2" />
              <span>Select any account to inspect billing history and active risk cases.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
