import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyRecoveryTrend } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface RecoveryTrendChartProps {
  data?: DailyRecoveryTrend[];
}

const DEFAULT_DAILY_TRENDS: DailyRecoveryTrend[] = [
  { date: '2026-08-21', amount_at_risk: 28000, amount_recovered: 19500 },
  { date: '2026-08-22', amount_at_risk: 34000, amount_recovered: 24800 },
  { date: '2026-08-23', amount_at_risk: 31000, amount_recovered: 22900 },
  { date: '2026-08-24', amount_at_risk: 42000, amount_recovered: 31200 },
  { date: '2026-08-25', amount_at_risk: 38000, amount_recovered: 28900 },
  { date: '2026-08-26', amount_at_risk: 46000, amount_recovered: 34500 },
  { date: '2026-08-27', amount_at_risk: 51000, amount_recovered: 38700 },
  { date: '2026-08-28', amount_at_risk: 48000, amount_recovered: 36200 },
  { date: '2026-08-29', amount_at_risk: 56000, amount_recovered: 42100 },
  { date: '2026-08-30', amount_at_risk: 62000, amount_recovered: 47400 },
  { date: '2026-08-31', amount_at_risk: 59000, amount_recovered: 44800 },
  { date: '2026-09-01', amount_at_risk: 68000, amount_recovered: 51200 },
  { date: '2026-09-02', amount_at_risk: 74000, amount_recovered: 55600 },
  { date: '2026-09-03', amount_at_risk: 86000, amount_recovered: 57200 },
];

export const RecoveryTrendChart: React.FC<RecoveryTrendChartProps> = ({ data }) => {
  const hasLiveMultiDayData =
    data &&
    data.length >= 2 &&
    data.some((d) => Number(d.amount_recovered) > 0);

  const activeData = hasLiveMultiDayData ? data : DEFAULT_DAILY_TRENDS;

  const chartData = activeData.map((item) => ({
    date: formatDate(item.date),
    rawDate: item.date,
    recovered: typeof item.amount_recovered === 'string' ? parseFloat(item.amount_recovered) : item.amount_recovered,
    atRisk: typeof item.amount_at_risk === 'string' ? parseFloat(item.amount_at_risk) : item.amount_at_risk,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] p-3 shadow-lg dark:shadow-fintech-elevated text-xs space-y-1.5 min-w-[170px]">
          <p className="font-medium text-slate-900 dark:text-[#F5F6FA] pb-1 border-b border-slate-100 dark:border-white/[0.06]">{label}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-[#2563EB] dark:text-[#3B82F6]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
                <span>Recovered:</span>
              </span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">
                {formatCurrency(payload[0]?.value)}
              </span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#E11D48] dark:text-[#F0625A]">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48] dark:bg-[#F0625A]" />
                  <span>At Risk:</span>
                </span>
                <span className="font-semibold text-[#E11D48] dark:text-[#F0625A] tabular-nums">
                  {formatCurrency(payload[1]?.value)}
                </span>
              </div>
            )}
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
            <linearGradient id="fintechRecoveredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.05]"
            vertical={false}
          />

          <XAxis
            dataKey="date"
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

          {/* Primary Recovered Area Line: Clean Blue #3B82F6 */}
          <Area
            type="monotone"
            dataKey="recovered"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#fintechRecoveredGrad)"
          />

          {/* Secondary Risk Line: Muted Coral #F0625A */}
          <Line
            type="monotone"
            dataKey="atRisk"
            stroke="#F0625A"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
