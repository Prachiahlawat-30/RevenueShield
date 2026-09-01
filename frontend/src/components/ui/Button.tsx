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
    'inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6822CC]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-xs font-semibold rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold rounded-lg gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#6822CC] hover:bg-[#4B1A99] active:bg-[#3D157D] text-white shadow-sm border border-transparent',
    secondary:
      'bg-white hover:bg-[#F3EEFF] text-[#6822CC] border border-[#E5E7EB] hover:border-[#D5BEFF] shadow-sm',
    outline:
      'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-fintech-primary border border-[#E5E7EB]',
    ghost:
      'bg-transparent hover:bg-[#F3EEFF] text-[#6822CC] dark:text-[#B892FF] border border-transparent',
    danger:
      'bg-[#DC2626] hover:bg-[#B91C1C] active:bg-[#991B1B] text-white shadow-sm border border-transparent',
    success:
      'bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-sm border border-transparent',
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
