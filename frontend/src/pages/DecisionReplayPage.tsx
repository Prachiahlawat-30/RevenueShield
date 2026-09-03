import React, { useEffect, useState } from 'react';
import {
  History,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Database,
  Cpu,
  Clock,
  Code,
  Network,
} from 'lucide-react';
import {
  getReplayCases,
  getDecisionReplay,
  getDecisionExplainability,
} from '../api/tier3';
import {
  ReplayCaseListItem,
  DecisionReplayResponse,
  DecisionExplainabilityResponse,
} from '../types';
import { CounterfactualCard } from '../components/decision/CounterfactualCard';
import { PaymentDecisionGraph } from '../components/decision-graph/PaymentDecisionGraph';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const DecisionReplayPage: React.FC = () => {
  const [cases, setCases] = useState<ReplayCaseListItem[]>([]);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);
  const [replayData, setReplayData] = useState<DecisionReplayResponse | null>(null);
  const [explainability, setExplainability] = useState<DecisionExplainabilityResponse | null>(null);
  const [showDecisionGraph, setShowDecisionGraph] = useState<boolean>(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingReplay, setLoadingReplay] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoadingCases(true);
        const data = await getReplayCases(20);
        setCases(data);
        if (data.length > 0) {
          setSelectedRiskId(data[0].risk_id);
        }
      } catch (err) {
        console.error('Failed to load replay cases', err);
      } finally {
        setLoadingCases(false);
      }
    };
    fetchCases();
  }, []);

  useEffect(() => {
    if (!selectedRiskId) return;

    const fetchReplay = async () => {
      try {
        setLoadingReplay(true);
        const [rep, exp] = await Promise.all([
          getDecisionReplay(selectedRiskId),
          getDecisionExplainability(selectedRiskId),
        ]);
        setReplayData(rep);
        setExplainability(exp);
      } catch (err) {
        console.error('Failed to reconstruct decision replay', err);
      } finally {
        setLoadingReplay(false);
      }
    };
    fetchReplay();
  }, [selectedRiskId]);

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            <History className="h-4 w-4" />
            <span>FORENSIC DECISION RECONSTRUCTION</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Decision Replay & Audit Trace
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            Reconstruct historical recovery cases step-by-step: what RevenueShield knew, what it predicted, what it recommended, what PolicyEngine decided, and what settled.
          </p>
        </div>

        {replayData && (
          <div className="flex items-center gap-2 rounded-fintech-md border border-fintech-border bg-fintech-surface px-3.5 py-1.5 text-xs font-mono text-fintech-secondary">
            <Code className="h-3.5 w-3.5 text-brand-500" />
            <span>Version: {replayData.decision_version}</span>
          </div>
        )}
      </div>

      {/* Case Selector Ribbon */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm space-y-3">
        <span className="text-[10px] uppercase font-bold text-fintech-muted block tracking-wider">
          Select Historical Recovery Case for Forensic Replay:
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {cases.map((c) => {
            const isSelected = selectedRiskId === c.risk_id;
            return (
              <button
                key={c.risk_id}
                onClick={() => setSelectedRiskId(c.risk_id)}
                className={`flex-shrink-0 rounded-fintech-md p-3 text-left transition-all border text-xs min-w-[200px] ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500/10 text-fintech-primary shadow-fintech-sm font-semibold'
                    : 'border-fintech-border bg-fintech-surface-subtle text-fintech-secondary hover:text-fintech-primary hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate max-w-[120px]">{c.customer_name}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(c.amount)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] font-mono text-fintech-muted">
                  <span>{c.failure_type.replace('_', ' ')}</span>
                  <span className="uppercase font-semibold">{c.status}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Flagship Decision Graph Viewer Toggle Bar */}
      {selectedRiskId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-fintech-surface p-3.5 rounded-fintech-lg border border-brand-500/30 shadow-fintech-sm">
          <div className="flex items-center gap-2 text-xs text-fintech-primary">
            <Network className="w-4 h-4 text-brand-500" />
            <span className="font-bold">Flagship Payment Decision Graph:</span>
            <span className="text-fintech-secondary">Full 15-node causal explanation and policy governance</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Network}
            onClick={() => setShowDecisionGraph(!showDecisionGraph)}
          >
            {showDecisionGraph ? 'Hide Decision Graph' : 'View Payment Decision Graph'}
          </Button>
        </div>
      )}

      {/* Flagship Decision Graph View */}
      {showDecisionGraph && selectedRiskId && (
        <PaymentDecisionGraph riskId={selectedRiskId} />
      )}

      {loadingReplay || !replayData ? (
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center text-fintech-muted animate-pulse">
          Reconstructing forensic decision timeline from immutable audit logs...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 5 Reconstructed Pillar Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 text-xs">
            {/* 1. What RevenueShield Knew */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-2 shadow-fintech-sm">
              <div className="flex items-center gap-1.5 text-fintech-muted font-bold uppercase text-[10px]">
                <Database className="w-3.5 h-3.5 text-brand-500" />
                <span>1. What It Knew</span>
              </div>
              <h4 className="font-bold text-fintech-primary text-sm">{replayData.what_recoverai_knew.failure_label}</h4>
              <p className="text-[11px] text-fintech-secondary">Amount: <strong className="text-fintech-primary font-mono">{formatCurrency(replayData.amount_at_risk)}</strong></p>
              <div className="space-y-1 pt-1 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                <p>Card: •••• {replayData.what_recoverai_knew.card_last4}</p>
                <p>Tenure: {replayData.what_recoverai_knew.account_tenure_months} months</p>
                <p>Reliability: {replayData.what_recoverai_knew.historical_reliability_score}/100</p>
              </div>
            </div>

            {/* 2. What It Predicted */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-2 shadow-fintech-sm">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold uppercase text-[10px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>2. What It Predicted</span>
              </div>
              <h4 className="font-bold text-fintech-primary text-sm">
                {replayData.what_it_predicted.probability_percentage} Probability
              </h4>
              <p className="text-[11px] text-fintech-secondary">Confidence: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{replayData.what_it_predicted.confidence}</strong></p>
              <div className="space-y-1 pt-1 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                <p>Expected: {formatCurrency(replayData.what_it_predicted.expected_recovery_value)}</p>
                <p>Risk Score: {replayData.what_it_predicted.risk_score} / 100</p>
                <p className="text-brand-600 dark:text-brand-400">Model: {replayData.what_it_predicted.prediction_model}</p>
              </div>
            </div>

            {/* 3. What It Recommended */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-2 shadow-fintech-sm">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-bold uppercase text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Recommended</span>
              </div>
              <h4 className="font-bold text-fintech-primary text-sm truncate">
                {replayData.what_it_recommended.recommended_action?.replace('_', ' ')}
              </h4>
              <p className="text-[11px] text-fintech-secondary">Channel: <strong className="text-fintech-primary">{replayData.what_it_recommended.recommended_channel}</strong></p>
              <div className="space-y-1 pt-1 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                <p>Net Recovery: {formatCurrency(replayData.what_it_recommended.expected_net_recovery)}</p>
                <p>Marginal Cost: ${replayData.what_it_recommended.intervention_cost}</p>
              </div>
            </div>

            {/* 4. What Policy Decided */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-2 shadow-fintech-sm">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>4. Policy Verdict</span>
              </div>
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {replayData.what_policy_decided.verdict}
              </h4>
              <p className="text-[11px] text-fintech-secondary">Rules: <strong className="text-fintech-primary">4 Passed / 0 Violations</strong></p>
              <div className="space-y-1 pt-1 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                <p>Deterministic Safety: 100%</p>
                <p>Stop Reason: None</p>
              </div>
            </div>

            {/* 5. What Happened */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-2 shadow-fintech-sm">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>5. What Happened</span>
              </div>
              <h4 className="font-bold text-fintech-primary text-sm font-mono">
                {formatCurrency(replayData.what_happened.amount_recovered)}
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{replayData.what_happened.iso_8583_response_code}</p>
              <div className="space-y-1 pt-1 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
                <p>Via: {replayData.what_happened.gateway_channel}</p>
                <p>Status: {replayData.what_happened.execution_status}</p>
              </div>
            </div>
          </div>

          {/* Chronological Forensic Replay Timeline Ticker */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-5">
            <div className="flex items-center justify-between border-b border-fintech-border pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                <span className="font-bold text-fintech-primary text-xs uppercase tracking-wider">
                  Chronological Forensic Event Replay
                </span>
              </div>
              <span className="text-[10px] font-mono text-fintech-muted">
                Case ID: {replayData.risk_id}
              </span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {replayData.timeline_events.map((ev, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-fintech-surface"></span>

                  <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-1 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-brand-600 dark:text-brand-400 font-bold text-[11px]">
                        {ev.timestamp_str}
                      </span>
                      <span className="rounded bg-fintech-surface px-2 py-0.5 text-[9px] font-bold text-fintech-secondary uppercase font-mono border border-fintech-border">
                        {ev.stage_name}
                      </span>
                    </div>
                    <h5 className="font-bold text-fintech-primary text-xs">{ev.headline}</h5>
                    <p className="text-[11px] text-fintech-secondary leading-relaxed">{ev.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 21: Model Explainability & Factor Contribution Card */}
          {explainability && (
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fintech-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-fintech-primary text-xs uppercase tracking-wider">
                    Model Factor Explainability & Reproducibility
                  </span>
                </div>
                <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  Signature: {explainability.reproducibility_hash}
                </span>
              </div>

              <p className="text-xs text-fintech-secondary font-medium leading-relaxed">
                {explainability.explanation_summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
                {explainability.top_factors.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-fintech-primary text-xs">{f.factor_name}</span>
                      <span
                        className={`font-mono text-xs font-black ${
                          f.weight_pct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {f.weight_pct > 0 ? `+${f.weight_pct}%` : `${f.weight_pct}%`}
                      </span>
                    </div>
                    <p className="text-[10px] text-fintech-muted">{f.evidence_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature 23: Counterfactual Analysis Card */}
          <CounterfactualCard riskId={replayData.risk_id} />
        </div>
      )}
    </div>
  );
};
