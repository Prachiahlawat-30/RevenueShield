import React from 'react';
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
  | 'specialized-use-cases';

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
  const sections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard' as NavTab, label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'control-center' as NavTab, label: 'Recovery Control Center', icon: Activity, badge: 'Live' },
      ],
    },
    {
      title: 'REVENUE',
      items: [
        { id: 'risks' as NavTab, label: 'Revenue at Risk', icon: AlertTriangle },
        { id: 'workflow' as NavTab, label: 'Recovery Workflow', icon: PlayCircle },
        { id: 'customers' as NavTab, label: 'Customers 360', icon: Users },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'intelligence' as NavTab, label: 'Recovery Intelligence', icon: TrendingUp },
        { id: 'leakage' as NavTab, label: 'Revenue Leakage Radar', icon: Radar, badge: 'New' },
        { id: 'predictive' as NavTab, label: 'Predictive Risk & Forecast', icon: Zap, badge: 'Tier 3' },
        { id: 'recommendations' as NavTab, label: 'Action Recommendations', icon: Sparkles, badge: 'Auto' },
      ],
    },
    {
      title: 'OPTIMIZATION',
      items: [
        { id: 'policy-optimizer' as NavTab, label: 'Policy Optimizer', icon: ShieldCheck, badge: 'Self-Learn' },
        { id: 'experiments' as NavTab, label: 'A/B Experiments', icon: FlaskConical, badge: 'A/B' },
        { id: 'simulator' as NavTab, label: 'Strategy Simulator', icon: Sliders },
        { id: 'merchant-intelligence' as NavTab, label: 'Gateway & Merchant Intel', icon: Building2, badge: 'Growth' },
        { id: 'playground' as NavTab, label: 'Policy Playground', icon: Scale },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'specialized-use-cases' as NavTab, label: 'Specialized Recovery Hub', icon: Briefcase, badge: 'B2B/UPI' },
        { id: 'incidents' as NavTab, label: 'Payment Incidents', icon: ShieldAlert, badge: 'Live' },
        { id: 'approval-queue' as NavTab, label: 'Approval Queue', icon: Bot, badge: 'Action' },
        { id: 'autonomy' as NavTab, label: 'Autonomy Control', icon: Zap, badge: 'Tier 3' },
      ],
    },
    {
      title: 'GOVERNANCE',
      items: [
        { id: 'audit' as NavTab, label: 'Audit Trail', icon: ScrollText },
        { id: 'decision-replay' as NavTab, label: 'Decision Replay', icon: History, badge: 'Audit' },
        { id: 'system-health' as NavTab, label: 'System Health & Resilience', icon: Server, badge: 'Resilient' },
        { id: 'reports-leaderboard' as NavTab, label: 'Reports & Leaderboard', icon: Trophy, badge: 'Export' },
      ],
    },
    {
      title: 'DEMO',
      items: [
        { id: 'demo-lab' as NavTab, label: 'Demo Lab & Scenarios', icon: FlaskConical, badge: 'Pitch' },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-fintech-border bg-fintech-surface/95 backdrop-blur-md transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header Motif */}
      <div className="flex h-16 items-center justify-between border-b border-fintech-border px-4 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-fintech-md bg-brand-500 text-white shadow-fintech-sm shadow-brand-500/30">
              <Zap className="h-4.5 w-4.5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black tracking-tight text-fintech-primary">
                  RECOVER<span className="text-brand-500">AI</span>
                </span>
                <span className="rounded px-1.5 py-0.2 text-[9px] font-mono font-bold text-brand-500 bg-brand-500/10 border border-brand-500/20">
                  PRO
                </span>
              </div>
              <span className="text-[10px] font-medium text-fintech-muted">Payment Intelligence</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            title="Click to expand sidebar"
            className="group relative mx-auto flex h-9 w-9 items-center justify-center rounded-fintech-md bg-brand-500 hover:bg-brand-600 text-white shadow-fintech-sm transition-all"
          >
            <Zap className="h-4.5 w-4.5 fill-current group-hover:hidden" />
            <PanelLeftOpen className="h-4.5 w-4.5 hidden group-hover:block" />
          </button>
        )}

        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="text-fintech-muted hover:text-fintech-primary p-1.5 rounded-fintech-sm hover:bg-fintech-surface-subtle transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-fintech-muted">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              const buttonContent = (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-fintech-md px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border-l-2 border-brand-500 shadow-fintech-sm'
                      : 'text-fintech-secondary hover:bg-fintech-surface-subtle hover:text-fintech-primary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-brand-500 dark:text-brand-400'
                          : 'text-fintech-muted group-hover:text-fintech-primary'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300'
                          : 'bg-fintech-surface-subtle text-fintech-muted border border-fintech-border'
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
            })}
          </div>
        ))}
      </nav>

      {/* Operator Copilot Drawer Banner */}
      <div className="p-2.5 border-t border-fintech-border shrink-0 bg-fintech-surface-subtle/30">
        <button
          onClick={onOpenCopilot}
          className={`w-full flex items-center justify-between p-2.5 rounded-fintech-md border border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-500/50 transition-all group ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-fintech-sm bg-brand-500 text-white shadow-fintech-sm">
              <Bot className="h-3.5 w-3.5" />
            </div>
            {!isCollapsed && (
              <div className="text-left leading-tight">
                <span className="text-xs font-bold text-fintech-primary block">Operator Copilot</span>
                <span className="text-[10px] text-fintech-muted font-mono">Ask Analytics AI</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-xs font-mono text-brand-500 group-hover:translate-x-0.5 transition-transform">
              ➔
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
