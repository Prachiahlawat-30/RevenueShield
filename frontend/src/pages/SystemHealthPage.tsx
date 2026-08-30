import React, { useEffect, useState } from 'react';
import {
  Activity,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Scale,
  Bot,
} from 'lucide-react';
import {
  getSystemHealth,
  getSystemVersions,
  simulateChaos,
  evaluateAiVsRulesDemo,
} from '../api/tier3';
import {
  SystemHealthResponse,
  DecisionVersionConfigResponse,
  ChaosSimulationResultResponse,
  AiVsRulesEvaluationResponse,
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const SystemHealthPage: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [versionData, setVersionData] = useState<DecisionVersionConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Chaos simulation state
  const [chaosLoading, setChaosLoading] = useState(false);
  const [chaosResult, setChaosResult] = useState<ChaosSimulationResultResponse | null>(null);

  // AI vs Rules Demo state
  const [amount, setAmount] = useState<number>(2500.0);
  const [proposedAction, setProposedAction] = useState('retry_payment');
  const [confidence, setConfidence] = useState(84);
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [priorAttempts, setPriorAttempts] = useState(0);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<AiVsRulesEvaluationResponse | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const [h, v] = await Promise.all([getSystemHealth(), getSystemVersions()]);
      setHealthData(h);
      setVersionData(v);
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    handleEvaluateDemo(2500.0, 'retry_payment', 84, false, 0);
  }, []);

  const handleTriggerChaos = async (scenario: string) => {
    try {
      setChaosLoading(true);
      const res = await simulateChaos(scenario);
      setChaosResult(res);
    } catch (err) {
      console.error('Failed to execute chaos simulation', err);
    } finally {
      setChaosLoading(false);
    }
  };

  const handleEvaluateDemo = async (
    amt: number,
    action: string,
    conf: number,
    optOut: boolean,
    attempts: number
  ) => {
    try {
      setEvalLoading(true);
      const res = await evaluateAiVsRulesDemo({
        transaction_amount: amt,
        ai_proposed_action: action,
        ai_confidence_pct: conf,
        customer_opted_out: optOut,
        prior_attempts: attempts,
      });
      setEvalResult(res);
    } catch (err) {
      console.error('Failed to evaluate AI vs Rules demo', err);
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
            <Activity className="h-4 w-4" />
            <span>RESILIENCE & RESPONSIBLE AI</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            System Health & Resilience Console
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            Live subsystem health, deterministic fallback failover verification, controlled failure chaos testing, and AI-vs-Policy transparency gating.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchHealth}
        >
          Refresh Health
        </Button>
      </div>

      {/* Versioning & Architecture Governance Strip */}
      {versionData && (
        <div className="rounded-fintech-lg border border-brand-500/30 bg-brand-500/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-fintech-sm">
          <div className="flex items-center gap-3">
            <span className="rounded bg-brand-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-brand-700 dark:text-brand-300 border border-brand-500/20">
              DECISION VERSIONING
            </span>
            <span className="text-fintech-secondary font-mono">
              Intelligence: <strong className="text-fintech-primary">{versionData.recovery_intelligence_version}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-fintech-secondary font-mono">
              Policy: <strong className="text-fintech-primary">{versionData.policy_version}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-fintech-secondary font-mono">
              Strategy: <strong className="text-fintech-primary">{versionData.strategy_version}</strong>
            </span>
          </div>

          <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
            {versionData.governance_model}
          </span>
        </div>
      )}

      {/* 7 Subsystem Health Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthData?.components.map((comp, idx) => {
          const isOperational = comp.is_operational;
          return (
            <div
              key={idx}
              className={`rounded-fintech-lg border p-5 shadow-fintech-sm space-y-2.5 transition-all ${
                isOperational
                  ? 'border-fintech-border bg-fintech-surface'
                  : 'border-rose-500/30 bg-rose-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fintech-primary truncate">{comp.component_name}</span>
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-black uppercase font-mono border ${
                    comp.status === 'HEALTHY' || comp.status === 'OPERATIONAL' || comp.status === 'READY'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : comp.status === 'AVAILABLE'
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/30'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  ✓ {comp.status}
                </span>
              </div>

              <p className="text-[11px] text-fintech-secondary leading-relaxed min-h-[32px]">
                {comp.status_message}
              </p>

              <div className="flex items-center justify-between text-[10px] text-fintech-muted pt-2 border-t border-fintech-border font-mono">
                <span>Latency</span>
                <span className="text-fintech-primary font-bold">{comp.latency_ms}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature 34 & 35: AI vs Rules Transparency & "AI Cannot Override Policy" Live Demo */}
      <div className="rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300 border border-brand-500/30 uppercase tracking-wider font-mono">
                Responsible AI Architecture
              </span>
              <span className="text-[10px] font-mono text-fintech-muted">Deterministic Safety Gating</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-fintech-primary mt-1">
              "AI Cannot Override Policy" Interactive Demo
            </h2>
            <p className="text-xs text-fintech-secondary mt-1 max-w-3xl leading-relaxed">
              Verify in real-time that probabilistic AI recommendations cannot bypass deterministic PolicyEngine safety invariants (such as high-value escalation limits or opt-outs).
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold uppercase text-fintech-muted block mb-1 font-mono">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border px-3 py-2 text-fintech-primary font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-fintech-muted block mb-1 font-mono">
              AI Proposed Action
            </label>
            <select
              value={proposedAction}
              onChange={(e) => setProposedAction(e.target.value)}
              className="w-full rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border px-3 py-2 text-fintech-primary text-xs focus:border-brand-500 focus:outline-none"
            >
              <option value="retry_payment">retry_payment</option>
              <option value="send_payment_reminder">send_payment_reminder</option>
              <option value="request_payment_method_update">request_payment_method_update</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-fintech-muted block mb-1 font-mono">
              AI Confidence ({confidence}%)
            </label>
            <input
              type="range"
              min={50}
              max={99}
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full accent-brand-500 mt-2"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-fintech-muted block mb-1 font-mono">
              Customer Opted Out?
            </label>
            <button
              type="button"
              onClick={() => setIsOptedOut(!isOptedOut)}
              className={`w-full rounded-fintech-md px-3 py-2 text-xs font-bold border transition-all font-mono ${
                isOptedOut
                  ? 'bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400'
                  : 'bg-fintech-surface-subtle border-fintech-border text-fintech-muted'
              }`}
            >
              {isOptedOut ? 'YES (Opted Out)' : 'NO (Active)'}
            </button>
          </div>

          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              isLoading={evalLoading}
              onClick={() =>
                handleEvaluateDemo(amount, proposedAction, confidence, isOptedOut, priorAttempts)
              }
              className="w-full"
            >
              Run Policy Gate
            </Button>
          </div>
        </div>

        {/* Feature 34 Visual Flow Pipeline */}
        {evalResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Stage 1: AI Proposal */}
              <div className="rounded-fintech-md border border-brand-500/30 bg-brand-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 uppercase font-mono">
                    <Bot className="w-4 h-4" />
                    <span>1. AI Proposal</span>
                  </div>
                  <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold">
                    Conf: {evalResult.ai_confidence_pct}%
                  </span>
                </div>
                <div className="p-3 rounded-fintech-sm bg-fintech-surface border border-fintech-border">
                  <span className="font-mono text-xs font-bold text-fintech-primary block">
                    {evalResult.ai_proposal}
                  </span>
                  <span className="text-[10px] text-fintech-muted font-mono">Amount: {formatCurrency(evalResult.transaction_amount)}</span>
                </div>
              </div>

              {/* Stage 2: PolicyEngine Rules */}
              <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-fintech-primary uppercase font-mono">
                    <Scale className="w-4 h-4 text-brand-500" />
                    <span>2. Policy Engine</span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono border ${
                      evalResult.policy_verdict === 'BLOCK'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {evalResult.policy_verdict}
                  </span>
                </div>

                <div className="space-y-1 text-[10px]">
                  {evalResult.policy_rules_evaluated.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-1.5 rounded bg-fintech-surface border border-fintech-border"
                    >
                      <span className="text-fintech-secondary font-medium truncate">{r.rule_name}</span>
                      <span
                        className={`font-mono font-bold ${
                          r.status === 'PASSED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 3: Final Decision */}
              <div className="rounded-fintech-md border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>3. Final Verdict</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">100% Enforced</span>
                </div>

                <div className="p-3 rounded-fintech-sm bg-fintech-surface border border-emerald-500/30">
                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                    {evalResult.final_decision}
                  </span>
                  <span className="text-[10px] text-fintech-secondary block mt-1">
                    {evalResult.policy_violation_reason || 'Approved for autonomous execution'}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory Banner */}
            <div className="rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border p-3.5 text-xs text-fintech-secondary leading-relaxed font-medium">
              <strong className="text-brand-600 dark:text-brand-400 block mb-0.5 font-mono">Responsible AI Verification:</strong>
              {evalResult.responsible_ai_summary}
            </div>
          </div>
        )}
      </div>

      {/* Feature 33: Failure Chaos Simulation (Controlled Demo) */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wider font-mono">
                Controlled Chaos Simulator
              </span>
              <span className="text-[10px] font-mono text-fintech-muted">Non-Destructive Demo Sandbox</span>
            </div>
            <h3 className="text-lg font-bold text-fintech-primary mt-1">
              Resilience & Failover Chaos Testing
            </h3>
            <p className="text-xs text-fintech-secondary mt-0.5">
              Trigger simulated failure conditions to verify graceful fallback degradation, zero recovery downtime, and deterministic safety invariants.
            </p>
          </div>
        </div>

        {/* Chaos Triggers Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => handleTriggerChaos('OPENAI_FAILURE')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">OpenAI Failure</span>
            <span className="text-[10px] text-fintech-muted block">Tests Fallback Diagnosis</span>
          </button>

          <button
            onClick={() => handleTriggerChaos('GATEWAY_FAILURE')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">Gateway 504 Spike</span>
            <span className="text-[10px] text-fintech-muted block">Tests Dynamic Failover</span>
          </button>

          <button
            onClick={() => handleTriggerChaos('HIGH_VALUE_TRANSACTION')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">High-Value Tx</span>
            <span className="text-[10px] text-fintech-muted block">Tests Human Approval Gate</span>
          </button>

          <button
            onClick={() => handleTriggerChaos('CUSTOMER_OPT_OUT')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">Customer Opt-Out</span>
            <span className="text-[10px] text-fintech-muted block">Tests Dunning Halt</span>
          </button>

          <button
            onClick={() => handleTriggerChaos('REPEATED_FAILURE')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">Max 3 Attempts</span>
            <span className="text-[10px] text-fintech-muted block">Tests Network Rule Guard</span>
          </button>

          <button
            onClick={() => handleTriggerChaos('DATABASE_LATENCY')}
            disabled={chaosLoading}
            className="p-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle hover:border-brand-500 text-left transition-all space-y-1 shadow-fintech-sm"
          >
            <span className="text-xs font-bold text-fintech-primary block">DB Latency Spike</span>
            <span className="text-[10px] text-fintech-muted block">Tests Read Retry Rails</span>
          </button>
        </div>

        {/* Chaos Outcome Card */}
        {chaosResult && (
          <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-5 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase font-mono">
                Simulated Condition: {chaosResult.scenario}
              </span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                {chaosResult.audit_event_logged}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-fintech-sm bg-fintech-surface border border-fintech-border">
                <span className="text-[10px] text-fintech-muted block uppercase font-bold">Trigger Event</span>
                <span className="text-fintech-primary font-medium block mt-1">{chaosResult.trigger_event}</span>
              </div>
              <div className="p-3 rounded-fintech-sm bg-fintech-surface border border-fintech-border">
                <span className="text-[10px] text-fintech-muted block uppercase font-bold">Subsystem Failover</span>
                <span className="text-fintech-primary font-medium block mt-1">{chaosResult.subsystem_response}</span>
              </div>
            </div>

            <div className="p-3 rounded-fintech-sm bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Safety Guarantee:</strong> {chaosResult.safety_guarantee_observed}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
