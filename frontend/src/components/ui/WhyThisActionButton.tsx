import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

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
  const popoverRef = useRef<HTMLDivElement>(null);

  // Default reasons matching user prompt specification
  const effectiveReasons = reasons && reasons.length > 0
    ? reasons
    : [
        'Temporary decline detected.',
        'Previous attempt was more than 12 hours ago.',
        'Retry limit has not been reached.',
      ];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-all cursor-pointer ${
          size === 'sm'
            ? 'px-2.5 py-1 text-xs'
            : 'px-3 py-1.5 text-xs'
        } ${
          isOpen
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/50'
        }`}
        title="View explainable AI reasoning behind this recovery action"
      >
        <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span>Why this action?</span>
      </button>

      {/* Floating Explainability Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-88 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#111827] p-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] z-50 animate-fintech-fade space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Why this action?
                </h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Explainable AI & Policy Telemetry
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Focus */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Evaluated Strategy
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              {actionName}
            </p>
          </div>

          {/* Bulleted Evidence Points */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Decision Evidence:
            </span>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {effectiveReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confidence & Policy Check Strip */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>AI confidence: {confidenceScore}%</span>
            </div>

            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Policy: Passed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
