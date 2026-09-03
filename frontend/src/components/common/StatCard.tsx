import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate';
  badgeText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
}) => {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/80 dark:hover:bg-white/[0.07]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-900/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 shadow-xs">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white">{value}</span>
        {badgeText && (
          <span className="inline-flex items-center rounded-full bg-slate-500/[0.08] px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-500/15">
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">{subtitle}</p>}
    </div>
  );
};
