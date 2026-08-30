import React from 'react';
import { Activity } from 'lucide-react';
import { PolicyPerformanceOverview, AttemptEfficiencyMetric } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  overview: PolicyPerformanceOverview;
}

export const PolicyPerformanceCard: React.FC<Props> = ({ overview }) => {
  const current = overview.current_policy;

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            <h2 className="text-base font-bold text-fintech-primary">
              Current Active Policy Configuration (Deterministic)
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
              v{current.version}.0 LIVE
            </span>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            {current.name} • Deterministic enforcement rules evaluated against historical recovery telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-fintech-muted font-mono">
            Policy Score: <strong className="text-fintech-primary">{overview.policy_performance_score}/100</strong>
          </span>
        </div>
      </div>

      {/* 4 Policy Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1">
          <span className="text-[10px] text-fintech-muted uppercase font-bold font-mono">Max Attempts</span>
          <p className="font-mono text-base font-black text-fintech-primary">{current.max_attempts} attempts</p>
        </div>

        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1">
          <span className="text-[10px] text-fintech-muted uppercase font-bold font-mono">Cooldown Window</span>
          <p className="font-mono text-base font-black text-fintech-primary">{current.cooldown_hours} hours</p>
        </div>

        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1">
          <span className="text-[10px] text-fintech-muted uppercase font-bold font-mono">High-Value Threshold</span>
          <p className="font-mono text-base font-black text-fintech-primary">${current.high_value_threshold}</p>
        </div>
      </div>

      {/* Attempt Efficiency Decay Curve */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">
            Attempt Efficiency Decay (Yield vs Friction)
          </span>
          <span className="text-[10px] text-fintech-muted font-mono">Diminishing returns per additional retry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {overview.attempts_breakdown.map((att: AttemptEfficiencyMetric) => {
            const isViable = att.is_economically_viable;

            return (
              <div
                key={att.attempt_number}
                className={`p-3 rounded-fintech-md border transition-all flex flex-col justify-between ${
                  isViable
                    ? 'border-fintech-border bg-fintech-surface-subtle'
                    : 'border-rose-500/30 bg-rose-500/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-fintech-primary">
                      Attempt #{att.attempt_number}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                        isViable
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isViable ? 'VIABLE' : 'UNECONOMIC'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] my-2">
                    <div>
                      <span className="text-fintech-muted block text-[10px]">Recovery Rate</span>
                      <span className="font-mono font-bold text-fintech-primary">
                        {(att.recovery_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-fintech-muted block text-[10px]">Incremental</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{(att.incremental_recovery_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                  Volume: {att.total_attempts} attempts • Cost: {formatCurrency(att.intervention_cost)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
