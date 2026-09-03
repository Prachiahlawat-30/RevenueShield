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
    <div className="space-y-4">
      {stages.map((item, idx) => {
        const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        const isFinal = idx === stages.length - 1;

        return (
          <div key={item.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#F5F6FA] text-xs">{item.stage}</span>
              <span className="font-semibold text-[#F5F6FA] text-xs tabular-nums">{item.count} cases</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFinal ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                }`}
                style={{
                  width: `${widthPct}%`,
                  opacity: isFinal ? 1.0 : 0.6 + (idx / stages.length) * 0.4,
                }}
              />
            </div>
            <p className="text-[11px] text-[#6B7280]">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
