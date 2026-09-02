import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getExecutiveMoneyStory } from '../../api/tier3';
import { ExecutiveMoneyStoryResponse } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface ExecutiveMoneyStoryBannerProps {
  onNavigateToRecommendations?: () => void;
}

export const ExecutiveMoneyStoryBanner: React.FC<ExecutiveMoneyStoryBannerProps> = ({
  onNavigateToRecommendations,
}) => {
  const [data, setData] = useState<ExecutiveMoneyStoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const story = await getExecutiveMoneyStory();
        setData(story);
      } catch (err) {
        console.error('Failed to load Executive Money Story', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 animate-pulse">
        <div className="h-5 w-60 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-fintech-md"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] space-y-6">
      {/* Top Title & Narrative */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Executive Briefing
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Continuous Revenue Protection</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Macro Portfolio Exposure & Yield Capture
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {data.headline_narrative}
          </p>
        </div>

        {onNavigateToRecommendations && (
          <Button
            size="sm"
            variant="primary"
            icon={ArrowRight}
            iconPosition="right"
            onClick={onNavigateToRecommendations}
          >
            Action Recommendations
          </Button>
        )}
      </div>

      {/* 5 Core Macro Financial Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Revenue At Risk */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Money At Risk
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.revenue_at_risk)}
          </span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Total Declined Exposure</span>
        </div>

        {/* 2. Expected Recoverable */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Expected Recoverable
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.expected_recoverable)}
          </span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">60% Model Addressable</span>
        </div>

        {/* 3. Recovered */}
        <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
            Settled Funds
          </span>
          <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 block truncate">
            {formatCurrency(data.recovered_so_far)}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium">Captured to Merchant</span>
        </div>

        {/* 4. Protected Pre-Failure */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Pre-Failure Protected
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.protected_before_failure)}
          </span>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Smart 3DS & Pre-Auth</span>
        </div>

        {/* 5. Remaining Opportunity */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Remaining Opportunity
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.remaining_opportunity)}
          </span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Unclaimed Pipeline</span>
        </div>
      </div>

      {/* Why are we losing money? & What should we do next? */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-xs">
        {/* Why are we losing money? */}
        <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface p-4 space-y-3">
          <span className="text-fintech-muted font-bold uppercase text-[10px] tracking-wider block">
            WHY ARE WE LOSING MONEY?
          </span>
          <div className="space-y-2.5">
            {data.top_failure_causes.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fintech-primary">{c.failure_category}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {formatCurrency(c.amount_lost)} ({c.percentage_share}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                    style={{ width: `${c.percentage_share}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-fintech-muted italic block">
                  Solution: {c.primary_solution}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What should we do next? */}
        <div className="rounded-fintech-md border border-brand-500/30 bg-brand-500/5 dark:bg-indigo-950/20 p-4 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-brand-600 dark:text-indigo-400 font-bold uppercase text-[10px] tracking-wider block">
                WHAT SHOULD WE DO NEXT?
              </span>
              <span className="rounded bg-rose-500/10 dark:bg-rose-500/20 px-2 py-0.5 text-[9px] font-black text-rose-700 dark:text-rose-300 uppercase border border-rose-500/30">
                {data.action_urgency} ACTION
              </span>
            </div>

            <h4 className="text-base font-bold text-fintech-primary mt-2">
              {data.primary_recommended_action}
            </h4>
            <p className="text-xs text-fintech-secondary mt-1 leading-relaxed">
              Addressing Gateway Alpha degradation via dynamic routing will protect an estimated{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(data.action_expected_yield)}/hour
              </strong>{' '}
              with zero merchant operational disruption.
            </p>
          </div>

          <div className="pt-3 border-t border-brand-500/20 flex items-center justify-between">
            <span className="text-[11px] text-fintech-muted font-mono">
              Yield: <strong className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(data.action_expected_yield)}/hr</strong>
            </span>
            {onNavigateToRecommendations && (
              <Button
                size="sm"
                variant="primary"
                onClick={onNavigateToRecommendations}
              >
                Execute Intervention
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
