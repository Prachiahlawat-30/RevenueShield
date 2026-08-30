import React from 'react';
import { Clock, CheckCircle, Shield, Cpu, Activity } from 'lucide-react';
import { DecisionTimelineEvent } from '../../types';

interface Props {
  timeline: DecisionTimelineEvent[];
}

const getActorIcon = (actor: string) => {
  if (actor.toLowerCase().includes('policy')) return Shield;
  if (actor.toLowerCase().includes('diag') || actor.toLowerCase().includes('ai')) return Cpu;
  if (actor.toLowerCase().includes('risk') || actor.toLowerCase().includes('prob')) return Activity;
  return CheckCircle;
};

export const DecisionTimeline: React.FC<Props> = ({ timeline }) => {
  return (
    <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm space-y-4">
      <div className="flex items-center justify-between border-b border-fintech-border pb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-bold text-fintech-primary">Decision Lifecycle & Audit Trail</h3>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-fintech-surface-subtle text-fintech-muted border border-fintech-border font-bold">
          Chronological
        </span>
      </div>

      <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {timeline.map((event, idx) => {
          const Icon = getActorIcon(event.actor);
          const formattedTime = new Date(event.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div key={idx} className="relative group">
              {/* Bullet icon */}
              <div className="absolute -left-[22px] top-2 w-4 h-4 rounded-full bg-fintech-surface border border-fintech-border flex items-center justify-center text-brand-500 group-hover:border-brand-500 group-hover:scale-110 transition-transform">
                <Icon className="w-2.5 h-2.5" />
              </div>

              {/* Event card with contained box layout */}
              <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full overflow-hidden">
                {/* Header: Step Name + Actor Badge + Status Pill */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className="text-xs font-mono font-bold text-fintech-primary">{event.step_name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-fintech-surface text-fintech-muted border border-fintech-border font-semibold">
                      {event.actor}
                    </span>
                  </div>

                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shrink-0">
                    {event.status}
                  </span>
                </div>

                {/* Body: Summary Text with word-break */}
                <p className="text-xs text-fintech-secondary leading-relaxed break-words">
                  {event.summary}
                </p>

                {/* Footer: Timestamp */}
                <div className="pt-1.5 border-t border-fintech-border/60 flex items-center justify-end">
                  <span className="text-[10px] font-mono text-fintech-muted">
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
