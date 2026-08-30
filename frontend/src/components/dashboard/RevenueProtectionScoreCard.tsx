import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
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
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-8 text-center text-fintech-muted text-xs animate-pulse">
        Calculating Enterprise Revenue Protection Index & Calibration...
      </div>
    );
  }

  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-fintech-primary tracking-tight">
              Enterprise Revenue Protection Score
            </h2>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
              Grade {scoreData.grade}
            </span>
          </div>
          <p className="text-xs text-fintech-secondary mt-0.5">
            Holistic index measuring preventative protection, algorithmic recovery yield, and safety guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {scoreData.overall_score}
          </span>
          <span className="text-xs text-fintech-muted font-mono">/ 100</span>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pillar 1 */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fintech-secondary">Recovery Rate</span>
            <span className="font-mono font-bold text-fintech-primary">{scoreData.pillars.recovery}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${scoreData.pillars.recovery}%` }}
            />
          </div>
          <span className="text-[10px] text-fintech-muted block">
            Weighted efficiency on in-flight risk
          </span>
        </div>

        {/* Pillar 2 */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fintech-secondary">Pre-Failure Prevention</span>
            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{scoreData.pillars.prevention}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${scoreData.pillars.prevention}%` }}
            />
          </div>
          <span className="text-[10px] text-fintech-muted block">
            Pre-emptive mitigation rate
          </span>
        </div>

        {/* Pillar 3 */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fintech-secondary">Incident Response</span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{scoreData.pillars.incident_response}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${scoreData.pillars.incident_response}%` }}
            />
          </div>
          <span className="text-[10px] text-fintech-muted block">
            Gateway incident mitigation speed
          </span>
        </div>

        {/* Pillar 4 */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-fintech-secondary">Safety & Compliance</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{scoreData.pillars.policy_compliance}/100</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${scoreData.pillars.policy_compliance}%` }}
            />
          </div>
          <span className="text-[10px] text-fintech-muted block">
            100% PolicyEngine invariant pass
          </span>
        </div>
      </div>

      {/* Model Calibration & Accuracy Metrics */}
      {accuracyData && (
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-fintech-border pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-bold text-fintech-primary">
                Predictive Model Calibration & Accuracy
              </span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                {accuracyData.evaluation_label}
              </span>
            </div>
            <span className="text-[10px] font-mono text-fintech-muted">
              {accuracyData.total_evaluated_predictions} Evaluations
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-fintech-sm bg-fintech-surface p-2.5 border border-fintech-border">
              <span className="text-[10px] text-fintech-muted block">Recovery Accuracy</span>
              <span className="font-mono font-bold text-fintech-primary text-sm">{accuracyData.recovery_probability_accuracy_pct}%</span>
            </div>
            <div className="rounded-fintech-sm bg-fintech-surface p-2.5 border border-fintech-border">
              <span className="text-[10px] text-fintech-muted block">Precision @ High</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{accuracyData.precision_pct}%</span>
            </div>
            <div className="rounded-fintech-sm bg-fintech-surface p-2.5 border border-fintech-border">
              <span className="text-[10px] text-fintech-muted block">Recall @ Recoverable</span>
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">{accuracyData.recall_pct}%</span>
            </div>
            <div className="rounded-fintech-sm bg-fintech-surface p-2.5 border border-fintech-border">
              <span className="text-[10px] text-fintech-muted block">Risk Model Accuracy</span>
              <span className="font-mono font-bold text-fintech-primary text-sm">{accuracyData.risk_prediction_accuracy_pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
