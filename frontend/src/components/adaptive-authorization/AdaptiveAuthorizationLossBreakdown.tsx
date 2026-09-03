import React, { useEffect, useState } from 'react';
import { AlertOctagon, TrendingDown, ShieldCheck, DollarSign } from 'lucide-react';
import { AuthorizationLossBreakdownResponse } from '../../types';
import { getAuthorizationLossBreakdown } from '../../api/authorization';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export const AdaptiveAuthorizationLossBreakdown: React.FC = () => {
  const [data, setData] = useState<AuthorizationLossBreakdownResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBreakdown = async () => {
      try {
        setLoading(true);
        const res = await getAuthorizationLossBreakdown();
        setData(res);
      } catch (err) {
        console.error('Failed to load authorization loss breakdown', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBreakdown();
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 text-center text-fintech-muted text-xs animate-pulse">
        Calculating pre-recovery revenue leakage across authorization stages...
      </div>
    );
  }

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-fintech-primary">
              Pre-Recovery Authorization Loss Breakdown
            </h3>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Breakdown of revenue leaked at checkout before failed transaction dunning begins
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-fintech-muted uppercase font-mono block">Preventable by RevenueShield</span>
            <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.preventable_total)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.categories.map((cat, idx) => (
          <div
            key={idx}
            className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fintech-primary truncate">{cat.category}</span>
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(cat.lost_amount)}
              </span>
            </div>

            <p className="text-[11px] text-fintech-secondary leading-relaxed">
              {cat.explanation}
            </p>

            <div className="pt-2 border-t border-fintech-border flex items-center justify-between text-[10px] font-mono">
              <span className="text-fintech-muted">Preventable:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(cat.preventable_by_recoverai)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
