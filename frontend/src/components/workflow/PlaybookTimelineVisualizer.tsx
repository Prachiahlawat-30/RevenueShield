import React, { useEffect, useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { getRecoveryPlaybook } from '../../api/tier2';
import { RecoveryPlaybook } from '../../types';
import { formatPercent } from '../../utils/formatters';

interface PlaybookTimelineVisualizerProps {
  riskId: string;
}

export const PlaybookTimelineVisualizer: React.FC<PlaybookTimelineVisualizerProps> = ({ riskId }) => {
  const [playbook, setPlaybook] = useState<RecoveryPlaybook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaybook = async () => {
      try {
        setLoading(true);
        const pb = await getRecoveryPlaybook(riskId);
        setPlaybook(pb);
      } catch (err: any) {
        console.error('Failed to load playbook:', err);
      } finally {
        setLoading(false);
      }
    };
    if (riskId) {
      fetchPlaybook();
    }
  }, [riskId]);

  if (loading || !playbook) return null;

  return (
    <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border space-y-3 shadow-fintech-sm">
      <div className="flex items-center justify-between border-b border-fintech-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider">
            {playbook.playbook_name}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-fintech-muted">
          Step {playbook.current_step_index + 1} of {playbook.total_steps}
        </span>
      </div>

      {/* Timeline sequence */}
      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {playbook.steps.map((step, idx) => {
          const isCompleted = step.status === 'COMPLETED';
          const isCurrent = step.status === 'CURRENT';

          return (
            <div key={idx} className="relative space-y-1">
              {/* Step indicator icon */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                    : 'bg-fintech-surface-subtle text-fintech-muted border border-fintech-border'
                }`}
              >
                {isCompleted ? '✓' : step.step_number}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-fintech-primary">{step.action_label}</span>
                  <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded font-semibold">
                    {step.time_offset_label}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-fintech-muted">
                  {formatPercent(step.expected_recovery_rate * 100)} Exp. Rate
                </span>
              </div>

              <p className="text-[11px] text-fintech-secondary leading-snug">{step.description}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-fintech-muted pt-0.5">
                <ShieldCheck className="w-3 h-3 text-brand-500" />
                <span>{step.policy_guardrail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
