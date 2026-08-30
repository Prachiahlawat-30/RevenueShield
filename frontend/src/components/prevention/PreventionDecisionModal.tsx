import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  Scale,
} from 'lucide-react';
import { executeProactiveAction } from '../../api/tier3';
import { PreventionDecisionResult, ProactiveActionExecutionResponse } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface PreventionDecisionModalProps {
  decision: PreventionDecisionResult | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PreventionDecisionModal: React.FC<PreventionDecisionModalProps> = ({
  decision,
  onClose,
  onSuccess,
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ProactiveActionExecutionResponse | null>(null);

  if (!decision) return null;

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      const res = await executeProactiveAction({
        customer_id: decision.customer_id,
        action_type: 'PROACTIVE_PAYMENT_METHOD_CHECK',
        custom_notes: `Operator triggered proactive intervention based on 3-way decision matrix (+${decision.net_value_advantage} net advantage)`,
      });
      setResult(res);
      if (res.policy_approved) {
        onSuccess(res.execution_message);
      }
    } catch (err: any) {
      console.error('Failed to execute proactive intervention:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-fintech-xl bg-fintech-surface border border-fintech-border shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg font-bold text-fintech-primary">Prevention vs Recovery Decision Matrix</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                Unit Economics & Yield
              </span>
            </div>
            <p className="text-xs text-fintech-secondary mt-1">
              Account: <strong className="text-fintech-primary">{decision.customer_name}</strong> • Upcoming:{' '}
              <strong className="text-fintech-primary font-mono">{formatCurrency(decision.upcoming_amount)}</strong> • Failure Probability:{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatPercent(decision.probability_of_failure * 100)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-fintech-sm text-fintech-muted hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Way Economic Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OPTION A: Do Nothing */}
          <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
                OPTION A
              </span>
              <h3 className="text-sm font-bold text-fintech-secondary">{decision.option_a.name}</h3>
              <p className="text-[11px] text-fintech-muted leading-snug">{decision.option_a.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-fintech-border text-xs">
              <div className="flex justify-between">
                <span className="text-fintech-muted">Expected Loss</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{formatCurrency(decision.option_a.expected_loss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Intervention Cost</span>
                <span className="font-mono text-fintech-secondary">$0.00</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-fintech-border font-bold">
                <span className="text-fintech-primary">Net Outcome</span>
                <span className="font-mono text-rose-600 dark:text-rose-400">{formatCurrency(decision.option_a.net_financial_outcome)}</span>
              </div>
              <div className="pt-1 text-[10px] text-fintech-muted">
                Churn Risk: <span className="text-rose-600 dark:text-rose-400 font-semibold">{decision.option_a.customer_churn_risk}</span>
              </div>
            </div>
          </div>

          {/* OPTION B: Recover After Failure */}
          <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
                OPTION B (REACTIVE)
              </span>
              <h3 className="text-sm font-bold text-fintech-secondary">{decision.option_b.name}</h3>
              <p className="text-[11px] text-fintech-muted leading-snug">{decision.option_b.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-fintech-border text-xs">
              <div className="flex justify-between">
                <span className="text-fintech-muted">Expected Recovered</span>
                <span className="font-mono text-fintech-secondary">{formatCurrency(decision.option_b.expected_recovered)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-muted">Retry/Dunning Cost</span>
                <span className="font-mono text-fintech-secondary">{formatCurrency(decision.option_b.intervention_cost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-fintech-border font-bold">
                <span className="text-fintech-primary">Net Yield</span>
                <span className="font-mono text-fintech-primary">{formatCurrency(decision.option_b.net_financial_yield)}</span>
              </div>
              <div className="pt-1 text-[10px] text-fintech-muted">
                Churn Risk: <span className="text-amber-600 dark:text-amber-400 font-semibold">{decision.option_b.customer_churn_risk}</span>
              </div>
            </div>
          </div>

          {/* OPTION C: Proactive Intervention (Winner) */}
          <div className="p-4 rounded-fintech-md bg-brand-500/5 border-2 border-brand-500/60 space-y-3 flex flex-col justify-between shadow-fintech-md relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block font-mono">
                  OPTION C (RECOMMENDED)
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500 text-white font-mono">
                  BEST OPTION
                </span>
              </div>
              <h3 className="text-sm font-bold text-fintech-primary">{decision.option_c.name}</h3>
              <p className="text-[11px] text-fintech-secondary leading-snug">{decision.option_c.description}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-brand-500/30 text-xs">
              <div className="flex justify-between">
                <span className="text-fintech-secondary">Prevented Loss</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(decision.option_c.expected_prevented_loss)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-fintech-secondary">Pre-Dunning Cost</span>
                <span className="font-mono text-fintech-secondary">{formatCurrency(decision.option_c.intervention_cost)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-brand-500/30 font-bold">
                <span className="text-fintech-primary">Net Yield</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(decision.option_c.net_financial_yield)}
                </span>
              </div>
              <div className="pt-1 text-[10px] text-fintech-muted">
                Churn Risk: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{decision.option_c.customer_churn_risk}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Rationale Box */}
        <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            AI Economic & Governance Rationale
          </span>
          <p className="text-fintech-primary leading-relaxed">{decision.economic_rationale}</p>
          <div className="pt-2 border-t border-fintech-border flex items-center justify-between text-[11px]">
            <span className="text-fintech-muted">
              Net Proactive Advantage:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                +{formatCurrency(decision.net_value_advantage)}
              </strong>
            </span>
            <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Policy Guardrails Verified
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-fintech-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Zap}
            isLoading={isExecuting}
            onClick={handleExecute}
          >
            Execute Option C
          </Button>
        </div>
      </div>
    </div>
  );
};
