import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  RefreshCw,
  ExternalLink,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  X,
} from 'lucide-react';
import { getRazorpayStatus, testRazorpayConnection } from '../../api/razorpay';
import { RazorpayStatus, RazorpayConnectionTestResult } from '../../types';
import { Button } from '../ui/Button';

interface RazorpayConnectionCardProps {
  onSimulateClick?: () => void;
}

export const RazorpayConnectionCard: React.FC<RazorpayConnectionCardProps> = ({
  onSimulateClick,
}) => {
  const [status, setStatus] = useState<RazorpayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<RazorpayConnectionTestResult | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getRazorpayStatus();
      setStatus(data);
    } catch (err) {
      console.warn('Could not fetch Razorpay status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testRazorpayConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        status: 'error',
        connected: false,
        message: err?.response?.data?.detail || 'Failed to communicate with Razorpay API.',
      });
    } finally {
      setTesting(false);
    }
  };

  const webhookEndpoint = `${window.location.origin}/api/webhooks/razorpay`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-[16px] border border-blue-200 dark:border-blue-500/30 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 dark:from-[#131b2e] dark:via-[#12161F] dark:to-[#17192e] p-5 shadow-sm transition-all">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Branding & Status Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-xs">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                  Razorpay Infrastructure
                </h3>
                {status?.is_configured ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      TEST MODE ACTIVE
                    </span>
                    <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-800 dark:text-blue-200">
                      Key: {status.key_id}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-amber-800 dark:text-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Mock / Demo Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Listening for live <code className="font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-1 py-0.5 rounded border border-rose-200 dark:border-rose-900/50 font-semibold">payment.failed</code> and <code className="font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/50 font-semibold">payment.captured</code> webhook events.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-600 dark:text-slate-300 ${testing ? 'animate-spin' : ''}`} />
              <span>Test API Connection</span>
            </button>

            <button
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Webhook Tunnel (ngrok)</span>
            </button>

            {onSimulateClick && (
              <button
                onClick={onSimulateClick}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B6FFF] hover:bg-[#2055CC] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer active:scale-[0.99] whitespace-nowrap"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Simulate RZP Event</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Test Feedback Banner */}
        {testResult && (
          <div
            className={`mt-3.5 flex items-center justify-between rounded-xl p-3 text-xs font-medium transition-all border ${
              testResult.connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-200'
                : 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {testResult.connected ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span>
                {testResult.connected
                  ? testResult.message
                  : testResult.message?.includes('Authentication failed')
                  ? 'Razorpay Test Keys Invalid: Authentication failed with Razorpay API. Please check your Key ID & Secret in backend/.env.'
                  : testResult.message}
              </span>
              {!testResult.connected && (
                <button
                  onClick={() => setShowGuideModal(true)}
                  className="font-bold underline text-blue-700 dark:text-blue-300 hover:text-blue-800 ml-1 cursor-pointer"
                >
                  Configure Keys Guide
                </button>
              )}
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs font-semibold underline opacity-80 hover:opacity-100 ml-2 cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ngrok / Webhook Setup Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fintech-fade">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131824] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
                  <Terminal className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Razorpay Webhook & Tunneling Guide
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connect your local RevenueShield backend to live Razorpay TEST MODE events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
              {/* Step 1: API Keys */}
              <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3.5 border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">1</span>
                  Get &amp; Configure Razorpay Test API Keys
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Log in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center gap-0.5">Razorpay Dashboard <ExternalLink className="h-2.5 w-2.5" /></a> and ensure the switch at the top-left is set to <strong>TEST MODE</strong>.</li>
                  <li>Go to <strong>Settings</strong> &gt; <strong>API Keys</strong> &gt; click <strong>Generate Test Key</strong>.</li>
                  <li>Copy your <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">Key Id</code> (e.g. <code className="font-mono">rzp_test_...</code>) and <code className="text-blue-600 dark:text-blue-400 font-mono font-semibold">Key Secret</code>.</li>
                  <li>Paste them in <code className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">backend/.env</code>:
                    <div className="mt-1.5 rounded-lg bg-slate-900 p-2.5 font-mono text-blue-300 border border-slate-800 text-[11px] select-all space-y-0.5">
                      <div>RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID</div>
                      <div>RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET</div>
                    </div>
                  </li>
                  <li className="text-slate-500 dark:text-slate-400 italic">
                    Note: If you don't have keys yet, click <strong>Simulate RZP Event</strong> on the dashboard to test the complete recovery pipeline without credentials.
                  </li>
                </ol>
              </div>

              {/* Step 2: Webhook Endpoint */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">2</span>
                  Webhook Ingestion Endpoint
                </p>
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 font-mono text-[11px] text-blue-700 dark:text-blue-300">
                  <span className="truncate flex-1 font-semibold">{webhookEndpoint}</span>
                  <button
                    onClick={handleCopyWebhook}
                    className="flex items-center gap-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {copiedUrl ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Step 3: Tunneling */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">3</span>
                  Expose Localhost via ngrok
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  To receive webhooks from Razorpay servers while developing locally:
                </p>
                <div className="rounded-lg bg-slate-900 p-3 font-mono text-emerald-400 border border-slate-800 font-semibold">
                  ngrok http 8000
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Copy the assigned HTTPS URL (e.g., <code className="text-blue-600 dark:text-blue-300 font-semibold">https://xyz.ngrok-free.app</code>) and append <code className="text-blue-600 dark:text-blue-300 font-semibold">/api/webhooks/razorpay</code>.
                </p>
              </div>

              {/* Step 4: Razorpay Webhook Configuration */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">4</span>
                  Configure in Razorpay Merchant Dashboard
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>Go to <strong>Settings</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Add New Webhook</strong>.</li>
                  <li>Paste your ngrok URL in <strong>Webhook URL</strong>.</li>
                  <li>Enter a <strong>Secret</strong> and save it as <code className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">RAZORPAY_WEBHOOK_SECRET</code> in your root <code className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">.env</code>.</li>
                  <li>Select active events:
                    <ul className="list-disc pl-4 mt-1 font-mono text-slate-700 dark:text-slate-300">
                      <li><code className="text-rose-600 dark:text-rose-300 font-bold">payment.failed</code> (Triggers diagnosis &amp; recovery link)</li>
                      <li><code className="text-emerald-600 dark:text-emerald-300 font-bold">payment.captured</code> (Closes recovery loop &amp; settles)</li>
                      <li><code className="text-emerald-600 dark:text-emerald-300 font-bold">payment_link.paid</code> / <code className="text-emerald-600 dark:text-emerald-300 font-bold">order.paid</code></li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/30 p-3.5 text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Info className="h-4.5 w-4.5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Advisory Safety Guarantee:</strong> RevenueShield evaluates failures deterministically. AI diagnosis is strictly advisory and cannot execute unapproved financial transactions.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowGuideModal(false)}
                className="text-xs"
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
