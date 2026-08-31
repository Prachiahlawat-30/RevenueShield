import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bell,
  Play,
  Database,
  RefreshCw,
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose,
  Sparkles,
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

  // Tab Breadcrumb mapping
  const breadcrumbMap: Record<NavTab, { section: string; title: string }> = {
    dashboard: { section: 'Overview', title: 'Executive Dashboard' },
    'control-center': { section: 'Overview', title: 'Recovery Control Center' },
    intelligence: { section: 'Intelligence', title: 'Recovery Intelligence' },
    leakage: { section: 'Intelligence', title: 'Revenue Leakage Radar' },
    predictive: { section: 'Intelligence', title: 'Predictive Risk & Forecast' },
    recommendations: { section: 'Intelligence', title: 'Action Recommendations' },
    risks: { section: 'Recovery', title: 'Revenue at Risk' },
    workflow: { section: 'Recovery', title: 'Recovery Workflow' },
    customers: { section: 'Recovery', title: 'Customers 360' },
    experiments: { section: 'Optimization', title: 'A/B Experiments' },
    simulator: { section: 'Optimization', title: 'Strategy Simulator' },
    'merchant-intelligence': { section: 'Optimization', title: 'Gateway & Merchant Intel' },
    'policy-optimizer': { section: 'Optimization', title: 'Policy Optimizer' },
    playground: { section: 'Optimization', title: 'Policy Playground' },
    incidents: { section: 'Operations', title: 'Payment Incidents' },
    'approval-queue': { section: 'Operations', title: 'Approval Queue' },
    autonomy: { section: 'Operations', title: 'Autonomy Control' },
    audit: { section: 'Governance', title: 'Audit Trail' },
    'decision-replay': { section: 'Governance', title: 'Decision Replay' },
    'system-health': { section: 'Governance', title: 'System Health & Resilience' },
    'reports-leaderboard': { section: 'Governance', title: 'Reports & Leaderboard' },
    'demo-lab': { section: 'Demo', title: 'Demo Lab & Scenarios' },
    'specialized-use-cases': { section: 'Operations', title: 'Specialized Recovery Hub' },
  };

  const breadcrumb = breadcrumbMap[currentTab] || { section: 'Console', title: 'Overview' };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-fintech-border bg-fintech-surface/95 px-5 md:px-6 backdrop-blur-md transition-colors">
      {/* Left: Sidebar Toggle & Clean Breadcrumb Hierarchy */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className="p-1.5 rounded-fintech-sm text-fintech-muted hover:text-fintech-primary hover:bg-fintech-surface-subtle border border-fintech-border transition-colors flex items-center justify-center shrink-0"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-brand-500" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-fintech-secondary" />
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs truncate">
          <span className="text-fintech-muted font-medium hidden sm:inline">{breadcrumb.section}</span>
          <ChevronRight className="h-3 w-3 text-fintech-muted hidden sm:inline shrink-0" />
          <span className="font-bold text-fintech-primary truncate">{breadcrumb.title}</span>
        </div>

        {/* Subtle Live Badge */}
        <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Sim</span>
        </span>
      </div>

      {/* Center: Sleek Universal Search Bar */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-1.5 text-xs text-fintech-muted hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-sm"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-fintech-muted" />
          <span className="flex-1 text-left truncate text-[11px]">Search risks, policies, telemetry...</span>
          <kbd className="hidden lg:inline-flex items-center rounded border border-fintech-border bg-fintech-surface px-1.5 py-0.5 text-[10px] font-mono text-fintech-muted shadow-fintech-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, 1-Click Theme Toggle & Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Seed Data Button */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          title="Reset and seed realistic test scenarios"
          className="hidden sm:flex items-center gap-1.5 rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-1.5 text-xs font-semibold text-fintech-secondary hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-all disabled:opacity-50"
        >
          {isSeeding ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
          ) : (
            <Database className="h-3.5 w-3.5 text-brand-500" />
          )}
          <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
        </button>

        {/* Batch Recovery Primary Action */}
        <button
          onClick={onOpenBatchRunner}
          className="flex items-center gap-1.5 rounded-fintech-md bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-fintech-sm shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Batch Recovery</span>
        </button>

        {/* 1-Click Fast Theme Switcher */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          className="flex h-8 w-8 items-center justify-center rounded-fintech-md border border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-colors"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 text-brand-500" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="System notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-fintech-md border border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-fintech-surface" />
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-3 shadow-fintech-lg z-50 text-xs animate-fintech-fade space-y-2.5"
              onClick={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between border-b border-fintech-border pb-2">
                <span className="font-bold text-fintech-primary">Audit Notifications</span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">2 New</span>
              </div>
              <div className="space-y-2">
                <div className="rounded-fintech-md bg-fintech-surface-subtle p-2 text-[11px] text-fintech-secondary">
                  <strong className="text-fintech-primary block">Policy v2 Evaluated</strong>
                  <span>Policy Optimizer discovered 2 candidate improvements.</span>
                </div>
                <div className="rounded-fintech-md bg-fintech-surface-subtle p-2 text-[11px] text-fintech-secondary">
                  <strong className="text-fintech-primary block">Gateway Health Rebalanced</strong>
                  <span>Gateway B success rate stabilized at 96.2%.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operator Profile Tag */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-fintech-border">
          <div
            title="Operator: Active Session"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-300 font-bold border border-brand-500/20 text-xs cursor-default"
          >
            OP
          </div>
        </div>
      </div>
    </header>
  );
};
