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
import { useTheme } from '../../context/ThemeContext';

interface FailureBreakdownChartProps {
  data: FailureTypeBreakdown[];
}

export const FailureBreakdownChart: React.FC<FailureBreakdownChartProps> = ({ data }) => {
  const { isDark } = useTheme();

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
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 backdrop-blur-xl p-3 shadow-glass-2 text-xs space-y-1.5">
          <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
          <div className="space-y-1 font-mono text-[11px]">
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-between gap-4">
              <span>At Risk:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(payload[0]?.value)}</span>
            </p>
            <p className="text-slate-900 dark:text-white flex items-center justify-between gap-4">
              <span>Recovered:</span>
              <strong className="font-bold text-slate-950 dark:text-white">{formatCurrency(payload[1]?.value)}</strong>
            </p>
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
            strokeDasharray="2 4"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.4)'}
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.4)'}
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span className={isDark ? 'text-slate-400 font-mono' : 'text-slate-600 font-mono'}>
                {value === 'atRisk' ? 'Amount at Risk' : 'Amount Recovered'}
              </span>
            )}
          />
          <Bar
            dataKey="atRisk"
            fill={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.16)'}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="recovered"
            fill={isDark ? '#FFFFFF' : '#111827'}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
