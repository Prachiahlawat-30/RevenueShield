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
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-xl p-3.5 shadow-glass-3 text-xs space-y-2">
          <p className="font-semibold text-slate-900 dark:text-white font-mono">{label}</p>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>At Risk:</span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(payload[0]?.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
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
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="fintechEmeraldArea" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="#10B981"
                stopOpacity={isDark ? 0.35 : 0.25}
              />
              <stop
                offset="95%"
                stopColor="#10B981"
                stopOpacity={0.0}
              />
            </linearGradient>
            <linearGradient id="fintechRiskLine" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="#F43F5E"
                stopOpacity={isDark ? 0.15 : 0.1}
              />
              <stop
                offset="95%"
                stopColor="#F43F5E"
                stopOpacity={0.0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}
            vertical={false}
          />
          <XAxis
            dataKey="date"
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
          <Area
            type="monotone"
            dataKey="atRisk"
            name="Revenue at Risk"
            stroke="#F43F5E"
            strokeWidth={2}
            strokeDasharray="4 4"
            fill="url(#fintechRiskLine)"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Recovered Revenue"
            stroke="#10B981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#fintechEmeraldArea)"
            activeDot={{ r: 5, fill: '#10B981', stroke: isDark ? '#090D16' : '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
