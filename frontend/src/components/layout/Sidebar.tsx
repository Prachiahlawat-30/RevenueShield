import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  Radar,
  FlaskConical,
  AlertTriangle,
  ShieldAlert,
  PlayCircle,
  Users,
  Sliders,
  Scale,
  ScrollText,
  Bot,
  Zap,
  History,
  Building2,
  TrendingUp,
  Trophy,
  Server,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Globe2,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export type NavTab =
  | 'dashboard'
  | 'control-center'
  | 'intelligence'
  | 'leakage'
  | 'predictive'
  | 'recommendations'
  | 'risks'
  | 'workflow'
  | 'customers'
  | 'experiments'
  | 'simulator'
  | 'merchant-intelligence'
  | 'policy-optimizer'
  | 'playground'
  | 'incidents'
  | 'approval-queue'
  | 'autonomy'
  | 'audit'
  | 'decision-replay'
  | 'system-health'
  | 'reports-leaderboard'
  | 'demo-lab'
  | 'specialized-use-cases'
  | 'global-intelligence';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCopilot: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCopilot,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Core Primary Navigation
  const primaryNavItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'risks' as NavTab, label: 'Revenue at Risk', icon: AlertTriangle, badge: 'Live' },
    { id: 'workflow' as NavTab, label: 'Recovery Workflow', icon: PlayCircle },
    { id: 'customers' as NavTab, label: 'Customers 360', icon: Users },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: ScrollText },
  ];

  // Secondary Intelligence & Advanced Modules (preserving all existing routes and features)
  const secondarySections = [
    {
      title: 'INTELLIGENCE & OPERATIONS',
      items: [
        { id: 'global-intelligence' as NavTab, label: 'Global Payment Intelligence', icon: Globe2, badge: 'Global' },
        { id: 'control-center' as NavTab, label: 'Recovery Control Center', icon: Activity, badge: 'Ops' },
        { id: 'intelligence' as NavTab, label: 'Recovery Intelligence', icon: TrendingUp },
        { id: 'specialized-use-cases' as NavTab, label: 'Specialized Recovery Hub', icon: Briefcase, badge: 'B2B/UPI' },
        { id: 'leakage' as NavTab, label: 'Revenue Leakage Radar', icon: Radar, badge: 'Radar' },
        { id: 'predictive' as NavTab, label: 'Predictive Risk & Forecast', icon: Zap, badge: 'AI' },
        { id: 'recommendations' as NavTab, label: 'Action Recommendations', icon: Sparkles, badge: 'Auto' },
        { id: 'policy-optimizer' as NavTab, label: 'Policy Optimizer', icon: ShieldCheck },
        { id: 'experiments' as NavTab, label: 'A/B Experiments', icon: FlaskConical },
        { id: 'simulator' as NavTab, label: 'Strategy Simulator', icon: Sliders },
        { id: 'merchant-intelligence' as NavTab, label: 'Gateway & Merchant Intel', icon: Building2 },
        { id: 'playground' as NavTab, label: 'Policy Playground', icon: Scale },
        { id: 'incidents' as NavTab, label: 'Payment Incidents', icon: ShieldAlert },
        { id: 'approval-queue' as NavTab, label: 'Approval Queue', icon: Bot },
        { id: 'decision-replay' as NavTab, label: 'Decision Replay', icon: History },
        { id: 'system-health' as NavTab, label: 'System Health & Resilience', icon: Server },
        { id: 'reports-leaderboard' as NavTab, label: 'Reports & Leaderboard', icon: Trophy },
        { id: 'demo-lab' as NavTab, label: 'Demo Lab & Scenarios', icon: FlaskConical, badge: 'Demo' },
      ],
    },
  ];

  const renderNavButton = (item: { id: NavTab; label: string; icon: any; badge?: string }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;

    const buttonContent = (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`relative group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-slate-900/[0.06] dark:bg-white/[0.09] text-slate-900 dark:text-white font-semibold shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {/* Subtle accent indicator for active state */}
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-slate-900 dark:bg-white" />
        )}

        <div className="flex items-center gap-2.5">
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
            }`}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge && (
          <span
            className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-medium tracking-wider uppercase border ${
              isActive
                ? 'bg-slate-900/10 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-900/20 dark:border-white/20'
                : 'bg-slate-500/[0.06] text-slate-500 dark:text-slate-400 border-slate-500/15'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id} content={item.label} position="right">
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/80 dark:border-white/[0.08] bg-[#F7F8FA]/95 dark:bg-[oklch(0.218_0.008_223.9)]/95 backdrop-blur-2xl transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header Motif */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] px-4 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                  RECOVER<span className="opacity-60">AI</span>
                </span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-500/10 border border-slate-500/20">
                  OPS
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Financial Operations</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="group relative mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs transition-all cursor-pointer hover:-translate-y-[1px]"
          >
            <Zap className="h-4 w-4 fill-current group-hover:hidden" />
            <PanelLeftOpen className="h-4 w-4 hidden group-hover:block" />
          </button>
        )}

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Core Primary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-1.5 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              CORE PLATFORM
            </div>
          )}
          {primaryNavItems.map(renderNavButton)}
        </div>

        {/* Secondary Modules (All preserved) */}
        {secondarySections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
            {!isCollapsed && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <span>{section.title}</span>
                {showAdvanced ? (
                  <ChevronDown className="h-3 w-3 opacity-60" />
                ) : (
                  <ChevronRight className="h-3 w-3 opacity-60" />
                )}
              </button>
            )}
            {(showAdvanced || isCollapsed) && section.items.map(renderNavButton)}
          </div>
        ))}
      </nav>

      {/* Operator Copilot Quick Trigger */}
      <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.06] shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] hover:bg-white dark:hover:bg-white/[0.07] transition-all duration-200 group cursor-pointer shadow-xs ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs">
              <Bot className="h-3.5 w-3.5" />
            </div>
            {!isCollapsed && (
              <div className="text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">Operator Copilot</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Analytics & Inquiries</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs font-mono text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform">
              ➔
            </span>
          )}
        </button>
      </div>

      {/* System Status Section */}
      <div className="px-4 py-3 border-t border-slate-200/60 dark:border-white/[0.06] bg-transparent shrink-0">
        {!isCollapsed ? (
          <div>
            <div className="text-[10px] font-mono font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500">
              ENGINE STATUS
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate text-[11px]">All systems operational</span>
            </div>
          </div>
        ) : (
          <Tooltip content="All systems operational" position="right">
            <div className="flex justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
