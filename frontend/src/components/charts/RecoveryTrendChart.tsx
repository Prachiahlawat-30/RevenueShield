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
        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-3 shadow-md text-xs space-y-1.5">
          <p className="font-bold text-[#1A1A2E] dark:text-white">{label}</p>
          <div className="space-y-1 font-mono">
            <p className="text-[#6822CC] flex items-center justify-between gap-4">
              <span>Revenue at Risk:</span>
              <strong className="font-bold">{formatCurrency(payload[0]?.value)}</strong>
            </p>
            <p className="text-[#16A34A] flex items-center justify-between gap-4">
              <span>Recovered Revenue:</span>
              <strong className="font-bold">{formatCurrency(payload[1]?.value)}</strong>
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
            <linearGradient id="colorAtRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6822CC" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6822CC" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#242E42' : '#F3F4F6'}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke={isDark ? '#6B7280' : '#9CA3AF'}
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="atRisk"
            name="Revenue at Risk"
            stroke="#6822CC"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAtRisk)"
          />
          <Area
            type="monotone"
            dataKey="recovered"
            name="Recovered Revenue"
            stroke="#16A34A"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRecovered)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
