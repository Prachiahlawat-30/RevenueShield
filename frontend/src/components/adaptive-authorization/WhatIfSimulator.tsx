import React, { useState, useEffect } from 'react';
import { Sliders, TrendingUp, TrendingDown } from 'lucide-react';
import { WhatIfSimulationResponse } from '../../types';
import { simulateWhatIfScenario } from '../../api/authorization';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  initialAmount?: number;
}

export const WhatIfSimulator: React.FC<Props> = ({ initialAmount = 84000 }) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [gateway, setGateway] = useState<string>('Gateway B (Enterprise Direct)');
  const [authentication, setAuthentication] = useState<string>('FRICTIONLESS_3DS');
  const [tokenStrategy, setTokenStrategy] = useState<string>('NETWORK_TOKEN_SIMULATED');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

  const [simResult, setSimResult] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const res = await simulateWhatIfScenario({
        amount,
        selected_gateway: gateway,
        selected_authentication: authentication,
        selected_token_strategy: tokenStrategy,
        customer_risk_level: riskLevel,
      });
      setSimResult(res);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [amount, gateway, authentication, tokenStrategy, riskLevel]);

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex items-center justify-between border-b border-fintech-border pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-fintech-primary">"What If?" Pre-Authorization Simulator</h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/30 font-bold">
          Interactive Sandbox
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive Controls */}
        <div className="space-y-3 bg-fintech-surface-subtle p-4 rounded-fintech-md border border-fintech-border text-xs">
          {/* Amount Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-fintech-primary">Transaction Amount</label>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(amount)}</span>
            </div>
            <input
              type="range"
              min={500}
              max={250000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
          </div>

          {/* Gateway Selector */}
          <div>
            <label className="font-semibold text-fintech-primary block mb-1">Select Gateway Candidate</label>
            <select
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
              className="w-full rounded-fintech-sm border border-fintech-border bg-fintech-surface px-3 py-1.5 text-xs text-fintech-primary focus:border-brand-500 focus:outline-none"
            >
              <option value="Gateway B (Enterprise Direct)">Gateway B (97.1% Auth, 410ms Latency)</option>
              <option value="Gateway A (Primary Global)">Gateway A (78.1% Auth, 680ms Latency - DEGRADED)</option>
              <option value="Gateway C (Regional Fallback)">Gateway C (94.2% Auth, 520ms Latency)</option>
            </select>
          </div>

          {/* Authentication Selector */}
          <div>
            <label className="font-semibold text-fintech-primary block mb-1">Select Authentication Path</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'NO_3DS', label: 'No 3DS' },
                { id: 'FRICTIONLESS_3DS', label: 'Frictionless 3DS' },
                { id: 'CHALLENGE_3DS', label: 'Challenge OTP' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAuthentication(opt.id)}
                  className={`p-2 rounded-fintech-sm border text-center font-semibold transition-all ${
                    authentication === opt.id
                      ? 'border-brand-500 bg-brand-500 text-white shadow-fintech-sm'
                      : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Token Strategy Selector */}
          <div>
            <label className="font-semibold text-fintech-primary block mb-1">Select Token Strategy</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'NETWORK_TOKEN_SIMULATED', label: 'Network Token (+3.5% Auth)' },
                { id: 'STANDARD_CREDENTIAL', label: 'Standard Credential' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTokenStrategy(opt.id)}
                  className={`p-2 rounded-fintech-sm border text-center font-semibold transition-all ${
                    tokenStrategy === opt.id
                      ? 'border-purple-500 bg-purple-500 text-white shadow-fintech-sm'
                      : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Level Selector */}
          <div>
            <label className="font-semibold text-fintech-primary block mb-1">Customer Risk Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskLevel(r)}
                  className={`py-1.5 px-2 rounded-fintech-sm border text-center font-semibold transition-all ${
                    riskLevel === r
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-bold'
                      : 'border-fintech-border bg-fintech-surface text-fintech-muted hover:text-fintech-primary'
                  }`}
                >
                  {r} RISK
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Real-Time Computed Outcome */}
        {simResult ? (
          <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface p-4 flex flex-col justify-between space-y-4 shadow-fintech-sm">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-mono text-fintech-muted font-bold">
                  Simulated Strategy Outcome
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fintech-surface-subtle border border-fintech-border text-fintech-secondary">
                  Friction: {simResult.customer_friction_label} ({simResult.customer_friction_score})
                </span>
              </div>

              {/* Expected Net Revenue Big Metric */}
              <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border mb-3">
                <span className="text-[10px] uppercase font-semibold text-fintech-muted block">
                  Simulated Expected Net Revenue
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-mono font-black text-fintech-primary">
                    {formatCurrency(simResult.expected_net_revenue)}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      simResult.delta_vs_recommended >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {simResult.delta_vs_recommended >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {simResult.delta_vs_recommended >= 0 ? '+' : ''}
                    {formatCurrency(simResult.delta_vs_recommended)} vs Optimal
                  </span>
                </div>
              </div>

              {/* Probabilities preview */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                  <span className="text-[10px] text-fintech-muted block">Authorization Prob</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {(simResult.authorization_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-2 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                  <span className="text-[10px] text-fintech-muted block">Conversion Prob</span>
                  <span className="font-mono font-bold text-sky-600 dark:text-cyan-400">
                    {(simResult.conversion_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-fintech-secondary mt-3 leading-relaxed">
                {simResult.comparison_summary}
              </p>
            </div>

            <div className="pt-2 border-t border-fintech-border text-[10px] text-fintech-muted italic">
              {simResult.simulation_disclaimer}
            </div>
          </div>
        ) : (
          <div className="rounded-fintech-md border border-dashed border-fintech-border bg-fintech-surface-subtle p-8 text-center text-fintech-muted text-xs flex items-center justify-center">
            Adjust parameters to calculate real-time authorization tradeoff estimates.
          </div>
        )}
      </div>
    </div>
  );
};
