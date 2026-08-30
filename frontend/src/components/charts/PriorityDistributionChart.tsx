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
}

export const PriorityDistributionChart: React.FC<Props> = ({
  data,
  selectedBand,
  onSelectBand,
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
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="label"
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke={isDark ? '#64748b' : '#94a3b8'}
            fontSize={11}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className={`p-2.5 rounded-fintech-md shadow-xl text-xs border ${
                    isDark ? 'bg-[#0f1420] border-[#263247] text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <p className="font-bold">{item.label} Priority</p>
                    <p className="text-fintech-muted mt-0.5">
                      Opportunities: <span className="font-bold font-mono text-fintech-primary">{item.count}</span>
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
            onClick={(entry: any) => onSelectBand && onSelectBand(entry.band || entry.payload?.band)}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                opacity={selectedBand && selectedBand !== entry.band ? 0.35 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
