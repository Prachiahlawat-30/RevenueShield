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
    { id: 'DETECTED', label: 'DETECTED', subtext: 'Failure Ingested', icon: AlertCircle },
    { id: 'DIAGNOSING', label: 'DIAGNOSING', subtext: 'Root-Cause Analysis', icon: Brain },
    { id: 'ACTION_SELECTED', label: 'ACTION SELECTED', subtext: 'Optimal Strategy', icon: Sparkles },
    { id: 'POLICY_CHECK', label: 'POLICY CHECK', subtext: 'Guardrails Evaluated', icon: ShieldCheck },
    { id: 'EXECUTING', label: 'EXECUTED', subtext: 'Gateway Routing', icon: Zap },
    {
      id: 'OUTCOME',
      label:
        status === 'recovered'
          ? 'RECOVERED'
          : status === 'escalated'
          ? 'ESCALATED'
          : status === 'stopped'
          ? 'STOPPED'
          : 'SETTLED',
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

  const stageOrder = ['DETECTED', 'DIAGNOSING', 'ACTION_SELECTED', 'POLICY_CHECK', 'EXECUTING', 'OUTCOME'];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="w-full rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-5 border-b border-[#E5E7EB] dark:border-[#242E42] pb-3">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6822CC]">
            AUTONOMOUS DECISION PIPELINE
          </span>
          <h2 className="text-sm font-bold text-[#1A1A2E] dark:text-white">Revenue Recovery State Machine</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[#6B7280]">Stage:</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F3EEFF] text-[#6822CC] border border-[#D5BEFF]">
            {currentStage}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-5 h-0.5 bg-[#E5E7EB] dark:bg-[#242E42]" />

        {/* Active Progress Line */}
        <div
          className="absolute left-6 top-5 h-0.5 bg-gradient-to-r from-[#6822CC] to-[#16A34A] transition-all duration-500"
          style={{ width: `${(Math.max(0, currentIndex) / (stages.length - 1)) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx < currentIndex || status === 'recovered' || status === 'stopped' || status === 'escalated';
          const isCurrent = idx === currentIndex;

          let bubbleClass = 'border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-[#131824] text-[#9CA3AF]';
          if (isCurrent) {
            bubbleClass =
              'border-[#6822CC] bg-[#F3EEFF] dark:bg-purple-950/50 text-[#6822CC] ring-4 ring-[#6822CC]/15 shadow-sm scale-110';
          } else if (isPassed) {
            bubbleClass =
              status === 'recovered' && idx === stages.length - 1
                ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                : status === 'escalated' && idx === stages.length - 1
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                : status === 'stopped' && idx === stages.length - 1
                ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]'
                : 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]';
          }

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${bubbleClass}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span
                className={`mt-2.5 text-center text-[11px] font-bold tracking-tight max-w-[100px] leading-tight ${
                  isCurrent ? 'text-[#6822CC] font-bold' : isPassed ? 'text-[#1A1A2E] dark:text-white' : 'text-[#9CA3AF]'
                }`}
              >
                {stage.label}
              </span>
              <span className="text-[10px] text-[#6B7280] hidden sm:block mt-0.5 text-center truncate max-w-[90px]">
                {stage.subtext}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
