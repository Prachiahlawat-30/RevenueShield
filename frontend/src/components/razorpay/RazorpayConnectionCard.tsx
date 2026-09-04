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
      <div className="relative overflow-hidden rounded-[14px] border border-blue-500/20 bg-gradient-to-r from-blue-950/20 via-[#131824] to-indigo-950/20 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2B6FFF]/10 border border-[#2B6FFF]/30 text-[#2B6FFF]">
              <Zap className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white flex items-center gap-1.5">
                  Razorpay Infrastructure
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  TEST MODE ACTIVE
                </span>
                {status?.is_configured ? (
                  <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">
                    Key: {status.key_id}
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
                    Mock / Demo Sandbox
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-0.5">
                Listening for live <code className="font-mono text-indigo-400">payment.failed</code> and <code className="font-mono text-emerald-400">payment.captured</code> webhook events.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
              className="text-xs border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${testing ? 'animate-spin' : ''}`} />
              Test API Connection
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuideModal(true)}
              className="text-xs border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
            >
              <Terminal className="h-3.5 w-3.5 mr-1.5" />
              Webhook Tunnel (ngrok)
            </Button>

            {onSimulateClick && (
              <Button
                variant="primary"
                size="sm"
                onClick={onSimulateClick}
                className="text-xs bg-[#2B6FFF] hover:bg-[#2055CC] text-white"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Simulate RZP Event
              </Button>
            )}
          </div>
        </div>

        {/* Live Test Feedback Banner */}
        {testResult && (
          <div
            className={`mt-3 flex items-center justify-between rounded-lg p-2.5 text-xs transition-all border ${
              testResult.connected
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.connected ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
              )}
              <span>{testResult.message}</span>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs opacity-70 hover:opacity-100 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ngrok / Webhook Setup Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#131824] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Razorpay Webhook & Tunneling Guide
                  </h3>
                  <p className="text-xs text-slate-400">
                    Connect your local RevenueShield backend to live Razorpay TEST MODE events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
              <div className="space-y-2">
                <p className="font-semibold text-slate-200">1. Webhook Ingestion Endpoint</p>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 p-2.5 font-mono text-[11px] text-blue-300">
                  <span className="truncate flex-1">{webhookEndpoint}</span>
                  <button
                    onClick={handleCopyWebhook}
                    className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-200">2. Expose Localhost via ngrok</p>
                <p className="text-slate-400">
                  To receive webhooks from Razorpay servers while developing locally:
                </p>
                <div className="rounded-lg bg-slate-950 p-3 font-mono text-emerald-400 border border-slate-800">
                  ngrok http 8000
                </div>
                <p className="text-slate-400">
                  Copy the assigned HTTPS URL (e.g., <code className="text-blue-300">https://xyz.ngrok-free.app</code>) and append <code className="text-blue-300">/api/webhooks/razorpay</code>.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-slate-200">3. Configure in Razorpay Merchant Dashboard</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400">
                  <li>Log in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">Razorpay Dashboard <ExternalLink className="h-2.5 w-2.5" /></a> and switch to <strong>TEST MODE</strong>.</li>
                  <li>Go to <strong>Settings</strong> &gt; <strong>Webhooks</strong> &gt; <strong>Add New Webhook</strong>.</li>
                  <li>Paste your ngrok URL in <strong>Webhook URL</strong>.</li>
                  <li>Enter a <strong>Secret</strong> and save it as <code className="text-slate-200">RAZORPAY_WEBHOOK_SECRET</code> in your root <code className="text-slate-200">.env</code>.</li>
                  <li>Select active events:
                    <ul className="list-disc pl-4 mt-1 font-mono text-slate-300">
                      <li><code className="text-rose-300">payment.failed</code> (Triggers diagnosis &amp; recovery link)</li>
                      <li><code className="text-emerald-300">payment.captured</code> (Closes recovery loop &amp; settles)</li>
                      <li><code className="text-emerald-300">payment_link.paid</code> / <code className="text-emerald-300">order.paid</code></li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="rounded-lg bg-blue-950/40 border border-blue-500/20 p-3 text-blue-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
                <span>
                  <strong>Advisory Safety Guarantee:</strong> RevenueShield evaluates failures deterministically. AI diagnosis is strictly advisory and cannot execute unapproved financial transactions.
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800 px-6 py-3 bg-slate-900/60 flex justify-end">
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
