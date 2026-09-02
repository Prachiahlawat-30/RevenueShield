import React from 'react';
import {
  Brain,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowDown,
  Lock,
  Cpu,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AIDiagnosisResult, PolicyEvaluationResult } from '../../types';
import { getActionLabel } from '../../utils/formatters';

interface AIVsPolicyComparisonCardProps {
  diagnosis?: AIDiagnosisResult | null;
  policyEvaluation?: PolicyEvaluationResult | null;
  className?: string;
  compact?: boolean;
}

export const AIVsPolicyComparisonCard: React.FC<AIVsPolicyComparisonCardProps> = ({
  diagnosis,
  policyEvaluation,
  className = '',
  compact = false,
}) => {
  // Dynamic or User Specified Default Values
  const aiAction = diagnosis?.recommended_action
    ? getActionLabel(diagnosis.recommended_action)
    : 'Retry Payment';

  const confidencePct = diagnosis?.confidence_score
    ? Math.round(diagnosis.confidence_score * 100)
    : 91;

  const reasonText = diagnosis?.root_cause_summary
    ? diagnosis.root_cause_summary
    : 'Temporary issuer decline';

  const isApproved = policyEvaluation ? policyEvaluation.is_approved : true;

  return (
    <div
      className={`w-full rounded-fintech-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-fintech-md space-y-4 ${className}`}
    >
      {/* Top Banner: Architecture Principle Explainer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] dark:border-[#242E42] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
              <Cpu className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6822CC] dark:text-[#B892FF]">
              SYSTEM ARCHITECTURE: AI SUGGESTS • POLICY GOVERNS
            </span>
          </div>
          <h3 className="text-sm font-black text-[#1A1A2E] dark:text-white font-mono mt-0.5">
            PROBABILISTIC REASONING VS DETERMINISTIC ENFORCEMENT
          </h3>
        </div>
        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          Supervised Safety Boundary
        </span>
      </div>

      {/* Dual Column Side-by-Side Comparison (or Stacked on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* ========================================================= */}
        {/* 1. 🤖 AI RECOMMENDATION (Purple / Neural / Probabilistic)  */}
        {/* ========================================================= */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 dark:from-purple-950/30 dark:via-[#131824] dark:to-purple-950/10 p-4 shadow-sm space-y-3 relative overflow-hidden">
          {/* Subtle background glow badge */}
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-purple-500/5 blur-xl pointer-events-none" />

          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-purple-200/70 dark:border-purple-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div>
                  <h4 className="text-xs font-black font-mono tracking-tight text-purple-900 dark:text-purple-300 uppercase">
                    AI RECOMMENDATION
                  </h4>
                  <span className="text-[9px] font-mono text-purple-700 dark:text-purple-400">
                    Probabilistic Yield Prediction
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Confidence: {confidencePct}%</span>
              </span>
            </div>

            {/* Proposed Strategy / Action */}
            <div className="space-y-1 bg-white/80 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200/60 dark:border-purple-800/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 dark:text-purple-400 font-bold block">
                Proposed Action:
              </span>
              <p className="text-sm font-black text-purple-900 dark:text-white font-mono">
                {aiAction}
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-1 bg-white/80 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200/60 dark:border-purple-800/30">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] dark:text-slate-400 font-bold block">
                Reason:
              </span>
              <p className="text-xs font-semibold text-[#1A1A2E] dark:text-slate-200 leading-relaxed font-mono">
                {reasonText}
              </p>
            </div>
          </div>

          {/* AI Footnote */}
          <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 text-[9px] font-mono text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            <Brain className="w-3 h-3 text-purple-500 shrink-0" />
            <span>AI cannot execute financial transactions directly. Passed to Policy Gatekeeper.</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. 🛡 POLICY ENGINE (Emerald / Deterministic / Vault)     */}
        {/* ========================================================= */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/30 dark:via-[#131824] dark:to-emerald-950/10 p-4 shadow-sm space-y-3 relative overflow-hidden">
          {/* Subtle background glow badge */}
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />

          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-200/70 dark:border-emerald-900/40 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡</span>
                <div>
                  <h4 className="text-xs font-black font-mono tracking-tight text-emerald-900 dark:text-emerald-300 uppercase">
                    POLICY ENGINE
                  </h4>
                  <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400">
                    Deterministic Safety Gatekeeper
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Strict Guardrails</span>
              </span>
            </div>

            {/* Checklist per prompt specifications */}
            <div className="bg-white/80 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/30 space-y-1.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Customer opted in</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Attempts &lt; 3</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Cooldown satisfied</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Amount within limit</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>No duplicate action</span>
              </div>
            </div>

            {/* ACTION APPROVED STAMP */}
            <div className="p-2.5 rounded-lg bg-emerald-600 text-white font-mono font-black text-center text-xs tracking-widest uppercase shadow-sm border border-emerald-500 flex items-center justify-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>ACTION APPROVED</span>
            </div>
          </div>

          {/* Policy Footnote */}
          <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 text-[9px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>PolicyEngine remains the authoritative gatekeeper for all financial interventions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
