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

  // Structured Policy Checklist
  const defaultPolicyChecks = [
    { label: 'Action allowed by merchant rules', passed: isApproved },
    { label: 'Customer not opted out of recovery', passed: !evaluation.applied_rules.some((r) => r.includes('OPT_OUT')) },
    { label: 'Attempt limit not exceeded (< 3 retries)', passed: !evaluation.applied_rules.some((r) => r.includes('MAX_ATTEMPTS')) },
    { label: 'Intervention cooldown satisfied', passed: !evaluation.applied_rules.some((r) => r.includes('COOLDOWN')) },
  ];

  return (
    <div className="flex flex-col justify-between rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
      <div>
        {/* Header with Professional Policy Indicator Badge */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#6822CC] dark:bg-purple-950/40 dark:text-purple-300 border border-[#D5BEFF] dark:border-purple-800/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1A1A2E] dark:text-white block">
                Deterministic Policy Engine
              </span>
              <span className="text-[10px] text-[#6B7280]">Guardrail verification & execution authorization</span>
            </div>
          </div>

          {renderPolicyBadge()}
        </div>

        {/* Action Decision Box */}
        <div className="mt-4 rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/70 dark:bg-slate-800/40 p-4">
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
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6822CC] dark:text-[#B892FF] block">
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
            Policy Safety Checklist
          </span>
          <div className="space-y-1.5">
            {defaultPolicyChecks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  {check.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />
                  )}
                  <span className={check.passed ? 'text-[#1A1A2E] dark:text-white font-medium' : 'text-[#DC2626] font-medium'}>
                    {check.label}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold uppercase ${check.passed ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {check.passed ? 'PASSED' : 'BLOCKED'}
                </span>
              </div>
            ))}
          </div>
        </div>
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
