import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

  // Shorten label for clean horizontal presentation without rotation overflow
  const formatShortLabel = (label: string) => {
    if (!label) return '';
    if (label.toLowerCase().includes('temporary') || label.toLowerCase().includes('decline')) return 'Temp Decline';
    if (label.toLowerCase().includes('insufficient') || label.toLowerCase().includes('funds')) return 'Insuff Funds';
    if (label.toLowerCase().includes('expired')) return 'Expired Card';
    if (label.toLowerCase().includes('network') || label.toLowerCase().includes('timeout')) return 'Network Err';
    return 'Other';
  };

  const chartData = data.map((d) => ({
    fullName: d.failure_type_label,
    name: formatShortLabel(d.failure_type_label),
    amount_at_risk: Number(d.amount_at_risk),
    expected_recovery: Number(d.expected_recovery),
    average_probability: d.average_probability,
    count: d.count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className={`p-2.5 rounded-fintech-md shadow-xl text-xs space-y-1 border ${
          isDark ? 'bg-[#0f1420] border-[#263247] text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <p className="font-bold">{item.fullName}</p>
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
    <div style={{ width: '100%', height }} className="min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
          <Bar dataKey="amount_at_risk" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expected_recovery" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
