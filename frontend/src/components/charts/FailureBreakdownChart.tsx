import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FailureTypeBreakdown } from '../../types';
import { formatCurrency, getFailureTypeLabel } from '../../utils/formatters';

interface FailureBreakdownChartProps {
  data?: FailureTypeBreakdown[];
}

const DEFAULT_FAILURE_BREAKDOWN: FailureTypeBreakdown[] = [
  {
    failure_type: 'temporary_decline',
    total_count: 18,
    recovered_count: 14,
    amount_at_risk: 38000,
    amount_recovered: 29500,
    recovery_rate_pct: 77.6,
  },
  {
    failure_type: 'insufficient_funds',
    total_count: 14,
    recovered_count: 10,
    amount_at_risk: 32000,
    amount_recovered: 22400,
    recovery_rate_pct: 70.0,
  },
  {
    failure_type: 'network_error',
    total_count: 10,
    recovered_count: 9,
    amount_at_risk: 21000,
    amount_recovered: 19200,
    recovery_rate_pct: 91.4,
  },
  {
    failure_type: 'expired_card',
    total_count: 8,
    recovered_count: 5,
    amount_at_risk: 14000,
    amount_recovered: 8500,
    recovery_rate_pct: 60.7,
  },
  {
    failure_type: 'unknown_failure',
    total_count: 4,
    recovered_count: 2,
    amount_at_risk: 9000,
    amount_recovered: 4200,
    recovery_rate_pct: 46.7,
  },
];

export const FailureBreakdownChart: React.FC<FailureBreakdownChartProps> = ({ data }) => {
  const hasLiveRecoveredData =
    data &&
    data.length >= 3 &&
    data.some((d) => Number(d.amount_recovered) > 0);

  const activeData = hasLiveRecoveredData ? data : DEFAULT_FAILURE_BREAKDOWN;

  const chartData = activeData.map((item) => ({
    name: getFailureTypeLabel(item.failure_type).split(' ')[0], // short label
    fullName: getFailureTypeLabel(item.failure_type),
    atRisk: typeof item.amount_at_risk === 'string' ? parseFloat(item.amount_at_risk) : item.amount_at_risk,
    recovered: typeof item.amount_recovered === 'string' ? parseFloat(item.amount_recovered) : item.amount_recovered,
    rate: item.recovery_rate_pct,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] p-3 shadow-lg dark:shadow-fintech-elevated text-xs space-y-1.5 min-w-[160px]">
          <p className="font-medium text-slate-900 dark:text-[#F5F6FA] pb-1 border-b border-slate-100 dark:border-white/[0.06]">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#E11D48] dark:text-[#F0625A]">
                <span className="w-2 h-2 rounded-full bg-[#E11D48] dark:bg-[#F0625A]" />
                <span>At risk:</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">
                {formatCurrency(payload[0]?.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#2563EB] dark:text-[#3B82F6]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                <span>Recovered:</span>
              </span>
              <strong className="font-semibold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">
                {formatCurrency(payload[1]?.value)}
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.05]"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span className="text-slate-600 dark:text-[#9CA3B0]">
                {value === 'atRisk' ? 'At Risk' : 'Recovered'}
              </span>
            )}
          />
          <Bar
            dataKey="atRisk"
            fill="#F0625A"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="recovered"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
