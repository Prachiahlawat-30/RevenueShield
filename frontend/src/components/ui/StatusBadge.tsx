import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const displayLabel = label || status?.replace(/_/g, ' ');
  const colorClass = getStatusBadgeClass(status);
  const sizeClass = size === 'sm' ? 'h-4.5 px-2 text-[10px]' : 'h-5 px-2.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider transition-colors ${colorClass} ${sizeClass} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {pulse && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current opacity-90"></span>
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};
