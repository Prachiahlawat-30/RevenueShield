import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { DecisionFactor, DecisionGraphNode } from '../../types';

interface Props {
  factors?: DecisionFactor[];
  node?: DecisionGraphNode;
}

export const DecisionFactorPanel: React.FC<Props> = ({ factors, node }) => {
  const displayFactors: DecisionFactor[] = factors || [
    {
      category: 'governance',
      factor: node?.label || 'Decision Invariant',
      impact: node?.status === 'BLOCK' ? 'negative' : 'positive',
      value: node?.data?.value || '100% Policy Bound',
      explanation: node?.tooltip || 'Deterministic boundary condition verified by policy engine.',
      weight: 0.95,
      tag: 'INVARIANT',
    },
  ];

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm space-y-3">
      <div className="flex items-center justify-between border-b border-fintech-border pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-fintech-primary">Decision Factors & Weights</h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-fintech-surface-subtle text-fintech-muted border border-fintech-border font-semibold">
          Explanatory Factors
        </span>
      </div>

      <div className="space-y-2">
        {displayFactors.map((f, i) => {
          const isPos = f.impact === 'positive';
          const isNeg = f.impact === 'negative';
          const weightPct = Math.round(f.weight * 100);

          return (
            <div
              key={i}
              className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted font-mono">
                    {f.category.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1">
                    {isPos && (
                      <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 gap-0.5">
                        <TrendingUp className="w-3 h-3" /> Positive
                      </span>
                    )}
                    {isNeg && (
                      <span className="flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Negative
                      </span>
                    )}
                    {!isPos && !isNeg && (
                      <span className="flex items-center text-[10px] font-bold text-fintech-muted gap-0.5">
                        <Minus className="w-3 h-3" /> Neutral
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <h4 className="text-xs font-bold text-fintech-primary">{f.factor}</h4>
                  <span className="font-mono text-xs text-fintech-secondary font-semibold">{String(f.value)}</span>
                </div>

                <p className="text-[11px] text-fintech-secondary mt-1 leading-relaxed">
                  {f.explanation}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-fintech-border flex items-center justify-between text-[10px] text-fintech-muted font-mono">
                <span>Influence Weight</span>
                <span className="font-bold text-fintech-primary">{weightPct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
