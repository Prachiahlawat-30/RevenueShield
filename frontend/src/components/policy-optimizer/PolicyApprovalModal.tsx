import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { PolicyProposalResponse } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface Props {
  proposal: PolicyProposalResponse;
  onClose: () => void;
  onConfirm: (proposalId: string, operatorName: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const PolicyApprovalModal: React.FC<Props> = ({
  proposal,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [operatorName, setOperatorName] = useState('Human Operator (Risk & Policy Lead)');
  const [reason, setReason] = useState(
    'Approved after reviewing counterfactual simulation evidence and verified safety compliance.'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(proposal.proposal_id, operatorName, reason);
  };

  const nextVersion = proposal.policy_version_before + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-fintech-xl bg-fintech-surface border border-fintech-border shadow-2xl p-6 space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-fintech-primary">Final Review & Policy Activation</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-fintech-sm p-1 text-fintech-muted hover:bg-fintech-surface-subtle hover:text-fintech-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Change Banner */}
        <div className="rounded-fintech-md border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-fintech-primary">
            <span className="font-semibold">{proposal.parameter_label}:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {proposal.current_value} → {proposal.proposed_value}
            </span>
          </div>
          <div className="flex justify-between items-center text-fintech-secondary">
            <span>Projected Monthly Lift:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(proposal.projected_net_revenue_delta)}
            </span>
          </div>
          <div className="flex justify-between items-center text-fintech-secondary">
            <span>Confidence & Observations:</span>
            <span className="font-mono font-bold text-fintech-primary">
              {(proposal.confidence_score * 100).toFixed(0)}% ({proposal.observations_count.toLocaleString()} cases)
            </span>
          </div>
          <div className="flex justify-between items-center text-fintech-secondary pt-1 border-t border-emerald-500/20">
            <span>Version Upgrade:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
              Policy v{proposal.policy_version_before} → Policy v{nextVersion}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-fintech-secondary font-semibold mb-1">Human Operator Identity</label>
            <input
              type="text"
              required
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-2 text-fintech-primary focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-fintech-secondary font-semibold mb-1">Approval Audit Rationale</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-2 text-fintech-primary focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="p-2.5 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border text-[11px] text-fintech-muted leading-relaxed">
            🔒 <strong>Strict Governance Invariant:</strong> Only authenticated Human Operators may approve policy upgrades. This action creates an immutable Policy v{nextVersion} revision in the audit ledger.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-fintech-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              Activate Policy v{nextVersion}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
