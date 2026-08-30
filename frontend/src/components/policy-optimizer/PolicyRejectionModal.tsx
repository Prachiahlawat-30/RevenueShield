import React, { useState } from 'react';
import { XCircle, X } from 'lucide-react';
import { PolicyProposalResponse } from '../../types';
import { Button } from '../ui/Button';

interface Props {
  proposal: PolicyProposalResponse;
  onClose: () => void;
  onConfirm: (proposalId: string, operatorName: string, reason: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export const PolicyRejectionModal: React.FC<Props> = ({
  proposal,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [operatorName, setOperatorName] = useState('Human Operator (Risk & Policy Lead)');
  const [reason, setReason] = useState('Business constraint');
  const [notes, setNotes] = useState('');

  const reasonsList = [
    'Business constraint',
    'Insufficient evidence',
    'Customer experience concern',
    'Expected impact too small',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(proposal.proposal_id, operatorName, reason, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg rounded-fintech-xl bg-fintech-surface border border-fintech-border shadow-2xl p-6 space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="text-base font-bold text-fintech-primary">Reject Policy Proposal</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-fintech-sm p-1 text-fintech-muted hover:bg-fintech-surface-subtle hover:text-fintech-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-fintech-secondary font-semibold mb-1">Human Operator Identity</label>
            <input
              type="text"
              required
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-2 text-fintech-primary focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-fintech-secondary font-semibold mb-1">Select Rejection Reason</label>
            <div className="space-y-1.5">
              {reasonsList.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2.5 rounded-fintech-md border cursor-pointer transition-colors ${
                    reason === r
                      ? 'border-rose-500/60 bg-rose-500/10 text-fintech-primary font-semibold'
                      : 'border-fintech-border bg-fintech-surface-subtle text-fintech-secondary hover:text-fintech-primary'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-fintech-secondary font-semibold mb-1">Additional Operator Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Cooldown change postponed until Q4 subscription cycle completes."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-2 text-fintech-primary focus:border-rose-500 focus:outline-none"
            />
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
              variant="danger"
              size="sm"
              isLoading={isLoading}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
