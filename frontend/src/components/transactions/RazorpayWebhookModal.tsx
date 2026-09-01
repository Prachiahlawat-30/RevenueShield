import React, { useState } from 'react';
import {
  X,
  Zap,
  Copy,
  Check,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { simulateRazorpayWebhook, RazorpayWebhookResponse } from '../../api/transactions';
import { formatCurrency } from '../../utils/formatters';

interface RazorpayWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RazorpayWebhookModal: React.FC<RazorpayWebhookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [scenario, setScenario] = useState('insufficient_funds');
  const [amountInr, setAmountInr] = useState('2499.00');
  const [customerName, setCustomerName] = useState('Ananya Sharma');
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<RazorpayWebhookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/api/webhooks/razorpay`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setError(null);
    setResult(null);

    try {
      const data = await simulateRazorpayWebhook({
        scenario,
        amount_inr: parseFloat(amountInr) || 2499.0,
        customer_name: customerName,
      });
      setResult(data);
      onSuccess();
    } catch (err: any) {
      console.error('Failed to simulate Razorpay webhook', err);
      setError(err.response?.data?.detail || 'Failed to simulate webhook event.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fintech-fade">
      <div className="w-full max-w-xl rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2B6FFF]/10 text-[#2B6FFF] border border-[#2B6FFF]/20">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">
                  Razorpay Webhook Integration
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 px-2 py-0.2 text-[10px] font-mono font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  Active Listener
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Capture real-time <code className="text-[#6822CC] font-mono">payment.failed</code> events directly from your Razorpay Merchant Dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Live Webhook Endpoint Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1A2E] dark:text-white uppercase tracking-wider">
                Webhook Receiver URL
              </label>
              <span className="text-[10px] text-[#6B7280] font-mono">POST Payload</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs font-mono text-[#1A1A2E] dark:text-white select-all focus:outline-none"
              />
              <Button
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopyUrl}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-[11px] text-[#6B7280]">
              Add this URL in your <strong>Razorpay Dashboard &gt; Settings &gt; Webhooks</strong> and subscribe to the <strong>payment.failed</strong> event.
            </p>
          </div>

          {/* Interactive Test Simulator */}
          <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6822CC]">
                1-Click Webhook Simulator
              </span>
              <span className="text-[10px] font-mono text-[#6B7280]">Real-time Dispatch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                  Failure Scenario
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-1.5 text-xs text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
                >
                  <option value="insufficient_funds">Insufficient Funds (Debit decline)</option>
                  <option value="temporary_decline">Temporary Bank Decline (Velocity check)</option>
                  <option value="expired_card">Expired Card Credential</option>
                  <option value="network_error">Issuer Bank 3DS Network Timeout</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                  Transaction Amount (INR)
                </label>
                <input
                  type="number"
                  value={amountInr}
                  onChange={(e) => setAmountInr(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-1.5 text-xs font-mono text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-1.5 text-xs text-[#1A1A2E] dark:text-white focus:border-[#6822CC] focus:outline-none"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Play}
              className="w-full"
              isLoading={isSimulating}
              onClick={handleSimulate}
            >
              Simulate Razorpay payment.failed Event
            </Button>
          </div>

          {/* Simulation Output Result */}
          {result && (
            <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-4 space-y-2 text-xs animate-fintech-fade">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
                <span>Razorpay Webhook Successfully Processed</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div>
                  <span className="text-[#6B7280] block">Payment ID</span>
                  <span className="font-bold text-[#1A1A2E] dark:text-white">{result.razorpay_payment_id}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Volume at Risk</span>
                  <span className="font-bold text-[#DC2626]">
                    {formatCurrency(result.amount, result.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Customer</span>
                  <span className="font-semibold text-[#1A1A2E] dark:text-white">{result.customer.name}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Diagnosis Type</span>
                  <span className="font-bold text-[#6822CC] uppercase">
                    {result.detected_failure_type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40 p-3 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/50 dark:bg-slate-900/30 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
