import React from 'react';
import {
  Brain,
  Scale,
  Sparkles,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { DecisionGraphNode as DecisionGraphNodeType, DecisionGraphNodeStatus } from '../../types';

interface Props {
  node: DecisionGraphNodeType;
  isSelected?: boolean;
  onClick?: () => void;
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'telemetry':
    case 'customer':
    case 'transaction':
    case 'payment_method':
    case 'failure':
      return Layers;
    case 'intelligence':
    case 'customer_risk':
    case 'gateway_health':
    case 'recovery_probability':
    case 'retry_timing':
    case 'expected_recovery':
    case 'recovery_cost':
      return Brain;
    case 'policy_gate':
    case 'ai_proposal':
    case 'policy_engine':
    case 'final_decision':
      return Scale;
    case 'execution':
    case 'outcome':
      return CheckCircle2;
    default:
      return Sparkles;
  }
};

const getStatusBadgeStyle = (status: DecisionGraphNodeStatus) => {
  switch (status) {
    case 'ALLOW':
    case 'PASS':
    case 'SUCCESS':
    case 'HEALTHY':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case 'BLOCK':
    case 'FAILED':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
    case 'DEGRADED':
    case 'ESCALATE':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'PENDING':
    case 'ACTIVE':
      return 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30';
    default:
      return 'bg-fintech-surface-subtle text-fintech-muted border-fintech-border';
  }
};

const getNodeGlowBorder = (status: DecisionGraphNodeStatus, isSelected?: boolean) => {
  if (isSelected) {
    return 'border-brand-500 ring-2 ring-brand-500/30 bg-brand-500/5 shadow-fintech-md';
  }
  switch (status) {
    case 'ALLOW':
    case 'PASS':
    case 'SUCCESS':
    case 'HEALTHY':
      return 'border-fintech-border bg-fintech-surface hover:border-emerald-500/50 shadow-fintech-sm';
    case 'BLOCK':
    case 'FAILED':
      return 'border-rose-500/30 bg-fintech-surface hover:border-rose-500/60 shadow-fintech-sm';
    default:
      return 'border-fintech-border bg-fintech-surface hover:border-slate-300 dark:hover:border-slate-700 shadow-fintech-sm';
  }
};

export const DecisionGraphNode: React.FC<Props> = ({ node, isSelected, onClick }) => {
  const Icon = getNodeIcon(node.type);
  const statusStyle = getStatusBadgeStyle(node.status);
  const glowStyle = getNodeGlowBorder(node.status, isSelected);

  const displayValue = node.data?.value || node.data?.headline || node.tooltip || '';
  const isDeterministic = node.data?.deterministic ?? node.data?.is_deterministic ?? true;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-fintech-lg border p-3 transition-all cursor-pointer select-none flex flex-col justify-between min-h-[110px] ${glowStyle}`}
    >
      <div>
        {/* Top Bar: Icon + Step Index + Status Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Icon className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-mono text-fintech-muted font-bold">#{node.stage_index}</span>
          </div>

          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${statusStyle}`}>
            {node.status}
          </span>
        </div>

        {/* Node Title & Subtitle */}
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-fintech-primary leading-tight line-clamp-1" title={node.label}>
            {node.label}
          </h4>
          <p className="text-[10px] text-fintech-secondary line-clamp-1" title={node.subtitle}>
            {node.subtitle}
          </p>
        </div>
      </div>

      {/* Main Metric Value & Invariant Badge */}
      <div className="mt-2 pt-1.5 border-t border-fintech-border flex items-center justify-between gap-1 text-[10px]">
        <span className="font-mono font-bold text-fintech-primary truncate max-w-[65%]" title={String(displayValue)}>
          {String(displayValue)}
        </span>
        {isDeterministic ? (
          <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
            Deterministic
          </span>
        ) : (
          <span className="text-[9px] font-mono font-bold text-brand-600 dark:text-brand-400 shrink-0">
            AI Probabilistic
          </span>
        )}
      </div>

      {/* Hover Pulse Ring */}
      {isSelected && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
        </span>
      )}
    </div>
  );
};
