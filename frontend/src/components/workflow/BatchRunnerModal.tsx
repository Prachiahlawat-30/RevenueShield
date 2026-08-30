import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { runBatchRecovery } from '../../api/recovery';
import { getIntelligenceSummary, runPriorityBatchRecovery } from '../../api/intelligence';
import { BatchRecoveryResponse, RecoveryIntelligenceSummary } from '../../types';
import { formatCurrency, getStatusBadgeClass } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface BatchRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
  onComplete?: () => void;
}

export const BatchRunnerModal: React.FC<BatchRunnerModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  onComplete,
}) => {
  const [batchSize, setBatchSize] = useState(10);
  const [executionMode, setExecutionMode] = useState<'priority' | 'fifo'>('priority');
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<BatchRecoveryResponse | null>(null);
  const [summary, setSummary] = useState<RecoveryIntelligenceSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResponse(null);
      setError(null);
      loadPreBatchSummary();
    }
  }, [isOpen]);

  const loadPreBatchSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await getIntelligenceSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch pre-batch summary', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!isOpen) return null;

  const handleStartBatch = async () => {
    setIsRunning(true);
    setError(null);
    try {
      let data: BatchRecoveryResponse;
      if (executionMode === 'priority') {
        data = await runPriorityBatchRecovery(batchSize, true);
      } else {
        data = await runBatchRecovery(batchSize, true);
      }
      setResponse(data);
      if (onCompleted) onCompleted();
      if (onComplete) onComplete();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Batch execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="flex w-full max-w-2xl flex-col rounded-fintech-xl border border-fintech-border bg-fintech-surface shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-fintech-border px-6 py-4 bg-fintech-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-fintech-primary">Priority Batch Recovery Engine</h3>
              <p className="text-xs text-fintech-secondary">
                Execute AI diagnosis & policy validation prioritized by recovery likelihood
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-fintech-sm p-1.5 text-fintech-muted hover:bg-fintech-surface-subtle hover:text-fintech-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {!response && !isRunning && (
            <div className="space-y-5">
              {/* Pre-Batch Intelligence Overview */}
              {summary && (
                <div className="p-4 rounded-fintech-md bg-brand-500/5 border border-brand-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-bold text-fintech-primary uppercase tracking-wider">
                        Pre-Batch Intelligence Analysis
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(summary.expected_recoverable_revenue)} Expected Recoverable
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-fintech-md bg-fintech-surface border border-fintech-border">
                      <p className="text-[10px] text-fintech-muted">Active Risks</p>
                      <p className="font-mono font-bold text-fintech-primary mt-0.5">{summary.total_risks}</p>
                    </div>
                    <div className="p-2.5 rounded-fintech-md bg-fintech-surface border border-fintech-border">
                      <p className="text-[10px] text-fintech-muted">Total At Risk</p>
                      <p className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatCurrency(summary.total_revenue_at_risk)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-fintech-md bg-rose-500/10 border border-rose-500/20">
                      <p className="text-[10px] text-rose-700 dark:text-rose-400">Critical Priority</p>
                      <p className="font-mono font-bold text-rose-700 dark:text-rose-400 mt-0.5">{summary.critical_opportunities}</p>
                    </div>
                    <div className="p-2.5 rounded-fintech-md bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">High Priority</p>
                      <p className="font-mono font-bold text-amber-700 dark:text-amber-400 mt-0.5">{summary.high_priority_opportunities}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Execution Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-fintech-secondary">
                  Execution Priority Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setExecutionMode('priority')}
                    className={`p-3 rounded-fintech-md border text-left transition-all ${
                      executionMode === 'priority'
                        ? 'border-brand-500 bg-brand-500/10 text-fintech-primary shadow-fintech-sm'
                        : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-brand-500" />
                      <span className="text-xs font-bold">Priority Score Order</span>
                    </div>
                    <p className="text-[11px] text-fintech-muted mt-1">
                      Highest expected recovery yield and urgency executed first.
                    </p>
                  </button>

                  <button
                    onClick={() => setExecutionMode('fifo')}
                    className={`p-3 rounded-fintech-md border text-left transition-all ${
                      executionMode === 'fifo'
                        ? 'border-brand-500 bg-brand-500/10 text-fintech-primary shadow-fintech-sm'
                        : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-fintech-muted" />
                      <span className="text-xs font-bold">Standard FIFO Order</span>
                    </div>
                    <p className="text-[11px] text-fintech-muted mt-1">
                      Process in database creation order.
                    </p>
                  </button>
                </div>
              </div>

              {/* Batch Size Selector */}
              <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-fintech-secondary">
                  Batch Processing Limit
                </label>
                <div className="flex gap-3">
                  {[5, 10, 20].map((size) => (
                    <button
                      key={size}
                      onClick={() => setBatchSize(size)}
                      className={`flex-1 rounded-fintech-sm border py-2 text-xs font-bold transition-all ${
                        batchSize === size
                          ? 'border-brand-500 bg-brand-500 text-white shadow-fintech-sm'
                          : 'border-fintech-border bg-fintech-surface text-fintech-secondary hover:text-fintech-primary'
                      }`}
                    >
                      {size} Cases
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-fintech-md border border-brand-500/20 bg-brand-500/5 p-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-brand-500 flex-shrink-0" />
                <p className="text-xs text-fintech-secondary leading-snug">
                  Deterministic policy invariants (3 max attempts, opt-out flags, and threshold escalations) are strictly evaluated before every settlement.
                </p>
              </div>
            </div>
          )}

          {/* Running State */}
          {isRunning && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <RefreshCw className="h-10 w-10 animate-spin text-brand-500" />
              <div>
                <h4 className="text-base font-bold text-fintech-primary">Running Priority Recovery Engine</h4>
                <p className="text-xs text-fintech-secondary mt-1">
                  Predict Likelihood ➔ Prioritize ➔ Recommend ➔ Policy Check ➔ Execute Gateway
                </p>
              </div>
            </div>
          )}

          {/* Results Summary */}
          {response && (
            <div className="space-y-4">
              {/* Metric Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fintech-muted">
                    Processed
                  </span>
                  <p className="mt-1 text-xl font-black text-fintech-primary font-mono">{response.processed_count}</p>
                </div>
                <div className="rounded-fintech-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Recovered
                  </span>
                  <p className="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{response.recovered_count}</p>
                </div>
                <div className="rounded-fintech-md border border-purple-500/20 bg-purple-500/10 p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Escalated
                  </span>
                  <p className="mt-1 text-xl font-black text-purple-700 dark:text-purple-400 font-mono">{response.escalated_count}</p>
                </div>
                <div className="rounded-fintech-md border border-brand-500/20 bg-brand-500/10 p-3 text-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                    Total Captured
                  </span>
                  <p className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-400 font-mono truncate">
                    {formatCurrency(response.total_amount_recovered)}
                  </p>
                </div>
              </div>

              {/* Individual Item Results */}
              <div className="max-h-64 overflow-y-auto rounded-fintech-md border border-fintech-border bg-fintech-surface p-2 space-y-1.5">
                {response.results.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-fintech-sm border border-fintech-border bg-fintech-surface-subtle px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {item.priority_score !== undefined && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            Score {item.priority_score}
                          </span>
                        )}
                        <span className="font-semibold text-fintech-primary">{item.customer_name}</span>
                      </div>
                      <p className="text-[11px] text-fintech-muted mt-0.5">
                        {item.detected_failure_type} • {formatCurrency(item.amount_at_risk)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-fintech-muted">{item.step_count} step(s)</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getStatusBadgeClass(
                          item.final_status
                        )}`}
                      >
                        {item.final_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-fintech-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-fintech-border px-6 py-4 bg-fintech-surface-subtle/50">
          <Button variant="outline" size="sm" onClick={onClose}>
            {response ? 'Close' : 'Cancel'}
          </Button>
          {!response && (
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              isLoading={isRunning}
              onClick={handleStartBatch}
            >
              Run Priority Recovery
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
