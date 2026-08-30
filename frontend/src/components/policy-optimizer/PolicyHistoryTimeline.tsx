import React, { useState } from 'react';
import { History, RotateCcw, AlertTriangle } from 'lucide-react';
import { PolicyHistoryItem } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface Props {
  history: PolicyHistoryItem[];
  onRollback: (targetVersion?: number) => Promise<void>;
  isLoading?: boolean;
}

export const PolicyHistoryTimeline: React.FC<Props> = ({
  history,
  onRollback,
  isLoading,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
      <div className="flex items-center justify-between border-b border-fintech-border pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-fintech-primary">Immutable Policy Version History</h3>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={RotateCcw}
          onClick={() => setShowConfirm(true)}
          className="text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
        >
          Emergency Rollback
        </Button>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 text-xs">
        {history.map((item, idx) => {
          const isActive = item.is_active;

          return (
            <div key={idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
                  isActive
                    ? 'bg-emerald-500 border-emerald-300 ring-4 ring-emerald-500/20'
                    : 'bg-fintech-surface-subtle border-fintech-border'
                }`}
              />

              <div
                className={`p-3.5 rounded-fintech-md border transition-colors ${
                  isActive
                    ? 'border-emerald-500/40 bg-emerald-500/5 shadow-fintech-sm'
                    : 'border-fintech-border bg-fintech-surface-subtle'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-fintech-primary text-sm">Policy v{item.version}</span>
                    {isActive && (
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        ACTIVE NOW
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-fintech-muted font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-fintech-primary mb-2">
                  <div>
                    <span className="text-fintech-muted block text-[9px]">MAX ATTEMPTS</span>
                    {item.max_attempts}
                  </div>
                  <div>
                    <span className="text-fintech-muted block text-[9px]">COOLDOWN</span>
                    {item.cooldown_hours}h
                  </div>
                  <div>
                    <span className="text-fintech-muted block text-[9px]">HIGH-VALUE THRESHOLD</span>
                    ${item.high_value_threshold}
                  </div>
                </div>

                <div className="text-[11px] text-fintech-secondary border-t border-fintech-border pt-1.5 flex justify-between items-center">
                  <span>Reason: <strong className="text-fintech-primary">{item.change_reason || 'Policy Baseline'}</strong></span>
                  <span className="text-[10px] font-mono text-fintech-muted">{item.changed_by}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Rollback Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-fintech-xl bg-fintech-surface border border-rose-500/40 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-base font-bold text-fintech-primary">Emergency Policy Rollback</h4>
            </div>

            <p className="text-xs text-fintech-secondary leading-relaxed">
              Are you sure you want to rollback active policies to the baseline safe version? This will immediately revert high-value thresholds and cooldown bounds.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-fintech-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isLoading}
                onClick={async () => {
                  await onRollback();
                  setShowConfirm(false);
                }}
              >
                Confirm Rollback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
