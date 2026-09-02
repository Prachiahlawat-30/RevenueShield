import React from 'react';
import {
  Check,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
  Zap,
  Brain,
  Sparkles,
  Layers,
  Loader2,
  XCircle,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { RevenueRisk, AIDiagnosisResult, PolicyEvaluationResult, RecoveryExecutionResult } from '../../types';
import { formatCurrency, formatIndianLakhs, getActionLabel, getFailureTypeLabel } from '../../utils/formatters';

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
  // Format real timestamps from database objects
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

  // Dynamic values based on REAL state
  const hasDiagnosis = Boolean(diagnosis || stage !== 'DETECTED');
  const actionName = diagnosis?.recommended_action
    ? getActionLabel(diagnosis.recommended_action)
    : risk?.status === 'escalated'
    ? 'escalate to human'
    : 'Retry payment';

  const confidenceScore = diagnosis?.confidence_score
    ? Math.round(diagnosis.confidence_score * 100)
    : 85;

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

  const formattedAmount = `${currencySymbol}${amountVal.toLocaleString()}`;

  // Build the 6 functional dynamic steps
  const steps = [
    // 1. DETECTED
    {
      id: 'DETECTED',
      status: 'completed',
      title: '✓ DETECTED',
      subtitle: detectedTime,
      detail: risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Decline Ingested',
    },
    // 2. DIAGNOSING
    {
      id: 'DIAGNOSING',
      status: hasDiagnosis ? 'completed' : stage === 'DIAGNOSING' ? 'active' : 'pending',
      title: hasDiagnosis ? '✓ DIAGNOSING' : stage === 'DIAGNOSING' ? '⟳ DIAGNOSING...' : '◌ DIAGNOSING',
      subtitle: hasDiagnosis ? diagnosingTime : 'Awaiting diagnostic run',
      detail: diagnosis?.root_cause_summary || (risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Root cause analysis'),
    },
    // 3. ACTION SELECTED
    {
      id: 'ACTION_SELECTED',
      status: hasDiagnosis ? 'completed' : 'pending',
      title: hasDiagnosis ? '✓ ACTION SELECTED' : '◌ ACTION SELECTION',
      subtitle: hasDiagnosis ? actionName : 'Pending diagnosis',
      detail: hasDiagnosis ? `AI Confidence: ${confidenceScore}%` : 'Optimal yield strategy',
    },
    // 4. POLICY CHECK
    {
      id: 'POLICY_CHECK',
      status: isPolicyChecked
        ? isApproved
          ? 'completed'
          : 'blocked'
        : stage === 'POLICY_CHECK'
        ? 'active'
        : 'pending',
      title: isPolicyChecked
        ? isApproved
          ? '✓ POLICY CHECK'
          : '✕ POLICY BLOCKED'
        : '◌ POLICY CHECK',
      subtitle: isPolicyChecked
        ? isApproved
          ? 'Approved'
          : 'Requires Manual Override'
        : 'Deterministic guardrail verification',
      detail: isPolicyChecked
        ? isApproved
          ? '0 violations • Cooldown & caps satisfied'
          : policyEvaluation?.rejection_reason || 'Rule limit reached'
        : '5 merchant safety rules pending',
    },
    // 5. EXECUTED
    {
      id: 'EXECUTED',
      status: hasExecuted
        ? 'completed'
        : isExecuting || stage === 'EXECUTING'
        ? 'active'
        : 'pending',
      title: hasExecuted
        ? '✓ EXECUTED'
        : isExecuting || stage === 'EXECUTING'
        ? '⟳ EXECUTING...'
        : '◌ EXECUTED',
      subtitle: hasExecuted
        ? executionChannel
        : isExecuting
        ? 'Dispatching payment retry...'
        : 'Awaiting execution',
      detail: hasExecuted ? executedTime : 'Optimal routing channel',
    },
    // 6. RECOVERED / TERMINAL OUTCOME
    {
      id: 'RECOVERED',
      status: isRecovered ? 'success' : isEscalated ? 'escalated' : isStopped ? 'stopped' : 'pending',
      title: isRecovered
        ? '💰 RECOVERED'
        : isEscalated
        ? '👤 ESCALATED'
        : isStopped
        ? '🛑 STOPPED'
        : '⏳ RECOVERY PENDING',
      subtitle: isRecovered
        ? formattedAmount
        : isEscalated
        ? 'Sent to Human Ops'
        : isStopped
        ? 'Max Attempts'
        : `${formattedAmount} at risk`,
      detail: isRecovered
        ? 'Settled to merchant ledger'
        : isEscalated
        ? 'Agent review dispatched'
        : isStopped
        ? 'Retry cap enforced'
        : 'Awaiting final capture settlement',
      isHero: true,
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] space-y-5 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Visual State Timeline
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
              TXN {risk?.transaction_id || risk?.id || 'Active Case'}
            </p>
          </div>
        </div>

        {risk?.customer?.name && (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Customer: {risk.customer.name}
          </span>
        )}
      </div>

      {/* Timeline Steps (Dynamic Causal Sequence) */}
      <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isSuccess = step.status === 'success';
          const isBlocked = step.status === 'blocked';
          const isEscalatedStatus = step.status === 'escalated';
          const isPending = step.status === 'pending';

          return (
            <React.Fragment key={step.id}>
              {/* Step Card with dynamic styling */}
              <div
                className={`w-full text-center p-3.5 rounded-xl border transition-all ${
                  isSuccess
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/40 dark:to-slate-900 shadow-md ring-2 ring-emerald-500/20'
                    : isEscalatedStatus
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                    : isBlocked
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                    : isActive
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 animate-pulse'
                    : isCompleted
                    ? 'border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
                    : 'border-dashed border-slate-200 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 opacity-60'
                }`}
              >
                {/* Status Header: e.g. ✓ DETECTED or ⟳ DIAGNOSING */}
                <div className="flex items-center justify-center gap-1.5 font-bold font-mono text-xs tracking-wider">
                  {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  <span
                    className={
                      isSuccess
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold text-sm'
                        : isBlocked
                        ? 'text-rose-600 dark:text-rose-400'
                        : isEscalatedStatus
                        ? 'text-amber-600 dark:text-amber-400'
                        : isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }
                  >
                    {step.title}
                  </span>
                </div>

                {/* Subtitle / Value */}
                <div
                  className={`mt-1 font-bold font-mono ${
                    isSuccess
                      ? 'text-2xl text-emerald-600 dark:text-emerald-400 font-black'
                      : isBlocked
                      ? 'text-sm text-rose-700 dark:text-rose-300'
                      : isEscalatedStatus
                      ? 'text-sm text-amber-700 dark:text-amber-300'
                      : isCompleted
                      ? 'text-sm text-slate-800 dark:text-slate-200'
                      : 'text-xs text-slate-400 dark:text-slate-500 font-normal'
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
                      ? 'text-emerald-500/70 dark:text-emerald-500/50'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                >
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Interactive Action Trigger directly on the timeline */}
      {onExecuteStep && !isRecovered && isApproved && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onExecuteStep}
            disabled={isExecuting}
            className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:bg-slate-400 text-white text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
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
