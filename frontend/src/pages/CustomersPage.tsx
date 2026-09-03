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
  Code,
  UserPlus,
  X,
  Sparkles,
} from 'lucide-react';
import {
  getCustomers,
  getCustomerDetail,
  toggleCustomerOptOut,
  createCustomer,
  CustomerDetail,
} from '../api/customers';
import { Customer } from '../types';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';
import { CustomerRecoveryProfileCard } from '../components/customers/CustomerRecoveryProfileCard';
import { CustomerValueBadge } from '../components/customers/CustomerValueBadge';
import { JsonDrawer } from '../components/common/JsonDrawer';
import { formatCurrency, formatDate, getFailureTypeLabel } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [inspectDrawerData, setInspectDrawerData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'OPTED_OUT'>('ALL');

  // Add Account / Customer Injection Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '+91 98765 43210',
    card_last4: '4242',
    card_expiry: '12/28',
    is_opted_out: false,
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createSuccessNotice, setCreateSuccessNotice] = useState<string | null>(null);

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

  const handleInspectCustomer = async (c: Customer | CustomerDetail) => {
    try {
      const detail = await getCustomerDetail(c.id);
      setSelectedCustomer(detail);
      setInspectDrawerData({
        account: {
          id: detail.id,
          name: detail.name,
          email: detail.email,
          external_id: detail.external_id,
          created_at: detail.created_at,
        },
        vaulted_credentials: {
          card_last4: detail.card_last4 || '4242',
          card_expiry: detail.card_expiry || '12/28',
          payment_method_type: detail.payment_method_type || 'credit_card',
          pci_dss_tokenization: 'NETWORK_TOKENIZED_ACTIVE',
        },
        policy_guardrails: {
          opt_out_rule_1: detail.is_opted_out
            ? 'OPTED_OUT (COMMUNICATIONS_HALTED)'
            : 'ACTIVE (RECOVERY_PERMITTED)',
          high_value_threshold_rule_2: '$1,000.00 (₹1,00,000)',
          max_attempts_rule_3: 3,
          cooldown_hours_rule_4: 24,
          anti_duplicate_rule_5: 'ENFORCED',
        },
        total_transactions: detail.transactions.length,
        transactions: detail.transactions,
      });
    } catch (err) {
      console.error('Failed to inspect customer', err);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.email.trim()) return;

    setIsCreatingCustomer(true);
    try {
      const created = await createCustomer({
        name: newCustomerForm.name.trim(),
        email: newCustomerForm.email.trim(),
        phone: newCustomerForm.phone.trim(),
        card_last4: newCustomerForm.card_last4.trim() || '4242',
        card_expiry: newCustomerForm.card_expiry.trim() || '12/28',
        is_opted_out: newCustomerForm.is_opted_out,
      });

      setIsAddModalOpen(false);
      setNewCustomerForm({
        name: '',
        email: '',
        phone: '+91 98765 43210',
        card_last4: '4242',
        card_expiry: '12/28',
        is_opted_out: false,
      });

      setCreateSuccessNotice(`Enrolled ${created.name} into RecoverAI active policy guardrails!`);
      setTimeout(() => setCreateSuccessNotice(null), 4000);

      await fetchCustomers();
      await handleSelectCustomer(created.id);
    } catch (err: any) {
      console.error('Failed to create customer', err);
      alert(err?.response?.data?.detail || 'Failed to inject customer profile.');
    } finally {
      setIsCreatingCustomer(false);
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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={fetchCustomers}
          >
            Refresh Accounts
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {createSuccessNotice && (
        <div className="p-3.5 rounded-[12px] bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{createSuccessNotice}</span>
          </div>
          <button
            onClick={() => setCreateSuccessNotice(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
        {/* Customer Table - 7 Cols */}
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

          {/* Table Container - table-fixed ensures 100% fit with ZERO horizontal scroll */}
          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full text-left text-xs table-fixed">
              <colgroup>
                <col className="w-[44%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-[#6B7280] uppercase text-[10px] font-semibold tracking-[0.04em] bg-slate-50 dark:bg-[#0E121A]">
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 font-semibold">Card & Expiry</th>
                  <th className="px-3 py-3 font-semibold">Policy State</th>
                  <th className="px-3 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-4">
                      <TableSkeleton rows={6} cols={4} />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-[#6B7280]">
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
                        className={`group cursor-pointer transition-all border-l-4 ${
                          isSelected
                            ? 'border-l-[#3B82F6] bg-blue-50/70 dark:bg-[#3B82F6]/10'
                            : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Customer Column */}
                        <td className="px-4 py-3.5 overflow-hidden">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] truncate">
                                  {c.name}
                                </span>
                                <CustomerValueBadge customerId={c.id} />
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#6B7280] truncate font-mono">
                                {c.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Card & Expiry Column */}
                        <td className="px-3 py-3.5 text-slate-600 dark:text-[#9CA3B0] font-mono whitespace-nowrap overflow-hidden">
                          <div>•••• {c.card_last4 || '4242'}</div>
                          <div className="text-[10px] text-slate-400 dark:text-[#6B7280]">Exp {c.card_expiry || '12/28'}</div>
                        </td>

                        {/* Policy State Column - strictly whitespace-nowrap, never wraps */}
                        <td className="px-3 py-3.5 whitespace-nowrap overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => handleToggleOptOut(c, e)}
                            className={`h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                              c.is_opted_out
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title="Click to toggle compliance opt-out state"
                          >
                            {c.is_opted_out ? (
                              <>
                                <XCircle className="h-3 w-3 shrink-0 text-rose-500" />
                                <span className="whitespace-nowrap">Opted Out</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                                <span className="whitespace-nowrap">Active</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action Column - Functional Button */}
                        <td className="px-3 py-3.5 text-right whitespace-nowrap overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectCustomer(c);
                            }}
                            className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                              isSelected
                                ? 'bg-[#3B82F6] text-white'
                                : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-[#3B82F6] hover:text-white dark:hover:bg-[#3B82F6] dark:hover:text-white'
                            }`}
                            title={`Inspect full ledger and telemetry for ${c.name}`}
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Dossier - 5 Cols (Sticky & Seamlessly Fitted) */}
        <div className="lg:col-span-5 sticky top-6 self-start rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-5 shadow-sm dark:shadow-fintech-card space-y-4 transition-colors">
          {selectedCustomer ? (
            <div className="space-y-4">
              {/* Account Header with Actions */}
              <div className="border-b border-slate-200 dark:border-white/[0.06] pb-3.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-[10px] bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-xs font-bold text-[#3B82F6] shrink-0">
                    {selectedCustomer.name
                      ? selectedCustomer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'AC'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F6FA] truncate">
                        {selectedCustomer.name}
                      </h3>
                      <CustomerValueBadge customerId={selectedCustomer.id} />
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-[#6B7280] font-mono truncate">
                      {selectedCustomer.external_id}
                    </div>
                  </div>
                </div>

                {/* Right Header Buttons: Raw Dossier + Opt-Out Toggle */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleInspectCustomer(selectedCustomer)}
                    className="p-1 rounded-[8px] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="View full audit telemetry"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleOptOut(selectedCustomer)}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedCustomer.is_opted_out
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                    }`}
                    title="Toggle customer opt-out status"
                  >
                    {selectedCustomer.is_opted_out ? 'Opted Out' : 'Active Policy'}
                  </button>
                </div>
              </div>

              {/* Recovery Intelligence Profile */}
              <CustomerRecoveryProfileCard customerId={selectedCustomer.id} />

              {/* Vaulted Payment Credentials */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
                  Vaulted Payment Credentials
                </span>
                <div className="rounded-[10px] bg-slate-50 dark:bg-[#0E121A] border border-slate-200/80 dark:border-white/[0.06] p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#3B82F6] shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-[#F5F6FA]">
                        •••• {selectedCustomer.card_last4 || '4242'}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-[#6B7280] ml-2 font-mono">
                        Exp {selectedCustomer.card_expiry || '12/28'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold whitespace-nowrap shrink-0">
                    Network Tokenized
                  </span>
                </div>
              </div>

              {/* Payment History Timeline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
                    Payment History Timeline
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#6B7280] font-mono">
                    {selectedCustomer.transactions.length} entries
                  </span>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {selectedCustomer.transactions.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#6B7280] py-3 text-center">
                      No transaction records found.
                    </p>
                  ) : (
                    selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-[8px] border border-slate-200/70 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-2.5 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-[#F5F6FA] tabular-nums font-mono">
                              {formatCurrency(tx.amount)}
                            </span>
                            <span
                              className={`h-4 px-1.5 rounded-full inline-flex items-center text-[9px] font-semibold uppercase border ${
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
                          <span className="text-[10px] text-slate-500 dark:text-[#9CA3B0] max-w-[130px] truncate text-right font-medium">
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

      {/* Customer JSON Dossier Drawer */}
      {inspectDrawerData && (
        <JsonDrawer
          isOpen={Boolean(inspectDrawerData)}
          onClose={() => setInspectDrawerData(null)}
          title={`Customer Audit Dossier: ${inspectDrawerData.account?.name || 'Account'}`}
          data={inspectDrawerData}
        />
      )}

      {/* Modal: Inject / Add Customer Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fintech-fade">
          <div
            className="w-full max-w-md rounded-[18px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12161F] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F5F6FA]">
                    Direct Customer Injection
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">
                    Enroll account into RecoverAI PolicyEngine
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-[#F5F6FA] font-medium mb-1">
                  Company / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Dynamic Corp"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full rounded-[8px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-slate-900 dark:text-[#F5F6FA] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#F5F6FA] font-medium mb-1">
                  Billing Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. finance@apexdynamic.io"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  className="w-full rounded-[8px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-slate-900 dark:text-[#F5F6FA] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#F5F6FA] font-medium mb-1">
                  Contact Phone (WhatsApp Dunning)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full rounded-[8px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-slate-900 dark:text-[#F5F6FA] font-mono focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-[#F5F6FA] font-medium mb-1">
                    Card Last 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="4242"
                    value={newCustomerForm.card_last4}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, card_last4: e.target.value })}
                    className="w-full rounded-[8px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-slate-900 dark:text-[#F5F6FA] font-mono focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-[#F5F6FA] font-medium mb-1">
                    Card Expiry
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="12/28"
                    value={newCustomerForm.card_expiry}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, card_expiry: e.target.value })}
                    className="w-full rounded-[8px] border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0E121A] px-3 py-2 text-slate-900 dark:text-[#F5F6FA] font-mono focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-slate-50 dark:bg-[#0E121A] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] block">
                    Policy Enforcement State
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">
                    Enable automated recovery sequences
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewCustomerForm({
                      ...newCustomerForm,
                      is_opted_out: !newCustomerForm.is_opted_out,
                    })
                  }
                  className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold border cursor-pointer ${
                    newCustomerForm.is_opted_out
                      ? 'bg-rose-500/15 text-rose-600 border-rose-500/25'
                      : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25'
                  }`}
                >
                  {newCustomerForm.is_opted_out ? 'Opted Out' : 'Active'}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200/80 dark:border-white/[0.06]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreatingCustomer}
                >
                  Inject Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
