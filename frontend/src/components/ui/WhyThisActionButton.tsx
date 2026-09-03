import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhyThisActionButtonProps {
  actionName?: string;
  reasons?: string[];
  confidenceScore?: number;
  failureCategory?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const WhyThisActionButton: React.FC<WhyThisActionButtonProps> = ({
  actionName = 'Retry Payment',
  reasons,
  confidenceScore = 91,
  className = '',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const effectiveReasons =
    reasons && reasons.length > 0
      ? reasons
      : [
          'Temporary decline detected.',
          'Previous attempt was more than 12 hours ago.',
          'Retry limit has not been reached.',
        ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button - Clean & Crisp */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-xl font-mono text-[11px] font-medium transition-all cursor-pointer ${
          size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
        } bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.08] hover:text-slate-950 dark:hover:text-white border border-slate-200/80 dark:border-white/10 shadow-xs hover:-translate-y-[1px] ${className}`}
        title="View explainable AI reasoning behind this recovery action"
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Why this action?</span>
      </button>

      {/* Centered Modal with Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fintech-fade"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[20px] border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 p-6 shadow-glass-3 space-y-4 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900/[0.05] dark:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Why this action?
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Explainable AI & Policy Telemetry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evaluated Strategy */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                EVALUATED STRATEGY
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 font-sans">
                {actionName}
              </p>
            </div>

            {/* Decision Evidence */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                DECISION EVIDENCE
              </span>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-normal">
                {effectiveReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04]">
                    <span className="text-slate-400 font-mono shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confidence & Policy Check Footer */}
            <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium bg-slate-500/[0.06] px-2.5 py-1 rounded-lg border border-slate-500/15">
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>AI confidence: {confidenceScore}%</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-500/[0.08] px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Policy: Approved</span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Got it, close explanation
            </button>
          </div>
        </div>
      )}
    </>
  );
};
