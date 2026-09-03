import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
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
      <div className="rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card animate-pulse text-center text-xs text-slate-400 dark:text-[#6B7280]">
        Calculating enterprise revenue protection index...
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 shadow-sm dark:shadow-fintech-card space-y-6 transition-colors">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#3B82F6]" />
            <h2 className="text-[18px] font-semibold text-slate-900 dark:text-[#F5F6FA] tracking-tight">
              Enterprise Revenue Protection Score
            </h2>
            <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
              Grade {scoreData.grade}
            </span>
          </div>
          <p className="text-[12px] text-slate-600 dark:text-[#9CA3B0] mt-0.5">
            Holistic index measuring preventative protection, algorithmic recovery yield, and safety guardrails.
          </p>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-[36px] font-semibold tracking-tight text-slate-900 dark:text-[#F5F6FA] tabular-nums">
            {scoreData.overall_score}
          </span>
          <span className="text-xs text-slate-400 dark:text-[#6B7280]">/ 100</span>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1 */}
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Recovery rate</span>
            <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">{scoreData.pillars.recovery}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] rounded-full"
              style={{ width: `${scoreData.pillars.recovery}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#6B7280] block">
            Weighted efficiency on in-flight risk
          </span>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Pre-failure prevention</span>
            <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">{scoreData.pillars.prevention}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] rounded-full"
              style={{ width: `${scoreData.pillars.prevention}%`, opacity: 0.85 }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#6B7280] block">
            Pre-emptive mitigation rate
          </span>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Incident response</span>
            <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">{scoreData.pillars.incident_response}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] rounded-full"
              style={{ width: `${scoreData.pillars.incident_response}%`, opacity: 0.7 }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#6B7280] block">
            Mitigation response speed
          </span>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">Policy compliance</span>
            <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">{scoreData.pillars.policy_compliance}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#10B981] rounded-full"
              style={{ width: `${scoreData.pillars.policy_compliance}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#6B7280] block">
            100% policy engine invariant pass
          </span>
        </div>
      </div>

      {/* Model Calibration & Accuracy Metrics */}
      {accuracyData && (
        <div className="rounded-[12px] border border-slate-200 dark:border-white/[0.04] bg-slate-50 dark:bg-[#0E121A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#8B7CF6]" />
              <span className="text-xs font-medium text-slate-900 dark:text-[#F5F6FA]">
                Predictive Model Calibration & Accuracy
              </span>
              <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium text-[#059669] dark:text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20">
                {accuracyData.evaluation_label}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-[#6B7280]">
              {accuracyData.total_evaluated_predictions} evaluations
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-[8px] bg-white dark:bg-[#12161F] p-3 border border-slate-200 dark:border-white/[0.04]">
              <span className="text-[11px] text-slate-400 dark:text-[#6B7280] block">Recovery accuracy</span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] text-sm tabular-nums">{accuracyData.recovery_probability_accuracy_pct}%</span>
            </div>
            <div className="rounded-[8px] bg-white dark:bg-[#12161F] p-3 border border-slate-200 dark:border-white/[0.04]">
              <span className="text-[11px] text-slate-400 dark:text-[#6B7280] block">Precision @ High</span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] text-sm tabular-nums">{accuracyData.precision_pct}%</span>
            </div>
            <div className="rounded-[8px] bg-white dark:bg-[#12161F] p-3 border border-slate-200 dark:border-white/[0.04]">
              <span className="text-[11px] text-slate-400 dark:text-[#6B7280] block">Recall @ Recoverable</span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] text-sm tabular-nums">{accuracyData.recall_pct}%</span>
            </div>
            <div className="rounded-[8px] bg-white dark:bg-[#12161F] p-3 border border-slate-200 dark:border-white/[0.04]">
              <span className="text-[11px] text-slate-400 dark:text-[#6B7280] block">Risk model accuracy</span>
              <span className="font-semibold text-slate-900 dark:text-[#F5F6FA] text-sm tabular-nums">{accuracyData.risk_prediction_accuracy_pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
