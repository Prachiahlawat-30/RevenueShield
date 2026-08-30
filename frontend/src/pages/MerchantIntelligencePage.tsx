import React, { useEffect, useState } from 'react';
import {
  Building2,
  Award,
} from 'lucide-react';
import { getMerchantHealthScores, getMerchantActionPlan } from '../api/tier3';
import { MerchantHealthScoreResponse, MerchantActionPlanResponse } from '../types';
import { formatCurrency } from '../utils/formatters';

export const MerchantIntelligencePage: React.FC = () => {
  const [merchants, setMerchants] = useState<MerchantHealthScoreResponse[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<MerchantActionPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        setLoading(true);
        const data = await getMerchantHealthScores();
        setMerchants(data);
        if (data.length > 0) {
          setSelectedMerchantId(data[0].merchant_id);
        }
      } catch (err) {
        console.error('Failed to load merchant health scores', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMerchants();
  }, []);

  useEffect(() => {
    if (!selectedMerchantId) return;

    const fetchPlan = async () => {
      try {
        setLoadingPlan(true);
        const plan = await getMerchantActionPlan(selectedMerchantId);
        setActionPlan(plan);
      } catch (err) {
        console.error('Failed to load merchant action plan', err);
      } finally {
        setLoadingPlan(false);
      }
    };
    fetchPlan();
  }, [selectedMerchantId]);

  const selectedMerchant = merchants.find((m) => m.merchant_id === selectedMerchantId);

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
            <Building2 className="h-4 w-4" />
            <span>MERCHANT REVENUE INTELLIGENCE</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Merchant Health & Action Plans
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            Merchant-level revenue health benchmarking, payment gateway resilience diagnostics, and prioritized revenue growth action plans.
          </p>
        </div>
      </div>

      {/* Merchant Selector Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {merchants.map((m) => {
          const isSelected = selectedMerchantId === m.merchant_id;
          return (
            <button
              key={m.merchant_id}
              onClick={() => setSelectedMerchantId(m.merchant_id)}
              className={`flex items-center gap-3 rounded-fintech-lg p-4 border transition-all min-w-[240px] text-left ${
                isSelected
                  ? 'border-brand-500 bg-brand-500/10 text-fintech-primary shadow-fintech-sm'
                  : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-sm font-mono border border-brand-500/20">
                {m.overall_health_score}
              </div>
              <div>
                <span className="font-bold text-xs text-fintech-primary block">{m.merchant_name}</span>
                <span className="text-[10px] font-mono text-fintech-muted">
                  {m.active_customers_count} accounts • {formatCurrency(m.monthly_volume)}/mo
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMerchant && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Merchant Health Score Card */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
            <div className="flex items-center justify-between border-b border-fintech-border pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-fintech-muted block">
                  Merchant Health Index
                </span>
                <h3 className="text-lg font-bold text-fintech-primary mt-0.5">{selectedMerchant.merchant_name}</h3>
              </div>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                {selectedMerchant.grade}
              </span>
            </div>

            {/* Score Display */}
            <div className="flex items-baseline justify-center gap-2 py-2">
              <span className="text-5xl font-black font-mono text-fintech-primary">
                {selectedMerchant.overall_health_score}
              </span>
              <span className="text-sm font-mono text-fintech-muted">/ 100</span>
            </div>

            {/* 4 Pillars Breakdown */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-fintech-secondary font-semibold mb-1">
                  <span>Payment Success Health</span>
                  <span className="font-mono text-fintech-primary">{selectedMerchant.pillars.payment_health}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${selectedMerchant.pillars.payment_health}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-fintech-secondary font-semibold mb-1">
                  <span>Recovery Efficacy</span>
                  <span className="font-mono text-fintech-primary">{selectedMerchant.pillars.recovery}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${selectedMerchant.pillars.recovery}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-fintech-secondary font-semibold mb-1">
                  <span>Revenue Leakage Shield</span>
                  <span className="font-mono text-fintech-primary">{selectedMerchant.pillars.revenue_leakage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500" style={{ width: `${selectedMerchant.pillars.revenue_leakage}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-fintech-secondary font-semibold mb-1">
                  <span>Gateway Reliability</span>
                  <span className="font-mono text-fintech-primary">{selectedMerchant.pillars.gateway_reliability}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${selectedMerchant.pillars.gateway_reliability}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Top 3 Action Plan Opportunities */}
          <div className="lg:col-span-2 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-6">
            <div className="flex items-center justify-between border-b border-fintech-border pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider font-mono">
                  Prioritized Growth Strategy
                </span>
                <h3 className="text-lg font-bold text-fintech-primary mt-0.5">
                  Action Plan & Top Revenue Opportunities
                </h3>
              </div>
              <span className="text-xs font-mono text-rose-600 dark:text-rose-400">
                Predicted Leakage: <strong>{formatCurrency(actionPlan?.predicted_monthly_leakage || 87000)}/mo</strong>
              </span>
            </div>

            {loadingPlan || !actionPlan ? (
              <div className="p-8 text-center text-fintech-muted text-xs animate-pulse">
                Generating merchant action plan...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 3 Opportunities */}
                <div className="space-y-3">
                  {actionPlan.top_3_opportunities.map((opp) => (
                    <div
                      key={opp.rank}
                      className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black font-mono">
                            #{opp.rank}
                          </span>
                          <h4 className="font-bold text-fintech-primary text-xs">{opp.title}</h4>
                        </div>
                        <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{formatCurrency(opp.potential_monthly_revenue)}/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-fintech-muted">{opp.failure_cause}</p>
                      <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                        Playbook: {opp.recommended_playbook}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Strategy Summary Box */}
                <div className="rounded-fintech-md bg-fintech-surface-subtle p-4 border border-fintech-border space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold uppercase text-[10px]">
                    <Award className="w-3.5 h-3.5" />
                    <span>Top Recovery Strategy</span>
                  </div>
                  <p className="text-fintech-primary font-medium">{actionPlan.top_recovery_strategy}</p>
                  <p className="text-fintech-muted text-[11px]">Primary Issue: {actionPlan.top_gateway_issue}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
