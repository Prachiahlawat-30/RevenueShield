import React, { useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { AuthorizationStrategyCandidate } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface Props {
  alternatives?: AuthorizationStrategyCandidate[];
  amount?: number;
  paymentMethod?: string;
  onSelectCandidate?: (candidate: AuthorizationStrategyCandidate) => void;
}

export const AuthorizationStrategyTable: React.FC<Props> = ({
  alternatives = [],
  amount = 1250,
  onSelectCandidate,
}) => {
  const candidates = alternatives;

  if (candidates.length === 0) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 text-center text-fintech-muted text-xs">
        No candidate strategies available for this transaction profile.
      </div>
    );
  }

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex items-center justify-between border-b border-fintech-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-fintech-primary">Real-Time Routing & Strategy Rankings</h3>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Ranked by composite score of auth yield, processing cost, and checkout conversion
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-fintech-md border border-fintech-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-fintech-border bg-fintech-surface-subtle text-fintech-muted font-mono text-[10px]">
              <th className="py-2.5 px-3 uppercase">Rank</th>
              <th className="py-2.5 px-3 uppercase">Gateway</th>
              <th className="py-2.5 px-3 uppercase">Authentication Method</th>
              <th className="py-2.5 px-3 uppercase">Token Strategy</th>
              <th className="py-2.5 px-3 uppercase">Auth Rate</th>
              <th className="py-2.5 px-3 uppercase">Friction Level</th>
              <th className="py-2.5 px-3 uppercase">Cost</th>
              <th className="py-2.5 px-3 uppercase text-right">Expected Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fintech-border">
            {candidates.map((c) => {
              const isRecommended = c.is_recommended || c.rank === 1;

              return (
                <tr
                  key={c.rank}
                  onClick={() => onSelectCandidate && onSelectCandidate(c)}
                  className={`transition-colors cursor-pointer ${
                    isRecommended
                      ? 'bg-brand-500/5 hover:bg-brand-500/10'
                      : 'hover:bg-fintech-surface-subtle'
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-bold">
                    {isRecommended ? (
                      <span className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> #{c.rank}
                      </span>
                    ) : (
                      <span className="text-fintech-muted">#{c.rank}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-semibold text-fintech-primary">
                    {c.gateway_name}
                  </td>

                  <td className="py-3 px-3 text-fintech-secondary">
                    {c.authentication_method}
                  </td>

                  <td className="py-3 px-3 font-mono text-fintech-muted text-[11px]">
                    {c.token_strategy}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPercent(c.authorization_probability * 100)}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        c.customer_friction_label === 'LOW' || c.customer_friction_label === 'FRICTIONLESS'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : c.customer_friction_label === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {c.customer_friction_label || 'STANDARD'}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-fintech-muted">
                    {formatCurrency(c.estimated_cost)}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-right text-fintech-primary">
                    {formatCurrency(c.expected_net_revenue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
