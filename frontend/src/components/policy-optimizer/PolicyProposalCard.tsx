import React from 'react';
import { ArrowRight, Sparkles, Play, CheckCircle2, XCircle } from 'lucide-react';
import { PolicyProposalResponse } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface Props {
  proposal: PolicyProposalResponse;
  onSimulate: (proposalId: string) => void;
  onApprove: (proposal: PolicyProposalResponse) => void;
  onReject: (proposal: PolicyProposalResponse) => void;
  isSimulating?: boolean;
}

export const PolicyProposalCard: React.FC<Props> = ({
  proposal,
  onSimulate,
  onApprove,
  onReject,
  isSimulating,
}) => {
  const isPending = proposal.status === 'PENDING_REVIEW';
  const isApproved = proposal.status === 'APPROVED' || proposal.status === 'ACTIVATED';
  const isRejected = proposal.status === 'REJECTED';
  const isStale = proposal.status === 'STALE';

  return (
    <div
      className={`rounded-fintech-lg border p-5 shadow-fintech-sm space-y-4 transition-all bg-fintech-surface ${
        isPending
          ? 'border-brand-500/40 hover:shadow-fintech-md'
          : isApproved
          ? 'border-emerald-500/40'
          : 'border-fintech-border opacity-85'
      }`}
    >
      {/* Top Proposal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-fintech-primary">{proposal.proposal_id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono uppercase ${
                  isPending
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    : isApproved
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : isStale
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                }`}
              >
                {proposal.status.replace('_', ' ')}
              </span>
            </div>
            <h4 className="text-sm font-bold text-fintech-primary mt-0.5">{proposal.parameter_label}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right font-mono">
            <span className="text-[10px] text-fintech-muted block font-semibold">Confidence</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{(proposal.confidence_score * 100).toFixed(0)}%</span>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-fintech-muted block font-semibold">Observations</span>
            <span className="font-bold text-fintech-primary">{proposal.observations_count.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Parameter Change Highlight Ribbon */}
      <div className="flex items-center justify-between rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
        <div className="text-center sm:text-left">
          <span className="text-[10px] uppercase font-semibold text-fintech-muted block">Current Policy (v{proposal.policy_version_before})</span>
          <span className="text-sm font-mono font-bold text-fintech-secondary">{proposal.current_value}</span>
        </div>

        <div className="flex items-center gap-1.5 text-brand-500 font-bold px-3">
          <ArrowRight className="w-4 h-4" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Optimize</span>
        </div>

        <div className="text-center sm:text-right">
          <span className="text-[10px] uppercase font-semibold text-brand-600 dark:text-brand-400 block">Proposed Policy Target</span>
          <span className="text-base font-mono font-black text-brand-600 dark:text-brand-300">{proposal.proposed_value}</span>
        </div>
      </div>

      {/* 3 Key Projected Impact Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[9px] uppercase text-fintech-muted block font-semibold">Net Revenue Lift</span>
          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            +{formatCurrency(proposal.projected_net_revenue_delta)}
          </span>
        </div>

        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[9px] uppercase text-fintech-muted block font-semibold">Recovery Uplift</span>
          <span className="text-sm font-mono font-bold text-brand-600 dark:text-brand-400 mt-0.5 block">
            +{(proposal.projected_recovery_delta * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-center">
          <span className="text-[9px] uppercase text-fintech-muted block font-semibold">Cost Reduction</span>
          <span className="text-sm font-mono font-bold text-fintech-primary mt-0.5 block">
            {formatCurrency(Math.abs(proposal.projected_cost_delta))}
          </span>
        </div>
      </div>

      {/* AI Recommendation Rationale */}
      <p className="text-xs text-fintech-secondary leading-relaxed bg-fintech-surface-subtle p-3 rounded-fintech-md border border-fintech-border italic">
        "{proposal.ai_rationale}"
      </p>

      {/* Action Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-fintech-border">
        <Button
          size="sm"
          variant="outline"
          icon={Play}
          isLoading={isSimulating}
          onClick={() => onSimulate(proposal.proposal_id)}
        >
          {isSimulating ? 'Simulating...' : 'Simulate Counterfactual'}
        </Button>

        {isPending && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(proposal)}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onApprove(proposal)}
            >
              Approve & Deploy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
