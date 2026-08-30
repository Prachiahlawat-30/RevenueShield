import React from 'react';
import { ArrowRight, Server, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuthorizationDecisionResponse } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface Props {
  decision: AuthorizationDecisionResponse;
}

export const VisualDecisionPath: React.FC<Props> = ({ decision }) => {
  const steps = [
    {
      title: '1. Intelligent Gateway',
      value: decision.recommended_strategy.gateway,
      subtext: `Optimal routing for ${decision.payment_method}`,
      icon: Server,
      color: 'text-brand-500',
    },
    {
      title: '2. Smart 3DS Optimization',
      value: decision.recommended_strategy.authentication,
      subtext: decision.customer_friction_label || 'Frictionless Evaluation',
      icon: ShieldAlert,
      color: 'text-indigo-500',
    },
    {
      title: '3. Network Tokenization',
      value: decision.recommended_strategy.token_strategy,
      subtext: 'Account Updater & Cryptogram',
      icon: KeyRound,
      color: 'text-emerald-500',
    },
  ];

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex items-center justify-between border-b border-fintech-border pb-3">
        <h3 className="text-sm font-bold text-fintech-primary">End-to-End Decision Pathway</h3>
        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Auth: {formatPercent(decision.authorization_probability * 100)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-2 relative"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-fintech-sm bg-fintech-surface border border-fintech-border ${step.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted font-mono">
                  {step.title}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-fintech-primary">{step.value}</p>
                <p className="text-[11px] text-fintech-muted mt-0.5">{step.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-fintech-border flex items-center justify-between text-xs">
        <span className="text-fintech-muted">Expected Net Revenue:</span>
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(decision.expected_net_revenue)}
        </span>
      </div>
    </div>
  );
};
