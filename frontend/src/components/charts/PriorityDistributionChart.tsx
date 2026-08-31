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
    { key: 'CRITICAL', label: 'Critical', color: '#f43f5e' },
    { key: 'HIGH', label: 'High', color: '#f59e0b' },
    { key: 'MEDIUM', label: 'Medium', color: '#3b82f6' },
    { key: 'LOW', label: 'Low', color: '#64748b' },
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
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={10}
            tickLine={false}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
          />
          <YAxis
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={10}
            tickLine={false}
            allowDecimals={false}
            tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className={`p-2 rounded-fintech-sm shadow-md text-xs border ${
                    isDark ? 'bg-[#0f1420] border-[#263247] text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <p className="font-bold">{item.label} Priority</p>
                    <p className="font-mono text-fintech-muted">
                      Count: <strong className="text-fintech-primary">{item.count}</strong>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
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
                opacity={selectedBand === 'all' || selectedBand === entry.band ? 1 : 0.35}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
