import React, { useState } from 'react';
import {
  Scale,
  Play,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { evaluatePolicyPlayground } from '../api/tier2';
import { PolicyPlaygroundRequest, PolicyPlaygroundResponse } from '../types';
import { Button } from '../components/ui/Button';

export const PolicyPlaygroundPage: React.FC = () => {
  const [params, setParams] = useState<PolicyPlaygroundRequest>({
    amount: 1250,
    failure_type: 'temporary_decline',
    attempt_count: 0,
    is_customer_opted_out: false,
    hours_since_last_attempt: 25,
    customer_segment: 'FAST_RECOVERY',
    card_expiry: '12/28',
  });

  const [response, setResponse] = useState<PolicyPlaygroundResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const res = await evaluatePolicyPlayground(params);
      setResponse(res);
    } catch (err: any) {
      console.error('Policy evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">Policy Engine Playground</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30 font-mono">
              Interactive Rule Sandbox
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Test arbitrary transaction failure parameters directly against the authoritative deterministic PolicyEngine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Synthetic Input Controls */}
        <div className="lg:col-span-5 p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-fintech-border pb-4">
            <Scale className="w-5 h-5 text-brand-500" />
            <h2 className="text-xs font-bold text-fintech-primary uppercase tracking-wider font-mono">Test Scenario Input</h2>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs text-fintech-secondary font-medium block">Transaction Amount ($)</label>
              <input
                type="number"
                value={params.amount}
                onChange={(e) => setParams({ ...params, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-sm bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-fintech-primary font-mono focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-fintech-muted">Hint: Try $1,500 to test the high-value escalation rule.</span>
            </div>

            {/* Failure Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-fintech-secondary font-medium block">Detected Failure Type</label>
              <select
                value={params.failure_type}
                onChange={(e) => setParams({ ...params, failure_type: e.target.value as any })}
                className="w-full px-3.5 py-2.5 text-xs bg-fintech-surface-subtle border border-fintech-border rounded-fintech-md text-fintech-primary focus:outline-none focus:border-brand-500"
              >
                <option value="temporary_decline">Temporary Bank Decline</option>
                <option value="insufficient_funds">Insufficient Funds</option>
                <option value="expired_card">Expired Card</option>
                <option value="network_error">Gateway Network Timeout</option>
                <option value="unknown_failure">Unknown Failure Code</option>
              </select>
            </div>

            {/* Past Attempts */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-fintech-secondary font-medium">Previous Attempt Count</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{params.attempt_count} attempts</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={params.attempt_count}
                onChange={(e) => setParams({ ...params, attempt_count: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <span className="text-[10px] text-fintech-muted">Hint: Setting 3+ attempts tests the Max Attempts rule.</span>
            </div>

            {/* Hours Since Last Attempt */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-fintech-secondary font-medium">Elapsed Hours Since Last Attempt</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{params.hours_since_last_attempt}h</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                step="1"
                value={params.hours_since_last_attempt}
                onChange={(e) => setParams({ ...params, hours_since_last_attempt: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <span className="text-[10px] text-fintech-muted">Hint: &lt; 24h triggers the Cooldown enforcement rule.</span>
            </div>

            {/* Opt-out switch */}
            <div className="flex items-center justify-between p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
              <div>
                <span className="text-xs font-semibold text-fintech-primary block">Customer Opt-Out Status</span>
                <span className="text-[10px] text-fintech-muted">Exclude from automated recovery</span>
              </div>
              <input
                type="checkbox"
                checked={params.is_customer_opted_out}
                onChange={(e) => setParams({ ...params, is_customer_opted_out: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 bg-fintech-surface border-fintech-border"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Play}
              isLoading={evaluating}
              onClick={handleEvaluate}
              className="w-full"
            >
              Evaluate Policy Rules
            </Button>
          </div>
        </div>

        {/* Right Column: Live Policy Engine Decision Output */}
        <div className="lg:col-span-7 space-y-6">
          {response ? (
            <div className="space-y-6">
              {/* Decision Hero Card */}
              <div
                className={`p-6 rounded-fintech-lg border space-y-4 shadow-fintech-sm ${
                  response.policy_evaluation.is_approved
                    ? 'bg-emerald-500/5 border-emerald-500/40'
                    : 'bg-rose-500/5 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {response.policy_evaluation.is_approved ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertOctagon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
                        Authoritative Policy Decision
                      </span>
                      <h3 className="text-xl font-bold text-fintech-primary">
                        {response.policy_evaluation.is_approved ? 'APPROVED' : (response.policy_evaluation.rejection_reason || 'BLOCKED')}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-fintech-md uppercase font-mono ${
                      response.policy_evaluation.is_approved
                        ? 'bg-emerald-500 text-white shadow-fintech-sm'
                        : 'bg-rose-500 text-white shadow-fintech-sm'
                    }`}
                  >
                    Effective: {response.final_action_label}
                  </span>
                </div>

                <p className="text-xs text-fintech-secondary leading-relaxed font-medium bg-fintech-surface p-3.5 rounded-fintech-md border border-fintech-border">
                  {response.reasoning}
                </p>
              </div>

              {/* Policy Rule Checklist */}
              <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-fintech-muted font-mono">
                  Deterministic Policy Rule Evaluation
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                    <span className="text-xs font-medium text-fintech-secondary">Customer Opt-Out Rule (`RULE_OPT_OUT_STOP`)</span>
                    {params.is_customer_opted_out ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono">
                        <XCircle className="w-4 h-4" /> BLOCKED
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> PASSED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                    <span className="text-xs font-medium text-fintech-secondary">Attempt Count Limit (`RULE_MAX_ATTEMPTS`)</span>
                    {params.attempt_count >= 3 ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono">
                        <XCircle className="w-4 h-4" /> BLOCKED
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> PASSED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                    <span className="text-xs font-medium text-fintech-secondary">Cooldown Enforcement (`RULE_COOLDOWN`)</span>
                    {params.hours_since_last_attempt < 24 && params.attempt_count > 0 ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 font-mono">
                        <XCircle className="w-4 h-4" /> BLOCKED (Cooldown Active)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> PASSED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
                    <span className="text-xs font-medium text-fintech-secondary">High-Value Threshold (`RULE_HIGH_VALUE_THRESHOLD`)</span>
                    {params.amount > 1000 ? (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                        <AlertOctagon className="w-4 h-4" /> ESCALATE TO HUMAN
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-4 h-4" /> PASSED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-fintech-muted bg-fintech-surface rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
              Select scenario inputs on the left and click <strong>"Evaluate Policy Rules"</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
