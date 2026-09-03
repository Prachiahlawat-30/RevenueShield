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

export const ExpectedRecoveryByTypeChart: React.FC<Props> = ({ data, height = 220 }) => {
  const { isDark } = useTheme();

  const formatShortLabel = (label: string) => {
    if (!label) return '';
    const l = label.toLowerCase();
    if (l.includes('temporary') || l.includes('decline')) return 'Temp Decline';
    if (l.includes('insufficient') || l.includes('funds')) return 'Insuff Funds';
    if (l.includes('expired')) return 'Expired Card';
    if (l.includes('network') || l.includes('timeout') || l.includes('gateway')) return 'Network Err';
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
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 backdrop-blur-xl p-3 shadow-glass-2 text-xs space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">{item.fullName}</p>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Cases: <span className="text-slate-900 dark:text-white font-bold">{item.count}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Exposure: <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.amount_at_risk)}</span>
          </p>
          <p className="text-slate-900 dark:text-white font-mono text-[11px]">
            Expected Yield: <strong className="font-bold">{formatCurrency(item.expected_recovery)}</strong>
          </p>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Probability: <span className="font-semibold text-slate-900 dark:text-white">{formatPercent(item.average_probability * 100)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }} className="min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 10, left: -15, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="2 4"
            stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)'}
            vertical={false}
          />
          <XAxis
            dataKey="name"
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
            tickFormatter={(v) => `₹${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount_at_risk"
            fill={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.16)'}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="expected_recovery"
            fill={isDark ? '#FFFFFF' : '#111827'}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
