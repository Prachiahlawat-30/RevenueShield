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
}

export const ExpectedRecoveryByTypeChart: React.FC<Props> = ({ data }) => {
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
        <div className={`p-3 rounded-fintech-md shadow-xl text-xs space-y-1 border ${
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
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#263247' : '#E2E8F0'} />
          <XAxis
            dataKey="name"
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tickLine={false}
            interval={0}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
            formatter={(value) => (
              <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>
                {value === 'amount_at_risk' ? 'Amount at Risk' : 'Expected Recovery'}
              </span>
            )}
          />
          <Bar dataKey="amount_at_risk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expected_recovery" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
