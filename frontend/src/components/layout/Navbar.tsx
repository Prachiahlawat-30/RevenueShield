import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Play,
  Database,
  RefreshCw,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenBatchRunner: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
  onOpenSearch: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenBatchRunner,
  onSeedData,
  isSeeding,
  onOpenSearch,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { isDark, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Tab Title & Subtitle Mapping
  const pageMetaMap: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Overview', subtitle: 'Real-time payment failure recovery velocity and portfolio health' },
    'control-center': { title: 'Recovery Control Center', subtitle: 'Real-time operational triage, batch queues, and intervention overrides' },
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
  };

  const currentMeta = pageMetaMap[currentTab] || { title: 'Payment Operations', subtitle: 'Autonomous revenue protection console' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] bg-white/95 dark:bg-[#131824]/95 px-5 md:px-6 backdrop-blur-sm transition-colors">
      {/* Left: Sidebar Toggle, Title & Contextual Subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-[#6822CC]" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-[#6B7280]" />
            )}
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#1A1A2E] dark:text-white truncate">
              {currentMeta.title}
            </h1>
            <span className="hidden xl:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/40 px-2 py-0.2 text-[10px] font-mono font-semibold text-[#16A34A] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Live Engine</span>
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-[#6B7280] truncate max-w-lg">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Command Trigger */}
      <div className="hidden lg:flex items-center justify-center flex-1 max-w-sm mx-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/70 dark:bg-slate-800/50 px-3 py-1.5 text-xs text-[#6B7280] hover:border-[#D1D5DB] dark:hover:border-slate-600 transition-colors shadow-none"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
          <span className="flex-1 text-left truncate text-[11px]">Search failures, customers, policies...</span>
          <kbd className="inline-flex items-center rounded border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-[#9CA3AF]">
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
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {isSeeding ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#6822CC]" />
          ) : (
            <Database className="h-3.5 w-3.5 text-[#6822CC]" />
          )}
          <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onOpenBatchRunner}
          className="flex items-center gap-1.5 rounded-lg bg-[#6822CC] hover:bg-[#4B1A99] active:bg-[#3D157D] text-white px-3.5 py-1.5 text-xs font-bold shadow-sm shadow-[#6822CC]/25 transition-all"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Batch Recovery</span>
        </button>

        {/* 1-Click Theme Switcher */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-[#F59E0B]" />
          ) : (
            <Moon className="h-4 w-4 text-[#6822CC]" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="System notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] text-[#6B7280] hover:text-[#1A1A2E] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#6822CC] ring-2 ring-white dark:ring-[#131824]" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-3 shadow-lg z-50 text-xs animate-fintech-fade space-y-2.5"
              onClick={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] pb-2">
                <span className="font-bold text-[#1A1A2E] dark:text-white">Audit Notifications</span>
                <span className="text-[10px] text-[#16A34A] font-mono font-bold">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 text-[11px] text-[#6B7280]">
                  <strong className="text-[#1A1A2E] dark:text-white block font-semibold">Policy v2 Evaluated</strong>
                  <span>Policy Optimizer discovered 2 candidate improvements.</span>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 text-[11px] text-[#6B7280]">
                  <strong className="text-[#1A1A2E] dark:text-white block font-semibold">Gateway Health Rebalanced</strong>
                  <span>Gateway B success rate stabilized at 96.2%.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-[#E5E7EB] dark:border-[#242E42]">
          <div
            title="Payment Operations Lead"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#6822CC] font-bold border border-[#D5BEFF] text-xs cursor-default"
          >
            OP
          </div>
        </div>
      </div>
    </header>
  );
};
