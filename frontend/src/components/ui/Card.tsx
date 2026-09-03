import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  hoverable = false,
}) => {
  return (
    <div
      className={`rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] shadow-sm dark:shadow-fintech-card transition-all duration-150 ${
        hoverable ? 'hover:border-slate-300 dark:hover:border-white/[0.1] hover:bg-slate-50/50 dark:hover:bg-[#141923]' : ''
      } ${className}`}
    >
      {header && (
        <div className="border-b border-slate-200 dark:border-white/[0.06] px-6 py-4">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E121A] px-6 py-3.5 rounded-b-[16px]">
          {footer}
        </div>
      )}
    </div>
  );
};
