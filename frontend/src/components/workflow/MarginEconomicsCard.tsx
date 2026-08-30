import React from 'react';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface MarginEconomicsCardProps {
  actionLabel: string;
  interventionCost: number | string;
  expectedGrossRecovery: number | string;
  expectedNetRecovery: number | string;
  isMarginViable: boolean;
  rationale: string;
}

export const MarginEconomicsCard: React.FC<MarginEconomicsCardProps> = ({
  actionLabel,
  interventionCost,
  expectedGrossRecovery,
  expectedNetRecovery,
  isMarginViable,
  rationale,
}) => {
  return (
    <div
      className={`p-4 rounded-fintech-md border space-y-3 text-xs transition-all ${
        isMarginViable
          ? 'bg-fintech-surface border-fintech-border'
          : 'bg-rose-500/5 border-rose-500/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className={`w-4 h-4 ${isMarginViable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
          <span className="font-bold text-fintech-primary">Unit Recovery Economics</span>
          <span className="text-fintech-muted">({actionLabel})</span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase font-mono ${
            isMarginViable
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          {isMarginViable ? 'Margin Viable' : 'Margin Negative Guard'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-fintech-muted text-[10px] block uppercase font-semibold">Gross Expected</span>
          <span className="font-mono font-bold text-fintech-primary text-sm">
            {formatCurrency(expectedGrossRecovery)}
          </span>
        </div>
        <div className="p-2.5 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-fintech-muted text-[10px] block uppercase font-semibold">Intervention Cost</span>
          <span className="font-mono font-bold text-fintech-secondary text-sm">
            {formatCurrency(interventionCost)}
          </span>
        </div>
        <div className="p-2.5 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-fintech-muted text-[10px] block uppercase font-semibold">Expected Net</span>
          <span
            className={`font-mono font-black text-sm ${
              Number(expectedNetRecovery) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(expectedNetRecovery)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-fintech-muted italic leading-relaxed pt-0.5">
        "{rationale}"
      </p>
    </div>
  );
};
