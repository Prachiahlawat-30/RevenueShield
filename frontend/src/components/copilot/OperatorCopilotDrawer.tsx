import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { queryOperatorCopilot } from '../../api/tier2';
import { CopilotQueryResponse } from '../../types';
import { Button } from '../ui/Button';

interface OperatorCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorCopilotDrawer: React.FC<OperatorCopilotDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; res: CopilotQueryResponse }>>([]);

  if (!isOpen) return null;

  const handleSend = async (customQ?: string) => {
    const qToSend = customQ || query;
    if (!qToSend.trim() || loading) return;

    try {
      setLoading(true);
      const res = await queryOperatorCopilot(qToSend);
      setHistory((prev) => [...prev, { q: qToSend, res }]);
      setQuery('');
    } catch (err: any) {
      console.error('Copilot query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Why did Stripe decline surge in the last 2 hours?',
    'What is our projected recovery for the next 7 days?',
    'Show top 3 high-priority accounts at risk of churn',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg h-full bg-fintech-surface border-l border-fintech-border shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-fintech-border bg-fintech-surface-subtle/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">RecoverAI Operator Copilot</h2>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> Grounded in Telemetry & Policy
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-fintech-sm text-fintech-muted hover:text-fintech-primary hover:bg-fintech-surface transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="p-3 w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center border border-brand-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-fintech-primary">Ask Copilot Anything</h3>
              <p className="text-xs text-fintech-secondary max-w-xs mx-auto">
                Real-time explanations of recovery decisions, telemetry trends, policy rules, and revenue forecasts.
              </p>

              <div className="pt-4 space-y-2 text-left max-w-sm mx-auto">
                <span className="text-[10px] font-bold text-fintech-muted uppercase block font-mono">
                  Sample Prompts
                </span>
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="w-full text-left p-2.5 rounded-fintech-md bg-fintech-surface-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-fintech-secondary border border-fintech-border transition"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((item, idx) => (
            <div key={idx} className="space-y-3 text-xs">
              {/* User message */}
              <div className="flex items-start gap-2 justify-end">
                <div className="p-3 rounded-fintech-md bg-brand-500 text-white max-w-[80%] font-medium shadow-fintech-sm">
                  {item.q}
                </div>
                <div className="p-1.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Bot response */}
              <div className="p-4 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-2 text-left shadow-fintech-sm">
                <div className="flex items-center gap-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase font-mono">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Telemetry Analysis</span>
                </div>

                <p className="text-xs text-fintech-primary leading-relaxed font-medium">
                  {item.res.answer}
                </p>

                {item.res.evidence && item.res.evidence.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-fintech-border">
                    <span className="text-[10px] font-bold text-fintech-muted uppercase block font-mono">
                      Supporting Evidence
                    </span>
                    <ul className="space-y-1 text-xs text-fintech-secondary">
                      {item.res.evidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-1.5 font-mono text-[11px]">
                          <span className="text-brand-500 font-bold">›</span>{' '}
                          <span className="font-semibold text-fintech-primary">{ev.title}:</span> {ev.metric_value} ({ev.context})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-xs text-fintech-muted">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span>Querying recovery engines & synthesized telemetry...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-fintech-border bg-fintech-surface space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Copilot about payment trends..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-3.5 py-2 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border text-xs text-fintech-primary placeholder-fintech-muted focus:outline-none focus:border-brand-500"
            />
            <Button
              variant="primary"
              size="md"
              icon={Send}
              isLoading={loading}
              onClick={() => handleSend()}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
