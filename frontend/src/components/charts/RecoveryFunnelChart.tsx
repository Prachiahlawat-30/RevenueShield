import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

  const getStageBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
      case 1:
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 2:
        return 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  const getProgressColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-rose-500';
      case 1:
        return 'bg-amber-500';
      case 2:
        return 'bg-brand-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-2 py-0.5">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(10, Math.round((amountNum / maxAmount) * 100));

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-fintech-primary flex items-center gap-1.5 truncate">
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono font-bold border ${getStageBadgeStyle(index)}`}>
                  {index + 1}
                </span>
                <span className="truncate">{item.stage}</span>
              </span>
              <span className="font-mono font-bold text-fintech-primary text-xs shrink-0">
                {formatCurrency(item.amount)}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(index)} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
