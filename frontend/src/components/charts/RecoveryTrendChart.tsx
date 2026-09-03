import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyRecoveryTrend } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

interface RecoveryTrendChartProps {
  data: DailyRecoveryTrend[];
}

export const RecoveryTrendChart: React.FC<RecoveryTrendChartProps> = ({ data }) => {
  const { isDark } = useTheme();

  const chartData = data.map((item) => ({
    date: item.date,
    atRisk: typeof item.amount_at_risk === 'string' ? parseFloat(item.amount_at_risk) : item.amount_at_risk,
    recovered: typeof item.amount_recovered === 'string' ? parseFloat(item.amount_recovered) : item.amount_recovered,
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
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fintechRecoveredArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isDark ? '#FFFFFF' : '#111827'}
                stopOpacity={isDark ? 0.08 : 0.05}
              />
              <stop
                offset="95%"
                stopColor={isDark ? '#FFFFFF' : '#111827'}
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}
            vertical={false}
          />
          <XAxis
            dataKey="date"
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
          <Area
            type="monotone"
            dataKey="atRisk"
            name="Revenue at Risk"
            stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)'}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Recovered Revenue"
            stroke={isDark ? '#FFFFFF' : '#111827'}
            strokeWidth={1.75}
            fillOpacity={1}
            fill="url(#fintechRecoveredArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
