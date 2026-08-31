import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

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

  const getBadgeStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 1:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 2:
        return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-2.5 py-0.5">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(8, Math.round((amountNum / maxAmount) * 100));

        return (
          <div key={index} className="space-y-1">
            {/* Top Row: Stage Name & Amount */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono font-bold border shrink-0 ${getBadgeStyle(index)}`}>
                  {index + 1}
                </span>
                <span className="font-semibold text-fintech-primary text-[11px] truncate">
                  {item.stage}
                </span>
              </div>
              <span className="font-mono font-bold text-fintech-primary text-xs shrink-0 pl-2">
                {formatCurrency(item.amount)}
              </span>
            </div>

            {/* Middle Row: Clean Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(index)} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Bottom Row: Context Description & Conversion Rate */}
            <div className="flex items-center justify-between text-[10px] text-fintech-muted font-mono">
              <span className="truncate pr-2">{item.description}</span>
              <span className="shrink-0 font-bold text-fintech-secondary">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
