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
      <div className="flex h-72 w-full items-center justify-center rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card">
        <div className="flex flex-col items-center gap-3">
          <Brain className="h-7 w-7 text-[#7C3AED] dark:text-[#8B7CF6] animate-pulse" />
          <p className="text-xs text-slate-500 dark:text-[#9CA3B0]">
            Synthesizing failure context & trajectory...
          </p>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="flex h-72 w-full items-center justify-center rounded-[16px] border border-dashed border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#12161F] p-6 text-center text-slate-400 dark:text-[#6B7280] shadow-sm dark:shadow-fintech-card">
        <div className="flex flex-col items-center gap-2">
          <Brain className="h-7 w-7 text-slate-400 dark:text-[#6B7280]" />
          <p className="text-xs text-slate-500 dark:text-[#9CA3B0]">Run diagnosis to formulate recovery strategy.</p>
        </div>
      </div>
    );
  }

  const confidencePct = Math.round(diagnosis.confidence_score * 100);

  return (
    <div className="flex flex-col justify-between rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card space-y-4 transition-colors">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#8B7CF6]/15 flex items-center justify-center text-[#7C3AED] dark:text-[#8B7CF6] shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.04em] text-slate-900 dark:text-[#F5F6FA] block">
                AI diagnosis
              </span>
              <p className="text-[11px] text-slate-500 dark:text-[#6B7280] mt-0.5">
                Probabilistic root-cause analysis
              </p>
            </div>
          </div>

          <div className="h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium bg-[#8B7CF6]/10 text-[#7C3AED] dark:text-[#8B7CF6] border border-[#8B7CF6]/20">
            <Sparkles className="h-2.5 w-2.5 text-[#7C3AED] dark:text-[#8B7CF6]" />
            <span>Confidence: {confidencePct}%</span>
          </div>
        </div>

        {/* Failure Category & Root Cause Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] space-y-1">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
              Failure category
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-[#F5F6FA]">
              Temporary Decline
            </p>
          </div>

          <div className="p-3.5 rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] space-y-1">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
              Root cause
            </span>
            <p className="text-xs text-slate-600 dark:text-[#9CA3B0] truncate">
              {diagnosis.root_cause_summary || 'Temporary issuer or network issue detected.'}
            </p>
          </div>
        </div>

        {/* Proposed Strategy / Action */}
        <div className="p-3.5 rounded-[10px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
              Recommended action
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-[#F5F6FA] mt-0.5">
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

        {/* Reasoning Narrative Callout */}
        <div className="p-3 rounded-[10px] bg-slate-50 dark:bg-[#0E121A] border border-slate-200 dark:border-white/[0.04] flex items-start gap-2.5 text-xs text-slate-600 dark:text-[#9CA3B0]">
          <MessageSquareQuote className="h-4 w-4 text-[#7C3AED] dark:text-[#8B7CF6] shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[12px]">
            {diagnosis.root_cause_summary ||
              'Model inferred transient upstream settlement latency. Recommending timed retry with secondary routing fallback.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-[#6B7280]">
        <span>Model: <strong className="text-slate-600 dark:text-[#9CA3B0] font-medium">RecoveryTransformer v3.1</strong></span>
        <span>Advisory only</span>
      </div>
    </div>
  );
};
