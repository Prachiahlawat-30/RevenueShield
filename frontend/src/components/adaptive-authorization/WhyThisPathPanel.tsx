import React from 'react';
import { CheckCircle2, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { WhyThisPathFactor } from '../../types';

interface Props {
  factors: WhyThisPathFactor[];
}

export const WhyThisPathPanel: React.FC<Props> = ({ factors }) => {
  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3">
      <div className="flex items-center justify-between border-b border-fintech-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-fintech-primary">Why Did RecoverAI Choose This Path?</h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-fintech-surface-subtle text-fintech-muted border border-fintech-border font-semibold">
          Decision Telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {factors.map((f, idx) => {
          const isPos = f.impact === 'POSITIVE';
          const isWarn = f.impact === 'WARNING';

          return (
            <div
              key={idx}
              className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-fintech-primary">{f.factor}</span>
                  {isPos && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Optimal
                    </span>
                  )}
                  {isWarn && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      <AlertTriangle className="w-3 h-3" /> Policy Rule
                    </span>
                  )}
                  {!isPos && !isWarn && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-fintech-muted">
                      <Info className="w-3 h-3" /> Neutral
                    </span>
                  )}
                </div>
                <p className="text-xs text-fintech-secondary leading-relaxed mt-1">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
