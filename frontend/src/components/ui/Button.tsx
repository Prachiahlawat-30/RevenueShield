import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-fintech-sm gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-fintech-md gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold rounded-fintech-md gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-fintech-sm shadow-brand-500/20 border border-transparent',
    secondary:
      'bg-fintech-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-fintech-primary border border-fintech-border',
    outline:
      'bg-transparent hover:bg-fintech-surface-subtle text-fintech-primary border border-fintech-border',
    ghost:
      'bg-transparent hover:bg-fintech-surface-subtle text-fintech-secondary hover:text-fintech-primary border border-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-fintech-sm border border-transparent',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!isLoading && Icon && iconPosition === 'right' ? (
        <Icon className="h-3.5 w-3.5 shrink-0" />
      ) : null}
    </button>
  );
};
