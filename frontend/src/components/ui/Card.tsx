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
      className={`rounded-[16px] border border-white/[0.06] bg-[#12161F] shadow-fintech-card transition-all duration-150 ${
        hoverable ? 'hover:border-white/[0.1] hover:bg-[#141923]' : ''
      } ${className}`}
    >
      {header && (
        <div className="border-b border-white/[0.06] px-6 py-4">{header}</div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-white/[0.06] bg-[#0E121A] px-6 py-3.5 rounded-b-[16px]">
          {footer}
        </div>
      )}
    </div>
  );
};
