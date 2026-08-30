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
  deltaLabel = 'vs prev 14d',
  icon: Icon,
  tooltip,
  subtext,
  className = '',
}) => {
  return (
    <div
      className={`rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm transition-all hover:shadow-fintech-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fintech-secondary">
          <span>{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="h-3.5 w-3.5 cursor-help text-fintech-muted hover:text-fintech-primary transition-colors" />
            </Tooltip>
          )}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-black font-sans tracking-tight text-fintech-primary sm:text-3xl">
          {value}
        </div>
      </div>

      {(delta !== undefined || subtext) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold ${
                deltaType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : deltaType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-fintech-muted'
              }`}
            >
              {deltaType === 'positive' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : deltaType === 'negative' ? (
                <TrendingDown className="h-3.5 w-3.5" />
              ) : null}
              {delta}
            </span>
          )}
          {deltaLabel && (
            <span className="text-fintech-muted text-[11px]">{deltaLabel}</span>
          )}
          {subtext && (
            <span className="text-fintech-muted text-[11px] ml-auto">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
};
