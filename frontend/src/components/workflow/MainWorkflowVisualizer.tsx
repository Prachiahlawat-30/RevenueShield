import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
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
    title: 'Payment failure',
    tagline: 'Gateway decline ingested',
    description: 'A customer charge fails due to insufficient funds, temporary network drop, or card expiration.',
    engine: 'Gateway Simulator / Webhook',
    icon: AlertTriangle,
    badge: '01 · Trigger',
    sampleTelemetry: {
      label: 'Decline Event',
      value: 'ERR_INSUFFICIENT_FUNDS (HTTP 402)',
      details: 'Card ending 4242 · Gateway A · ₹8,500 attempt',
    },
    targetTab: 'simulator',
  },
  {
    step: 2,
    title: 'Revenue at risk',
    tagline: 'Money associated with failed transactions',
    description: 'The failed transaction is captured into the active risk exposure pool before silent churn occurs.',
    engine: 'Risk Engine',
    icon: Flame,
    badge: '02 · Exposure',
    sampleTelemetry: {
      label: 'Portfolio Exposure',
      value: 'Risk ID #RSK-8491 (Active Pool)',
      details: 'Revenue at Risk: ₹8,500 · LTV: ₹1,20,000',
    },
    targetTab: 'risks',
  },
  {
    step: 3,
    title: 'AI diagnosis',
    tagline: 'Probabilistic failure context analysis',
    description: 'AI analyzes failure context, issuer error codes, customer habit data, and payment velocity to propose the optimal strategy.',
    engine: 'AI Diagnosis Engine',
    icon: Brain,
    badge: '03 · Intelligence',
    sampleTelemetry: {
      label: 'Diagnosis Score',
      value: 'Confidence: 94% · High Recovery Propensity',
      details: 'Root Cause: Temporary Liquidity · Payday Spacing',
    },
    targetTab: 'intelligence',
  },
  {
    step: 4,
    title: 'Action proposal',
    tagline: 'Optimal strategy sequenced',
    description: 'Selects the exact intervention: Smart Retry, Timed Reminder, or Gateway Re-routing.',
    engine: 'Recovery Intelligence',
    icon: Sparkles,
    badge: '04 · Strategy',
    sampleTelemetry: {
      label: 'Recommended Action',
      value: 'Timed Reminder ➔ Smart Retry',
      details: 'Expected Recovery Rate: 88.5% · Yield: +₹7,522',
    },
    targetTab: 'recommendations',
  },
  {
    step: 5,
    title: 'Policy check',
    tagline: 'Deterministic rules validate proposals',
    description: 'PolicyEngine verifies customer opt-out status, cooldown intervals, and maximum retry limits before authorizing execution.',
    engine: 'PolicyEngine Guardrails',
    icon: ShieldCheck,
    badge: '05 · Validation',
    sampleTelemetry: {
      label: 'Policy Evaluation',
      value: 'Passed All 5 Merchant Guardrails',
      details: 'Customer Eligible: True · Cooldown: Met · Attempts < 3',
    },
    targetTab: 'playground',
  },
  {
    step: 6,
    title: 'Recovery engine',
    tagline: 'Executes approved actions safely',
    description: 'Executes the authorized action via smart gateway routing, direct card networks, or multi-channel communications.',
    engine: 'RecoveryEngine Execution',
    icon: Zap,
    badge: '06 · Execution',
    sampleTelemetry: {
      label: 'Execution Status',
      value: 'Dispatched via Gateway Simulator',
      details: 'Routing: Secondary Gateway B · Payload Sealed',
    },
    targetTab: 'workflow',
  },
  {
    step: 7,
    title: 'Recovered',
    tagline: 'Realized revenue settled into ledger',
    description: 'Transaction succeeds, revenue is settled to merchant ledger, and audit log is permanently recorded.',
    engine: 'Settlement Ledger',
    icon: ShieldCheck,
    badge: '07 · Settled',
    sampleTelemetry: {
      label: 'Settlement Outcome',
      value: 'Settled: ₹8,500 Realized',
      details: 'Ledger Sequence: #TXN-SETTLE-8491 · Audit Recorded',
    },
    targetTab: 'audit',
  },
];

export const MainWorkflowVisualizer: React.FC<MainWorkflowVisualizerProps> = ({
  currentActiveStep = 1,
  onNavigateToTab,
  interactiveSimulation = true,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(
    Math.max(0, Math.min(6, currentActiveStep - 1))
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (currentActiveStep >= 1 && currentActiveStep <= 7) {
      setActiveStepIndex(currentActiveStep - 1);
    }
  }, [currentActiveStep]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => (prev + 1) % WORKFLOW_STEPS.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeStep = WORKFLOW_STEPS[activeStepIndex];

  return (
    <div className="w-full rounded-[16px] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#12161F] p-6 sm:p-7 shadow-sm dark:shadow-fintech-card space-y-6 transition-colors">
      {/* 1. Header & Architectural Overview */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-[6px] bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.06]">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
              Pipeline architecture
            </span>
            <span className="h-5 px-2 rounded-full inline-flex items-center text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
              7-Stage Deterministic Flow
            </span>
          </div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-slate-900 dark:text-[#F5F6FA] mt-1 tracking-tight">
            Autonomous Payment Recovery Lifecycle
          </h2>
          <p className="text-[13px] text-slate-600 dark:text-[#9CA3B0] mt-0.5">
            Seven-stage causal state machine from gateway failure ingestion to merchant ledger settlement.
          </p>
        </div>

        {/* Live Simulation Controls */}
        {interactiveSimulation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-medium bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors shadow-sm cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause flow</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run interactive flow</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setActiveStepIndex(0);
              }}
              title="Reset to Stage 1"
              className="p-1.5 rounded-[10px] border border-slate-200 dark:border-white/[0.08] bg-slate-100 hover:bg-slate-200 dark:bg-[#171C28] dark:hover:bg-[#1C2333] text-slate-600 hover:text-slate-900 dark:text-[#9CA3B0] dark:hover:text-[#F5F6FA] transition-colors cursor-pointer"
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
                className={`relative flex flex-col justify-between p-3.5 rounded-[12px] border transition-all duration-150 cursor-pointer select-none text-left ${
                  isCurrent
                    ? 'bg-[#3B82F6]/10 border-[#3B82F6]/50 shadow-sm'
                    : isPassed
                    ? 'bg-slate-50 dark:bg-[#0E121A] border-slate-200 dark:border-white/[0.06] opacity-90 hover:border-slate-300 dark:hover:border-white/[0.12]'
                    : 'bg-slate-50/60 dark:bg-[#0E121A] border-slate-100 dark:border-white/[0.04] opacity-60 hover:opacity-90'
                }`}
              >
                {/* Step Top Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase border font-medium ${
                        isCurrent
                          ? 'bg-[#3B82F6] text-white border-transparent'
                          : 'text-slate-500 dark:text-[#6B7280] bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]'
                      }`}
                    >
                      {item.badge}
                    </span>

                    {/* Step Icon */}
                    <div
                      className={`w-6 h-6 rounded-[6px] flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'bg-[#3B82F6] text-white'
                          : isPassed
                          ? 'bg-[#10B981]/10 text-[#059669] dark:text-[#10B981]'
                          : 'bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-[#6B7280]'
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
                    className={`text-xs tracking-tight leading-tight font-medium ${
                      isCurrent
                        ? 'text-slate-900 dark:text-[#F5F6FA]'
                        : 'text-slate-700 dark:text-[#9CA3B0]'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Tagline */}
                  <p className="text-[11px] text-slate-500 dark:text-[#6B7280] leading-snug line-clamp-2">
                    {item.tagline}
                  </p>
                </div>

                {/* Bottom Engine Badge */}
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 dark:text-[#6B7280] truncate max-w-[85px]">{item.engine.split(' ')[0]}</span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Connecting Rail Indicator */}
        <div className="hidden lg:flex items-center justify-between px-6 pt-3 text-[11px] text-slate-400 dark:text-[#6B7280]">
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [1] Failure detected
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6B7280]" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [2] Risk isolated
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6B7280]" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [3] AI diagnosis
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6B7280]" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [4] Action proposal
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6B7280]" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [5] Policy check
          </span>
          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-[#6B7280]" />
          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-[#9CA3B0]">
            [6] Recovery
          </span>
          <ArrowRight className="w-3 h-3 text-[#059669] dark:text-[#10B981]" />
          <span className="flex items-center gap-1 font-medium text-[#059669] dark:text-[#10B981]">
            [7] Settled ✓
          </span>
        </div>
      </div>

      {/* 3. ACTIVE STAGE DEEP DIVE & TELEMETRY INSPECTOR */}
      <div className="p-5 rounded-[14px] border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0E121A]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left Column: Stage Explanation */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] uppercase bg-[#3B82F6] text-white">
                Stage {activeStep.step} of 7
              </span>
              <span className="text-xs text-slate-600 dark:text-[#9CA3B0]">
                Engine: <strong className="text-slate-900 dark:text-[#F5F6FA] font-medium">{activeStep.engine}</strong>
              </span>
            </div>

            <h4 className="text-[16px] font-semibold text-slate-900 dark:text-[#F5F6FA]">
              {activeStep.title}: {activeStep.tagline}
            </h4>

            <p className="text-[13px] text-slate-600 dark:text-[#9CA3B0] leading-relaxed">
              {activeStep.description}
            </p>

            {/* Quick Link to Module */}
            {onNavigateToTab && activeStep.targetTab && (
              <div className="pt-1.5">
                <button
                  onClick={() => onNavigateToTab(activeStep.targetTab!)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] cursor-pointer"
                >
                  <span>Open {activeStep.engine} console</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Telemetry Preview Box */}
          <div className="md:col-span-5 bg-white dark:bg-[#12161F] rounded-[12px] p-4 border border-slate-200 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-[#6B7280] pb-2 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-slate-500 dark:text-[#9CA3B0]" />
                <span>Telemetry stream</span>
              </span>
              <span className="h-5 px-2 rounded-full inline-flex items-center gap-1 text-[10px] font-medium text-[#059669] dark:text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] dark:bg-[#10B981]" />
                Live
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 dark:text-[#6B7280] uppercase tracking-[0.04em] block">
                {activeStep.sampleTelemetry.label}
              </span>
              <p className="font-semibold text-slate-900 dark:text-[#F5F6FA] tabular-nums">
                {activeStep.sampleTelemetry.value}
              </p>
              <p className="text-[12px] text-slate-600 dark:text-[#9CA3B0] truncate">
                {activeStep.sampleTelemetry.details}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Architecture & Governance Note */}
      <div className="flex items-start gap-3 p-4 rounded-[12px] bg-slate-50 dark:bg-[#0E121A] border border-slate-200 dark:border-white/[0.04] text-xs text-slate-600 dark:text-[#9CA3B0]">
        <Info className="w-4 h-4 text-slate-400 dark:text-[#6B7280] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-[#F5F6FA] font-medium">Deterministic policy enforcement: </strong>
          Unlike legacy dunning systems that indiscriminately re-attempt card debits, RevenueShield immediately isolates failed transactions into a monitored risk exposure ledger. Every recovery intervention is synthesized using causal machine learning, but strictly bounded by deterministic merchant compliance guardrails before reaching any payment rail.
        </div>
      </div>
    </div>
  );
};
