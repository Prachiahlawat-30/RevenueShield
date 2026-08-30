import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  AlertTriangle,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getProactiveRecommendations } from '../api/tier3';
import { RecommendationsFeedResponse, ProactiveRecommendationItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';

interface RecommendationsFeedPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const RecommendationsFeedPage: React.FC<RecommendationsFeedPageProps> = ({
  onNavigateToTab,
}) => {
  const [data, setData] = useState<RecommendationsFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getProactiveRecommendations();
      setData(res);
    } catch (err) {
      console.error('Failed to load recommendations feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = (item: ProactiveRecommendationItem) => {
    if (item.action_type === 'SIMULATE' && onNavigateToTab) {
      onNavigateToTab('control-center');
    } else if (item.action_type === 'VIEW_CUSTOMERS' && onNavigateToTab) {
      onNavigateToTab('predictive');
    } else if (item.action_type === 'LAUNCH_CAMPAIGN') {
      setActionNotice(`Card refresh campaign dispatched for 84 enterprise accounts.`);
      setTimeout(() => setActionNotice(null), 4500);
    } else if (item.action_type === 'APPLY_TIMING') {
      setActionNotice(`Applied 48-hour payroll alignment retry cooldown for 42 accounts.`);
      setTimeout(() => setActionNotice(null), 4500);
    }
  };

  const getPriorityStyle = (lvl: string) => {
    switch (lvl) {
      case 'HIGH_PRIORITY':
        return {
          border: 'border-rose-500/30',
          bg: 'bg-rose-500/5',
          badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
          icon: Flame,
        };
      case 'CUSTOMER_RISK':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/5',
          badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
          icon: AlertTriangle,
        };
      case 'EXPIRING_CARDS':
        return {
          border: 'border-sky-500/30',
          bg: 'bg-sky-500/5',
          badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
          icon: CreditCard,
        };
      default:
        return {
          border: 'border-brand-500/30',
          bg: 'bg-brand-500/5',
          badge: 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
            <Sparkles className="h-4 w-4" />
            <span>PROACTIVE RECOMMENDATION FEED</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Autonomous Recommendations
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary max-w-3xl">
            RecoverAI continuously scans processor health, customer risk signals, and decline codes to proactively surface high-yield interventions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={loadData}
        >
          Refresh Feed
        </Button>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="rounded-fintech-md border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase text-fintech-muted block">Total Active Recommendations</span>
          <span className="text-2xl font-black font-mono text-fintech-primary block mt-1">{data?.total_recommendations || 0}</span>
          <span className="text-[10px] text-fintech-muted">Ranked by expected yield</span>
        </div>

        <div className="rounded-fintech-lg border border-rose-500/30 bg-rose-500/5 p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">High Priority Actions</span>
          <span className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300 block mt-1">{data?.high_priority_count || 0}</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">Immediate operator review</span>
        </div>

        <div className="rounded-fintech-lg border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Addressable Protected Revenue</span>
          <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 block mt-1">
            {formatCurrency(data?.estimated_total_addressable_revenue || 0)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500">Cumulative expected lift</span>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {data?.recommendations.map((item) => {
          const style = getPriorityStyle(item.priority_level);

          return (
            <div
              key={item.id}
              className={`rounded-fintech-lg border ${style.border} ${style.bg} p-6 shadow-fintech-sm space-y-4 transition-all hover:border-slate-400 dark:hover:border-slate-600`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fintech-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono border ${style.badge}`}>
                    {item.badge_label}
                  </span>
                  <h3 className="text-base font-bold text-fintech-primary">{item.title}</h3>
                </div>

                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-fintech-surface px-2.5 py-1 rounded-fintech-sm border border-fintech-border">
                  {item.financial_impact_metric}
                </span>
              </div>

              <p className="text-xs text-fintech-secondary leading-relaxed font-medium">
                {item.description}
              </p>

              <div className="rounded-fintech-md bg-fintech-surface border border-fintech-border p-3.5 text-xs text-fintech-primary">
                <strong className="text-brand-600 dark:text-brand-400 uppercase text-[10px] block mb-0.5 font-mono">Recommended Intervention:</strong>
                {item.recommended_action}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-fintech-border text-xs">
                <span className="text-fintech-muted font-mono">
                  Expected Protected Revenue:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                    +{formatCurrency(item.expected_protected_revenue)}
                  </strong>
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => handleAction(item)}
                >
                  {item.action_type === 'SIMULATE'
                    ? 'Simulate Mitigation'
                    : item.action_type === 'VIEW_CUSTOMERS'
                    ? 'View At-Risk Customers'
                    : item.action_type === 'LAUNCH_CAMPAIGN'
                    ? 'Launch Refresh Campaign'
                    : 'Apply Cooldown Timing'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
