import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

  return (
    <div className="space-y-3 py-1">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(8, Math.round((amountNum / maxAmount) * 100));

        return (
          <div key={index} className="space-y-1.5">
            {/* Top Row: Stage Name & Amount */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-mono font-semibold bg-slate-900/[0.06] dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0">
                  {index + 1}
                </span>
                <span className="font-medium text-slate-900 dark:text-white text-[11px] truncate">
                  {item.stage}
                </span>
              </div>
              <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs shrink-0 pl-2">
                {formatCurrency(item.amount)}
              </span>
            </div>

            {/* Middle Row: Clean Monochrome Progress Bar */}
            <div className="w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 dark:bg-white transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  opacity: 0.35 + (index / Math.max(data.length - 1, 1)) * 0.65,
                }}
              />
            </div>

            {/* Bottom Row: Context Description & Conversion Rate */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="truncate pr-2">{item.description}</span>
              <span className="shrink-0 font-medium text-slate-600 dark:text-slate-300">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
