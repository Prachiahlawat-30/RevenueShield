import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

  // Vibrant stage color palette
  const stageColors = [
    { bg: 'bg-indigo-500', text: 'text-indigo-500 dark:text-indigo-400', bar: 'bg-gradient-to-r from-indigo-600 to-indigo-400' },
    { bg: 'bg-purple-500', text: 'text-purple-500 dark:text-purple-400', bar: 'bg-gradient-to-r from-purple-600 to-purple-400' },
    { bg: 'bg-cyan-500', text: 'text-cyan-500 dark:text-cyan-400', bar: 'bg-gradient-to-r from-cyan-600 to-cyan-400' },
    { bg: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400', bar: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]' },
  ];

  return (
    <div className="space-y-4 py-1">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(8, Math.round((amountNum / maxAmount) * 100));
        const color = stageColors[index % stageColors.length];

        return (
          <div key={index} className="space-y-1.5">
            {/* Top Row: Stage Name & Amount */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold text-white ${color.bg} shrink-0 shadow-xs`}>
                  {index + 1}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                  {item.stage}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs shrink-0 pl-2">
                {formatCurrency(item.amount)}
              </span>
            </div>

            {/* Middle Row: Vibrant Progress Bar */}
            <div className="w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Bottom Row: Context Description & Conversion Rate */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="truncate pr-2">{item.description}</span>
              <span className={`shrink-0 font-bold ${color.text}`}>{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
