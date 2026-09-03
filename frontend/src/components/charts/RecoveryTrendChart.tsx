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
import { BarChart3 } from 'lucide-react';

interface RecoveryTrendChartProps {
  data: DailyRecoveryTrend[];
}

export const RecoveryTrendChart: React.FC<RecoveryTrendChartProps> = ({ data }) => {
  const hasData =
    data &&
    data.length > 0 &&
    data.some(
      (d) =>
        (typeof d.amount_recovered === 'number' && d.amount_recovered > 0) ||
        (typeof d.amount_at_risk === 'number' && d.amount_at_risk > 0)
    );

  if (!hasData) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-white/[0.08] rounded-[12px]">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center text-slate-500 dark:text-[#6B7280] mb-3">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-900 dark:text-[#F5F6FA]">Not enough trend data yet</p>
        <p className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-1 max-w-xs">
          Daily recovery trends will populate automatically as failed payment events are processed.
        </p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
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
