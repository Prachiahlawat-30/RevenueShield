import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ArrowDown, DollarSign } from 'lucide-react';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

  const getStageColor = (index: number) => {
    switch (index) {
      case 0:
        return 'from-rose-600 to-rose-700 text-rose-300 border-rose-500/40';
      case 1:
        return 'from-amber-600 to-amber-700 text-amber-300 border-amber-500/40';
      case 2:
        return 'from-indigo-600 to-indigo-700 text-indigo-300 border-indigo-500/40';
      default:
        return 'from-emerald-600 to-emerald-700 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-3 py-1">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(12, Math.round((amountNum / maxAmount) * 100));

        return (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                  {index + 1}
                </span>
                {item.stage}
              </span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(item.amount)}
              </span>
            </div>

            <div className="w-full bg-slate-800/80 rounded-lg h-7 overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-md bg-gradient-to-r ${getStageColor(
                  index
                )} flex items-center justify-between px-3 text-[11px] font-medium text-white transition-all duration-500 shadow-sm`}
                style={{ width: `${percentage}%` }}
              >
                <span className="truncate pr-2">{item.description}</span>
                <span className="font-mono shrink-0">{percentage}%</span>
              </div>
            </div>

            {index < data.length - 1 && (
              <div className="flex justify-center -my-1 text-slate-600">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
