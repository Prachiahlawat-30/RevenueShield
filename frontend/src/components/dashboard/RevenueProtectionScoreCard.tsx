import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  getRevenueProtectionScore,
  getPredictionAccuracyMetrics,
} from '../../api/tier3';
import {
  RevenueProtectionScoreResponse,
  PredictionAccuracyMetricsResponse,
} from '../../types';

export const RevenueProtectionScoreCard: React.FC = () => {
  const [scoreData, setScoreData] = useState<RevenueProtectionScoreResponse | null>(null);
  const [accuracyData, setAccuracyData] = useState<PredictionAccuracyMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [s, a] = await Promise.all([
          getRevenueProtectionScore(),
          getPredictionAccuracyMetrics(),
        ]);
        setScoreData(s);
        setAccuracyData(a);
      } catch (err) {
        console.error('Failed to load protection score metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !scoreData) {
    return (
      <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-8 text-center text-slate-400 text-xs animate-pulse">
        Calculating Enterprise Revenue Protection Index & Calibration...
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Enterprise Revenue Protection Score
            </h2>
            <span className="rounded-full bg-slate-500/[0.08] px-2.5 py-0.5 text-[10px] font-mono font-medium uppercase text-slate-700 dark:text-slate-300 border border-slate-500/15">
              Grade {scoreData.grade}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Holistic index measuring preventative protection, algorithmic recovery yield, and safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">
            {scoreData.overall_score}
          </span>
          <span className="text-xs text-slate-400 font-mono">/ 100</span>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1 */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">Recovery Rate</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{scoreData.pillars.recovery}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${scoreData.pillars.recovery}%`, opacity: 0.9 }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Weighted efficiency on in-flight risk
          </span>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">Pre-Failure Prevention</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{scoreData.pillars.prevention}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${scoreData.pillars.prevention}%`, opacity: 0.75 }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Pre-emptive mitigation rate
          </span>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">Incident Response</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{scoreData.pillars.incident_response}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${scoreData.pillars.incident_response}%`, opacity: 0.6 }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            Gateway incident mitigation speed
          </span>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase">Safety & Compliance</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{scoreData.pillars.policy_compliance}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
              style={{ width: `${scoreData.pillars.policy_compliance}%`, opacity: 1.0 }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            100% PolicyEngine invariant pass
          </span>
        </div>
      </div>

      {/* Model Calibration & Accuracy Metrics */}
      {accuracyData && (
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                Predictive Model Calibration & Accuracy
              </span>
              <span className="rounded-full bg-slate-500/[0.08] px-2 py-0.5 text-[9px] font-mono font-medium text-slate-700 dark:text-slate-300 border border-slate-500/15">
                {accuracyData.evaluation_label}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {accuracyData.total_evaluated_predictions} Evaluations
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-2.5 border border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">Recovery Accuracy</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{accuracyData.recovery_probability_accuracy_pct}%</span>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-2.5 border border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">Precision @ High</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{accuracyData.precision_pct}%</span>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-2.5 border border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">Recall @ Recoverable</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{accuracyData.recall_pct}%</span>
            </div>
            <div className="rounded-xl bg-white/60 dark:bg-white/[0.04] p-2.5 border border-slate-200/60 dark:border-white/[0.06]">
              <span className="text-[10px] text-slate-400 block font-mono">Risk Model Accuracy</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{accuracyData.risk_prediction_accuracy_pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
