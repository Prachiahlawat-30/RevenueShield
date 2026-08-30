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
      className={`rounded-fintech-lg border border-fintech-border bg-fintech-surface shadow-fintech-sm transition-all ${
        hoverable ? 'hover:shadow-fintech-md hover:border-slate-300 dark:hover:border-slate-700' : ''
      } ${className}`}
    >
      {header && (
        <div className="border-b border-fintech-border px-6 py-4">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-fintech-border bg-fintech-surface-subtle/50 px-6 py-3.5 rounded-b-fintech-lg">
          {footer}
        </div>
      )}
    </div>
  );
};
