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
  accent = 'default',
}) => {
  // Subtle accents inspired by modern payment dashboards
  const getIconContainerStyle = () => {
    switch (accent) {
      case 'success':
        return 'bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20';
      case 'danger':
        return 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20';
      case 'warning':
        return 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20';
      case 'purple':
        return 'bg-[#F3EEFF] text-[#6822CC] border border-[#6822CC]/20';
      case 'blue':
        return 'bg-[#EFF4FF] text-[#2B6FFF] border border-[#2B6FFF]/20';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const getValueColor = () => {
    switch (accent) {
      case 'success':
        return 'text-[#16A34A]';
      case 'danger':
        return 'text-[#DC2626]';
      case 'warning':
        return 'text-[#F59E0B]';
      case 'purple':
        return 'text-[#6822CC]';
      default:
        return 'text-[#1A1A2E] dark:text-white';
    }
  };

  return (
    <div
      className={`rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          <span>{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="h-3.5 w-3.5 cursor-help text-[#9CA3AF] hover:text-[#1A1A2E] dark:hover:text-white transition-colors" />
            </Tooltip>
          )}
        </div>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getIconContainerStyle()}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className={`text-2xl font-bold font-sans tracking-tight sm:text-3xl ${getValueColor()}`}>
          {value}
        </div>
      </div>

      {(delta !== undefined || subtext) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          {delta !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold ${
                deltaType === 'positive'
                  ? 'text-[#16A34A]'
                  : deltaType === 'negative'
                  ? 'text-[#DC2626]'
                  : 'text-[#6B7280]'
              }`}
            >
              {deltaType === 'positive' && <TrendingUp className="h-3.5 w-3.5 text-[#16A34A]" />}
              {deltaType === 'negative' && <TrendingDown className="h-3.5 w-3.5 text-[#DC2626]" />}
              <span>{delta}</span>
            </span>
          )}
          {deltaLabel && (
            <span className="text-[#6B7280] font-normal">{deltaLabel}</span>
          )}
          {subtext && !deltaLabel && (
            <span className="text-[#6B7280] font-normal">{subtext}</span>
          )}
        </div>
      )}
    </div>
  );
};
