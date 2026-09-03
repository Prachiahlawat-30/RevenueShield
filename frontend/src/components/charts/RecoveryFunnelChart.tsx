import React from 'react';
import { RecoveryFunnelItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  data: RecoveryFunnelItem[];
}

export const RecoveryFunnelChart: React.FC<Props> = ({ data }) => {
  const maxAmount = Math.max(...data.map((d) => Number(d.amount) || 1));

  return (
    <div className="space-y-4 py-1">
      {data.map((item, index) => {
        const amountNum = Number(item.amount);
        const percentage = Math.max(8, Math.round((amountNum / maxAmount) * 100));
        const isFinal = index === data.length - 1;

        return (
          <div key={index} className="space-y-1.5">
            {/* Top Row: Stage Name & Amount */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-medium bg-white/[0.06] text-[#9CA3B0] border border-white/[0.08] shrink-0">
                  {index + 1}
                </span>
                <span className="font-medium text-[#F5F6FA] text-xs truncate">
                  {item.stage}
                </span>
              </div>
              <span className="font-semibold text-[#F5F6FA] text-xs shrink-0 pl-2 tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </div>

            {/* Middle Row: Progress Bar */}
            <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isFinal ? 'bg-[#10B981]' : 'bg-[#3B82F6]'
                }`}
                style={{
                  width: `${percentage}%`,
                  opacity: isFinal ? 1.0 : 0.6 + (index / data.length) * 0.4,
                }}
              />
            </div>

            {/* Bottom Row: Context Description & Conversion Rate */}
            <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
              <span className="truncate pr-2">{item.description}</span>
              <span className={`shrink-0 font-medium tabular-nums ${isFinal ? 'text-[#10B981]' : 'text-[#9CA3B0]'}`}>
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
