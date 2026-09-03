import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Play,
  Database,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenBatchRunner: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenBatchRunner,
  onSeedData,
  isSeeding,
  onOpenSearch,
}) => {
  const { isDark, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Tab Title & Subtitle Mapping
  const pageMetaMap: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Real-time payment failure recovery velocity and portfolio health' },
    'control-center': { title: 'Recovery Control Center', subtitle: 'Operational triage, batch queues, and manual intervention overrides' },
    intelligence: { title: 'Recovery Intelligence', subtitle: 'Probabilistic yield modeling and dynamic dunning optimization' },
    leakage: { title: 'Revenue Leakage Radar', subtitle: 'Real-time detection of silent churn and recurring billing slippage' },
    predictive: { title: 'Predictive Risk & Forecast', subtitle: 'AI-driven payment decline forecasting and salvage trajectories' },
    recommendations: { title: 'Action Recommendations', subtitle: 'Autonomous next-best payment actions prioritized by confidence' },
    risks: { title: 'Revenue at Risk', subtitle: 'Active failed payment transactions undergoing diagnostic evaluation' },
    workflow: { title: 'Recovery Workflow', subtitle: 'Deterministic AI state machine and gateway re-routing execution' },
    customers: { title: 'Customers 360', subtitle: 'Customer billing profiles, contact history, and opt-out preferences' },
    experiments: { title: 'A/B Experiments', subtitle: 'Statistical significance testing across dunning copy and retry policies' },
    simulator: { title: 'Strategy Simulator', subtitle: 'Monte Carlo policy yield forecasting and synthetic stress testing' },
    'merchant-intelligence': { title: 'Gateway & Merchant Intel', subtitle: 'PSP health scoring, routing latency, and fee economics' },
    'policy-optimizer': { title: 'Policy Optimizer', subtitle: 'Self-learning guardrail suggestions and approval governance' },
    playground: { title: 'Policy Playground', subtitle: 'Interactive dry-run simulator for rule creation and threshold testing' },
    incidents: { title: 'Payment Incidents', subtitle: 'Live gateway outage detection and automated traffic re-routing' },
    'approval-queue': { title: 'Approval Queue', subtitle: 'Human-in-the-loop review for high-value and VIP enterprise accounts' },
    autonomy: { title: 'Autonomy Control', subtitle: 'Tier 1 to Tier 3 supervisory boundary management' },
    audit: { title: 'Audit Trail', subtitle: 'Immutable, verifiable log of all AI diagnoses and gateway actions' },
    'decision-replay': { title: 'Decision Replay', subtitle: 'Deterministic event trace reproduction and factor attribution' },
    'system-health': { title: 'System Health & Resilience', subtitle: 'Circuit breaker states, DB telemetry, and API latency' },
    'reports-leaderboard': { title: 'Reports & Leaderboard', subtitle: 'Financial reconciliation reports and operational benchmarks' },
    'demo-lab': { title: 'Demo Lab & Scenarios', subtitle: 'Synthetic failure scenario injectors and sandbox environment' },
    'specialized-use-cases': { title: 'Specialized Recovery Hub', subtitle: 'B2B receivables, UPI Autopay sequencer, and Hinglish Studio' },
    'global-intelligence': { title: 'Global Payment Intelligence', subtitle: 'Global payment flow, regional failure patterns, and cross-border recovery yield' },
  };

  const currentMeta = pageMetaMap[currentTab] || { title: 'Payment Operations', subtitle: 'Autonomous revenue protection console' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] bg-[#F7F8FA]/90 dark:bg-[oklch(0.218_0.008_223.9)]/90 px-5 md:px-6 backdrop-blur-2xl transition-colors">
      {/* Left: Title & Contextual Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {currentMeta.title}
          </h1>
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-lg">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Command Trigger */}
      <div className="hidden lg:flex items-center justify-center flex-1 max-w-sm mx-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200 shadow-xs cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="flex-1 text-left truncate text-[11px]">Search failures, customers, policies...</span>
          <kbd className="inline-flex items-center rounded-md border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-mono text-slate-400 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Theme Switcher & Operator Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Seed Demo Data Button */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          title="Reset and seed realistic test scenarios"
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] hover:-translate-y-[1px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isSeeding ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-700 dark:text-slate-300" />
          ) : (
            <Database className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          )}
          <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenBatchRunner}
          className="flex items-center gap-1.5 rounded-xl bg-[#111827] hover:bg-[#1f2937] dark:bg-white dark:text-[#111827] dark:hover:bg-slate-100 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:-translate-y-[1px] transition-all cursor-pointer"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Batch Recovery</span>
        </button>

        {/* 1-Click Theme Switcher */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="System notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-all cursor-pointer shadow-xs"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-slate-900 dark:bg-white" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[oklch(0.24_0.008_223.9)]/95 backdrop-blur-xl p-4 shadow-glass-2 z-50 text-xs animate-fintech-fade space-y-2.5"
              onClick={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-2">
                <span className="font-semibold text-slate-900 dark:text-white">Audit Notifications</span>
                <span className="text-[10px] text-slate-500 font-mono">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white block font-medium">Policy v2 Evaluated</strong>
                  <span className="text-slate-500 dark:text-slate-400">Policy Optimizer discovered 2 candidate improvements.</span>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white block font-medium">Gateway Health Rebalanced</strong>
                  <span className="text-slate-500 dark:text-slate-400">Gateway B success rate stabilized at 96.2%.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-200/80 dark:border-white/[0.08]">
          <div
            title="Payment Operations Lead"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/[0.05] dark:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200/80 dark:border-white/10 font-mono text-xs cursor-default"
          >
            OP
          </div>
        </div>
      </div>
    </header>
  );
};
