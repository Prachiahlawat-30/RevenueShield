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

  return (
    <div className="space-y-3">
      {stages.map((item, idx) => {
        const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        const opacity = 0.4 + (idx / Math.max(stages.length - 1, 1)) * 0.6;

        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] font-mono">{item.stage}</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">{item.count} cases</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-200/60 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 dark:bg-white transition-all duration-500"
                style={{ width: `${widthPct}%`, opacity }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
