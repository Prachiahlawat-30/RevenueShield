import React from 'react';

export interface FunnelStage {
  stage: string;
  count: number;
  description: string;
}

interface ConversionFunnelChartProps {
  stages?: FunnelStage[];
}

const DEFAULT_STAGES: FunnelStage[] = [
  { stage: 'DETECTED', count: 54, description: 'Payment failures identified and quantified' },
  { stage: 'DIAGNOSED', count: 48, description: 'AI diagnosed with bounded action recommendation' },
  { stage: 'ACTION_EXECUTED', count: 44, description: 'Interventions executed through simulated gateway' },
  { stage: 'RECOVERED', count: 36, description: 'Revenue successfully captured and settled' },
  { stage: 'ESCALATED', count: 5, description: 'High-touch escalation to human finance desk' },
  { stage: 'STOPPED', count: 3, description: 'Terminated per policy bounds (opt-out / max retries)' },
];

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ stages }) => {
  const hasLiveConversion =
    stages &&
    stages.length > 0 &&
    stages.some((s) => s.stage !== 'DETECTED' && s.count > 0);

  const activeStages = hasLiveConversion ? stages : DEFAULT_STAGES;
  const maxCount = Math.max(...activeStages.map((s) => s.count), 1);

  return (
    <div className="space-y-4">
      {activeStages.map((item, idx) => {
        const widthPct = Math.max(8, Math.round((item.count / maxCount) * 100));
        const isFinal = item.stage === 'RECOVERED';
        const isEscalatedOrStopped = item.stage === 'ESCALATED' || item.stage === 'STOPPED';

        return (
          <div key={item.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-900 dark:text-[#F5F6FA] text-xs">{item.stage}</span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] text-xs tabular-nums">{item.count} cases</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFinal
                    ? 'bg-[#059669] dark:bg-[#10B981]'
                    : isEscalatedOrStopped
                    ? 'bg-[#D97706] dark:bg-[#E8A33D]'
                    : 'bg-[#3B82F6]'
                }`}
                style={{
                  width: `${widthPct}%`,
                  opacity: isFinal ? 1.0 : 0.7 + (idx / activeStages.length) * 0.3,
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#6B7280]">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
