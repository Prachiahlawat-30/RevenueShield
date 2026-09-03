import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface Props {
  data: Record<string, number>;
  selectedBand?: string;
  onSelectBand?: (band: string) => void;
  height?: number;
}

export const PriorityDistributionChart: React.FC<Props> = ({
  data,
  selectedBand,
  onSelectBand,
  height = 140,
}) => {
  const bands = [
    { key: 'CRITICAL', label: 'Critical', color: '#F0625A' },
    { key: 'HIGH', label: 'High', color: '#E8A33D' },
    { key: 'MEDIUM', label: 'Medium', color: '#3B82F6' },
    { key: 'LOW', label: 'Low', color: '#10B981' },
  ];

  const chartData = bands.map((b) => ({
    band: b.key,
    label: b.label,
    count: data[b.key] || 0,
    color: b.color,
  }));

  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <XAxis
            dataKey="label"
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
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-[12px] border border-white/[0.08] bg-[#171C28] p-2.5 shadow-fintech-elevated text-xs space-y-1">
                    <p className="font-medium text-[#F5F6FA] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.label} Priority</span>
                    </p>
                    <p className="text-[#9CA3B0] text-[11px]">
                      Active cases: <strong className="text-[#F5F6FA] tabular-nums">{item.count}</strong>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
            onClick={(entry: any) => {
              const bandKey = entry?.band || entry?.payload?.band;
              if (onSelectBand && bandKey) {
                onSelectBand(bandKey);
              }
            }}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={
                  selectedBand === 'all' || !selectedBand || selectedBand === entry.band
                    ? 1.0
                    : 0.25
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
