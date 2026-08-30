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
    <div className="rounded-fintech-lg border border-brand-500/30 bg-gradient-to-br from-indigo-50/80 via-white to-brand-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950 p-6 shadow-fintech-sm space-y-6">
      {/* Top Title & Narrative */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              Executive Money Story
            </span>
            <span className="text-[10px] font-mono text-fintech-muted">Continuous Revenue Protection</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-fintech-primary mt-1">
            The Financial Picture: At-Risk, Captured & Remaining
          </h2>
          <p className="text-xs text-fintech-secondary mt-1 max-w-3xl leading-relaxed">
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
            View Recommendations
          </Button>
        )}
      </div>

      {/* 5 Core Macro Financial Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Revenue At Risk */}
        <div className="rounded-fintech-md border border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/20 p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            1. Money At Risk
          </span>
          <span className="text-xl font-black font-mono text-fintech-primary block truncate">
            {formatCurrency(data.revenue_at_risk)}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-300 font-medium">Total Declined Exposure</span>
        </div>

        {/* 2. Expected Recoverable */}
        <div className="rounded-fintech-md border border-purple-500/30 bg-purple-50/70 dark:bg-purple-950/20 p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block">
            2. Expected Recoverable
          </span>
          <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-300 block truncate">
            {formatCurrency(data.expected_recoverable)}
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">60% Model Addressable</span>
        </div>

        {/* 3. Recovered */}
        <div className="rounded-fintech-md border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            3. Recovered Funds
          </span>
          <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400 block truncate">
            {formatCurrency(data.recovered_so_far)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Settled to Merchant</span>
        </div>

        {/* 4. Protected Pre-Failure */}
        <div className="rounded-fintech-md border border-sky-500/30 bg-sky-50/70 dark:bg-sky-950/20 p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
            4. Protected Pre-Failure
          </span>
          <span className="text-xl font-black font-mono text-sky-700 dark:text-sky-300 block truncate">
            {formatCurrency(data.protected_before_failure)}
          </span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">Pre-Empted In Advance</span>
        </div>

        {/* 5. Remaining Opportunity */}
        <div className="rounded-fintech-md border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            5. Remaining Opportunity
          </span>
          <span className="text-xl font-black font-mono text-amber-700 dark:text-amber-300 block truncate">
            {formatCurrency(data.remaining_opportunity)}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Unclaimed Net Yield</span>
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
