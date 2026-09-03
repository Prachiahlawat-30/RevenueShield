import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaType?: 'positive' | 'negative' | 'neutral';
  deltaLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tooltip?: string;
  subtext?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'positive',
  deltaLabel = 'vs prev period',
  icon: Icon,
  tooltip,
  subtext,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card transition-all duration-150 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.04em] text-slate-500 dark:text-[#6B7280] uppercase">
          <span>{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="h-3.5 w-3.5 cursor-help text-slate-400 hover:text-slate-600 dark:text-[#6B7280] dark:hover:text-[#9CA3B0] transition-colors" />
            </Tooltip>
          )}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-[#9CA3B0]">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-[#F5F6FA] tabular-nums">
          {value}
        </div>
      </div>

      {(delta !== undefined || subtext) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${
                deltaType === 'positive'
                  ? 'text-[#059669] dark:text-[#10B981]'
                  : deltaType === 'negative'
                  ? 'text-[#E11D48] dark:text-[#F0625A]'
                  : 'text-slate-600 dark:text-[#9CA3B0]'
              }`}
            >
              {deltaType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {deltaType === 'negative' && <TrendingDown className="h-3 w-3" />}
              {delta}
            </span>
          )}
          {deltaLabel && delta !== undefined && (
            <span className="text-xs text-slate-500 dark:text-[#6B7280]">
              {deltaLabel}
            </span>
          )}
          {subtext && !delta && (
            <span className="text-xs text-slate-500 dark:text-[#6B7280]">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
