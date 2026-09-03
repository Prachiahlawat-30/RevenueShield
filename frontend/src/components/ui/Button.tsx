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
    'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-[10px] gap-1.5',
    md: 'px-4 py-2 text-xs rounded-[12px] gap-2',
    lg: 'px-5 py-2.5 text-sm rounded-[12px] gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#3B82F6] hover:bg-[#2563EB] text-white border border-transparent shadow-sm',
    secondary:
      'bg-[#171C28] hover:bg-[#1C2333] text-[#F5F6FA] border border-white/[0.08] shadow-sm',
    outline:
      'bg-transparent hover:bg-white/[0.04] text-[#F5F6FA] border border-white/[0.08]',
    ghost:
      'bg-transparent hover:bg-white/[0.04] text-[#9CA3B0] hover:text-[#F5F6FA] border border-transparent',
    danger:
      'bg-[#F0625A] hover:bg-[#E0534B] text-white border border-transparent shadow-sm',
    success:
      'bg-[#10B981] hover:bg-[#059669] text-white border border-transparent shadow-sm',
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
