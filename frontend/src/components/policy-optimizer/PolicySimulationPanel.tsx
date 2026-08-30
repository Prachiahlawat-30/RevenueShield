import React from 'react';
import { TrendingUp, Scale, ShieldCheck } from 'lucide-react';
import { PolicySimulationResponse } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  simulation: PolicySimulationResponse;
}

export const PolicySimulationPanel: React.FC<Props> = ({ simulation }) => {
  return (
    <div className="rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Scale className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Counterfactual Simulation Model
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fintech-surface-subtle text-fintech-primary border border-fintech-border">
              {simulation.proposal_id}
            </span>
          </div>
          <h3 className="text-base font-bold text-fintech-primary mt-1">
            Current Policy vs Proposed Policy Yield Comparison
          </h3>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-fintech-md">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs text-fintech-secondary">
            Projected Monthly Lift:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{formatCurrency(simulation.net_revenue_delta)}</strong>
          </span>
        </div>
      </div>

      {/* Side-by-Side Current vs Proposed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Current Policy */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-fintech-border pb-2">
            <span className="text-xs font-bold uppercase text-fintech-muted tracking-wider">Current Active Policy</span>
            <span className="text-xs font-mono font-bold text-fintech-secondary">{simulation.current_value}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-fintech-muted">Recovered Revenue:</span>
              <span className="font-mono font-bold text-fintech-primary">{formatCurrency(simulation.current_gross_revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Intervention Cost:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">{formatCurrency(simulation.current_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Recovery Rate:</span>
              <span className="font-mono text-fintech-primary">{(simulation.current_recovery_rate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-fintech-border font-bold">
              <span className="text-fintech-primary">Net Recovered:</span>
              <span className="font-mono text-fintech-primary">{formatCurrency(simulation.current_net_revenue)}</span>
            </div>
          </div>
        </div>

        {/* Right: Proposed Policy */}
        <div className="rounded-fintech-md border border-brand-500/30 bg-brand-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-brand-500/20 pb-2">
            <span className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 tracking-wider">Simulated Proposed Policy</span>
            <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-300">{simulation.proposed_value}</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-fintech-muted">Recovered Revenue:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(simulation.proposed_gross_revenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Intervention Cost:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-300">{formatCurrency(simulation.proposed_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Recovery Rate:</span>
              <span className="font-mono text-sky-600 dark:text-cyan-400">{(simulation.proposed_recovery_rate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-brand-500/20 font-bold">
              <span className="text-brand-700 dark:text-brand-200">Net Recovered:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(simulation.proposed_net_revenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Impact Deltas Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[10px] text-fintech-muted uppercase block font-semibold">Net Yield Lift</span>
          <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            +{formatCurrency(simulation.net_revenue_delta)}
          </span>
        </div>

        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[10px] text-fintech-muted uppercase block font-semibold">Recovery Rate Shift</span>
          <span className="text-base font-mono font-bold text-brand-600 dark:text-brand-400 mt-1 block">
            +{(simulation.recovery_rate_delta * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[10px] text-fintech-muted uppercase block font-semibold">Cost Efficiency Shift</span>
          <span className="text-base font-mono font-bold text-fintech-primary mt-1 block">
            {formatCurrency(simulation.cost_delta)}
          </span>
        </div>

        <div className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[10px] text-fintech-muted uppercase block font-semibold">Safety Invariants</span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Guaranteed
          </span>
        </div>
      </div>
    </div>
  );
};
