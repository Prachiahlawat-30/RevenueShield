import React from 'react';
import {
  ArrowDown,
  Layers,
  Loader2,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';
import { RevenueRisk, AIDiagnosisResult, PolicyEvaluationResult, RecoveryExecutionResult } from '../../types';
import { getActionLabel, getFailureTypeLabel } from '../../utils/formatters';

interface TransactionStateTimelineProps {
  risk?: RevenueRisk | null;
  stage?: string;
  diagnosis?: AIDiagnosisResult | null;
  policyEvaluation?: PolicyEvaluationResult | null;
  executionResult?: RecoveryExecutionResult | null;
  className?: string;
  onExecuteStep?: () => void;
  isExecuting?: boolean;
}

export const TransactionStateTimeline: React.FC<TransactionStateTimelineProps> = ({
  risk,
  stage = 'DETECTED',
  diagnosis,
  policyEvaluation,
  executionResult,
  className = '',
  onExecuteStep,
  isExecuting = false,
}) => {
  const formatTime = (isoString?: string | null, fallbackSecondsOffset: number = 0) => {
    if (!isoString) {
      if (!risk?.created_at) return '10:31:02';
      const d = new Date(new Date(risk.created_at).getTime() + fallbackSecondsOffset * 1000);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch {
      return '10:31:02';
    }
  };

  const detectedTime = formatTime(risk?.created_at);
  const diagnosingTime = formatTime(risk?.created_at, 1);
  const executedTime = formatTime(
    risk?.recovery_attempts?.[0]?.initiated_at || risk?.last_attempt_at || risk?.updated_at,
    3
  );

  const hasDiagnosis = Boolean(diagnosis || stage !== 'DETECTED');
  const actionName = diagnosis?.recommended_action
    ? getActionLabel(diagnosis.recommended_action)
    : risk?.status === 'escalated'
    ? 'Escalate to human'
    : 'Retry payment';

  const confidenceScore = diagnosis?.confidence_score
    ? Math.round(diagnosis.confidence_score * 100)
    : 91;

  const isPolicyChecked = Boolean(
    policyEvaluation ||
      stage === 'POLICY_CHECK' ||
      stage === 'EXECUTING' ||
      stage === 'OUTCOME' ||
      (risk && ['recovering', 'recovered', 'escalated', 'stopped'].includes(risk.status))
  );

  const isApproved = policyEvaluation ? policyEvaluation.is_approved : true;

  const hasExecuted = Boolean(
    executionResult ||
      (risk?.recovery_attempts && risk.recovery_attempts.length > 0) ||
      risk?.status === 'recovered' ||
      stage === 'OUTCOME'
  );

  const executionChannel =
    executionResult?.channel ||
    risk?.recovery_attempts?.[0]?.execution_channel ||
    'Gateway simulator';

  const isRecovered = risk ? risk.status === 'recovered' : false;
  const isEscalated = risk ? risk.status === 'escalated' : false;
  const isStopped = risk ? risk.status === 'stopped' : false;

  const amountVal =
    risk?.amount_recovered && Number(risk.amount_recovered) > 0
      ? Number(risk.amount_recovered)
      : risk?.amount_at_risk && Number(risk.amount_at_risk) > 0
      ? Number(risk.amount_at_risk)
      : 8500;

  const formattedAmount = `₹${amountVal.toLocaleString('en-IN')}`;

  const steps = [
    {
      id: 'DETECTED',
      status: 'completed',
      title: 'Detected',
      subtitle: detectedTime,
      detail: risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Temporary decline detected',
    },
    {
      id: 'DIAGNOSING',
      status: hasDiagnosis ? 'completed' : stage === 'DIAGNOSING' ? 'active' : 'pending',
      title: 'Diagnosing',
      subtitle: hasDiagnosis ? diagnosingTime : 'Diagnostic analysis',
      detail: diagnosis?.root_cause_summary || (risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Issuer failure context'),
    },
    {
      id: 'ACTION_SELECTED',
      status: hasDiagnosis ? 'completed' : 'pending',
      title: 'Action selected',
      subtitle: hasDiagnosis ? actionName : 'Pending diagnosis',
      detail: hasDiagnosis ? `AI confidence: ${confidenceScore}%` : 'Optimal intervention',
    },
    {
      id: 'POLICY_CHECK',
      status: isPolicyChecked
        ? isApproved
          ? 'completed'
          : 'blocked'
        : stage === 'POLICY_CHECK'
        ? 'active'
        : 'pending',
      title: 'Policy check',
      subtitle: isPolicyChecked
        ? isApproved
          ? 'Approved'
          : 'Manual Override Required'
        : 'Safety check',
      detail: isPolicyChecked
        ? isApproved
          ? 'Deterministic rules passed'
          : 'Bounded by risk invariant'
        : 'Validation against rules',
    },
    {
      id: 'EXECUTED',
      status: hasExecuted
        ? 'completed'
        : stage === 'EXECUTING'
        ? 'active'
        : 'pending',
      title: 'Executed',
      subtitle: hasExecuted ? executionChannel : 'Gateway simulator',
      detail: hasExecuted ? executedTime : 'Controlled execution rail',
    },
    {
      id: 'RECOVERED',
      status: isRecovered
        ? 'success'
        : isEscalated
        ? 'escalated'
        : isStopped
        ? 'blocked'
        : 'pending',
      title: isRecovered
        ? 'Recovered'
        : isEscalated
        ? 'Escalated'
        : isStopped
        ? 'Terminated'
        : 'Expected yield',
      subtitle: isRecovered
        ? formattedAmount
        : isEscalated
        ? 'Human Review'
        : isStopped
        ? 'Zero Yield'
        : formattedAmount,
      detail: isRecovered
        ? 'Merchant ledger settled'
        : isEscalated
        ? 'Manual intervention needed'
        : isStopped
        ? 'Retry budget exhausted'
        : 'Estimated recoverable',
    },
  ];

  return (
    <div
      className={`w-full rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card space-y-5 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center text-slate-600 dark:text-[#9CA3B0]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
              State timeline
            </h3>
            <p className="text-xs text-slate-900 dark:text-[#F5F6FA] font-medium truncate max-w-xs">
              TXN {risk?.transaction_id || risk?.id || 'Active Case'}
            </p>
          </div>
        </div>

        {risk?.customer?.name && (
          <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
            {risk.customer.name}
          </span>
        )}
      </div>

      {/* Timeline Steps */}
      <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto w-full">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isSuccess = step.status === 'success';
          const isBlocked = step.status === 'blocked';
          const isEscalatedStatus = step.status === 'escalated';

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div
                className={`w-full text-center p-3.5 rounded-[12px] border transition-colors ${
                  isSuccess
                    ? 'border-[#10B981]/30 bg-[#10B981]/[0.05]'
                    : isEscalatedStatus
                    ? 'border-[#E8A33D]/30 bg-[#E8A33D]/[0.05]'
                    : isBlocked
                    ? 'border-[#F0625A]/30 bg-[#F0625A]/[0.05]'
                    : isActive
                    ? 'border-[#3B82F6]/40 bg-[#3B82F6]/[0.05]'
                    : isCompleted
                    ? 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E121A]'
                    : 'border-dashed border-slate-200 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#0E121A]/40 opacity-50'
                }`}
              >
                {/* Status Header */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium tracking-[0.02em]">
                  {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" />}
                  {isCompleted && <Check className="w-3.5 h-3.5 text-slate-600 dark:text-[#9CA3B0]" />}
                  {isSuccess && <span className="text-[#059669] dark:text-[#10B981] font-bold">✓</span>}
                  <span
                    className={
                      isSuccess
                        ? 'text-[#059669] dark:text-[#10B981] font-semibold text-xs'
                        : isBlocked
                        ? 'text-[#E11D48] dark:text-[#F0625A] font-semibold text-xs'
                        : isEscalatedStatus
                        ? 'text-[#D97706] dark:text-[#E8A33D] font-semibold text-xs'
                        : isActive
                        ? 'text-[#3B82F6] font-semibold text-xs'
                        : isCompleted
                        ? 'text-slate-800 dark:text-[#F5F6FA] font-medium text-xs'
                        : 'text-slate-400 dark:text-[#6B7280] text-xs'
                    }
                  >
                    {step.title}
                  </span>
                </div>

                {/* Subtitle / Value */}
                <div
                  className={`mt-1 tabular-nums ${
                    isSuccess
                      ? 'text-2xl text-[#059669] dark:text-[#10B981] font-semibold'
                      : isBlocked
                      ? 'text-sm text-[#E11D48] dark:text-[#F0625A] font-medium'
                      : isEscalatedStatus
                      ? 'text-sm text-[#D97706] dark:text-[#E8A33D] font-medium'
                      : isCompleted
                      ? 'text-sm text-slate-900 dark:text-[#F5F6FA] font-medium'
                      : 'text-xs text-slate-400 dark:text-[#6B7280]'
                  }`}
                >
                  {step.subtitle}
                </div>

                {/* Micro Detail */}
                <div className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5 truncate">
                  {step.detail}
                </div>
              </div>

              {/* Connecting Down Arrow ↓ */}
              {!isLast && (
                <div
                  className={`flex justify-center py-0.5 transition-colors ${
                    isCompleted ? 'text-slate-400 dark:text-[#6B7280]' : 'text-slate-300 dark:text-[#6B7280]/40'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Interactive Action Trigger */}
      {onExecuteStep && !isRecovered && isApproved && (
        <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onExecuteStep}
            disabled={isExecuting}
            className="w-full py-2.5 px-3 rounded-[10px] bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executing step...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Execute recovery action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
