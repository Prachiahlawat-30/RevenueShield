import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ExpectedByFailureTypeItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  data: ExpectedByFailureTypeItem[];
  height?: number;
}

export const ExpectedRecoveryByTypeChart: React.FC<Props> = ({ data, height = 200 }) => {
  const { isDark } = useTheme();

  const chartData = data.map((d) => ({
    name: d.failure_type_label,
    amount_at_risk: Number(d.amount_at_risk),
    expected_recovery: Number(d.expected_recovery),
    average_probability: d.average_probability,
    count: d.count,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={`p-2.5 rounded-fintech-md shadow-xl text-xs space-y-1 border ${
          isDark ? 'bg-[#0f1420] border-[#263247] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <p className="font-bold">{label}</p>
          <p className="text-fintech-muted">
            Cases: <span className="font-mono font-bold text-fintech-primary">{item.count}</span>
          </p>
          <p className="text-fintech-muted">
            Revenue At Risk:{' '}
            <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">{formatCurrency(item.amount_at_risk)}</span>
          </p>
          <p className="text-fintech-muted">
            Expected Recovery:{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatCurrency(item.expected_recovery)}</span>
          </p>
          <p className="text-fintech-muted">
            Avg Probability:{' '}
            <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{formatPercent(item.average_probability * 100)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#E2E8F0'} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={10}
            tickLine={false}
            interval={0}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
          />
          <YAxis
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={10}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
            formatter={(value) => (
              <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
                {value === 'amount_at_risk' ? 'Amount at Risk' : 'Expected Recovery'}
              </span>
            )}
          />
          <Bar dataKey="amount_at_risk" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expected_recovery" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
