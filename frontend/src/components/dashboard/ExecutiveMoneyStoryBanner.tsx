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
      <div className="rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card animate-pulse">
        <div className="h-5 w-48 bg-white/[0.06] rounded-lg mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.03] rounded-[12px]"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-white/[0.06] bg-[#12161F] p-6 shadow-fintech-card space-y-6">
      {/* Top Title & Narrative */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase">
              Executive briefing
            </span>
            <span className="text-xs text-[#9CA3B0]">· Portfolio health & yield capture</span>
          </div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#F5F6FA] mt-1 tracking-tight">
            Macro Portfolio Exposure & Yield Capture
          </h2>
          <p className="text-[14px] text-[#9CA3B0] mt-1 max-w-3xl leading-relaxed">
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
            Action recommendations
          </Button>
        )}
      </div>

      {/* 4 Cards with Clear Visual Hierarchy (Reduced from cramped 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Primary Highlight: Settled Funds */}
        <div className="rounded-[12px] border border-[#10B981]/20 bg-[#10B981]/[0.04] p-4 space-y-1">
          <span className="text-[11px] font-medium tracking-[0.04em] text-[#10B981] uppercase block">
            Settled funds
          </span>
          <span className="text-[24px] font-semibold text-[#10B981] block truncate tabular-nums">
            {formatCurrency(data.recovered_so_far)}
          </span>
          <span className="text-[12px] text-[#9CA3B0]">Captured to merchant account</span>
        </div>

        {/* 2. Money At Risk */}
        <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-4 space-y-1">
          <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
            Money at risk
          </span>
          <span className="text-[24px] font-semibold text-[#F0625A] block truncate tabular-nums">
            {formatCurrency(data.revenue_at_risk)}
          </span>
          <span className="text-[12px] text-[#6B7280]">Total declined exposure</span>
        </div>

        {/* 3. Expected Recoverable */}
        <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-4 space-y-1">
          <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
            Expected recoverable
          </span>
          <span className="text-[24px] font-semibold text-[#F5F6FA] block truncate tabular-nums">
            {formatCurrency(data.expected_recoverable)}
          </span>
          <span className="text-[12px] text-[#6B7280]">60% model addressable</span>
        </div>

        {/* 4. Pre-Auth Protected */}
        <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-4 space-y-1">
          <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
            Pre-auth protected
          </span>
          <span className="text-[24px] font-semibold text-[#F5F6FA] block truncate tabular-nums">
            {formatCurrency(data.protected_before_failure)}
          </span>
          <span className="text-[12px] text-[#6B7280]">Smart 3DS & routing</span>
        </div>
      </div>

      {/* Primary Loss Factors & Recommended Action */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-xs">
        {/* Primary Loss Factors */}
        <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-5 space-y-3">
          <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
            Primary loss factors
          </span>
          <div className="space-y-3">
            {data.top_failure_causes.map((c, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#F5F6FA]">{c.failure_category}</span>
                  <span className="text-[#9CA3B0] tabular-nums">
                    {formatCurrency(c.amount_lost)} ({c.percentage_share}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3B82F6]"
                    style={{
                      width: `${c.percentage_share}%`,
                      opacity: 1 - idx * 0.25,
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#6B7280] block">
                  Intervention: {c.primary_solution}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action */}
        <div className="rounded-[12px] border border-white/[0.06] bg-[#0E121A] p-5 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-[0.04em] text-[#6B7280] uppercase block">
                Recommended action
              </span>
              <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 border border-[#E8A33D]/20">
                {data.action_urgency} priority
              </span>
            </div>

            <h4 className="text-[16px] font-semibold text-[#F5F6FA] mt-2">
              {data.primary_recommended_action}
            </h4>
            <p className="text-[13px] text-[#9CA3B0] mt-1 leading-relaxed">
              Addressing Gateway Alpha degradation via dynamic routing will protect an estimated{' '}
              <strong className="text-[#F5F6FA] tabular-nums">
                {formatCurrency(data.action_expected_yield)}/hour
              </strong>{' '}
              with zero merchant operational disruption.
            </p>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">
              Expected yield: <strong className="text-[#10B981] tabular-nums">+{formatCurrency(data.action_expected_yield)}/hr</strong>
            </span>
            {onNavigateToRecommendations && (
              <Button
                size="sm"
                variant="primary"
                onClick={onNavigateToRecommendations}
              >
                Execute intervention
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
