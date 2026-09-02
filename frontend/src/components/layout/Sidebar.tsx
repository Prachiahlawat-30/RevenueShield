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

  // Core Primary Navigation as requested
  const primaryNavItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'risks' as NavTab, label: 'Revenue at Risk', icon: AlertTriangle, badge: 'Live' },
    { id: 'workflow' as NavTab, label: 'Recovery', icon: PlayCircle },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
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
        { id: 'leakage' as NavTab, label: 'Revenue Leakage Radar', icon: Radar, badge: 'New' },
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
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
          isActive
            ? 'bg-[#F3EEFF] text-[#6822CC] dark:bg-[#6822CC]/20 dark:text-[#B892FF] font-bold shadow-sm'
            : 'text-[#6B7280] hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[#1A1A2E] dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive
                ? 'text-[#6822CC] dark:text-[#B892FF]'
                : 'text-[#9CA3AF] group-hover:text-[#1A1A2E] dark:group-hover:text-white'
            }`}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge && (
          <span
            className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider ${
              isActive
                ? 'bg-[#6822CC]/15 text-[#6822CC] dark:text-[#B892FF]'
                : 'bg-slate-100 dark:bg-slate-800 text-[#6B7280] border border-[#E5E7EB] dark:border-slate-700'
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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header Motif */}
      <div className="flex h-16 items-center justify-between border-b border-[#E5E7EB] dark:border-[#242E42] px-4 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6822CC] text-white shadow-sm shadow-[#6822CC]/25">
              <Zap className="h-4.5 w-4.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-bold tracking-tight text-[#1A1A2E] dark:text-white">
                  RECOVER<span className="text-[#6822CC]">AI</span>
                </span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#6822CC] bg-[#F3EEFF] border border-[#D5BEFF] dark:bg-purple-950/40 dark:border-purple-800/40">
                  FINTECH
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#6B7280]">Payment Operations</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="group relative mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#6822CC] hover:bg-[#4B1A99] text-white shadow-sm transition-all cursor-pointer"
          >
            <Zap className="h-4.5 w-4.5 fill-current group-hover:hidden" />
            <PanelLeftOpen className="h-4.5 w-4.5 hidden group-hover:block" />
          </button>
        )}

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="text-[#9CA3AF] hover:text-[#1A1A2E] dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              MAIN MENU
            </div>
          )}
          {primaryNavItems.map(renderNavButton)}
        </div>

        {/* Secondary Modules (All preserved) */}
        {secondarySections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1 pt-2 border-t border-[#E5E7EB] dark:border-[#242E42]">
            {!isCollapsed && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] hover:text-[#1A1A2E] dark:hover:text-white transition-colors"
              >
                <span>{section.title}</span>
                {showAdvanced ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            {(showAdvanced || isCollapsed) && section.items.map(renderNavButton)}
          </div>
        ))}
      </nav>

      {/* Operator Copilot Quick Trigger */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#242E42] shrink-0 bg-slate-50/40 dark:bg-slate-900/20">
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg border border-[#D5BEFF] bg-[#F3EEFF]/60 hover:bg-[#F3EEFF] dark:bg-purple-950/20 dark:border-purple-800/40 hover:border-[#6822CC]/40 transition-all group ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6822CC] text-white shadow-sm">
              <Bot className="h-3.5 w-3.5" />
            </div>
            {!isCollapsed && (
              <div className="text-left leading-tight">
                <span className="text-xs font-bold text-[#1A1A2E] dark:text-white block">Operator Copilot</span>
                <span className="text-[10px] text-[#6822CC] dark:text-[#B892FF] font-mono">Ask Analytics AI</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs font-mono text-[#6822CC] group-hover:translate-x-0.5 transition-transform">
              ➔
            </span>
          )}
        </button>
      </div>

      {/* System Status Section as requested */}
      <div className="px-4 py-3 border-t border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] shrink-0">
        {!isCollapsed ? (
          <div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#9CA3AF]">
              SYSTEM STATUS
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
              <span className="truncate">All systems operational</span>
            </div>
          </div>
        ) : (
          <Tooltip content="All systems operational" position="right">
            <div className="flex justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] animate-pulse" />
            </div>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
