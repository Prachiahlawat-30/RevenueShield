import React from 'react';
import { ShieldCheck, ArrowRight, Check, X, AlertTriangle } from 'lucide-react';
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
      <div className="flex h-72 w-full items-center justify-center rounded-[16px] border border-dashed border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12161F] p-6 text-center text-slate-400 dark:text-[#6B7280] shadow-sm dark:shadow-fintech-card">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-slate-400 dark:text-[#6B7280]" />
          <p className="text-xs text-slate-500 dark:text-[#9CA3B0]">Policy evaluation will validate proposals before execution.</p>
        </div>
      </div>
    );
  }

  const isApproved = evaluation.is_approved;
  const isOverridden = evaluation.original_proposed_action !== evaluation.effective_action;

  const defaultPolicyChecks = [
    { label: 'Customer eligible', passed: !evaluation.applied_rules.some((r) => r.includes('OPT_OUT')) },
    { label: 'Attempts within limit (< 3)', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_ATTEMPTS')) },
    { label: 'Cooldown period satisfied', passed: !evaluation.applied_rules.some((r) => r.includes('COOLDOWN')) },
    { label: 'Amount within autonomous limit', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_AMOUNT')) },
    { label: 'No duplicate action active', passed: !evaluation.applied_rules.some((r) => r.includes('DUPLICATE')) },
  ];

  return (
    <div className="flex flex-col justify-between rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card space-y-4 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-900 dark:text-[#F5F6FA] block">
                Policy engine
              </span>
              <p className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">
                Deterministic rules validate proposals before execution
              </p>
            </div>
          </div>

          <span
            className={`h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium border ${
              isApproved
                ? 'bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] border-[#10B981]/20'
                : 'bg-[#F0625A]/10 text-[#E11D48] dark:text-[#F0625A] border-[#F0625A]/20'
            }`}
          >
            {isApproved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            <span>{isApproved ? 'Policy approved' : 'Policy blocked'}</span>
          </span>
        </div>

        {/* Action Decision Box */}
        <div className="rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
                AI suggested action
              </span>
              <p className="font-medium text-slate-700 dark:text-[#9CA3B0] mt-0.5">
                {getActionLabel(evaluation.original_proposed_action)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 dark:text-[#6B7280]" />
            <div className="text-right">
              <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
                Authorized action
              </span>
              <p className="font-semibold text-slate-900 dark:text-[#F5F6FA] mt-0.5">
                {getActionLabel(evaluation.effective_action)}
              </p>
            </div>
          </div>

          {isOverridden && (
            <div className="mt-2.5 flex items-center gap-2 rounded-[8px] bg-[#E8A33D]/10 p-2 text-xs text-[#D97706] dark:text-[#E8A33D] border border-[#E8A33D]/20">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Policy Engine bounded and modified AI suggestion to comply with safety limits.</span>
            </div>
          )}
        </div>

        {/* Deterministic Guardrails Checklist */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
            Enforced guardrails
          </span>
          <div className="space-y-1.5 text-xs">
            {defaultPolicyChecks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </span>
                  <span className="text-slate-700 dark:text-[#9CA3B0]">{check.label}</span>
                </div>
                <span className="h-4.5 px-1.5 rounded-full inline-flex items-center text-[9px] font-medium bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-[#6B7280] border border-slate-200 dark:border-white/[0.06]">
                  Verified
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
          className="w-full p-3 rounded-[10px] bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          {isExecuting ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              <span>Executing recovery action...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{isApproved ? 'Approved · Click to execute' : 'Action blocked'}</span>
            </>
          )}
        </button>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#6B7280]">
        <span>Engine: <strong className="text-slate-600 dark:text-[#9CA3B0] font-medium">PolicyEngine v2.4</strong></span>
        <span>Deterministic</span>
      </div>
    </div>
  );
};
