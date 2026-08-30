import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Zap,
  TrendingUp,
  CreditCard,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { AuthorizationDecisionResponse } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface Props {
  decision: AuthorizationDecisionResponse;
  onOpenWhatIf?: () => void;
}

export const AdaptiveAuthorizationCard: React.FC<Props> = ({ decision, onOpenWhatIf }) => {
  const isApproved = decision.policy_result.status === 'ALLOW';

  return (
    <div className="rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-5 shadow-fintech-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300 border border-brand-500/20 uppercase tracking-wider font-mono">
              Adaptive Auth Engine
            </span>
            <span className="text-[10px] font-mono text-fintech-muted">
              Tx: {decision.transaction_id}
            </span>
          </div>
          <h3 className="text-base font-bold text-fintech-primary mt-1">
            Pre-Recovery Authorization Optimization
          </h3>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Real-time routing, 3DS authentication challenge selection, and network tokenization optimization.
          </p>
        </div>

        {onOpenWhatIf && (
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-fintech-md text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all font-mono"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simulate What-If</span>
          </button>
        )}
      </div>

      {/* Recommended Strategy Banner */}
      <div className="rounded-fintech-md border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-fintech-primary">
              Recommended Routing: <strong className="text-emerald-600 dark:text-emerald-400">{decision.recommended_strategy.gateway}</strong>
            </span>
          </div>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            {decision.recommended_strategy.authentication}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-emerald-500/20">
          <div>
            <span className="text-fintech-muted block text-[10px] font-mono">Gateway Rail</span>
            <span className="font-semibold text-fintech-primary">{decision.recommended_strategy.gateway}</span>
          </div>
          <div>
            <span className="text-fintech-muted block text-[10px] font-mono">3DS / Auth Challenge</span>
            <span className="font-semibold text-fintech-primary">{decision.recommended_strategy.authentication}</span>
          </div>
          <div>
            <span className="text-fintech-muted block text-[10px] font-mono">Tokenization</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{decision.recommended_strategy.token_strategy}</span>
          </div>
        </div>
      </div>

      {/* 4 Quantitative Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Authorization Probability */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
          <span className="text-[10px] uppercase font-semibold text-fintech-muted block font-mono">Authorization Prob</span>
          <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {(decision.authorization_probability * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
            +{formatPercent(decision.expected_revenue_lift * 100)} lift
          </span>
        </div>

        {/* Expected Net Value */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
          <span className="text-[10px] uppercase font-semibold text-fintech-muted block font-mono">Expected Net Yield</span>
          <span className="text-lg font-mono font-bold text-fintech-primary mt-0.5 block">
            {formatCurrency(decision.expected_net_revenue)}
          </span>
          <span className="text-[10px] text-fintech-muted font-mono">Net of interchange</span>
        </div>

        {/* Processing Cost */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
          <span className="text-[10px] uppercase font-semibold text-fintech-muted block font-mono">Processing Fee</span>
          <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
            {formatCurrency(decision.estimated_cost)}
          </span>
          <span className="text-[10px] text-fintech-muted font-mono">Interchange estimate</span>
        </div>

        {/* Policy Guardrail Status */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
          <span className="text-[10px] uppercase font-semibold text-fintech-muted block font-mono">Policy Gate</span>
          <div className="flex items-center gap-1.5 mt-1">
            {isApproved ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span
              className={`text-xs font-mono font-bold ${
                isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {decision.policy_result.status}
            </span>
          </div>
          <span className="text-[10px] text-fintech-muted font-mono block truncate mt-0.5">
            {decision.policy_result.rules_evaluated.join(', ') || 'Standard limits verified'}
          </span>
        </div>
      </div>
    </div>
  );
};
