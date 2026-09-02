import React from 'react';
import { Brain, Sparkles, Clock, MessageSquareQuote, ShieldAlert } from 'lucide-react';
import { AIDiagnosisResult } from '../../types';
import { getActionLabel, getFailureTypeLabel } from '../../utils/formatters';
import { WhyThisActionButton } from '../ui/WhyThisActionButton';

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
    <div className="flex flex-col justify-between rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/20 dark:from-purple-950/30 dark:via-[#131824] dark:to-purple-950/10 p-6 shadow-sm space-y-4">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-200/70 dark:border-purple-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white block">
                AI DIAGNOSIS & RECOMMENDATION
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                AI analyzes failure context and proposes the most appropriate recovery strategy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            <span>Confidence: {confidencePct}%</span>
          </div>
        </div>

        {/* Proposed Strategy / Action with Why this action button */}
        <div className="mt-4 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-bold block">
              Recommended Action
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {getActionLabel(diagnosis.recommended_action)}
            </p>
          </div>

          <WhyThisActionButton
            actionName={getActionLabel(diagnosis.recommended_action)}
            confidenceScore={confidencePct}
            reasons={[
              diagnosis.root_cause_summary || 'Temporary decline detected.',
              'Previous attempt was more than 12 hours ago.',
              'Retry limit has not been reached.',
            ]}
          />
        </div>

        {/* Root Cause Reason */}
        <div className="mt-3 p-3.5 rounded-lg border border-purple-200/70 dark:border-purple-800/40 bg-white/80 dark:bg-purple-950/20 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-slate-400 font-bold block">
            Reason:
          </span>
          <p className="text-xs font-semibold text-[#1A1A2E] dark:text-slate-200 leading-relaxed font-mono">
            {diagnosis.root_cause_summary || 'Temporary issuer decline'}
          </p>
          {diagnosis.action_rationale && (
            <p className="mt-1 text-[11px] italic text-purple-700 dark:text-purple-400">
              Rationale: {diagnosis.action_rationale}
            </p>
          )}
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
