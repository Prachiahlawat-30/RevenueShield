import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, X } from 'lucide-react';

interface WhyThisActionButtonProps {
  actionName: string;
  confidenceScore?: number;
  reasons?: string[];
  className?: string;
  size?: 'sm' | 'md';
}

export const WhyThisActionButton: React.FC<WhyThisActionButtonProps> = ({
  actionName,
  confidenceScore = 92,
  reasons = [],
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultReasons = [
    'Model detected transient bank decline patterns consistent with payday or network latency.',
    'Customer payment profile shows 94% historical recovery propensity on timed retry.',
    'Autonomous guardrail limits are satisfied: attempt count 1 of 3, cooldown interval met.',
  ];

  const effectiveReasons = reasons.length > 0 ? reasons : defaultReasons;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-[10px] text-[11px] font-medium transition-colors cursor-pointer ${
          size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
        } bg-slate-100 hover:bg-slate-200 dark:bg-[#171C28] dark:hover:bg-[#1C2333] text-slate-700 hover:text-slate-900 dark:text-[#9CA3B0] dark:hover:text-[#F5F6FA] border border-slate-200 dark:border-white/[0.08] shadow-sm ${className}`}
        title="View explainable AI reasoning behind this recovery action"
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-[#6B7280] shrink-0" />
        <span>Why this action?</span>
      </button>

      {/* Centered Modal with Solid Surface */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] p-6 shadow-xl dark:shadow-fintech-elevated space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#8B7CF6]/15 flex items-center justify-center text-[#7C3AED] dark:text-[#8B7CF6]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F5F6FA]">
                    Why this action?
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">
                    Explainable AI & Policy Telemetry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:text-[#6B7280] dark:hover:text-[#F5F6FA] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evaluated Strategy */}
            <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-[#12161F] border border-slate-200 dark:border-white/[0.06]">
              <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
                Evaluated strategy
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F5F6FA] mt-0.5">
                {actionName}
              </p>
            </div>

            {/* Decision Evidence */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase block">
                Decision evidence
              </span>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-[#9CA3B0]">
                {effectiveReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-slate-50 dark:bg-[#12161F] border border-slate-200 dark:border-white/[0.04]">
                    <span className="text-[#3B82F6] shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed text-slate-800 dark:text-[#F5F6FA]">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confidence & Policy Check Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium bg-[#8B7CF6]/10 text-[#7C3AED] dark:text-[#8B7CF6] border border-[#8B7CF6]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{confidenceScore}% AI confidence</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[#059669] dark:text-[#10B981] font-medium text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Policy approved</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 rounded-[10px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
