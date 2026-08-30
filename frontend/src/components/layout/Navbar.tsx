import React, { useState } from 'react';
import {
  Search,
  Sun,
  Moon,
  Laptop,
  Bell,
  Play,
  Database,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  User,
  Sliders,
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
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Tab Breadcrumb mapping
  const breadcrumbMap: Record<NavTab, { section: string; title: string }> = {
    dashboard: { section: 'Overview', title: 'Executive Dashboard' },
    'control-center': { section: 'Overview', title: 'Recovery Control Center' },
    intelligence: { section: 'Revenue Intelligence', title: 'Recovery Intelligence' },
    leakage: { section: 'Revenue Intelligence', title: 'Revenue Leakage Radar' },
    predictive: { section: 'Revenue Intelligence', title: 'Predictive Risk & Forecast' },
    recommendations: { section: 'Revenue Intelligence', title: 'Action Recommendations' },
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-fintech-border bg-fintech-surface/90 px-6 backdrop-blur-md transition-colors">
      {/* Left: Breadcrumbs & Dynamic Page Context */}
      <div className="flex items-center gap-2 text-xs font-medium text-fintech-muted">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            className="mr-1 p-1.5 rounded-fintech-sm text-fintech-muted hover:text-fintech-primary hover:bg-fintech-surface-subtle border border-fintech-border transition-colors flex items-center justify-center"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-brand-500" />
            ) : (
              <PanelLeftClose className="h-4 w-4 text-fintech-secondary" />
            )}
          </button>
        )}
        <span className="text-fintech-secondary">{breadcrumb.section}</span>
        <ChevronRight className="h-3.5 w-3.5 text-fintech-muted" />
        <span className="font-semibold text-fintech-primary">{breadcrumb.title}</span>

        {/* Environment Status Badge */}
        <span className="ml-3 hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Simulation Active</span>
        </span>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden md:flex items-center">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-3 w-64 lg:w-80 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle px-3 py-1.5 text-xs text-fintech-muted hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-fintech-muted" />
          <span className="flex-1 text-left truncate">Search risks, customers, policies...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-fintech-border bg-fintech-surface px-1.5 py-0.5 text-[10px] font-mono text-fintech-muted shadow-fintech-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action Controls, Theme Toggle, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Seed Scenarios Action */}
        <button
          onClick={onSeedData}
          disabled={isSeeding}
          title="Reset and seed synthetic test scenarios"
          className="hidden sm:flex items-center gap-1.5 rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-1.5 text-xs font-semibold text-fintech-secondary hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-all disabled:opacity-50"
        >
          {isSeeding ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-brand-500" />
          ) : (
            <Database className="h-3.5 w-3.5 text-brand-500" />
          )}
          <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
        </button>

        {/* Run Recovery Batch Button */}
        <button
          onClick={onOpenBatchRunner}
          className="flex items-center gap-1.5 rounded-fintech-md bg-brand-500 hover:bg-brand-600 text-white px-3.5 py-1.5 text-xs font-bold shadow-fintech-sm shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Batch Recovery</span>
        </button>

        {/* Theme Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Toggle theme (Light / Dark / System)"
            className="flex h-8 w-8 items-center justify-center rounded-fintech-md border border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary hover:bg-fintech-surface-subtle transition-colors"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-brand-400" />
            ) : theme === 'light' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Laptop className="h-4 w-4 text-brand-500" />
            )}
          </button>

          {showThemeMenu && (
            <div
              className="absolute right-0 mt-2 w-36 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-1.5 shadow-fintech-lg z-50 text-xs font-medium text-fintech-secondary animate-fintech-fade"
              onClick={() => setShowThemeMenu(false)}
            >
              <button
                onClick={() => setTheme('light')}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 rounded-fintech-sm hover:bg-fintech-surface-subtle ${
                  theme === 'light' ? 'text-brand-500 font-bold bg-brand-500/10' : ''
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 rounded-fintech-sm hover:bg-fintech-surface-subtle ${
                  theme === 'dark' ? 'text-brand-400 font-bold bg-brand-500/10' : ''
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 rounded-fintech-sm hover:bg-fintech-surface-subtle ${
                  theme === 'system' ? 'text-brand-500 font-bold bg-brand-500/10' : ''
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover Toggle */}
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

        {/* Human Operator Avatar Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-fintech-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-300 font-bold border border-brand-500/20 text-xs">
            OP
          </div>
          <div className="hidden xl:block text-left text-xs leading-tight">
            <span className="font-semibold text-fintech-primary block">Human Operator</span>
            <span className="text-[10px] text-fintech-muted font-mono">Risk & Policy Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
};
