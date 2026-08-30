import React from 'react';
import { Brain, Sparkles, Clock, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { AIDiagnosisResult } from '../../types';
import { getActionLabel, getFailureTypeLabel } from '../../utils/formatters';

interface AIDiagnosisCardProps {
  diagnosis?: AIDiagnosisResult;
  isLoading?: boolean;
}

export const AIDiagnosisCard: React.FC<AIDiagnosisCardProps> = ({ diagnosis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-8 w-8 animate-bounce text-brand-500" />
          <p className="text-xs font-semibold text-fintech-secondary">AI Root-Cause Analysis in Progress...</p>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-fintech-lg border border-dashed border-fintech-border bg-fintech-surface p-6 text-center text-fintech-muted shadow-fintech-sm">
        <div className="flex flex-col items-center gap-2">
          <Brain className="h-8 w-8 text-fintech-muted" />
          <p className="text-xs font-medium">Click "Diagnose Failure" or "Step Next" to run AI diagnosis.</p>
        </div>
      </div>
    );
  }

  const confidencePct = Math.round(diagnosis.confidence_score * 100);

  return (
    <div className="flex flex-col justify-between rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-6 shadow-fintech-sm space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Brain className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              AI Diagnosis & Recommendation
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:text-brand-400">
            <Sparkles className="h-3 w-3" />
            <span>{confidencePct}% Confidence</span>
          </div>
        </div>

        {/* Failure Category & Proposed Action */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted block">
              Diagnosed Category
            </span>
            <p className="mt-1 text-xs font-bold text-fintech-primary">
              {getFailureTypeLabel(diagnosis.failure_category)}
            </p>
          </div>
          <div className="rounded-fintech-md border border-brand-500/20 bg-brand-500/5 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
              Proposed Action
            </span>
            <p className="mt-1 text-xs font-bold text-brand-700 dark:text-brand-300">
              {getActionLabel(diagnosis.recommended_action)}
            </p>
          </div>
        </div>

        {/* Root Cause Summary */}
        <div className="mt-3.5 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted block">
            Root-Cause Analysis
          </span>
          <p className="mt-1 text-xs text-fintech-primary leading-relaxed">
            {diagnosis.root_cause_summary}
          </p>
          <p className="mt-2 text-xs italic text-brand-600 dark:text-brand-400">
            Rationale: {diagnosis.action_rationale}
          </p>
        </div>

        {/* Customer Message Draft */}
        {diagnosis.customer_communication_draft && (
          <div className="mt-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fintech-muted">
              <MessageSquareQuote className="h-3.5 w-3.5 text-brand-500" />
              <span>Personalized Outreach Draft</span>
            </div>
            <p className="mt-1 text-xs font-mono text-fintech-secondary bg-fintech-surface p-2.5 rounded-fintech-sm border border-fintech-border">
              "{diagnosis.customer_communication_draft}"
            </p>
          </div>
        )}
      </div>

      {/* Suggested Cooldown */}
      <div className="flex items-center justify-between border-t border-fintech-border pt-3 text-xs text-fintech-muted font-mono">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-brand-500" />
          <span>Optimal Retry Window:</span>
        </div>
        <span className="font-bold text-fintech-primary">
          {diagnosis.suggested_cooldown_hours ? `+${diagnosis.suggested_cooldown_hours} hours cooldown` : 'Immediate Execution'}
        </span>
      </div>
    </div>
  );
};
