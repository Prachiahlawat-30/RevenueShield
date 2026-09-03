import React from 'react';
import { Brain, Sparkles, MessageSquareQuote } from 'lucide-react';
import { AIDiagnosisResult } from '../../types';
import { getActionLabel } from '../../utils/formatters';
import { WhyThisActionButton } from '../ui/WhyThisActionButton';

interface AIDiagnosisCardProps {
  diagnosis?: AIDiagnosisResult;
  isLoading?: boolean;
}

export const AIDiagnosisCard: React.FC<AIDiagnosisCardProps> = ({ diagnosis, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-6 shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-7 w-7 animate-pulse-subtle text-slate-700 dark:text-slate-300" />
          <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
            Synthesizing Failure Context & Trajectory...
          </p>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] p-6 text-center text-slate-400 shadow-xs">
        <div className="flex flex-col items-center gap-2">
          <Brain className="h-7 w-7 text-slate-400" />
          <p className="text-xs font-mono">Run diagnosis to formulate recovery strategy.</p>
        </div>
      </div>
    );
  }

  const confidencePct = Math.round(diagnosis.confidence_score * 100);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-md p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900/[0.05] dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white block">
                  AI DIAGNOSIS
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">
                Probabilistic root-cause analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] px-2.5 py-0.5 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 shadow-xs">
            <Sparkles className="h-3 w-3 text-slate-500" />
            <span>Confidence: {confidencePct}%</span>
          </div>
        </div>

        {/* Failure Category & Root Cause Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              FAILURE CATEGORY
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
              Temporary Decline
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              ROOT CAUSE
            </span>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {diagnosis.root_cause_summary || 'Temporary issuer or network issue detected.'}
            </p>
          </div>
        </div>

        {/* Proposed Strategy / Action */}
        <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              RECOMMENDED ACTION
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white font-sans mt-0.5">
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

        {/* Reason */}
        <div className="p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-white/70 dark:bg-white/[0.03] space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            REASON
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {diagnosis.action_rationale || 'The transaction appears suitable for a controlled retry.'}
          </p>
        </div>

        {/* Customer Message Draft */}
        {diagnosis.customer_communication_draft && (
          <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] p-3 space-y-1.5">
            <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-400 uppercase">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              <span>OUTREACH DRAFT</span>
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 italic font-sans leading-relaxed">
              "{diagnosis.customer_communication_draft}"
            </p>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Status: Recommendation Ready</span>
        <span>Awaiting Policy Clearance</span>
      </div>
    </div>
  );
};
