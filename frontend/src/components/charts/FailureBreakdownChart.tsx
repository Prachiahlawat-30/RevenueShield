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

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? '#242E42' : '#F3F4F6'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
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
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#131824' : '#ffffff',
              borderColor: isDark ? '#242E42' : '#E5E7EB',
              color: isDark ? '#F9FAFB' : '#1A1A2E',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any) => [
              formatCurrency(value),
              name === 'atRisk' ? 'Amount at Risk' : 'Amount Recovered',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => (
              <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>
                {value === 'atRisk' ? 'Amount at Risk' : 'Amount Recovered'}
              </span>
            )}
          />
          <Bar dataKey="atRisk" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="recovered" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
