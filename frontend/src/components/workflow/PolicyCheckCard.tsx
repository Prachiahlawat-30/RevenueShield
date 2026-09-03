import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { PolicyEvaluationResult } from '../../types';
import { getActionLabel } from '../../utils/formatters';

interface PolicyCheckCardProps {
  evaluation?: PolicyEvaluationResult;
  onExecute?: () => void;
  isExecuting?: boolean;
}

export const PolicyCheckCard: React.FC<PolicyCheckCardProps> = ({
  evaluation,
  onExecute,
  isExecuting = false,
}) => {
  if (!evaluation) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-6 text-center text-slate-400 shadow-xs">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-slate-400" />
          <p className="text-xs font-mono">Policy evaluation will validate proposals before execution.</p>
        </div>
      </div>
    );
  }

  const isApproved = evaluation.is_approved;
  const isOverridden = evaluation.original_proposed_action !== evaluation.effective_action;

  const defaultPolicyChecks = [
    { label: 'Customer eligible', passed: !evaluation.applied_rules.some((r) => r.includes('OPT_OUT')) },
    { label: 'Attempts within limit (< 3)', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_ATTEMPTS')) },
    { label: 'Cooldown satisfied', passed: !evaluation.applied_rules.some((r) => r.includes('COOLDOWN')) },
    { label: 'Amount within threshold', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_AMOUNT')) },
    { label: 'No duplicate action', passed: !evaluation.applied_rules.some((r) => r.includes('DUPLICATE')) },
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-md p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900/[0.05] dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white block">
                POLICY ENGINE
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                Deterministic rules validate proposals before execution
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-medium border ${
              isApproved
                ? 'bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {isApproved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{isApproved ? 'POLICY APPROVED' : 'POLICY BLOCKED'}</span>
          </span>
        </div>

        {/* Action Decision Box */}
        <div className="rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                AI Suggested Strategy
              </span>
              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 font-sans">
                {getActionLabel(evaluation.original_proposed_action)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Authorized Execution Action
              </span>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5 font-sans">
                {getActionLabel(evaluation.effective_action)}
              </p>
            </div>
          </div>

          {isOverridden && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-slate-500/[0.06] p-2 text-xs font-normal text-slate-600 dark:text-slate-400 border border-slate-500/15">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Policy Engine bounded and modified AI suggestion to comply with safety caps.</span>
            </div>
          )}
        </div>

        {/* Deterministic Guardrails Checklist */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            ENFORCED GUARDRAILS
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            {defaultPolicyChecks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{check.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            if (onExecute) onExecute();
          }}
          disabled={!isApproved || isExecuting}
          className="w-full p-3.5 rounded-xl bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-slate-100 disabled:opacity-50 text-white font-semibold font-mono text-center text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-xs hover:-translate-y-[1px] transition-all cursor-pointer"
        >
          {isExecuting ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              <span>EXECUTING RECOVERY ACTION...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isApproved
                  ? 'ACTION APPROVED • CLICK TO EXECUTE'
                  : 'ACTION BLOCKED'}
              </span>
              {isApproved && <ArrowRight className="w-3.5 h-3.5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
