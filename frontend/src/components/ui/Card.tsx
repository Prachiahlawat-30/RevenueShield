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
      className={`rounded-[14px] border border-[#E5E7EB] bg-white dark:bg-[#131824] dark:border-[#242E42] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all ${
        hoverable ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#D1D5DB] dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      {header && (
        <div className="border-b border-[#E5E7EB] dark:border-[#242E42] px-6 py-4">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/50 dark:bg-slate-900/30 px-6 py-3.5 rounded-b-[14px]">
          {footer}
        </div>
      )}
    </div>
  );
};
