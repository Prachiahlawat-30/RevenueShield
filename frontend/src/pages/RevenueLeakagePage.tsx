import React, { useEffect, useState } from 'react';
import {
  Radar,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getRevenueLeakageSummary, getExecutiveLeakageSummary } from '../api/tier2';
import { RevenueLeakageSummary, ExecutiveLeakageSummary, RevenueLeakageBreakdownItem } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

export const RevenueLeakagePage: React.FC = () => {
  const { isDark } = useTheme();
  const [summary, setSummary] = useState<RevenueLeakageSummary | null>(null);
  const [executive, setExecutive] = useState<ExecutiveLeakageSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'failure' | 'gateway' | 'method' | 'segment' | 'merchant'>('failure');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, execRes] = await Promise.all([
        getRevenueLeakageSummary(),
        getExecutiveLeakageSummary(),
      ]);
      setSummary(sumRes);
      setExecutive(execRes);
    } catch (err: any) {
      console.error('Failed to fetch revenue leakage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-fintech-muted">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
          <span className="text-sm">Calculating company-wide revenue leakage radar...</span>
        </div>
      </div>
    );
  }

  const getActiveBreakdownList = (): RevenueLeakageBreakdownItem[] => {
    switch (activeTab) {
      case 'failure':
        return summary.breakdown_by_failure_type || [];
      case 'gateway':
        return summary.breakdown_by_gateway || [];
      case 'method':
        return summary.breakdown_by_payment_method || [];
      case 'segment':
        return summary.breakdown_by_customer_segment || [];
      case 'merchant':
        return summary.breakdown_by_merchant || [];
      default:
        return [];
    }
  };

  const currentList = getActiveBreakdownList();

  const chartData = currentList.map((item) => ({
    name: item.dimension_label,
    atRisk: typeof item.revenue_at_risk === 'string' ? parseFloat(item.revenue_at_risk) : Number(item.revenue_at_risk),
    recovered: typeof item.recovered_revenue === 'string' ? parseFloat(item.recovered_revenue) : Number(item.recovered_revenue),
    expected: typeof item.expected_recoverable === 'string' ? parseFloat(item.expected_recoverable) : Number(item.expected_recoverable),
  }));

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">Revenue Leakage Radar</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-mono">
              Macro Analytics
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Multidimensional payment failure exposure, unrecovered revenue, and recovery yield across rails
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchData}
        >
          Refresh Radar
        </Button>
      </div>

      {/* Executive Briefing Banner */}
      {executive && (
        <div className="p-5 rounded-fintech-lg bg-fintech-surface border border-brand-500/30 shadow-fintech-sm grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider font-mono">Largest Leakage Source</span>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">{executive.largest_leakage_source}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider font-mono">Worst Performing Gateway</span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">{executive.worst_performing_gateway}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider font-mono">Largest Recovery Source</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{executive.largest_recovery_source}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-fintech-muted uppercase tracking-wider font-mono">Optimal Strategy</span>
            <p className="text-base font-bold text-brand-600 dark:text-brand-400">{executive.best_performing_strategy}</p>
          </div>
        </div>
      )}

      {/* KPI Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-xs text-fintech-muted">Total Payment Volume</span>
          <p className="text-xl font-bold text-fintech-primary font-mono">{formatCurrency(summary.total_payment_volume)}</p>
        </div>
        <div className="p-4 rounded-fintech-md bg-rose-500/10 border border-rose-500/30 space-y-1">
          <span className="text-xs text-rose-700 dark:text-rose-400">Revenue At Risk</span>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono">{formatCurrency(summary.revenue_at_risk)}</p>
        </div>
        <div className="p-4 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 space-y-1">
          <span className="text-xs text-brand-700 dark:text-brand-400">Expected Recoverable</span>
          <p className="text-xl font-bold text-brand-700 dark:text-brand-300 font-mono">{formatCurrency(summary.expected_recoverable_revenue)}</p>
        </div>
        <div className="p-4 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <span className="text-xs text-emerald-700 dark:text-emerald-400">Captured Revenue</span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatCurrency(summary.recovered_revenue)}</p>
        </div>
        <div className="p-4 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-xs text-fintech-muted">Unrecovered Leakage</span>
          <p className="text-xl font-bold text-fintech-secondary font-mono">{formatCurrency(summary.unrecovered_revenue)}</p>
        </div>
        <div className="p-4 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-1">
          <span className="text-xs text-fintech-muted">Portfolio Recovery Rate</span>
          <p className="text-xl font-bold text-fintech-primary font-mono">{formatPercent(summary.recovery_rate * 100)}</p>
        </div>
      </div>

      {/* Multidimensional Radar Tabs & Chart */}
      <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand-500" />
            <h2 className="text-base font-bold text-fintech-primary">Leakage Distribution by Dimension</h2>
          </div>
          <div className="flex items-center gap-1 bg-fintech-surface-subtle p-1 rounded-fintech-md border border-fintech-border text-xs">
            <button
              onClick={() => setActiveTab('failure')}
              className={`px-3 py-1 rounded-fintech-sm font-semibold transition-colors ${
                activeTab === 'failure' ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              Failure Type
            </button>
            <button
              onClick={() => setActiveTab('gateway')}
              className={`px-3 py-1 rounded-fintech-sm font-semibold transition-colors ${
                activeTab === 'gateway' ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              Gateway
            </button>
            <button
              onClick={() => setActiveTab('method')}
              className={`px-3 py-1 rounded-fintech-sm font-semibold transition-colors ${
                activeTab === 'method' ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              Payment Method
            </button>
            <button
              onClick={() => setActiveTab('segment')}
              className={`px-3 py-1 rounded-fintech-sm font-semibold transition-colors ${
                activeTab === 'segment' ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              Customer Segment
            </button>
            <button
              onClick={() => setActiveTab('merchant')}
              className={`px-3 py-1 rounded-fintech-sm font-semibold transition-colors ${
                activeTab === 'merchant' ? 'bg-brand-500 text-white shadow-fintech-sm' : 'text-fintech-muted hover:text-fintech-primary'
              }`}
            >
              Merchant
            </button>
          </div>
        </div>

        {/* Visual Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#263247' : '#E2E8F0'} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#0f1420' : '#ffffff',
                  borderColor: isDark ? '#263247' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(val) => (
                  <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>{val}</span>
                )}
              />
              <Bar dataKey="atRisk" name="Revenue At Risk" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expected" name="Expected Recoverable" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recovered" name="Captured" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto rounded-fintech-md border border-fintech-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-fintech-border bg-fintech-surface-subtle text-fintech-muted">
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Category / Rail</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Transactions</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Revenue At Risk</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Expected Recoverable</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Captured</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Unrecovered Leakage</th>
                <th className="py-3 px-4 uppercase tracking-wider font-semibold">Recovery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fintech-border text-fintech-secondary">
              {currentList.map((row, idx) => (
                <tr key={idx} className="hover:bg-fintech-surface-subtle transition-colors">
                  <td className="py-3.5 px-4 font-bold text-fintech-primary">{row.dimension_label}</td>
                  <td className="py-3.5 px-4 text-fintech-secondary font-mono">{row.transaction_count}</td>
                  <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-mono font-bold">
                    {formatCurrency(row.revenue_at_risk)}
                  </td>
                  <td className="py-3.5 px-4 text-brand-600 dark:text-brand-400 font-mono">
                    {formatCurrency(row.expected_recoverable)}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(row.recovered_revenue)}
                  </td>
                  <td className="py-3.5 px-4 text-fintech-muted font-mono">
                    {formatCurrency(row.unrecovered_leakage)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-fintech-primary">
                      {formatPercent(row.recovery_rate * 100)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
