import React from 'react';
import {
  AlertCircle,
  Brain,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
} from 'lucide-react';

export type WorkflowStage =
  | 'PAYMENT_FAILURE'
  | 'REVENUE_AT_RISK'
  | 'AI_DIAGNOSIS'
  | 'ACTION_PROPOSAL'
  | 'POLICY_CHECK'
  | 'RECOVERY'
  | 'MONEY_RECOVERED'
  // Legacy aliases
  | 'DETECTED'
  | 'DIAGNOSING'
  | 'ACTION_SELECTED'
  | 'EXECUTING'
  | 'OUTCOME';

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  status: string;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStage, status }) => {
  const stages = [
    { id: 'PAYMENT_FAILURE', label: 'PAYMENT FAILURE', subtext: 'Failure Ingested', icon: AlertTriangle },
    { id: 'REVENUE_AT_RISK', label: 'REVENUE AT RISK', subtext: 'Isolated in Pool', icon: AlertCircle },
    { id: 'AI_DIAGNOSIS', label: 'AI DIAGNOSIS', subtext: 'Root Cause Scored', icon: Brain },
    { id: 'ACTION_PROPOSAL', label: 'ACTION PROPOSAL', subtext: 'Optimal Strategy', icon: Sparkles },
    { id: 'POLICY_CHECK', label: 'POLICY CHECK', subtext: 'Guardrails Evaluated', icon: ShieldCheck },
    { id: 'RECOVERY', label: 'RECOVERY', subtext: 'Gateway Routing', icon: Zap },
    {
      id: 'MONEY_RECOVERED',
      label:
        status === 'recovered'
          ? 'MONEY RECOVERED'
          : status === 'escalated'
          ? 'ESCALATED'
          : status === 'stopped'
          ? 'STOPPED'
          : 'MONEY RECOVERED',
      subtext:
        status === 'recovered'
          ? 'Funds Captured'
          : status === 'escalated'
          ? 'Human Review'
          : status === 'stopped'
          ? 'Interventions Halted'
          : 'Pending Final Result',
      icon:
        status === 'recovered'
          ? CheckCircle2
          : status === 'escalated'
          ? AlertTriangle
          : StopCircle,
    },
  ];

  const stageToIndex: Record<string, number> = {
    PAYMENT_FAILURE: 0,
    DETECTED: 1,
    REVENUE_AT_RISK: 1,
    DIAGNOSING: 2,
    AI_DIAGNOSIS: 2,
    ACTION_SELECTED: 3,
    ACTION_PROPOSAL: 3,
    POLICY_CHECK: 4,
    EXECUTING: 5,
    RECOVERY: 5,
    OUTCOME: 6,
    MONEY_RECOVERED: 6,
  };

  const currentIndex = stageToIndex[currentStage] !== undefined ? stageToIndex[currentStage] : 1;

  return (
    <div className="w-full rounded-[18px] border border-slate-200/80 dark:border-white/[0.09] bg-white/65 dark:bg-white/[0.045] backdrop-blur-glass p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-5 border-b border-slate-200/60 dark:border-white/[0.06] pb-3">
        <div>
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            AUTONOMOUS STATE MACHINE
          </span>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Revenue Recovery Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Stage:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-500/[0.06] text-slate-700 dark:text-slate-300 border border-slate-500/15">
            {currentStage}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-200/60 dark:bg-white/[0.08]" />

        {/* Active Progress Line */}
        <div
          className="absolute left-6 top-5 h-0.5 bg-slate-900 dark:bg-white transition-all duration-500"
          style={{ width: `${(Math.max(0, currentIndex) / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx < currentIndex || status === 'recovered' || status === 'stopped' || status === 'escalated';
          const isCurrent = idx === currentIndex;

          let bubbleClass = 'border-slate-200/60 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.02] text-slate-400';
          if (isCurrent) {
            bubbleClass =
              'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-4 ring-slate-400/20 shadow-glass-1 scale-105';
          } else if (isPassed) {
            bubbleClass =
              status === 'recovered' && idx === stages.length - 1
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-300 dark:border-white/20 bg-white/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200';
          }

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${bubbleClass}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`mt-2.5 text-center text-[11px] font-mono tracking-tight max-w-[100px] leading-tight ${
                  isCurrent
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : isPassed
                    ? 'text-slate-700 dark:text-slate-300 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5 text-center truncate max-w-[90px]">
                {stage.subtext}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
