import React, { useEffect, useState } from 'react';
import { Crown, Sparkles, Award, User } from 'lucide-react';
import { getCustomerValueProfile } from '../../api/tier3';
import { CustomerValueProfile } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CustomerValueBadgeProps {
  customerId: string;
  amount?: number | string;
  initialProfile?: CustomerValueProfile;
}

export const CustomerValueBadge: React.FC<CustomerValueBadgeProps> = ({
  customerId,
  amount,
  initialProfile,
}) => {
  const [profile, setProfile] = useState<CustomerValueProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!initialProfile && customerId) {
      let isMounted = true;
      getCustomerValueProfile(customerId, amount)
        .then((res) => {
          if (isMounted) setProfile(res);
        })
        .catch((err) => console.error('Failed to load customer value:', err))
        .finally(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [customerId, amount, initialProfile]);

  if (loading || !profile) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-fintech-surface-subtle text-fintech-muted border border-fintech-border font-mono">
        Scoring LTV...
      </span>
    );
  }

  const isVip = profile.value_tier === 'VIP_ENTERPRISE';
  const isHighGrowth = profile.value_tier === 'HIGH_GROWTH';

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono transition-all border ${
          isVip
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shadow-fintech-sm'
            : isHighGrowth
            ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/40 hover:bg-brand-500/20'
            : 'bg-fintech-surface-subtle text-fintech-secondary border-fintech-border hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {isVip ? (
          <Crown className="w-3.5 h-3.5 text-amber-500" />
        ) : isHighGrowth ? (
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
        ) : (
          <Award className="w-3.5 h-3.5 text-fintech-muted" />
        )}
        <span>{profile.value_tier.replace('_', ' ')}</span>
      </button>

      {/* Popover */}
      {showDetails && (
        <div
          className="absolute z-30 mt-2 w-72 p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-2xl space-y-3 left-0 text-left animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-fintech-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-fintech-primary flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-brand-500" />
              Customer Value
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/30">
              Score {profile.customer_value_score}/100
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-fintech-muted">Historical GMV:</span>
              <span className="font-mono font-bold text-fintech-primary">{formatCurrency(profile.historical_volume)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Relationship Tenure:</span>
              <span className="font-mono font-bold text-fintech-primary">
                {profile.relationship_tenure_months} months
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-fintech-muted">Touch Level:</span>
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                {profile.recommended_touch_level.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-fintech-border text-[11px] text-fintech-secondary">
            <span className="font-semibold block mb-0.5 text-fintech-primary">Rationale:</span>
            {profile.explanation}
          </div>
        </div>
      )}
    </div>
  );
};
