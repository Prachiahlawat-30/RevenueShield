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
import { formatCurrency, getActionLabel, getFailureTypeLabel } from '../../utils/formatters';

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

  const currencySymbol = risk?.currency === 'USD' ? '$' : '₹';
  const amountVal =
    risk?.amount_recovered && Number(risk.amount_recovered) > 0
      ? Number(risk.amount_recovered)
      : risk?.amount_at_risk && Number(risk.amount_at_risk) > 0
      ? Number(risk.amount_at_risk)
      : 8500;

  const formattedAmount = `${currencySymbol}${amountVal.toLocaleString('en-IN')}`;

  const steps = [
    {
      id: 'DETECTED',
      status: 'completed',
      title: 'DETECTED',
      subtitle: detectedTime,
      detail: risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Temporary decline detected',
    },
    {
      id: 'DIAGNOSING',
      status: hasDiagnosis ? 'completed' : stage === 'DIAGNOSING' ? 'active' : 'pending',
      title: 'DIAGNOSING',
      subtitle: hasDiagnosis ? diagnosingTime : 'Diagnostic analysis',
      detail: diagnosis?.root_cause_summary || (risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Issuer failure context'),
    },
    {
      id: 'ACTION_SELECTED',
      status: hasDiagnosis ? 'completed' : 'pending',
      title: 'ACTION SELECTED',
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
      title: 'POLICY CHECK',
      subtitle: isPolicyChecked
        ? isApproved
          ? 'Approved'
          : 'Manual Override Required'
        : 'Safety check',
      detail: isPolicyChecked
        ? isApproved
          ? 'Cooldown satisfied • Retry limit not reached'
          : policyEvaluation?.rejection_reason || 'Rule limit reached'
        : 'Deterministic guardrails',
    },
    {
      id: 'EXECUTED',
      status: hasExecuted
        ? 'completed'
        : isExecuting || stage === 'EXECUTING'
        ? 'active'
        : 'pending',
      title: 'EXECUTED',
      subtitle: hasExecuted
        ? executionChannel
        : isExecuting
        ? 'Dispatching retry...'
        : 'Awaiting execution',
      detail: hasExecuted ? executedTime : 'Optimal routing channel',
    },
    {
      id: 'RECOVERED',
      status: isRecovered ? 'success' : isEscalated ? 'escalated' : isStopped ? 'stopped' : 'pending',
      title: isRecovered
        ? 'RECOVERED'
        : isEscalated
        ? 'ESCALATED'
        : isStopped
        ? 'STOPPED'
        : 'RECOVERY PENDING',
      subtitle: isRecovered
        ? formattedAmount
        : isEscalated
        ? 'Human review'
        : isStopped
        ? 'Max attempts reached'
        : `${formattedAmount} at risk`,
      detail: isRecovered
        ? 'Settled to merchant ledger'
        : isEscalated
        ? 'Sent to operator queue'
        : isStopped
        ? 'Retry ceiling enforced'
        : 'Awaiting capture settlement',
      isHero: true,
    },
  ];

  return (
    <div
      className={`rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900/[0.05] dark:bg-white/10 text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200/80 dark:border-white/10">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              STATE TIMELINE
            </h3>
            <p className="text-[11px] text-slate-900 dark:text-white font-mono font-semibold truncate max-w-xs">
              TXN {risk?.transaction_id || risk?.id || 'Active Case'}
            </p>
          </div>
        </div>

        {risk?.customer?.name && (
          <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-slate-500/[0.06] text-slate-700 dark:text-slate-300 border border-slate-500/15">
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
              {/* Step Card with subtle fintech styling */}
              <div
                className={`w-full text-center p-3.5 rounded-xl border transition-all duration-200 ${
                  isSuccess
                    ? 'border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] shadow-glass-1 ring-1 ring-emerald-500/20'
                    : isEscalatedStatus
                    ? 'border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]'
                    : isBlocked
                    ? 'border-rose-500/30 bg-rose-500/[0.04] dark:bg-rose-500/[0.06]'
                    : isActive
                    ? 'border-slate-400/40 bg-white/80 dark:bg-white/[0.08] ring-1 ring-slate-400/20 animate-pulse-subtle'
                    : isCompleted
                    ? 'border-slate-200/80 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03]'
                    : 'border-dashed border-slate-200/60 dark:border-white/[0.05] bg-white/20 dark:bg-white/[0.01] opacity-50'
                }`}
              >
                {/* Status Header */}
                <div className="flex items-center justify-center gap-1.5 font-mono text-xs tracking-wider">
                  {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700 dark:text-slate-300" />}
                  {isCompleted && <Check className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />}
                  {isSuccess && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
                  <span
                    className={
                      isSuccess
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold text-xs'
                        : isBlocked
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : isEscalatedStatus
                        ? 'text-amber-600 dark:text-amber-400 font-semibold'
                        : isActive
                        ? 'text-slate-900 dark:text-white font-semibold'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300 font-medium'
                        : 'text-slate-400'
                    }
                  >
                    {step.title}
                  </span>
                </div>

                {/* Subtitle / Value */}
                <div
                  className={`mt-1 font-mono ${
                    isSuccess
                      ? 'text-2xl text-slate-900 dark:text-white font-bold font-sans'
                      : isBlocked
                      ? 'text-sm text-rose-700 dark:text-rose-300 font-medium'
                      : isEscalatedStatus
                      ? 'text-sm text-amber-700 dark:text-amber-300 font-medium'
                      : isCompleted
                      ? 'text-sm text-slate-900 dark:text-white font-semibold'
                      : 'text-xs text-slate-400 font-normal'
                  }`}
                >
                  {step.subtitle}
                </div>

                {/* Micro Detail */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-sans">
                  {step.detail}
                </div>
              </div>

              {/* Connecting Down Arrow ↓ */}
              {!isLast && (
                <div
                  className={`flex justify-center py-0.5 transition-colors ${
                    isCompleted
                      ? 'text-slate-400 dark:text-slate-600'
                      : 'text-slate-300 dark:text-slate-700'
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
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onExecuteStep}
            disabled={isExecuting}
            className="w-full py-2.5 px-3 rounded-xl bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-slate-100 disabled:opacity-50 text-white text-xs font-semibold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs hover:-translate-y-[1px] transition-all cursor-pointer"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>EXECUTING STEP...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>EXECUTE RECOVERY ACTION</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
