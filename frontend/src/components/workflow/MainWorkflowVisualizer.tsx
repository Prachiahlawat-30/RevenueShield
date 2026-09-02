import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  Info,
  Layers,
  Cpu,
  Lock,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';

export interface MainWorkflowVisualizerProps {
  currentActiveStep?: number; // 1 to 7
  onNavigateToTab?: (tab: NavTab) => void;
  interactiveSimulation?: boolean;
  compact?: boolean;
}

export interface WorkflowStepItem {
  step: number;
  title: string;
  tagline: string;
  description: string;
  engine: string;
  icon: any;
  color: string;
  bgLight: string;
  borderLight: string;
  textLight: string;
  bgDark: string;
  borderDark: string;
  textDark: string;
  badge: string;
  sampleTelemetry: {
    label: string;
    value: string;
    details: string;
  };
  targetTab?: NavTab;
}

export const WORKFLOW_STEPS: WorkflowStepItem[] = [
  {
    step: 1,
    title: 'PAYMENT FAILURE',
    tagline: 'Gateway Decline Ingested',
    description: 'A customer charge fails due to insufficient funds, temporary network drop, or card expiration.',
    engine: 'Gateway Simulator / PSP Webhook',
    icon: AlertTriangle,
    color: '#EF4444',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    textLight: 'text-rose-700',
    bgDark: 'dark:bg-rose-950/30',
    borderDark: 'dark:border-rose-800/40',
    textDark: 'dark:text-rose-400',
    badge: '01 • TRIGGER',
    sampleTelemetry: {
      label: 'Decline Event',
      value: 'ERR_INSUFFICIENT_FUNDS (HTTP 402)',
      details: 'Card ending 4242 • Gateway A • $120.00 attempt',
    },
    targetTab: 'simulator',
  },
  {
    step: 2,
    title: 'REVENUE AT RISK',
    tagline: 'Money associated with failed or potentially recoverable transactions.',
    description: 'The failed transaction is captured into the active risk exposure pool before silent churn occurs.',
    engine: 'Risk Engine',
    icon: Flame,
    color: '#F59E0B',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    textLight: 'text-amber-800',
    bgDark: 'dark:bg-amber-950/30',
    borderDark: 'dark:border-amber-800/40',
    textDark: 'dark:text-amber-400',
    badge: '02 • EXPOSURE',
    sampleTelemetry: {
      label: 'Portfolio Exposure',
      value: 'Risk ID #RSK-8491 (Active Pool)',
      details: 'Revenue at Risk: $120.00 • LTV: $2,840.00',
    },
    targetTab: 'risks',
  },
  {
    step: 3,
    title: 'AI DIAGNOSIS',
    tagline: 'AI analyzes failure context and proposes the most appropriate recovery strategy.',
    description: 'AI analyzes failure context, issuer error codes, customer habit data, and payment velocity to propose the optimal strategy.',
    engine: 'AI Diagnosis Engine',
    icon: Brain,
    color: '#6822CC',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    textLight: 'text-purple-800',
    bgDark: 'dark:bg-purple-950/30',
    borderDark: 'dark:border-purple-800/40',
    textDark: 'dark:text-purple-300',
    badge: '03 • INTELLIGENCE',
    sampleTelemetry: {
      label: 'Diagnosis Score',
      value: 'Confidence: 94% • High Recovery Propensity',
      details: 'Root Cause: Temporary Liquidity • Payday Spacing',
    },
    targetTab: 'intelligence',
  },
  {
    step: 4,
    title: 'ACTION PROPOSAL',
    tagline: 'Optimal Strategy Sequenced',
    description: 'Selects the exact intervention: Smart Retry, Timed Reminder, or Gateway Re-routing.',
    engine: 'Recovery Intelligence',
    icon: Sparkles,
    color: '#0284C7',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    textLight: 'text-sky-800',
    bgDark: 'dark:bg-sky-950/30',
    borderDark: 'dark:border-sky-800/40',
    textDark: 'dark:text-sky-300',
    badge: '04 • STRATEGY',
    sampleTelemetry: {
      label: 'Recommended Action',
      value: 'Timed Reminder ➔ Smart Retry',
      details: 'Timing: Tomorrow 10:30 AM (Historical customer peak)',
    },
    targetTab: 'recommendations',
  },
  {
    step: 5,
    title: 'POLICY CHECK',
    tagline: 'Deterministic rules validate every AI proposal before execution.',
    description: 'Strict governance verifies max retry caps, 24h cooldowns, customer opt-outs, and transaction bounds.',
    engine: 'Deterministic Policy Engine',
    icon: ShieldCheck,
    color: '#0D9488',
    bgLight: 'bg-teal-50',
    borderLight: 'border-teal-200',
    textLight: 'text-teal-800',
    bgDark: 'dark:bg-teal-950/30',
    borderDark: 'dark:border-teal-800/40',
    textDark: 'dark:text-teal-300',
    badge: '05 • GOVERNANCE',
    sampleTelemetry: {
      label: 'Compliance Status',
      value: 'PASSED (0 Violations / Safe to Execute)',
      details: 'Attempt 1/3 • Cooldown OK • Customer Opt-in Active',
    },
    targetTab: 'policy-optimizer',
  },
  {
    step: 6,
    title: 'RECOVERY',
    tagline: 'Executes only approved actions and records the result.',
    description: 'Dispatches the scheduled charge or automated outreach through the optimal PSP rail and records the result.',
    engine: 'Recovery Engine',
    icon: Zap,
    color: '#4F46E5',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    textLight: 'text-indigo-800',
    bgDark: 'dark:bg-indigo-950/30',
    borderDark: 'dark:border-indigo-800/40',
    textDark: 'dark:text-indigo-300',
    badge: '06 • EXECUTION',
    sampleTelemetry: {
      label: 'Dispatched Interventions',
      value: 'Gateway B Re-route & Sequenced SMS/Email',
      details: 'Payload routed with 3DS pre-auth token bypass',
    },
    targetTab: 'workflow',
  },
  {
    step: 7,
    title: 'MONEY RECOVERED',
    tagline: 'Funds Captured & Settled',
    description: 'Transaction cleared, invoice marked paid, customer retained without support friction.',
    engine: 'Settlement & Ledger Audit',
    icon: CheckCircle2,
    color: '#10B981',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-300',
    textLight: 'text-emerald-800',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-700/50',
    textDark: 'dark:text-emerald-300',
    badge: '07 • OUTCOME',
    sampleTelemetry: {
      label: 'Captured Revenue',
      value: '+$120.00 SETTLED (100% Retained)',
      details: 'Audit Log #AUD-9912 • Immutable Ledger Hash Verified',
    },
    targetTab: 'audit',
  },
];

export const MainWorkflowVisualizer: React.FC<MainWorkflowVisualizerProps> = ({
  currentActiveStep,
  onNavigateToTab,
  interactiveSimulation = true,
  compact = false,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(
    currentActiveStep ? currentActiveStep - 1 : 0
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Sync prop if provided
  useEffect(() => {
    if (currentActiveStep !== undefined && currentActiveStep >= 1 && currentActiveStep <= 7) {
      setActiveStepIndex(currentActiveStep - 1);
    }
  }, [currentActiveStep]);

  // Live Auto-simulation timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % WORKFLOW_STEPS.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStep = WORKFLOW_STEPS[activeStepIndex];

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.02)] space-y-6 transition-all">
      {/* 1. Header & Architectural Overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Recovery Pipeline Architecture
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              7-Stage Causal Flow
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
            Autonomous Payment Recovery Lifecycle
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seven-stage deterministic pipeline from gateway failure ingestion to merchant fund settlement.
          </p>
        </div>

        {/* Live Simulation Controls */}
        {interactiveSimulation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                isPlaying
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Pipeline Flow</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Interactive Flow</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveStepIndex(0);
              }}
              title="Reset to Stage 1"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. THE 7-STEP VISUAL PIPELINE RAIL */}
      <div className="relative">
        {/* Step Cards Grid / Horizontal Rail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {WORKFLOW_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = idx === activeStepIndex;
            const isPassed = idx < activeStepIndex;

            return (
              <div
                key={item.step}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStepIndex(idx);
                }}
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none text-left ${
                  isCurrent
                    ? `${item.bgLight} ${item.bgDark} border-2 ${item.borderLight} ${item.borderDark} shadow-sm z-10`
                    : isPassed
                    ? 'bg-slate-50/70 dark:bg-[#182030] border-slate-200/80 dark:border-slate-800 opacity-90 hover:opacity-100 hover:border-slate-300'
                    : 'bg-white dark:bg-[#131824] border-slate-200/80 dark:border-slate-800 opacity-75 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                {/* Step Top Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        isCurrent
                          ? `${item.textLight} ${item.textDark} bg-white/70 dark:bg-black/30 font-extrabold`
                          : 'text-[#9CA3AF] bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>

                    {/* Step Icon */}
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-transform ${
                        isCurrent
                          ? 'bg-white dark:bg-slate-900 shadow-sm scale-110'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#6B7280]'
                      }`}
                      style={{ color: isCurrent ? item.color : undefined }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Step Title (Visually Obvious) */}
                  <h3
                    className={`text-xs font-black font-mono tracking-tight leading-tight ${
                      isCurrent
                        ? `${item.textLight} ${item.textDark}`
                        : 'text-[#1A1A2E] dark:text-white'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Tagline */}
                  <p className="text-[10px] text-[#6B7280] dark:text-slate-400 font-medium leading-snug line-clamp-2">
                    {item.tagline}
                  </p>
                </div>

                {/* Bottom Engine Badge */}
                <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[9px] font-mono">
                  <span className="text-[#9CA3AF] truncate max-w-[85px]">{item.engine.split(' ')[0]}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                  )}
                </div>

                {/* Connecting Arrow for mobile/stacked view */}
                <div className="lg:hidden flex justify-center py-0.5 text-[#9CA3AF]">
                  <ArrowDown className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Connecting Rail Indicator */}
        <div className="hidden lg:flex items-center justify-between px-6 pt-2 text-[11px] font-mono text-[#9CA3AF]">
          <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
            [1] Failure Detected
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
            [2] Isolated
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400">
            [3] Root Cause Scored
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
            [4] Strategy Scheduled
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
            [5] Guardrails Verified
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
          <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
            [6] Interventions Run
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
            [7] Funds Captured ✓
          </span>
        </div>
      </div>

      {/* 3. ACTIVE STAGE DEEP DIVE & TELEMETRY INSPECTOR */}
      <div
        className={`p-4 rounded-xl border transition-all ${activeStep.bgLight} ${activeStep.bgDark} ${activeStep.borderLight} ${activeStep.borderDark}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left Column: Stage Explanation */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${activeStep.textLight} ${activeStep.textDark} bg-white dark:bg-slate-900 border border-current shadow-xs`}
              >
                ACTIVE STAGE: STEP {activeStep.step} OF 7
              </span>
              <span className="text-xs font-mono font-semibold text-[#6B7280] dark:text-slate-400">
                Engine: <strong className="text-[#1A1A2E] dark:text-white">{activeStep.engine}</strong>
              </span>
            </div>

            <h4 className="text-base font-bold text-[#1A1A2E] dark:text-white font-mono">
              {activeStep.title}: {activeStep.tagline}
            </h4>

            <p className="text-xs text-[#4B5563] dark:text-slate-300 leading-relaxed font-medium">
              {activeStep.description}
            </p>

            {/* Quick Link to Module */}
            {onNavigateToTab && activeStep.targetTab && (
              <div className="pt-1">
                <button
                  onClick={() => onNavigateToTab(activeStep.targetTab!)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <span>Open {activeStep.engine} Console</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Real Telemetry Preview Card */}
          <div className="md:col-span-5 bg-white/90 dark:bg-slate-900/90 rounded-lg p-3.5 border border-[#E5E7EB] dark:border-slate-800 shadow-sm space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[10px] text-[#6B7280] dark:text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1 font-bold">
                <Cpu className="w-3 h-3 text-brand-500" />
                <span>TELEMETRY STREAM</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">● LIVE</span>
            </div>

            <div className="space-y-0.5 text-xs">
              <span className="text-[10px] text-[#9CA3AF] uppercase block">
                {activeStep.sampleTelemetry.label}
              </span>
              <p className="font-bold text-[#1A1A2E] dark:text-white">
                {activeStep.sampleTelemetry.value}
              </p>
              <p className="text-[11px] text-[#6B7280] dark:text-slate-400 truncate">
                {activeStep.sampleTelemetry.details}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Architecture & Governance Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-semibold">Deterministic Policy Enforcement: </strong>
          Unlike legacy dunning systems that indiscriminately re-attempt card debits, RecoverAI immediately isolates failed transactions into a monitored risk exposure ledger. Every recovery intervention is synthesized using causal machine learning, but strictly bounded by deterministic merchant compliance guardrails before reaching any payment rail.
        </div>
      </div>
    </div>
  );
};
