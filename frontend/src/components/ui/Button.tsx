import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
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
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400/20 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-xl gap-2',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#111827] text-white hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-slate-100 border border-transparent shadow-xs hover:-translate-y-[1px]',
    secondary:
      'bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs hover:-translate-y-[1px]',
    outline:
      'bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 hover:-translate-y-[1px]',
    ghost:
      'bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    success:
      'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
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
