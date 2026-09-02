import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Brain } from 'lucide-react';

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
  failureCategory,
  className = '',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Default reasons matching user prompt specification
  const effectiveReasons =
    reasons && reasons.length > 0
      ? reasons
      : [
          'Temporary decline detected.',
          'Previous attempt was more than 12 hours ago.',
          'Retry limit has not been reached.',
        ];

  // Close on Escape key
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
        className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-all cursor-pointer ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/50 shadow-xs ${className}`}
        title="View explainable AI reasoning behind this recovery action"
      >
        <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>Why this action?</span>
      </button>

      {/* Centered Modal with Backdrop (Prevents ALL Overlapping with cards & sidebar) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fintech-fade"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evaluated Strategy */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Evaluated Strategy
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                {actionName}
              </p>
            </div>

            {/* Decision Evidence */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                Decision Evidence:
              </span>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                {effectiveReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confidence & Policy Check Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-200/50 dark:border-indigo-800/40">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI confidence: {confidenceScore}%</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Policy: Passed</span>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              Got it, close explanation
            </button>
          </div>
        </div>
      )}
    </>
  );
};
