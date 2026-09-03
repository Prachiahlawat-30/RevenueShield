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
import { BarChart3 } from 'lucide-react';

interface Props {
  data: ExpectedByFailureTypeItem[];
  height?: number;
}

export const ExpectedRecoveryByTypeChart: React.FC<Props> = ({ data, height = 220 }) => {
  const hasData =
    data &&
    data.length > 0 &&
    data.some(
      (d) => Number(d.amount_at_risk) > 0 || Number(d.expected_recovery) > 0
    );

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] rounded-[12px]"
      >
        <div className="w-9 h-9 rounded-full bg-white/[0.04] flex items-center justify-center text-[#6B7280] mb-2">
          <BarChart3 className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-[#F5F6FA]">No failure records yet</p>
        <p className="text-[11px] text-[#6B7280] mt-0.5">
          Expected recovery models will display once failure transactions occur.
        </p>
      </div>
    );
  }

  const formatShortLabel = (label: string) => {
    if (!label) return '';
    const l = label.toLowerCase();
    if (l.includes('temporary') || l.includes('decline')) return 'Temp decline';
    if (l.includes('insufficient') || l.includes('funds')) return 'Insuff funds';
    if (l.includes('expired')) return 'Expired card';
    if (l.includes('network') || l.includes('timeout') || l.includes('gateway')) return 'Network err';
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
        <div className="rounded-[12px] border border-white/[0.08] bg-[#171C28] p-3 shadow-fintech-elevated text-xs space-y-1.5 min-w-[170px]">
          <p className="font-medium text-[#F5F6FA] pb-1 border-b border-white/[0.06]">{item.fullName}</p>
          <div className="space-y-1 text-xs">
            <p className="text-[#9CA3B0] flex items-center justify-between gap-4">
              <span>Active cases:</span>
              <strong className="text-[#F5F6FA] tabular-nums">{item.count}</strong>
            </p>
            <p className="flex items-center justify-between gap-4 text-[#F0625A]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F0625A]" />
                <span>Exposure:</span>
              </span>
              <strong className="tabular-nums">{formatCurrency(item.amount_at_risk)}</strong>
            </p>
            <p className="flex items-center justify-between gap-4 text-[#3B82F6]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span>Expected yield:</span>
              </span>
              <strong className="tabular-nums">{formatCurrency(item.expected_recovery)}</strong>
            </p>
            <p className="text-[#6B7280] flex items-center justify-between gap-4 pt-1 border-t border-white/[0.06]">
              <span>Recovery probability:</span>
              <span className="font-medium text-[#10B981] tabular-nums">{formatPercent(item.average_probability * 100)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }} className="min-w-0 overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 10, left: -20, bottom: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
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
            tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="amount_at_risk"
            fill="#F0625A"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            dataKey="expected_recovery"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
