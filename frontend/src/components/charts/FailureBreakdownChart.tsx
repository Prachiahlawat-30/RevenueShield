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
import { BarChart2 } from 'lucide-react';

interface FailureBreakdownChartProps {
  data: FailureTypeBreakdown[];
}

export const FailureBreakdownChart: React.FC<FailureBreakdownChartProps> = ({ data }) => {
  const hasData =
    data &&
    data.length > 0 &&
    data.some(
      (d) =>
        (typeof d.amount_at_risk === 'number' && d.amount_at_risk > 0) ||
        (typeof d.amount_recovered === 'number' && d.amount_recovered > 0)
    );

  if (!hasData) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-[12px]">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-500 dark:text-[#6B7280] mb-3">
          <BarChart2 className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-900 dark:text-[#F5F6FA]">No failure records yet</p>
        <p className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-1 max-w-xs">
          Failure causes will populate as payment events are diagnosed.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
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
