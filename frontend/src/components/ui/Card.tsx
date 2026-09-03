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
      className={`rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 ${
        hoverable
          ? 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:bg-white/80 dark:hover:bg-white/[0.07] hover:-translate-y-[1px]'
          : ''
      } ${className}`}
    >
      {header && (
        <div className="border-b border-slate-200/60 dark:border-white/[0.07] px-6 py-4">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-slate-200/60 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.02] px-6 py-3.5 rounded-b-[18px]">
          {footer}
        </div>
      )}
    </div>
  );
};
