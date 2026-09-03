import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
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
      <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 animate-pulse">
        <div className="h-5 w-60 bg-slate-200 dark:bg-white/10 rounded-lg mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
      {/* Top Title & Narrative */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-slate-500/[0.06] px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider border border-slate-500/15">
              EXECUTIVE BRIEFING
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Continuous Revenue Protection</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            Macro Portfolio Exposure & Yield Capture
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {data.headline_narrative}
          </p>
        </div>

        {onNavigateToRecommendations && (
          <Button
            size="sm"
            variant="outline"
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
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-1">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            MONEY AT RISK
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.revenue_at_risk)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Total Declined Exposure</span>
        </div>

        {/* 2. Expected Recoverable */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-1">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            EXPECTED RECOVERABLE
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.expected_recoverable)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">60% Model Addressable</span>
        </div>

        {/* 3. Recovered */}
        <div className="rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-1">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
            SETTLED FUNDS
          </span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 block truncate">
            {formatCurrency(data.recovered_so_far)}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-mono">Captured to Merchant</span>
        </div>

        {/* 4. Protected Pre-Failure */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-1">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            PRE-AUTH PROTECTED
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.protected_before_failure)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Smart 3DS & Routing</span>
        </div>

        {/* 5. Remaining Opportunity */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4 space-y-1">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            PIPELINE QUEUE
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white block truncate">
            {formatCurrency(data.remaining_opportunity)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Unclaimed Pipeline</span>
        </div>
      </div>

      {/* Why are we losing money? & What should we do next? */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-xs">
        {/* Why are we losing money? */}
        <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-5 space-y-3">
          <span className="text-slate-500 dark:text-slate-400 font-mono font-medium uppercase text-[10px] tracking-wider block">
            PRIMARY LOSS FACTORS
          </span>
          <div className="space-y-3">
            {data.top_failure_causes.map((c, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900 dark:text-white">{c.failure_category}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {formatCurrency(c.amount_lost)} ({c.percentage_share}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-200/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500"
                    style={{
                      width: `${c.percentage_share}%`,
                      opacity: 0.85 - idx * 0.2,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                  Intervention: {c.primary_solution}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What should we do next? */}
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-mono font-medium uppercase text-[10px] tracking-wider block">
                RECOMMENDED ACTION
              </span>
              <span className="rounded-full bg-slate-500/[0.08] px-2 py-0.5 text-[9px] font-mono font-medium text-slate-700 dark:text-slate-300 uppercase border border-slate-500/15">
                {data.action_urgency} URGENCY
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-2">
              {data.primary_recommended_action}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Addressing Gateway Alpha degradation via dynamic routing will protect an estimated{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {formatCurrency(data.action_expected_yield)}/hour
              </strong>{' '}
              with zero merchant operational disruption.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Expected Yield: <strong className="text-slate-900 dark:text-white">+{formatCurrency(data.action_expected_yield)}/hr</strong>
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
