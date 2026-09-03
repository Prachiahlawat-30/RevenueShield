/**
 * Enterprise fintech formatting utilities for currency, percentages, timestamps, and status styling.
 */

export const formatCurrency = (
  amount: string | number | undefined | null,
  currency: string = 'INR'
): string => {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
  val: string | number | undefined | null,
  decimals: number = 1
): string => {
  if (val === undefined || val === null) return '0%';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
};

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
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
      return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
    case 'recovering':
    case 'executing':
      return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
    case 'diagnosing':
    case 'action_selected':
    case 'action selected':
    case 'policy_check':
    case 'pending':
    case 'pending_review':
      return 'bg-white/[0.05] text-[#9CA3B0] border-white/[0.08]';
    case 'detected':
    case 'medium':
    case 'warning':
    case 'escalated':
    case 'human_approval_required':
      return 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/20';
    case 'stopped':
    case 'failed':
    case 'declined':
    case 'rejected':
    case 'block':
    case 'critical':
    case 'high':
      return 'bg-[#F0625A]/10 text-[#F0625A] border-[#F0625A]/20';
    case 'low':
    case 'stale':
    default:
      return 'bg-white/[0.05] text-[#9CA3B0] border-white/[0.08]';
  }
};

export const getFailureTypeLabel = (type: string | undefined | null): string => {
  if (!type) return 'Unknown Failure';
  switch (type.toLowerCase()) {
    case 'insufficient_funds':
      return 'Insufficient Funds';
    case 'expired_card':
      return 'Expired Card';
    case 'temporary_decline':
      return 'Temporary Decline';
    case 'network_error':
      return 'Network Error';
    case 'fraud_suspected':
      return 'Fraud Suspected';
    case 'invalid_card':
      return 'Invalid Card Details';
    case 'issuer_unavailable':
      return 'Issuer Unavailable';
    default:
      return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

export const getActionLabel = (action: string | undefined | null): string => {
  if (!action) return 'No Action';
  switch (action.toLowerCase()) {
    case 'retry_payment':
    case 'retry':
      return 'Retry Payment';
    case 'send_payment_link':
    case 'dunning_email':
      return 'Send Payment Link';
    case 'switch_gateway':
      return 'Switch Gateway';
    case 'request_new_method':
      return 'Request New Card';
    case 'smart_retry':
      return 'Smart Retry';
    case 'escalate_human':
    case 'escalate_to_human':
      return 'Escalate to Support';
    case 'stop_recovery':
      return 'Stop Interventions';
    default:
      return action
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
  }
};
