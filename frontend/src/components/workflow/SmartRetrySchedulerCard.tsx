import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import {
  getSmartRetrySchedule,
  confirmSmartRetrySchedule,
  SmartRetryScheduleResult,
} from '../../api/smartScheduler';

interface SmartRetrySchedulerCardProps {
  riskId: string;
  onScheduledConfirmed?: () => void;
}

export const SmartRetrySchedulerCard: React.FC<SmartRetrySchedulerCardProps> = ({
  riskId,
  onScheduledConfirmed,
}) => {
  const [schedule, setSchedule] = useState<SmartRetryScheduleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSmartRetrySchedule(riskId);
      setSchedule(data);
    } catch (err: any) {
      console.error('Failed to load smart retry schedule', err);
      setError('Unable to load smart retry schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (riskId) {
      fetchSchedule();
    }
  }, [riskId]);

  const handleConfirm = async () => {
    if (!riskId) return;
    try {
      setConfirming(true);
      const updated = await confirmSmartRetrySchedule(riskId);
      setSchedule(updated);
      if (onScheduledConfirmed) {
        onScheduledConfirmed();
      }
    } catch (err: any) {
      console.error('Failed to confirm smart retry schedule', err);
      setError('Failed to confirm schedule. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-6 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  if (error || !schedule) {
    return null;
  }

  const steps = [
    { label: 'Payment Failed', icon: AlertCircle, active: true, done: true },
    { label: 'Determine Failure Type', icon: Zap, active: true, done: true },
    { label: 'Analyze Customer History', icon: UserCheck, active: true, done: true },
    { label: 'Predict Optimal Retry Time', icon: Sparkles, active: true, done: true },
    { label: 'Schedule Retry', icon: Clock, active: true, done: schedule.is_scheduled },
  ];

  return (
    <div className="rounded-[14px] border border-[#E5E7EB] dark:border-[#242E42] bg-white dark:bg-[#131824] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] dark:border-[#242E42] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6822CC]/10 text-[#6822CC] dark:bg-purple-950/40">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                Intelligent Retry Timing (Smart Retry Scheduler)
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EEFF] text-[#6822CC] dark:bg-purple-950/50 dark:text-purple-300 px-2 py-0.5 text-[10px] font-mono font-bold">
                <Sparkles className="h-3 w-3" />
                AI Timing Engine
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Don't retry blindly. Analyzes customer historical settlement patterns to schedule retries during peak liquidity windows.
            </p>
          </div>
        </div>

        {schedule.is_scheduled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 px-3 py-1 text-xs font-mono font-bold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Scheduled for {schedule.scheduled_retry_formatted}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 px-3 py-1 text-xs font-mono font-bold">
            <Clock className="h-3.5 w-3.5" />
            Optimal Window Predicted
          </span>
        )}
      </div>

      {/* 5-Step Visual Pipeline */}
      <div className="rounded-[12px] bg-slate-50 dark:bg-slate-800/40 border border-[#E5E7EB] dark:border-[#242E42] p-3.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-2.5">
          Intelligent Scheduling Pipeline
        </span>
        <div className="grid grid-cols-5 gap-1 items-center">
          {steps.map((s, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    s.done
                      ? 'bg-[#16A34A] text-white shadow-sm'
                      : s.active
                      ? 'bg-[#6822CC] text-white shadow-sm ring-2 ring-[#6822CC]/20'
                      : 'bg-slate-200 dark:bg-slate-700 text-[#6B7280]'
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-medium text-[#1A1A2E] dark:text-white mt-1 line-clamp-1">
                  {s.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex justify-center -mt-3">
                  <ArrowRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Rationale Executive Quote */}
      <div className="rounded-[12px] border border-[#6822CC]/20 bg-[#F3EEFF]/40 dark:bg-purple-950/20 p-3.5 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6822CC] dark:text-purple-300">
          Predictive Scheduling Rationale
        </span>
        <p className="text-xs font-medium text-[#1A1A2E] dark:text-white leading-relaxed">
          "{schedule.rationale}"
        </p>
      </div>

      {/* Data Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/30 p-2.5">
          <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Customer Active Window</span>
          <span className="text-xs font-bold text-[#1A1A2E] dark:text-white mt-0.5 block font-mono">
            {schedule.peak_hours_window}
          </span>
          <span className="text-[10px] text-[#6B7280]">
            {schedule.historical_success_count > 0
              ? `${schedule.historical_success_count} past payments analyzed`
              : 'Benchmark clearing model'}
          </span>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/30 p-2.5">
          <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Scheduled Execution</span>
          <span className="text-xs font-bold text-[#6822CC] dark:text-purple-300 mt-0.5 block font-mono">
            {schedule.scheduled_retry_formatted}
          </span>
          <span className="text-[10px] text-[#6B7280]">+{schedule.recommended_delay_hours}h cooldown delay</span>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/30 p-2.5">
          <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Probability Lift</span>
          <span className="text-xs font-bold text-[#16A34A] mt-0.5 block font-mono">
            {schedule.probability_lift}
          </span>
          <span className="text-[10px] text-[#6B7280]">Over immediate retry</span>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] dark:border-[#242E42] bg-slate-50/60 dark:bg-slate-800/30 p-2.5">
          <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Model Confidence</span>
          <span className="text-xs font-bold text-[#1A1A2E] dark:text-white mt-0.5 block font-mono">
            {(schedule.confidence_score * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] text-[#6B7280]">Empirical significance</span>
        </div>
      </div>

      {/* Action Trigger */}
      <div className="flex items-center justify-between border-t border-[#E5E7EB] dark:border-[#242E42] pt-3">
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
          <span>Guaranteed compliance: prevents issuer velocity decline blocks</span>
        </div>

        {!schedule.is_scheduled ? (
          <Button
            variant="primary"
            size="sm"
            icon={Calendar}
            isLoading={confirming}
            onClick={handleConfirm}
          >
            Confirm & Queue Smart Retry
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[#16A34A] font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Smart Retry Queue Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
