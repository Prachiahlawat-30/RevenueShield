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
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1.5 rounded-[10px] text-[11px] font-medium transition-colors cursor-pointer ${
          size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'
        } bg-[#171C28] hover:bg-[#1C2333] text-[#9CA3B0] hover:text-[#F5F6FA] border border-white/[0.08] shadow-sm ${className}`}
        title="View explainable AI reasoning behind this recovery action"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
        <span>Why this action?</span>
      </button>

      {/* Centered Modal with Solid Surface #171C28 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[16px] border border-white/[0.08] bg-[#171C28] p-6 shadow-fintech-elevated space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-[#8B7CF6]/15 flex items-center justify-center text-[#8B7CF6]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F5F6FA]">
                    Why this action?
                  </h4>
                  <span className="text-[11px] text-[#6B7280]">
                    Explainable AI & Policy Telemetry
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-[8px] text-[#6B7280] hover:text-[#F5F6FA] hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evaluated Strategy */}
            <div className="p-3.5 rounded-[12px] bg-[#12161F] border border-white/[0.06]">
              <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
                Evaluated strategy
              </span>
              <p className="text-sm font-semibold text-[#F5F6FA] mt-0.5">
                {actionName}
              </p>
            </div>

            {/* Decision Evidence */}
            <div className="space-y-2">
              <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
                Decision evidence
              </span>
              <ul className="space-y-2 text-xs text-[#9CA3B0]">
                {effectiveReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-[#12161F] border border-white/[0.04]">
                    <span className="text-[#3B82F6] shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed text-[#F5F6FA]">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confidence & Policy Check Footer */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium bg-[#8B7CF6]/10 text-[#8B7CF6] border border-[#8B7CF6]/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{confidenceScore}% AI confidence</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[#10B981] font-medium text-xs">
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
                Close explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
