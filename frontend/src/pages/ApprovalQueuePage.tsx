import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ShieldAlert,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  getApprovalQueue,
  approveQueuedAction,
  rejectQueuedAction,
  escalateQueuedAction,
} from '../api/tier3';
import { ApprovalQueueItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const ApprovalQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const items = await getApprovalQueue();
      setQueue(items);
    } catch (err) {
      console.error('Failed to load approval queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleAction = async (
    riskId: string,
    action: 'APPROVE' | 'REJECT' | 'ESCALATE'
  ) => {
    try {
      setProcessingId(riskId);
      let res;
      if (action === 'APPROVE') {
        res = await approveQueuedAction(riskId, 'Approved via Operator Console');
      } else if (action === 'REJECT') {
        res = await rejectQueuedAction(riskId, 'Rejected via Operator Console');
      } else {
        res = await escalateQueuedAction(riskId, 'Escalated to Specialist Desk');
      }

      setNotification(`Action [${action}] recorded. Audit Event: ${res.audit_event_logged}.`);
      setQueue((prev) => prev.filter((item) => item.risk_id !== riskId));
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(`Failed to ${action} item`, err);
    } finally {
      setProcessingId(null);
    }
  };

  const getUrgencyBadge = (tag: string) => {
    switch (tag) {
      case 'HIGH_VALUE':
        return (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono">
            HIGH VALUE
          </span>
        );
      case 'UNKNOWN_FAILURE':
        return (
          <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 border border-purple-500/30 font-mono">
            UNKNOWN FAILURE
          </span>
        );
      case 'REPEATED_FAILURE':
        return (
          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 border border-rose-500/30 font-mono">
            REPEATED FAILURE
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-400 border border-brand-500/30 font-mono">
            SENSITIVE CASE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-4 w-4" />
            <span>Human-in-the-Loop Operations</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Human Approval Queue
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary">
            Review high-value, repeat-failure, and sensitive recovery interventions gated by PolicyEngine.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={loadQueue}
        >
          Refresh Queue ({queue.length})
        </Button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="rounded-fintech-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Queue Items List */}
      {loading ? (
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center text-fintech-muted">
          Loading approval queue items...
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center space-y-2 shadow-fintech-sm">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-fintech-primary">Approval Queue is Clear</h3>
          <p className="text-xs text-fintech-muted max-w-sm mx-auto">
            All current recovery interventions have been policy-approved or handled by autonomous routines.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item.id}
              className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm transition-all space-y-4"
            >
              {/* Row 1: Badges, Customer & Amount */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
                <div className="flex items-center gap-3">
                  {getUrgencyBadge(item.urgency_tag)}
                  <div>
                    <h3 className="text-base font-bold text-fintech-primary">{item.customer_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-fintech-muted">
                      <Building className="h-3.5 w-3.5" />
                      <span>{item.merchant_name}</span>
                      <span>•</span>
                      <span className="font-mono">{item.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
                    Amount at Risk
                  </span>
                  <span className="text-xl font-black font-mono text-fintech-primary">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>

              {/* Row 2: AI Recommendation & Policy Rationale */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5 font-mono">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Recommendation
                  </span>
                  <p className="font-medium text-fintech-primary">{item.ai_recommendation}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono pt-1">
                    Expected Yield: {formatCurrency(item.expected_recovery)}
                  </p>
                </div>

                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-mono">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    PolicyEngine Gate
                  </span>
                  <p className="font-medium text-fintech-secondary">{item.policy_reason}</p>
                </div>
              </div>

              {/* Row 3: Human Operator Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-fintech-muted font-mono">
                  Requested: {formatDate(item.requested_at)}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    isLoading={processingId === item.risk_id}
                    onClick={() => handleAction(item.risk_id, 'REJECT')}
                  >
                    REJECT
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={ArrowUpRight}
                    isLoading={processingId === item.risk_id}
                    onClick={() => handleAction(item.risk_id, 'ESCALATE')}
                  >
                    ESCALATE
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={processingId === item.risk_id}
                    onClick={() => handleAction(item.risk_id, 'APPROVE')}
                  >
                    APPROVE
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
