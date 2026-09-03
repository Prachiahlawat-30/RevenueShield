/**
 * Enterprise fintech formatting utilities for currency, percentages, timestamps, and status styling.
 */

export const formatCurrency = (
  amount: string | number | undefined | null,
  currency: string = 'USD'
): string => {
  if (amount === undefined || amount === null) return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatIndianLakhs = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatPercent = (
  percent: number | undefined | null,
  decimals: number = 1
): string => {
  if (percent === undefined || percent === null || isNaN(percent)) return '0%';
  // If decimal between 0 and 1, multiply by 100
  const normalized = percent <= 1.0 && percent >= 0 ? percent * 100 : percent;
  return `${normalized.toFixed(decimals)}%`;
};

export const formatCompactNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffSecs = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateString;
  }
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'recovered':
    case 'succeeded':
    case 'approved':
    case 'allow':
    case 'active':
      return 'bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'recovering':
    case 'executing':
      return 'bg-blue-500/[0.08] text-blue-700 dark:text-blue-400 border-blue-500/20';
    case 'diagnosing':
    case 'action_selected':
    case 'action selected':
    case 'policy_check':
    case 'pending':
    case 'pending_review':
      return 'bg-slate-500/[0.08] text-slate-700 dark:text-slate-300 border-slate-500/20';
    case 'detected':
    case 'medium':
    case 'warning':
      return 'bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'escalated':
    case 'human_approval_required':
      return 'bg-amber-500/[0.08] text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'stopped':
    case 'failed':
    case 'declined':
    case 'rejected':
    case 'block':
    case 'high':
      return 'bg-rose-500/[0.08] text-rose-700 dark:text-rose-400 border-rose-500/20';
    case 'low':
    case 'stale':
    default:
      return 'bg-slate-500/[0.06] text-slate-600 dark:text-slate-400 border-slate-500/15';
  }
};

export const getFailureTypeLabel = (type: string): string => {
  switch (type) {
    case 'temporary_decline':
      return 'Temporary Bank Decline';
    case 'insufficient_funds':
      return 'Insufficient Funds';
    case 'expired_card':
      return 'Expired Card Credential';
    case 'network_error':
      return 'Issuer / Network Timeout';
    case 'fraud_stoppage':
      return 'Risk Rule Flag';
    default:
      return type?.replace(/_/g, ' ') || 'Unknown Failure';
  }
};

export const getActionLabel = (action: string | undefined | null): string => {
  if (!action) return '—';
  switch (action.toLowerCase()) {
    case 'retry_payment':
      return 'Smart Retry';
    case 'payment_reminder':
      return 'Payment Reminder';
    case 'request_method_update':
      return 'Request Method Update';
    case 'human_escalation':
      return 'Human Escalation';
    case 'stop':
      return 'Stop Interventions';
    default:
      return action.replace(/_/g, ' ');
  }
};
