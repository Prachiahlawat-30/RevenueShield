import React, { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  PlayCircle,
  Users,
  ScrollText,
  Activity,
  Bot,
  Zap,
  Sparkles,
  Radar,
  Sliders,
  Shield,
  ShieldCheck,
  FlaskConical,
  Scale,
  ShieldAlert,
  History,
  Server,
  Trophy,
  Globe2,
  Briefcase,
  Building2,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCopilot,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(true);

  const primaryNavItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'risks' as NavTab, label: 'Revenue at Risk', icon: AlertTriangle, badge: 'Live' },
    { id: 'workflow' as NavTab, label: 'Recovery Workflow', icon: PlayCircle },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: ScrollText },
  ];

  const secondarySections = [
    {
      title: 'Intelligence & Operations',
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

  const renderBadge = (badge: string) => {
    const isLive = badge.toLowerCase() === 'live';
    if (isLive) {
      return (
        <span className="h-5 px-1.5 rounded-full inline-flex items-center gap-1 text-[10px] font-medium bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] border border-[#10B981]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Live</span>
        </span>
      );
    }

    return (
      <span className="h-5 px-1.5 rounded-full inline-flex items-center text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
        {badge}
      </span>
    );
  };

  const renderNavButton = (item: { id: NavTab; label: string; icon: any; badge?: string }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;

    const buttonContent = (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`relative group flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-xs transition-colors duration-150 cursor-pointer ${
          isActive
            ? 'bg-[#3B82F6]/10 text-[#2563EB] dark:text-[#F5F6FA] font-medium'
            : 'text-slate-600 dark:text-[#9CA3B0] hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-[#F5F6FA]'
        }`}
      >
        {/* Active-state left accent bar in primary brand blue */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#3B82F6]" />
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`h-4 w-4 shrink-0 transition-colors ${
              isActive
                ? 'text-[#3B82F6]'
                : 'text-slate-400 dark:text-[#6B7280] group-hover:text-slate-700 dark:group-hover:text-[#9CA3B0]'
            }`}
          />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge && renderBadge(item.badge)}
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
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0B0F17] transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-white/[0.06] px-4 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#3B82F6] text-white shadow-sm">
              <Shield className="h-4 w-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-[#F5F6FA]">
                  RevenueShield
                </span>
                <span className="h-4.5 px-1.5 rounded-full inline-flex items-center text-[9px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-[#9CA3B0] border border-slate-200 dark:border-white/[0.08]">
                  Ops
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-[#6B7280] font-normal">Financial Operations</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Expand sidebar"
            className="group relative mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#3B82F6] text-white shadow-sm transition-all cursor-pointer hover:bg-[#2563EB]"
          >
            <Shield className="h-4 w-4 fill-current group-hover:hidden" />
            <PanelLeftOpen className="h-4 w-4 hidden group-hover:block" />
          </button>
        )}

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="text-slate-500 hover:text-slate-900 dark:text-[#6B7280] dark:hover:text-[#F5F6FA] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List with Increased Group Spacing */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {/* Core Primary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 pb-2 text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
              Core Platform
            </div>
          )}
          {primaryNavItems.map(renderNavButton)}
        </div>

        {/* Secondary Modules */}
        {secondarySections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
            {!isCollapsed && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase hover:text-slate-700 dark:hover:text-[#9CA3B0] transition-colors cursor-pointer"
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
      <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] shrink-0">
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center justify-between p-2.5 rounded-[12px] border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#12161F] hover:bg-slate-100 dark:hover:bg-[#171C28] hover:border-slate-300 dark:hover:border-white/[0.1] transition-all duration-150 group cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-[#8B7CF6]/15 text-[#7C3AED] dark:text-[#8B7CF6]">
              <Bot className="h-3.5 w-3.5" />
            </div>
            {!isCollapsed && (
              <div className="text-left leading-tight">
                <span className="text-xs font-medium text-slate-900 dark:text-[#F5F6FA] block">Operator Copilot</span>
                <span className="text-[11px] text-slate-500 dark:text-[#6B7280]">AI Diagnostics</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs text-slate-400 dark:text-[#6B7280] group-hover:text-slate-700 dark:group-hover:text-[#F5F6FA] transition-colors">
              ➔
            </span>
          )}
        </button>
      </div>

      {/* System Status Section */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-white/[0.06] shrink-0">
        {!isCollapsed ? (
          <div>
            <div className="text-[11px] font-medium tracking-[0.04em] text-slate-400 dark:text-[#6B7280] uppercase">
              System Status
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-[#059669] dark:text-[#10B981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#059669] dark:bg-[#10B981] shrink-0" />
              <span className="truncate text-[11px]">All systems operational</span>
            </div>
          </div>
        ) : (
          <Tooltip content="All systems operational" position="right">
            <div className="flex justify-center">
              <span className="h-2 w-2 rounded-full bg-[#059669] dark:bg-[#10B981]" />
            </div>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
