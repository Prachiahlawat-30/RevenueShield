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
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-xl p-3.5 shadow-glass-3 text-xs space-y-2">
          <p className="font-semibold text-slate-900 dark:text-white font-mono">{label}</p>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>At Risk:</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(payload[0]?.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Recovered:</span>
              </span>
              <strong className="font-bold text-emerald-600 dark:text-emerald-400">
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
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)'}
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)'}
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
              <span className={isDark ? 'text-slate-300 font-mono' : 'text-slate-700 font-mono'}>
                {value === 'atRisk' ? '● Amount at Risk (Amber)' : '● Amount Recovered (Emerald)'}
              </span>
            )}
          />
          <Bar
            dataKey="atRisk"
            fill="#F59E0B"
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="recovered"
            fill="#10B981"
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
