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
  ExternalLink,
  Info,
  Layers,
  Cpu,
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
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(
    currentActiveStep ? currentActiveStep - 1 : 0
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (currentActiveStep !== undefined && currentActiveStep >= 1 && currentActiveStep <= 7) {
      setActiveStepIndex(currentActiveStep - 1);
    }
  }, [currentActiveStep]);

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
    <div className="w-full rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 transition-all">
      {/* 1. Header & Architectural Overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-lg bg-slate-900/[0.05] dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PIPELINE ARCHITECTURE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-500/[0.06] text-slate-700 dark:text-slate-300 border border-slate-500/15">
              7-Stage Deterministic Flow
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            Autonomous Payment Recovery Lifecycle
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Seven-stage causal state machine from gateway failure ingestion to merchant ledger settlement.
          </p>
        </div>

        {/* Live Simulation Controls */}
        {interactiveSimulation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-slate-100 text-white transition-all shadow-xs hover:-translate-y-[1px] cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Pipeline Flow</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
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
              className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. THE 7-STEP VISUAL PIPELINE RAIL */}
      <div className="relative">
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
                className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-left ${
                  isCurrent
                    ? 'bg-white/90 dark:bg-white/[0.09] border-slate-900/40 dark:border-white/40 shadow-glass-2 scale-[1.02] z-10'
                    : isPassed
                    ? 'bg-white/40 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.05] opacity-80 hover:opacity-100'
                    : 'bg-white/20 dark:bg-white/[0.01] border-slate-200/40 dark:border-white/[0.03] opacity-60 hover:opacity-90'
                }`}
              >
                {/* Step Top Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase border ${
                        isCurrent
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent font-bold'
                          : 'text-slate-400 bg-slate-500/[0.04] border-slate-500/10'
                      }`}
                    >
                      {item.badge}
                    </span>

                    {/* Step Icon */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                          : isPassed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-500/[0.06] text-slate-400'
                      }`}
                    >
                      {isPassed ? (
                        <span className="text-[10px] font-bold">✓</span>
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3
                    className={`text-xs font-mono tracking-tight leading-tight font-semibold ${
                      isCurrent
                        ? 'text-slate-950 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Tagline */}
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-snug line-clamp-2">
                    {item.tagline}
                  </p>
                </div>

                {/* Bottom Engine Badge */}
                <div className="pt-2 mt-2 border-t border-slate-200/40 dark:border-white/[0.05] flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-400 truncate max-w-[85px]">{item.engine.split(' ')[0]}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Connecting Rail Indicator */}
        <div className="hidden lg:flex items-center justify-between px-6 pt-3 text-[10px] font-mono text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [1] Failure Detected
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [2] Risk Isolated
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [3] AI Diagnosis
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [4] Action Proposal
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [5] Policy Check
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
            [6] Recovery
          </span>
          <ArrowRight className="w-3 h-3 text-emerald-500" />
          <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            [7] Settled ✓
          </span>
        </div>
      </div>

      {/* 3. ACTIVE STAGE DEEP DIVE & TELEMETRY INSPECTOR */}
      <div className="p-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left Column: Stage Explanation */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-transparent shadow-xs">
                STAGE {activeStep.step} OF 7
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Engine: <strong className="text-slate-900 dark:text-white font-semibold">{activeStep.engine}</strong>
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {activeStep.title}: {activeStep.tagline}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {activeStep.description}
            </p>

            {/* Quick Link to Module */}
            {onNavigateToTab && activeStep.targetTab && (
              <div className="pt-1.5">
                <button
                  onClick={() => onNavigateToTab(activeStep.targetTab!)}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-900 dark:text-white hover:underline cursor-pointer"
                >
                  <span>Open {activeStep.engine} Console</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Telemetry Preview Box */}
          <div className="md:col-span-5 bg-white/80 dark:bg-white/[0.04] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2 font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-white/[0.06]">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                <span>TELEMETRY STREAM</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">● LIVE</span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase block">
                {activeStep.sampleTelemetry.label}
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {activeStep.sampleTelemetry.value}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeStep.sampleTelemetry.details}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Architecture & Governance Note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-semibold">Deterministic Policy Enforcement: </strong>
          Unlike legacy dunning systems that indiscriminately re-attempt card debits, RecoverAI immediately isolates failed transactions into a monitored risk exposure ledger. Every recovery intervention is synthesized using causal machine learning, but strictly bounded by deterministic merchant compliance guardrails before reaching any payment rail.
        </div>
      </div>
    </div>
  );
};
