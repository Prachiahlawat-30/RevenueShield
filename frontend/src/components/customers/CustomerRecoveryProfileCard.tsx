import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Award,
  TrendingUp,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { getCustomerRecoveryProfile } from '../../api/tier2';
import { CustomerRecoveryProfile } from '../../types';
import { formatPercent } from '../../utils/formatters';

interface CustomerRecoveryProfileCardProps {
  customerId: string;
}

export const CustomerRecoveryProfileCard: React.FC<CustomerRecoveryProfileCardProps> = ({
  customerId,
}) => {
  const [profile, setProfile] = useState<CustomerRecoveryProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const p = await getCustomerRecoveryProfile(customerId);
        setProfile(p);
      } catch (err: any) {
        console.error('Failed to load customer profile:', err);
      } finally {
        setLoading(false);
      }
    };
    if (customerId) {
      fetchProfile();
    }
  }, [customerId]);

  if (loading || !profile) return null;

  return (
    <div className="p-4 rounded-fintech-lg bg-fintech-surface border border-fintech-border space-y-3 shadow-fintech-sm">
      {/* Header & Segment Badge */}
      <div className="flex items-center justify-between border-b border-fintech-border pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-fintech-primary uppercase tracking-wider">
              360 Recovery Profile
            </h3>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
              {profile.segment_label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-fintech-muted block uppercase font-semibold">Recoverability Score</span>
          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {profile.recoverability_score} / 100
          </span>
        </div>
      </div>

      <p className="text-xs text-fintech-secondary leading-snug">{profile.segment_description}</p>

      {/* Grid of Profile Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-[10px] text-fintech-muted uppercase font-semibold block">Historical Rate</span>
          <p className="text-xs font-bold font-mono text-fintech-primary mt-0.5">
            {formatPercent(profile.historical_recovery_rate * 100)}
          </p>
        </div>
        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-[10px] text-fintech-muted uppercase font-semibold block">Preferred Action</span>
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5 truncate">
            {profile.preferred_recovery_action}
          </p>
        </div>
        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-[10px] text-fintech-muted uppercase font-semibold block">Best Window</span>
          <p className="text-xs font-bold text-fintech-primary mt-0.5">
            {profile.best_recovery_window}
          </p>
        </div>
        <div className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border">
          <span className="text-[10px] text-fintech-muted uppercase font-semibold block">Sensitivity</span>
          <p
            className={`text-xs font-bold mt-0.5 ${
              profile.contact_sensitivity === 'HIGH'
                ? 'text-amber-600 dark:text-amber-400'
                : profile.contact_sensitivity === 'MEDIUM'
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {profile.contact_sensitivity}
          </p>
        </div>
      </div>
    </div>
  );
};
