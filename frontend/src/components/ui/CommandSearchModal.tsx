import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Activity,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
  Brain,
  ShieldCheck,
  Users,
  ScrollText,
  Sliders,
  Sparkles,
  Zap,
  RotateCcw,
  Moon,
  Sun,
  X,
  Globe2,
} from 'lucide-react';
import { NavTab } from '../layout/Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onNavigateToRisk?: (riskId: string) => void;
  onOpenCopilot?: () => void;
}

interface CommandItem {
  id: string;
  label: string;
  category: 'Pages' | 'Intelligence' | 'Operations' | 'Actions';
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export const CommandSearchModal: React.FC<CommandSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenCopilot,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme, setTheme } = useTheme();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'global-intelligence',
      label: 'Global Payment Intelligence & Regional Performance',
      category: 'Pages',
      icon: Globe2,
      shortcut: 'G G',
      action: () => {
        onSelectTab('global-intelligence');
        onClose();
      },
    },
    {
      id: 'dashboard',
      label: 'Executive Dashboard & Money Story',
      category: 'Pages',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => {
        onSelectTab('dashboard');
        onClose();
      },
    },
    {
      id: 'control-center',
      label: 'Recovery Control Center (Live)',
      category: 'Pages',
      icon: Activity,
      shortcut: 'G C',
      action: () => {
        onSelectTab('control-center');
        onClose();
      },
    },
    {
      id: 'risks',
      label: 'Revenue at Risk Operations Console',
      category: 'Pages',
      icon: AlertTriangle,
      shortcut: 'G R',
      action: () => {
        onSelectTab('risks');
        onClose();
      },
    },
    {
      id: 'workflow',
      label: 'Recovery Workflow & State Progression',
      category: 'Pages',
      icon: PlayCircle,
      shortcut: 'G W',
      action: () => {
        onSelectTab('workflow');
        onClose();
      },
    },
    {
      id: 'policy-optimizer',
      label: 'Self-Learning Policy Optimizer',
      category: 'Intelligence',
      icon: ShieldCheck,
      shortcut: 'G P',
      action: () => {
        onSelectTab('policy-optimizer');
        onClose();
      },
    },
    {
      id: 'specialized-use-cases',
      label: 'Specialized Recovery Hub (B2B, Mandates, Hinglish Voice, PTP)',
      category: 'Operations',
      icon: PlayCircle,
      shortcut: 'G S',
      action: () => {
        onSelectTab('specialized-use-cases');
        onClose();
      },
    },
    {
      id: 'decision-graph',
      label: 'Payment Decision Graph Visualizer',
      category: 'Intelligence',
      icon: Brain,
      action: () => {
        onSelectTab('workflow');
        onClose();
      },
    },
    {
      id: 'predictive',
      label: 'Predictive Revenue Risk & Forecast',
      category: 'Intelligence',
      icon: Zap,
      action: () => {
        onSelectTab('predictive');
        onClose();
      },
    },
    {
      id: 'recommendations',
      label: 'Action Recommendations Feed',
      category: 'Intelligence',
      icon: Sparkles,
      action: () => {
        onSelectTab('recommendations');
        onClose();
      },
    },
    {
      id: 'customers',
      label: 'Customers & Recovery Profiles',
      category: 'Operations',
      icon: Users,
      action: () => {
        onSelectTab('customers');
        onClose();
      },
    },
    {
      id: 'audit',
      label: 'Immutable Audit Trail & Observability',
      category: 'Operations',
      icon: ScrollText,
      action: () => {
        onSelectTab('audit');
        onClose();
      },
    },
    {
      id: 'demo-lab',
      label: 'Live Demo Lab & Scenario Sandboxes',
      category: 'Operations',
      icon: Sliders,
      action: () => {
        onSelectTab('demo-lab');
        onClose();
      },
    },
    // Actions
    {
      id: 'toggle-theme',
      label: `Switch Theme to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Actions',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        onClose();
      },
    },
    {
      id: 'open-copilot',
      label: 'Open Autonomous Operator Copilot',
      category: 'Actions',
      icon: Sparkles,
      action: () => {
        if (onOpenCopilot) onOpenCopilot();
        onClose();
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-fintech-xl border border-fintech-border bg-fintech-surface shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-fintech-border px-4 py-3.5 bg-fintech-surface-subtle/40">
          <Search className="h-5 w-5 text-fintech-muted shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search commands, pages, intelligence, actions... (↑↓ to navigate, Enter to select)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-fintech-primary placeholder-fintech-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-fintech-muted hover:text-fintech-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-fintech-border text-fintech-muted">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-fintech-muted">
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-fintech-md cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold'
                      : 'text-fintech-secondary hover:text-fintech-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-fintech-sm ${
                        isSelected
                          ? 'bg-brand-500 text-white'
                          : 'bg-fintech-surface-subtle text-fintech-muted border border-fintech-border'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block font-medium text-fintech-primary">{item.label}</span>
                      <span className="text-[10px] text-fintech-muted uppercase font-semibold">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {item.shortcut && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-fintech-border text-fintech-muted">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-fintech-border px-4 py-2 bg-fintech-surface-subtle/50 text-[11px] text-fintech-muted font-mono">
          <span>RevenueShield Payment Command</span>
          <span>Press ↵ to run</span>
        </div>
      </div>
    </div>
  );
};
