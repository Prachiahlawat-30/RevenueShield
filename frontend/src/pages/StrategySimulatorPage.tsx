import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { runStrategySimulation } from '../api/tier2';
import { StrategySimulationResponse, StrategySimulationRequest } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const StrategySimulatorPage: React.FC = () => {
  const [params, setParams] = useState<StrategySimulationRequest>({
    simulated_max_attempts: 2,
    simulated_cooldown_hours: 12,
    simulated_high_value_threshold: 1500,
    simulated_retry_delay_hours: 12,
    simulated_preferred_strategy: 'balanced_dunning',
  });

  const [result, setResult] = useState<StrategySimulationResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      const res = await runStrategySimulation(params);
      setResult(res);
    } catch (err: any) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">What-If Strategy Simulator</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30 font-mono">
              Zero-Mutation Sandbox
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Simulate policy threshold changes, retry windows, and escalation limits on live portfolio datasets
          </p>
        </div>
      </div>

      {/* Simulator Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Sliders */}
        <div className="lg:col-span-5 p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-fintech-border pb-4">
            <Sliders className="w-5 h-5 text-brand-500" />
            <h2 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">Tuning Parameters</h2>
          </div>

          <div className="space-y-5">
            {/* Max Attempts Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-fintech-secondary font-medium">Max Automated Attempts</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{params.simulated_max_attempts} attempts</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={params.simulated_max_attempts}
                onChange={(e) => setParams({ ...params, simulated_max_attempts: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-fintech-muted font-mono">
                <span>1 (Conservative)</span>
                <span>3 (Default)</span>
                <span>5 (Aggressive)</span>
              </div>
            </div>

            {/* Cooldown Hours Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-fintech-secondary font-medium">Intervention Cooldown Window</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{params.simulated_cooldown_hours} hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="48"
                step="1"
                value={params.simulated_cooldown_hours}
                onChange={(e) => setParams({ ...params, simulated_cooldown_hours: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-fintech-muted font-mono">
                <span>1h (Rapid)</span>
                <span>24h (Standard)</span>
                <span>48h (Extended)</span>
              </div>
            </div>

            {/* High-Value Escalation Threshold Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-fintech-secondary font-medium">High-Value Escalation Threshold</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">${params.simulated_high_value_threshold}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={params.simulated_high_value_threshold}
                onChange={(e) => setParams({ ...params, simulated_high_value_threshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-fintech-muted font-mono">
                <span>$500</span>
                <span>$1,000 (Current)</span>
                <span>$3,000</span>
              </div>
            </div>

            {/* Action Strategy Selector */}
            <div className="space-y-2">
              <label className="text-xs text-fintech-secondary font-medium block">Preferred Strategy Profile</label>
              <select
                value={params.simulated_preferred_strategy}
                onChange={(e) => setParams({ ...params, simulated_preferred_strategy: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-fintech-primary focus:outline-none focus:border-brand-500"
              >
                <option value="balanced_dunning">Balanced Intelligent Dunning (Recommended)</option>
                <option value="rapid_retry">Aggressive Gateway Instant Retry</option>
                <option value="customer_first">Customer First (Soft Reminders Only)</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Play}
              isLoading={simulating}
              onClick={handleSimulate}
              className="w-full"
            >
              Run What-If Simulation
            </Button>
          </div>
        </div>

        {/* Right Column: Comparative Impact Projections */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Summary delta alert */}
              <div className="p-5 rounded-fintech-lg bg-brand-500/5 border border-brand-500/30 shadow-fintech-sm space-y-2">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Simulation Insight</span>
                </div>
                <p className="text-xs text-fintech-primary leading-relaxed font-medium">
                  {result.summary_analysis}
                </p>
              </div>

              {/* Side-by-side table */}
              <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-fintech-border text-fintech-muted">
                      <th className="pb-3 uppercase font-semibold tracking-wider">Metric</th>
                      <th className="pb-3 uppercase font-semibold tracking-wider text-right">Current Policy</th>
                      <th className="pb-3 uppercase font-semibold tracking-wider text-right text-brand-600 dark:text-brand-400">Simulated Policy</th>
                      <th className="pb-3 uppercase font-semibold tracking-wider text-right">Projected Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fintech-border font-mono text-fintech-secondary">
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Revenue At Risk</td>
                      <td className="py-3 text-right text-fintech-primary">{formatCurrency(result.current.revenue_at_risk)}</td>
                      <td className="py-3 text-right text-fintech-primary">{formatCurrency(result.simulated.revenue_at_risk)}</td>
                      <td className="py-3 text-right text-fintech-muted">—</td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Expected Recovery</td>
                      <td className="py-3 text-right text-fintech-primary">{formatCurrency(result.current.expected_recovery)}</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(result.simulated.expected_recovery)}</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        {Number(result.difference_expected_recovery) >= 0 ? '+' : ''}
                        {formatCurrency(result.difference_expected_recovery)}
                      </td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Recovery Rate</td>
                      <td className="py-3 text-right text-fintech-primary">{formatPercent(result.current.recovery_rate * 100)}</td>
                      <td className="py-3 text-right text-brand-600 dark:text-brand-400 font-bold">{formatPercent(result.simulated.recovery_rate * 100)}</td>
                      <td className="py-3 text-right text-brand-600 dark:text-brand-400 font-bold">
                        {result.difference_recovery_rate >= 0 ? '+' : ''}
                        {result.difference_recovery_rate}%
                      </td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Total Interventions</td>
                      <td className="py-3 text-right text-fintech-primary">{result.current.interventions_count}</td>
                      <td className="py-3 text-right text-fintech-primary">{result.simulated.interventions_count}</td>
                      <td className="py-3 text-right text-fintech-muted">
                        {result.difference_interventions >= 0 ? '+' : ''}
                        {result.difference_interventions}
                      </td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Human Escalations</td>
                      <td className="py-3 text-right text-fintech-primary">{result.current.escalations_count}</td>
                      <td className="py-3 text-right text-fintech-primary">{result.simulated.escalations_count}</td>
                      <td className="py-3 text-right text-fintech-muted">
                        {result.difference_escalations >= 0 ? '+' : ''}
                        {result.difference_escalations}
                      </td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle">
                      <td className="py-3 font-sans font-medium text-fintech-primary">Customer Contacts</td>
                      <td className="py-3 text-right text-fintech-primary">{result.current.customer_contacts_count}</td>
                      <td className="py-3 text-right text-fintech-primary">{result.simulated.customer_contacts_count}</td>
                      <td className="py-3 text-right text-fintech-muted">
                        {result.simulated.customer_contacts_count - result.current.customer_contacts_count >= 0 ? '+' : ''}
                        {result.simulated.customer_contacts_count - result.current.customer_contacts_count}
                      </td>
                    </tr>
                    <tr className="hover:bg-fintech-surface-subtle font-bold">
                      <td className="py-3 font-sans text-fintech-primary">Net Recovered Revenue</td>
                      <td className="py-3 text-right text-fintech-primary">{formatCurrency(result.current.net_recovered_revenue)}</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(result.simulated.net_recovered_revenue)}</td>
                      <td className="py-3 text-right text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(Number(result.simulated.net_recovered_revenue) - Number(result.current.net_recovered_revenue))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-fintech-muted bg-fintech-surface rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
              Adjust parameters on the left and click <strong>"Run What-If Simulation"</strong> to project macro financial yields.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
