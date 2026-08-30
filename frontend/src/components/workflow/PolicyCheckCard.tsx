import React from 'react';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { PolicyEvaluationResult } from '../../types';
import { getActionLabel } from '../../utils/formatters';

interface PolicyCheckCardProps {
  evaluation?: PolicyEvaluationResult;
}

export const PolicyCheckCard: React.FC<PolicyCheckCardProps> = ({ evaluation }) => {
  if (!evaluation) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-fintech-lg border border-dashed border-fintech-border bg-fintech-surface p-6 text-center text-fintech-muted shadow-fintech-sm">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-fintech-muted" />
          <p className="text-xs font-medium">Policy evaluation will trigger following AI recommendation.</p>
        </div>
      </div>
    );
  }

  const isApproved = evaluation.is_approved;
  const isOverridden = evaluation.original_proposed_action !== evaluation.effective_action;

  return (
    <div className="flex flex-col justify-between rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-fintech-sm border ${
                isApproved
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-fintech-primary">
              Deterministic Policy Engine
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              isApproved
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'
            }`}
          >
            {isApproved ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            <span>{isApproved ? 'Policy Approved' : 'Policy Blocked'}</span>
          </div>
        </div>

        {/* Action Decision Box */}
        <div className="mt-4 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted block">
                AI Suggestion
              </span>
              <p className="font-semibold text-fintech-secondary mt-0.5">
                {getActionLabel(evaluation.original_proposed_action)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-fintech-muted" />
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                Authorized Execution
              </span>
              <p className={`font-bold mt-0.5 ${isOverridden ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {getActionLabel(evaluation.effective_action)}
              </p>
            </div>
          </div>
          {isOverridden && (
            <div className="mt-2 flex items-center gap-1.5 rounded bg-purple-500/10 px-2 py-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 border border-purple-500/20">
              <AlertTriangle className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span>Policy Engine bounded and modified AI suggestion.</span>
            </div>
          )}
        </div>

        {/* Evaluated Rules Checklist */}
        <div className="mt-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted block">
            Rules Evaluation Trace
          </span>
          <div className="mt-1.5 space-y-1.5">
            {evaluation.applied_rules.map((rule, idx) => {
              const isRuleTriggered = rule.includes('TRIGGERED') || rule.includes('BLOCKED');
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-fintech-sm border border-fintech-border bg-fintech-surface-subtle px-3 py-1.5 text-xs font-mono"
                >
                  <span className="text-fintech-primary">{rule.split(':')[0]}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                      isRuleTriggered
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {rule.split(':')[1] || 'PASS'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safety Guarantee Footer */}
      <div className="flex items-center justify-between border-t border-fintech-border pt-3 text-[11px] text-fintech-muted font-mono">
        <span>Deterministic Rule Bounds:</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Policy Enforced</span>
      </div>
    </div>
  );
};
