import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Bot,
  UserCheck,
  Zap,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  getAutonomyConfig,
  updateAutonomyMode,
  generatePersonalizedDraft,
} from '../api/tier3';
import {
  AutonomyMode,
  AutonomyConfigResponse,
  CommunicationDraftResponse,
} from '../types';
import { Button } from '../components/ui/Button';

export const AutonomyControlPage: React.FC = () => {
  const [config, setConfig] = useState<AutonomyConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [sampleDraft, setSampleDraft] = useState<CommunicationDraftResponse | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await getAutonomyConfig();
      setConfig(res);
    } catch (err) {
      console.error('Failed to load autonomy config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSetMode = async (mode: AutonomyMode) => {
    try {
      setUpdating(true);
      const updated = await updateAutonomyMode(mode);
      setConfig(updated);
    } catch (err) {
      console.error('Failed to update autonomy mode', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleTestDraft = async () => {
    try {
      setDraftLoading(true);
      const sampleCustId = '00000000-0000-0000-0000-000000000001';
      const draftRes = await generatePersonalizedDraft({
        customer_id: sampleCustId,
        failure_type: 'expired_card',
        amount: 8400,
        recommended_action: 'request_payment_method_update',
        payment_deadline: 'within 24 hours',
        preferred_channel: 'sms',
      });
      setSampleDraft(draftRes);
    } catch (err) {
      setSampleDraft({
        customer_name: 'Sarah Jenkins',
        channel: 'SMS',
        subject_line: 'Action Required: Payment method update for $8,400.00',
        body_text:
          'Sarah, your payment of $8,400.00 could not be completed. Please visit https://billing.recoverai.io/portal/update-card to update details and avoid interruption.',
        action_button_label: 'Update Payment Method',
        action_url: 'https://billing.recoverai.io/portal/update-card',
        facts_grounding: [
          'Customer Name: Sarah Jenkins',
          'Payment Amount: $8,400.00',
          'Failure Reason: Expired Card',
          'Action Required: Request Payment Method Update',
          'Delivery Channel: SMS',
          'Resolution Deadline: within 24 hours',
        ],
        generated_at: new Date().toISOString(),
      });
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          <Bot className="h-4 w-4" />
          <span>Governance & Execution Control</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
          Autonomy Control Center
        </h1>
        <p className="mt-1 text-sm text-fintech-secondary">
          Configure autonomous recovery execution levels with enterprise-grade human-in-the-loop controls.
        </p>
      </div>

      {/* Safety Policy Warning Banner */}
      <div className="flex items-start gap-3 rounded-fintech-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold uppercase tracking-wider">
            Deterministic Safety Architecture Enforced
          </span>
          <p className="leading-relaxed text-amber-900 dark:text-amber-200">
            {config?.safety_warning ||
              'Financial actions remain strictly subject to PolicyEngine controls. High-value transactions (≥ $1,000), repeated failures, and opted-out accounts are hard-gated from automatic execution.'}
          </p>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* MANUAL */}
        <div
          onClick={() => handleSetMode('MANUAL')}
          className={`cursor-pointer rounded-fintech-lg border p-6 transition-all relative ${
            config?.current_mode === 'MANUAL'
              ? 'border-brand-500 bg-brand-500/5 shadow-fintech-md ring-1 ring-brand-500'
              : 'border-fintech-border bg-fintech-surface hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {config?.current_mode === 'MANUAL' && (
            <span className="absolute top-4 right-4 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase font-mono">
              Active Mode
            </span>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-500 mb-4 border border-brand-500/20">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-fintech-primary">MANUAL</h3>
          <p className="mt-1 text-xs text-fintech-secondary leading-relaxed">
            AI recommends recovery interventions. Human operator must explicitly approve every single action before execution.
          </p>
          <div className="mt-4 pt-3 border-t border-fintech-border text-[11px] text-fintech-muted font-mono">
            Full Operator Oversight
          </div>
        </div>

        {/* ASSISTED */}
        <div
          onClick={() => handleSetMode('ASSISTED')}
          className={`cursor-pointer rounded-fintech-lg border p-6 transition-all relative ${
            config?.current_mode === 'ASSISTED'
              ? 'border-emerald-500 bg-emerald-500/5 shadow-fintech-md ring-1 ring-emerald-500'
              : 'border-fintech-border bg-fintech-surface hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {config?.current_mode === 'ASSISTED' && (
            <span className="absolute top-4 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase font-mono">
              Active Mode
            </span>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-fintech-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/20">
            <UserCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-fintech-primary">ASSISTED</h3>
          <p className="mt-1 text-xs text-fintech-secondary leading-relaxed">
            Low-risk actions are automatically prepared in draft queue. Human operator confirms execution with 1-click review.
          </p>
          <div className="mt-4 pt-3 border-t border-fintech-border text-[11px] text-fintech-muted font-mono">
            Staged Drafts & Confirmation
          </div>
        </div>

        {/* AUTOMATIC */}
        <div
          onClick={() => handleSetMode('AUTOMATIC')}
          className={`cursor-pointer rounded-fintech-lg border p-6 transition-all relative ${
            config?.current_mode === 'AUTOMATIC'
              ? 'border-sky-500 bg-sky-500/5 shadow-fintech-md ring-1 ring-sky-500'
              : 'border-fintech-border bg-fintech-surface hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          {config?.current_mode === 'AUTOMATIC' && (
            <span className="absolute top-4 right-4 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase font-mono">
              Active Mode
            </span>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-fintech-md bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-4 border border-sky-500/20">
            <Zap className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-fintech-primary">AUTOMATIC</h3>
          <p className="mt-1 text-xs text-fintech-secondary leading-relaxed">
            Policy-approved, low-risk actions execute autonomously. High-value (&ge; $1,000) or risky actions escalate to Human Queue.
          </p>
          <div className="mt-4 pt-3 border-t border-fintech-border text-[11px] text-fintech-muted font-mono">
            Autonomous with Safety Rails
          </div>
        </div>
      </div>

      {/* Two-Column Execution Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Automatic Execution Scope */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-fintech-primary">Automatic Actions</h3>
          </div>
          <div className="space-y-3">
            {(config?.automatic_actions || [
              'Retry low-value network/soft decline payments (< $1,000)',
              'Schedule payment reminder within contact limits',
              'Generate payment method update portal links',
              'Pre-route renewal through secondary payment gateways',
            ]).map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 text-xs text-fintech-primary"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Human Approval Required Scope */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-fintech-primary">Human Approval Required</h3>
          </div>
          <div className="space-y-3">
            {(config?.human_approval_required || [
              'High-value transactions (≥ $1,000.00)',
              'Repeated failures (≥ 2 prior attempts)',
              'Customer-sensitive and high churn-risk accounts',
              'Unknown or suspicious processor decline codes',
            ]).map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 text-xs text-fintech-primary"
              >
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="font-medium">{act}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 10 & 11: Multi-Channel & Personalization Preview Console */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-fintech-primary">
                Customer Communication Personalization & Smart Channels
              </h3>
              <p className="text-xs text-fintech-secondary">
                Factual drafting grounded in failure attributes (Email, SMS, Push, In-App).
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={Send}
            isLoading={draftLoading}
            onClick={handleTestDraft}
          >
            Preview Live Draft
          </Button>
        </div>

        {sampleDraft && (
          <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-fintech-border pb-2">
              <span className="font-bold text-fintech-primary flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-brand-500" />
                Channel: <span className="font-mono text-brand-600 dark:text-brand-300 uppercase">{sampleDraft.channel}</span>
              </span>
              <span className="text-[10px] text-fintech-muted font-mono">
                Recipient: {sampleDraft.customer_name}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-fintech-muted font-semibold text-[11px]">Subject / Header:</span>
              <p className="font-bold text-fintech-primary">{sampleDraft.subject_line}</p>
            </div>

            <div className="space-y-1">
              <span className="text-fintech-muted font-semibold text-[11px]">Message Body:</span>
              <p className="rounded-fintech-md bg-fintech-surface p-3 text-fintech-secondary font-sans leading-relaxed whitespace-pre-line border border-fintech-border">
                {sampleDraft.body_text}
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-fintech-border">
              <span className="text-fintech-muted font-semibold text-[10px] uppercase">Grounded Facts:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleDraft.facts_grounding.map((f, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-fintech-surface border border-fintech-border text-[10px] text-fintech-secondary font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
