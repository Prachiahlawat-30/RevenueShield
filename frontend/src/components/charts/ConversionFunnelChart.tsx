import React from 'react';

interface FunnelStage {
  stage: string;
  count: number;
  description: string;
}

interface ConversionFunnelChartProps {
  stages: FunnelStage[];
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ stages }) => {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  const colors = [
    'bg-gradient-to-r from-indigo-500 to-indigo-400',
    'bg-gradient-to-r from-purple-500 to-purple-400',
    'bg-gradient-to-r from-cyan-500 to-cyan-400',
    'bg-gradient-to-r from-emerald-500 to-emerald-400',
    'bg-gradient-to-r from-amber-500 to-amber-400',
  ];

  return (
    <div className="space-y-3.5">
      {stages.map((item, idx) => {
        const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        const barColor = colors[idx % colors.length];

        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono">{item.stage}</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">{item.count} cases</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-200/60 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor} transition-all duration-500`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
