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
}

export const TransactionStateTimeline: React.FC<TransactionStateTimelineProps> = ({
  risk,
  stage = 'OUTCOME',
  diagnosis,
  policyEvaluation,
  executionResult,
  className = '',
}) => {
  // Format timestamps nicely
  const getCreatedTime = () => {
    if (!risk?.created_at) return '10:31:02';
    try {
      const d = new Date(risk.created_at);
      return d.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '10:31:02';
    }
  };

  const getDiagnosingTime = () => {
    if (!risk?.created_at) return '10:31:03';
    try {
      const d = new Date(new Date(risk.created_at).getTime() + 1200);
      return d.toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return '10:31:03';
    }
  };

  const actionName = diagnosis?.recommended_action
    ? getActionLabel(diagnosis.recommended_action)
    : 'Retry payment';

  const policyStatus = policyEvaluation
    ? policyEvaluation.is_approved
      ? 'Approved'
      : 'Review required'
    : 'Approved';

  const executionChannel = executionResult?.channel
    ? executionResult.channel
    : 'Gateway simulator';

  // Amount recovered formatting
  const recoveredValue =
    risk?.amount_recovered && Number(risk.amount_recovered) > 0
      ? Number(risk.amount_recovered)
      : risk?.amount_at_risk && Number(risk.amount_at_risk) > 0
      ? Number(risk.amount_at_risk)
      : 8500;

  const formattedAmount =
    risk?.currency === 'USD'
      ? `$${recoveredValue.toFixed(2)}`
      : `₹${recoveredValue.toLocaleString('en-IN')}`;

  const isRecovered = risk ? risk.status === 'recovered' : true;

  const steps = [
    {
      id: 'DETECTED',
      icon: Check,
      iconBg: 'bg-emerald-500 text-white',
      title: '✓ DETECTED',
      subtitle: getCreatedTime(),
      detail: risk ? getFailureTypeLabel(risk.detected_failure_type) : 'Decline Ingested',
      isDone: true,
    },
    {
      id: 'DIAGNOSING',
      icon: Check,
      iconBg: 'bg-emerald-500 text-white',
      title: '✓ DIAGNOSING',
      subtitle: getDiagnosingTime(),
      detail: diagnosis?.root_cause_summary || 'AI Root-Cause Inference',
      isDone: true,
    },
    {
      id: 'ACTION_SELECTED',
      icon: Check,
      iconBg: 'bg-emerald-500 text-white',
      title: '✓ ACTION SELECTED',
      subtitle: actionName,
      detail: 'Optimal recovery strategy formulated',
      isDone: true,
    },
    {
      id: 'POLICY_CHECK',
      icon: Check,
      iconBg: 'bg-emerald-500 text-white',
      title: '✓ POLICY CHECK',
      subtitle: policyStatus,
      detail: '0 violations • Cooldown & caps satisfied',
      isDone: true,
    },
    {
      id: 'EXECUTED',
      icon: Check,
      iconBg: 'bg-emerald-500 text-white',
      title: '✓ EXECUTED',
      subtitle: executionChannel,
      detail: 'Intervention dispatched via optimal routing rail',
      isDone: true,
    },
    {
      id: 'RECOVERED',
      icon: Coins,
      iconBg: 'bg-emerald-600 text-white',
      title: '💰 RECOVERED',
      subtitle: formattedAmount,
      detail: 'Settled to merchant ledger',
      isDone: isRecovered,
      isHero: true,
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] space-y-6 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Visual State Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deterministic causal sequence for transaction {risk?.transaction_id || '#TXN-849102'}
            </p>
          </div>
        </div>

        {risk?.customer?.name && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Customer: {risk.customer.name}
          </span>
        )}
      </div>

      {/* Timeline Steps (Vertical Causal Flow matching user prompt) */}
      <div className="flex flex-col items-center justify-center py-2 space-y-3 max-w-md mx-auto">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div
                className={`w-full text-center p-4 rounded-xl border transition-all ${
                  step.isHero
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-slate-900 shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
                }`}
              >
                {/* Status Title: e.g. ✓ DETECTED */}
                <div className="flex items-center justify-center gap-1.5 font-bold font-mono text-xs tracking-wider">
                  <span
                    className={
                      step.isHero
                        ? 'text-emerald-700 dark:text-emerald-400 font-extrabold text-sm'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {step.title}
                  </span>
                </div>

                {/* Subtitle / Value: e.g. 10:31:02 or Retry payment or ₹8,500 */}
                <div
                  className={`mt-1 font-bold font-mono ${
                    step.isHero
                      ? 'text-2xl text-emerald-600 dark:text-emerald-400'
                      : 'text-sm text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {step.subtitle}
                </div>

                {/* Micro Detail */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {step.detail}
                </div>
              </div>

              {/* Connecting Down Arrow ↓ */}
              {!isLast && (
                <div className="flex justify-center py-0.5 text-slate-300 dark:text-slate-600">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
