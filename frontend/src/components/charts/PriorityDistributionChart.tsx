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
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();

  const bands = [
    { key: 'CRITICAL', label: 'Critical', color: '#EF4444' },
    { key: 'HIGH', label: 'High', color: '#F59E0B' },
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
            stroke={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)'}
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)'}
            fontSize={10}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-xl p-2.5 shadow-glass-3 text-xs space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.label} Priority</span>
                    </p>
                    <p className="font-mono text-slate-500 text-[11px]">
                      Active cases: <strong className="text-slate-900 dark:text-white">{item.count}</strong>
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
            maxBarSize={24}
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
                    : 0.3
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
