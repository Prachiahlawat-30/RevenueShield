import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { RecoveryOpportunityItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { executeRecoveryStep } from '../../api/recovery';
import { Button } from '../ui/Button';

interface OpportunityDetailDrawerProps {
  opportunity: RecoveryOpportunityItem | null;
  isOpen: boolean;
  onClose: () => void;
  onActionExecuted?: () => void;
}

export const OpportunityDetailDrawer: React.FC<OpportunityDetailDrawerProps> = ({
  opportunity,
  isOpen,
  onClose,
  onActionExecuted,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>(
    opportunity?.recommended_action || 'send_payment_reminder'
  );
  const [currentStatus, setCurrentStatus] = useState<string>(
    opportunity?.status || 'detected'
  );
  const [executionFeedback, setExecutionFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (opportunity) {
      setSelectedAction(opportunity.recommended_action);
      setCurrentStatus(opportunity.status);
      setExecutionFeedback(null);
    }
  }, [opportunity]);

  if (!isOpen || !opportunity) return null;

  const handleExecute = async (actionToRun?: string) => {
    const action = actionToRun || selectedAction || opportunity.recommended_action;
    try {
      setIsExecuting(true);
      setExecutingAction(action);
      setExecutionFeedback(null);
      const res = await executeRecoveryStep(opportunity.risk_id, true, action);
      setCurrentStatus(res.current_status);
      const actionLabel =
        opportunity.candidates.find((c) => c.action === action)?.action_label || action;
      setExecutionFeedback(
        `✓ Action '${actionLabel}' executed successfully! New Status: ${res.current_status.toUpperCase()}${
          Number(res.amount_recovered) > 0
            ? ` • Recovered: ${formatCurrency(res.amount_recovered)}`
            : ''
        }`
      );
      if (onActionExecuted) {
        onActionExecuted();
      }
    } catch (err: any) {
      setExecutionFeedback(
        `Execution failed: ${err.response?.data?.detail || err.message || 'Unknown error'}`
      );
    } finally {
      setIsExecuting(false);
      setExecutingAction(null);
    }
  };

  const getPriorityColor = (band: string) => {
    switch (band) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30';
      default:
        return 'bg-fintech-surface-subtle text-fintech-muted border-fintech-border';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-150">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-2xl bg-fintech-surface border-l border-fintech-border flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-fintech-border flex items-center justify-between sticky top-0 bg-fintech-surface/95 backdrop-blur z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30 font-mono">
                  Opportunity Analysis
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded border font-mono ${getPriorityColor(
                    opportunity.priority_band
                  )}`}
                >
                  Score {opportunity.priority_score} • {opportunity.priority_band}
                </span>
              </div>
              <h2 className="text-xl font-bold text-fintech-primary mt-1.5 flex items-center gap-2">
                {opportunity.customer_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-fintech-muted hover:text-fintech-primary rounded-fintech-sm hover:bg-fintech-surface-subtle transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">
            {/* Feedback notification */}
            {executionFeedback && (
              <div className="p-4 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-fintech-primary">Execution Result</p>
                  <p>{executionFeedback}</p>
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
                <p className="text-xs text-fintech-muted">Failed Amount</p>
                <p className="text-lg font-bold text-fintech-primary mt-0.5 font-mono">
                  {formatCurrency(opportunity.transaction_amount)}
                </p>
                <span className="text-[10px] text-fintech-muted font-mono">{opportunity.currency}</span>
              </div>
              <div className="p-3.5 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Expected Recovery</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">
                  {formatCurrency(opportunity.expected_recovery_value)}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-500/80 font-mono">
                  {formatPercent(opportunity.recovery_probability * 100)} expected yield
                </span>
              </div>
              <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
                <p className="text-xs text-fintech-muted">Failure Type</p>
                <p className="text-sm font-semibold text-fintech-primary mt-1 truncate">
                  {opportunity.failure_type_label}
                </p>
                <span className="text-[10px] text-fintech-muted">{opportunity.attempt_count} attempts made</span>
              </div>
            </div>

            {/* Section 1: Recovery Probability & Explainability */}
            <div className="p-5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-500" />
                  <h3 className="text-sm font-semibold text-fintech-primary uppercase tracking-wider">
                    Recovery Likelihood Model
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                    {formatPercent(opportunity.recovery_probability * 100)}
                  </span>
                  <span className="text-xs text-fintech-muted">({opportunity.recoverability_score}/100)</span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${
                    opportunity.recovery_probability >= 0.75
                      ? 'bg-emerald-500'
                      : opportunity.recovery_probability >= 0.5
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${opportunity.recovery_probability * 100}%` }}
                />
              </div>

              {/* Factors */}
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-fintech-muted uppercase tracking-wider">
                  Why this score? (Explainable Factors)
                </p>
                <div className="space-y-1.5">
                  {opportunity.positive_factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-fintech-secondary">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </div>
                  ))}
                  {opportunity.negative_factors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-fintech-muted">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Next Best Action Engine */}
            <div className="p-5 rounded-fintech-md bg-brand-500/5 border border-brand-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  <h3 className="text-sm font-semibold text-fintech-primary uppercase tracking-wider">
                    Recommended Next Action
                  </h3>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-fintech-sm bg-brand-500 text-white shadow-fintech-sm uppercase tracking-wider">
                  {opportunity.recommended_action_label}
                </span>
              </div>

              <p className="text-xs text-fintech-secondary leading-relaxed bg-fintech-surface p-3 rounded-fintech-md border border-fintech-border">
                {opportunity.reason}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-fintech-surface rounded-fintech-md border border-fintech-border flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-fintech-muted" />
                  <div>
                    <p className="text-[10px] text-fintech-muted">Recommended Timing</p>
                    <p className="font-semibold text-fintech-primary">{opportunity.recommended_delay_label}</p>
                  </div>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-md border border-fintech-border flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-fintech-muted">Expected Net Recovery</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(opportunity.expected_recovery_value)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Candidate Evaluation Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-fintech-muted uppercase tracking-wider">
                    Intervention Candidates (Click to Select or Execute)
                  </p>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono">
                    Select any action to override AI recommendation
                  </span>
                </div>
                <div className="space-y-2">
                  {opportunity.candidates.map((cand, idx) => {
                    const isSelected = selectedAction === cand.action;
                    const isAiPick = cand.action === opportunity.recommended_action;
                    const isRowExecuting = executingAction === cand.action;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedAction(cand.action)}
                        className={`p-3 rounded-fintech-md border text-xs flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500 text-fintech-primary font-medium shadow-fintech-sm'
                            : 'bg-fintech-surface border-fintech-border text-fintech-secondary hover:border-brand-500/40 hover:bg-fintech-surface-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected
                                ? 'border-brand-500 bg-brand-500 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-[10px] text-fintech-muted font-mono">{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-fintech-primary">{cand.action_label}</span>
                            {isAiPick && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-300 font-mono">
                                AI Recommended
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-fintech-secondary text-[11px]">
                            {formatPercent(cand.action_recovery_probability * 100)}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            {formatCurrency(cand.expected_recovery_value)}
                          </span>
                          <span className="text-[10px] text-fintech-muted font-mono hidden sm:inline">
                            -${Number(cand.intervention_cost).toFixed(2)} cost
                          </span>
                          <button
                            type="button"
                            disabled={currentStatus === 'recovered' || isExecuting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecute(cand.action);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-fintech-sm border transition flex items-center gap-1 ${
                              isSelected
                                ? 'bg-brand-500 text-white border-brand-500 hover:bg-brand-600'
                                : 'bg-fintech-surface-subtle text-brand-600 dark:text-brand-400 border-fintech-border hover:bg-brand-500/10 hover:border-brand-500/30'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isRowExecuting ? (
                              <span className="inline-block animate-spin mr-1">●</span>
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            Execute
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 3: Deterministic Policy Engine Gate */}
            {opportunity.policy_preview && (
              <div className="p-5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-semibold text-fintech-primary uppercase tracking-wider">
                      Policy Engine Verification
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider font-mono ${
                      opportunity.policy_preview.is_approved
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {opportunity.policy_preview.is_approved ? 'APPROVED' : 'BLOCKED'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {opportunity.policy_preview.applied_rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-fintech-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-[11px]">{rule}</span>
                    </div>
                  ))}
                </div>

                {opportunity.policy_preview.rejection_reason && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded border border-rose-500/30 mt-2">
                    {opportunity.policy_preview.rejection_reason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 border-t border-fintech-border bg-fintech-surface sticky bottom-0 flex items-center justify-between">
            <div className="text-xs text-fintech-muted">
              <span>Risk Status: </span>
              <span className="font-mono uppercase font-bold text-brand-600 dark:text-brand-400">
                {currentStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={Zap}
                isLoading={isExecuting && !executingAction}
                disabled={currentStatus === 'recovered' || isExecuting}
                onClick={() => handleExecute(selectedAction)}
              >
                Execute: {opportunity.candidates.find((c) => c.action === selectedAction)?.action_label || 'Next Step'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
