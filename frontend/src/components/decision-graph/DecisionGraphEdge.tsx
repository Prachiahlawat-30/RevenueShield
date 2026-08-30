import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DecisionGraphEdge as EdgeType } from '../../types';

interface Props {
  edge: EdgeType;
}

export const DecisionGraphEdge: React.FC<Props> = ({ edge }) => {
  const isBlocked = edge.style === 'blocked';
  const isApproved = edge.style === 'approved';

  const lineStyle = isBlocked
    ? 'border-rose-500/80'
    : isApproved
    ? 'border-emerald-500/80'
    : 'border-slate-300 dark:border-slate-700';

  const badgeStyle = isBlocked
    ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
    : isApproved
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-fintech-border bg-fintech-surface-subtle text-fintech-muted';

  return (
    <div className="flex flex-col items-center justify-center px-1 flex-shrink-0 relative group">
      {/* Edge Label Badge */}
      <div
        className={`max-w-[120px] text-center text-[9px] font-medium leading-tight px-1.5 py-0.5 rounded-fintech-sm border shadow-fintech-sm truncate whitespace-nowrap mb-1 transition-transform group-hover:scale-105 ${badgeStyle}`}
        title={edge.label}
      >
        {edge.label}
      </div>

      {/* Directional Connector Line & Arrow */}
      <div className="flex items-center w-full min-w-[32px] justify-center">
        <div className={`h-[1.5px] w-full border-t border-dashed ${lineStyle}`} />
        <ArrowRight
          className={`w-3.5 h-3.5 -ml-1 flex-shrink-0 ${
            isBlocked ? 'text-rose-500' : isApproved ? 'text-emerald-500' : 'text-fintech-muted'
          }`}
        />
      </div>
    </div>
  );
};
