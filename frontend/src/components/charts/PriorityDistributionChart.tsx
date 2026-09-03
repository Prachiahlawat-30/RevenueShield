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
    { key: 'CRITICAL', label: 'Critical', opacity: 1.0 },
    { key: 'HIGH', label: 'High', opacity: 0.75 },
    { key: 'MEDIUM', label: 'Medium', opacity: 0.5 },
    { key: 'LOW', label: 'Low', opacity: 0.28 },
  ];

  const chartData = bands.map((b) => ({
    band: b.key,
    label: b.label,
    count: data[b.key] || 0,
    opacity: b.opacity,
  }));

  const baseColor = isDark ? '#FFFFFF' : '#111827';

  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <XAxis
            dataKey="label"
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
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 backdrop-blur-xl p-2.5 shadow-glass-2 text-xs space-y-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.label} Priority</p>
                    <p className="font-mono text-slate-500 text-[11px]">
                      Count: <strong className="text-slate-900 dark:text-white">{item.count}</strong>
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
                fill={baseColor}
                opacity={
                  selectedBand === 'all' || !selectedBand || selectedBand === entry.band
                    ? entry.opacity
                    : 0.2
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
