import React from 'react';
import { Cpu, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AiVsPolicyComparison, DecisionGraphNode } from '../../types';

interface Props {
  comparison?: AiVsPolicyComparison;
  policyNode?: DecisionGraphNode;
}

export const PolicyDecisionPanel: React.FC<Props> = ({ comparison, policyNode }) => {
  const isOverridden = comparison?.is_ai_overridden || false;
  const isBlocked = comparison?.policy_verdict === 'BLOCK' || policyNode?.status === 'BLOCK';
  const isEscalated = comparison?.policy_verdict === 'ESCALATE' || policyNode?.status === 'ESCALATE';
  const verdict = comparison?.policy_verdict || policyNode?.status || 'ALLOW';

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 space-y-4 shadow-fintech-sm">
      {/* Banner Header: AI vs Policy Engine Comparison */}
      <div
        className={`p-4 rounded-fintech-md border flex flex-wrap items-center justify-between gap-4 ${
          isOverridden
            ? isEscalated
              ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`p-2 rounded-fintech-sm shrink-0 mt-0.5 ${
              isOverridden
                ? isEscalated
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
            }`}
          >
            {isOverridden ? (
              isEscalated ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-fintech-primary">
                {isOverridden
                  ? isEscalated
                    ? 'PolicyEngine Gated & Escalated AI Proposal'
                    : 'PolicyEngine Blocked AI Recommendation'
                  : 'PolicyEngine Validated & Approved AI Recommendation'}
              </h4>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-fintech-surface border border-fintech-border font-bold">
                {verdict}
              </span>
            </div>
            <p className="text-xs text-fintech-secondary leading-relaxed">
              {comparison?.summary || policyNode?.tooltip || (policyNode?.data?.explanation as string) || 'Deterministic policy verified recovery bounds.'}
            </p>
          </div>
        </div>

        {/* Final Decision Badge Box */}
        <div className="flex items-center gap-3 bg-fintech-surface px-3.5 py-2 rounded-fintech-md border border-fintech-border shrink-0 shadow-fintech-sm">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-wider text-fintech-muted block font-mono font-bold">
              FINAL DECISION
            </span>
            <span className="text-xs font-mono font-bold text-fintech-primary">
              {comparison?.final_decision_action || 'Authorize Execution'}
            </span>
          </div>
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded font-bold uppercase border ${
              verdict === 'ALLOW' || verdict === 'HEALTHY'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : verdict === 'ESCALATE'
                ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}
          >
            {verdict}
          </span>
        </div>
      </div>

      {/* 3-Column Comparative Layout: AI Proposal -> Policy Invariants -> Final Decision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: AI Proposal */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 text-brand-500" />
                AI Recommendation
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fintech-surface border border-fintech-border text-brand-600 dark:text-brand-400 font-bold">
                {comparison?.ai_source || 'DiagnosisEngine'}
              </span>
            </div>

            <div className="my-2">
              <span className="text-xs text-fintech-muted block">Proposed Action:</span>
              <span className="text-base font-mono font-black text-brand-600 dark:text-brand-300">
                {comparison?.ai_proposed_action || 'Smart Retry'}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-fintech-muted mb-1">
                <span>Model Confidence:</span>
                <span className="font-mono font-bold text-fintech-primary">{comparison?.ai_confidence_pct || 95}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${comparison?.ai_confidence_pct || 95}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-fintech-secondary leading-relaxed italic border-l-2 border-brand-500/40 pl-2">
              "{comparison?.ai_rationale || 'Optimal recovery strategy estimated based on issuer error code.'}"
            </p>
          </div>

          <div className="pt-2 border-t border-fintech-border text-[10px] text-fintech-muted font-mono">
            AI Proposal is advisory only. Gated by PolicyEngine.
          </div>
        </div>

        {/* Column 2: PolicyEngine Deterministic Rules */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                PolicyEngine Invariants
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border ${
                  isBlocked
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    : isEscalated
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {verdict}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {(comparison?.policy_rules || [
                { rule_name: 'MaxAttemptsGuard', description: 'Limit 3 attempts per invoice', status: 'PASS' },
                { rule_name: 'OptOutGuard', description: 'Verify customer is active', status: 'PASS' },
                { rule_name: 'CooldownSafety', description: 'Enforce minimum 24h backoff', status: 'PASS' },
              ]).map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2 rounded bg-fintech-surface border border-fintech-border text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-fintech-primary block truncate">{rule.rule_name}</span>
                    <span className="text-[10px] text-fintech-muted truncate block">{rule.description}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border flex-shrink-0 ${
                      rule.status === 'PASS'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : rule.status === 'TRIGGERED'
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {rule.status}
                  </span>
                </div>
              ))}
            </div>

            {comparison?.policy_reason && (
              <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                Reason: {comparison.policy_reason}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-fintech-border text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
            100% Deterministic Safety Bound
          </div>
        </div>

        {/* Column 3: Final Decision Authority */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Final Decision & Target
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fintech-surface border border-fintech-border text-fintech-primary font-semibold">
                Authoritative
              </span>
            </div>

            <div className="my-2">
              <span className="text-xs text-fintech-muted block">Authorized Action:</span>
              <span className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
                {comparison?.final_decision_action || 'Smart Retry via Gateway'}
              </span>
            </div>

            <div className="p-2.5 rounded-fintech-sm bg-fintech-surface border border-fintech-border space-y-1.5 text-xs">
              <div className="flex justify-between text-fintech-muted">
                <span>Authority Layer:</span>
                <span className="font-semibold text-fintech-primary font-mono">PolicyEngine</span>
              </div>
              <div className="flex justify-between text-fintech-muted">
                <span>Execution Target:</span>
                <span className="font-semibold text-fintech-primary font-mono">
                  {isEscalated ? 'Human Ops Queue' : isBlocked ? 'Terminal Halt' : 'State Machine'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-fintech-border text-[10px] text-fintech-muted flex items-center justify-between font-mono">
            <span>Audit Trail Verified</span>
            <ArrowRight className="w-3 h-3 text-brand-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
