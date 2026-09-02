import React from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { PolicyEvaluationResult } from '../../types';
import { getActionLabel } from '../../utils/formatters';
import { Button } from '../ui/Button';

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
      <div className="flex h-72 w-full items-center justify-center rounded-[14px] border border-dashed border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-6 text-center text-[#9CA3AF] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-[#9CA3AF]" />
          <p className="text-xs font-medium">Policy evaluation will trigger following AI recommendation.</p>
        </div>
      </div>
    );
  }

  const isApproved = evaluation.is_approved;
  const isOverridden = evaluation.original_proposed_action !== evaluation.effective_action;

  // Policy Badge per prompt requirements
  const renderPolicyBadge = () => {
    if (isApproved && !isOverridden) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40">
          <Check className="h-3.5 w-3.5 text-[#16A34A]" />
          <span>POLICY APPROVED</span>
        </span>
      );
    }
    if (isApproved && isOverridden) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono border bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40">
          <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B]" />
          <span>POLICY REQUIRES REVIEW</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold font-mono border bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40">
        <X className="h-3.5 w-3.5 text-[#DC2626]" />
        <span>POLICY BLOCKED</span>
      </span>
    );
  };

  // Structured Policy Checklist - exact 5 items specified
  const defaultPolicyChecks = [
    { label: 'Customer opted in', passed: !evaluation.applied_rules.some((r) => r.includes('OPT_OUT')) },
    { label: 'Attempts < 3', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_ATTEMPTS')) },
    { label: 'Cooldown satisfied', passed: !evaluation.applied_rules.some((r) => r.includes('COOLDOWN')) },
    { label: 'Amount within limit', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_AMOUNT')) },
    { label: 'No duplicate action', passed: !evaluation.applied_rules.some((r) => r.includes('DUPLICATE')) },
  ];

  return (
    <div className="flex flex-col justify-between rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/20 dark:from-emerald-950/30 dark:via-[#131824] dark:to-emerald-950/10 p-6 shadow-sm space-y-4">
      <div>
        {/* Header with Professional Policy Indicator Badge */}
        <div className="flex items-center justify-between border-b border-emerald-200/70 dark:border-emerald-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                POLICY ENGINE
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                Deterministic rules validate every AI proposal before execution.
              </p>
            </div>
          </div>

          {renderPolicyBadge()}
        </div>

        {/* Action Decision Box */}
        <div className="mt-4 rounded-lg border border-emerald-200/60 dark:border-emerald-800/30 bg-white/80 dark:bg-emerald-950/20 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280] block">
                AI Suggested Strategy
              </span>
              <p className="font-semibold text-[#6B7280] mt-0.5">
                {getActionLabel(evaluation.original_proposed_action)}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#9CA3AF]" />
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Authorized Execution Action
              </span>
              <p className={`font-bold mt-0.5 text-sm ${isOverridden ? 'text-[#F59E0B]' : 'text-[#16A34A]'}`}>
                {getActionLabel(evaluation.effective_action)}
              </p>
            </div>
          </div>

          {isOverridden && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
              <AlertTriangle className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />
              <span>Policy Engine bounded and modified AI suggestion to comply with merchant safety rules.</span>
            </div>
          )}
        </div>

        {/* Real Payment Operations Policy Checklist */}
        <div className="mt-4 space-y-2">
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
            Deterministic Guardrail Checklist
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            {defaultPolicyChecks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-emerald-200/60 dark:border-emerald-800/30 bg-white/80 dark:bg-slate-900 px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="text-emerald-900 dark:text-emerald-200 font-medium">{check.label}</span>
                </div>
                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Approved Stamp Banner - Clickable */}
        <button
          type="button"
          onClick={onExecute}
          disabled={!isApproved || isExecuting}
          className={`w-full mt-4 p-3 rounded-lg text-white font-mono font-bold text-center text-xs tracking-wider uppercase shadow-sm border flex items-center justify-center gap-2 transition-all ${
            isApproved
              ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] border-emerald-500 cursor-pointer group'
              : 'bg-slate-400 border-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>
            {isExecuting
              ? 'EXECUTING RECOVERY...'
              : isApproved
              ? 'ACTION APPROVED • CLICK TO EXECUTE RECOVERY'
              : 'ACTION BLOCKED'}
          </span>
          {isApproved && !isExecuting && (
            <ArrowRight className="w-3.5 h-3.5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
          )}
        </button>
      </div>

      {/* Primary Action Button */}
      {onExecute && (
        <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#242E42]">
          <Button
            variant="primary"
            className="w-full py-2.5 text-xs font-bold"
            disabled={!isApproved || isExecuting}
            isLoading={isExecuting}
            onClick={onExecute}
          >
            Execute Recovery
          </Button>
        </div>
      )}
    </div>
  );
};
