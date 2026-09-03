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
  accent?: 'default' | 'success' | 'danger' | 'warning' | 'purple' | 'blue';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'positive',
  deltaLabel = 'vs prev 14d',
  icon: Icon,
  tooltip,
  subtext,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/80 dark:hover:bg-white/[0.07] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="h-3.5 w-3.5 cursor-help text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" />
            </Tooltip>
          )}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {value}
        </div>
      </div>

      {(delta !== undefined || subtext) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-mono text-[11px] font-medium ${
                deltaType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {deltaType === 'positive' && <TrendingUp className="h-3 w-3" />}
              {deltaType === 'negative' && <TrendingDown className="h-3 w-3" />}
              {delta}
            </span>
          )}
          {deltaLabel && delta !== undefined && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {deltaLabel}
            </span>
          )}
          {subtext && !delta && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
