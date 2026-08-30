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
  variant = 'emerald',
  badgeText,
}) => {
  const variantStyles = {
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400',
    amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    purple: 'border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400',
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    slate: 'border-fintech-border bg-fintech-surface-subtle text-fintech-muted',
  };

  return (
    <div className="relative overflow-hidden rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm transition-all hover:shadow-fintech-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-fintech-secondary">
          {title}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-fintech-md border ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-fintech-primary">{value}</span>
        {badgeText && (
          <span className="inline-flex items-center rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-fintech-muted">{subtitle}</p>}
    </div>
  );
};
