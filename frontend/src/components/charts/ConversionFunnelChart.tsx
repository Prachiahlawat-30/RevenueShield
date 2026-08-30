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

  const barFills: Record<string, string> = {
    DETECTED: 'bg-amber-500',
    DIAGNOSED: 'bg-indigo-500',
    ACTION_EXECUTED: 'bg-purple-500',
    RECOVERED: 'bg-emerald-500',
    ESCALATED: 'bg-purple-500',
    STOPPED: 'bg-rose-500',
  };

  return (
    <div className="space-y-3">
      {stages.map((item) => {
        const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        const fillClass = barFills[item.stage] || 'bg-brand-500';

        return (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-fintech-secondary">{item.stage}</span>
              <span className="font-bold text-fintech-primary font-mono">{item.count} cases</span>
            </div>
            <div className="relative h-5 w-full rounded-fintech-sm bg-fintech-surface-subtle p-0.5 border border-fintech-border">
              <div
                className={`h-full rounded-fintech-sm transition-all duration-500 flex items-center px-2 text-[10px] font-bold text-white ${fillClass}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <p className="text-[10px] text-fintech-muted">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
