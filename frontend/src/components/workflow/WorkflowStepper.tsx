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
  | 'DETECTED'
  | 'DIAGNOSING'
  | 'ACTION_SELECTED'
  | 'POLICY_CHECK'
  | 'EXECUTING'
  | 'OUTCOME';

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  status: string; // 'detected', 'recovering', 'recovered', 'escalated', 'stopped'
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStage, status }) => {
  const stages = [
    { id: 'DETECTED', label: 'Failure Detected', icon: AlertCircle },
    { id: 'DIAGNOSING', label: 'AI Diagnosis', icon: Brain },
    { id: 'ACTION_SELECTED', label: 'Action Proposed', icon: Sparkles },
    { id: 'POLICY_CHECK', label: 'Policy Guardrails', icon: ShieldCheck },
    { id: 'EXECUTING', label: 'Simulated Execution', icon: Zap },
    {
      id: 'OUTCOME',
      label:
        status === 'recovered'
          ? 'Revenue Recovered'
          : status === 'escalated'
          ? 'Escalated to Human'
          : status === 'stopped'
          ? 'Workflow Stopped'
          : 'Outcome Settled',
      icon:
        status === 'recovered'
          ? CheckCircle2
          : status === 'escalated'
          ? AlertTriangle
          : StopCircle,
    },
  ];

  const stageOrder = ['DETECTED', 'DIAGNOSING', 'ACTION_SELECTED', 'POLICY_CHECK', 'EXECUTING', 'OUTCOME'];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="w-full rounded-fintech-lg border border-fintech-border bg-fintech-surface p-6 shadow-fintech-sm">
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 dark:bg-slate-800" />
        
        {/* Active Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${(Math.max(0, currentIndex) / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx < currentIndex || status === 'recovered' || status === 'stopped' || status === 'escalated';
          const isCurrent = idx === currentIndex;

          let bubbleClass = 'border-slate-300 dark:border-slate-700 bg-fintech-surface text-fintech-muted';
          if (isCurrent) {
            bubbleClass =
              'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-4 ring-brand-500/20 scale-110 shadow-fintech-sm';
          } else if (isPassed) {
            bubbleClass =
              status === 'recovered' && idx === stages.length - 1
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : status === 'escalated' && idx === stages.length - 1
                ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                : status === 'stopped' && idx === stages.length - 1
                ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'border-brand-500/40 bg-fintech-surface text-brand-500';
          }

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${bubbleClass}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span
                className={`mt-2 text-center text-xs font-semibold max-w-[90px] leading-tight ${
                  isCurrent ? 'text-fintech-primary font-bold' : isPassed ? 'text-fintech-secondary' : 'text-fintech-muted'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
