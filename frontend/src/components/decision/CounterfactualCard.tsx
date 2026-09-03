import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Scale } from 'lucide-react';
import { getCounterfactualAnalysis } from '../../api/tier3';
import { CounterfactualAnalysisResponse } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CounterfactualCardProps {
  riskId: string;
}

export const CounterfactualCard: React.FC<CounterfactualCardProps> = ({ riskId }) => {
  const [data, setData] = useState<CounterfactualAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getCounterfactualAnalysis(riskId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error('Failed to load counterfactual analysis:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [riskId]);

  if (loading || !data) {
    return (
      <div className="p-4 rounded-fintech-lg bg-fintech-surface-subtle border border-fintech-border text-xs text-fintech-muted animate-pulse">
        Simulating counterfactual alternative path yields...
      </div>
    );
  }

  return (
    <div className="p-5 rounded-fintech-lg border border-brand-500/30 bg-brand-500/5 shadow-fintech-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 font-mono">
            Counterfactual Outcome Simulation
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/30 font-bold">
          Net Protected: +{formatCurrency(data.net_revenue_protected)}
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Without RevenueShield */}
        <div className="p-3.5 rounded-fintech-md bg-fintech-surface border border-rose-500/30 space-y-1 shadow-fintech-sm">
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase font-mono">
            Without RevenueShield (Standard Fallback)
          </span>
          <p className="font-mono text-sm font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(data.without_recoverai_expected_loss)} Loss
          </p>
          <p className="text-[11px] text-fintech-muted">Blind retries / customer churn outcome</p>
        </div>

        {/* With RevenueShield */}
        <div className="p-3.5 rounded-fintech-md bg-fintech-surface border border-emerald-500/30 space-y-1 shadow-fintech-sm">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase font-mono">
            With RevenueShield (Executed Policy)
          </span>
          <p className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(data.with_recoverai_recovered)} Recovered
          </p>
          <p className="text-[11px] text-fintech-muted">Policy-approved timing & channel recovery</p>
        </div>
      </div>

      {/* Strategy Comparison Breakdown */}
      <div className="p-3 rounded-fintech-md bg-fintech-surface border border-fintech-border space-y-2 text-xs shadow-fintech-sm">
        <span className="text-[10px] font-bold text-fintech-muted uppercase block font-mono">
          Alternative Strategy Yield Projections
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
            <span className="text-[10px] text-fintech-muted block">{data.strategy_comparison_a_name}</span>
            <span className="font-mono text-fintech-primary font-bold block mt-1">
              {formatCurrency(data.strategy_comparison_a_expected_recovery)}
            </span>
          </div>

          <div className="p-2.5 rounded-fintech-sm bg-brand-500/10 border border-brand-500/20">
            <span className="text-[10px] text-brand-700 dark:text-brand-300 block font-semibold">{data.strategy_comparison_b_name}</span>
            <span className="font-mono text-brand-700 dark:text-brand-300 font-black block mt-1">
              {formatCurrency(data.strategy_comparison_b_expected_recovery)}
            </span>
          </div>
        </div>

        <p className="text-xs text-fintech-secondary italic leading-relaxed pt-1">
          "{data.counterfactual_disclaimer}"
        </p>
      </div>
    </div>
  );
};
