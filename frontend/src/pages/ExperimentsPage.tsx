import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getExperiments, getExperimentResults } from '../api/tier2';
import { RecoveryExperiment, ExperimentResultsResponse } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

export const ExperimentsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [experiments, setExperiments] = useState<RecoveryExperiment[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExperimentResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const exps = await getExperiments();
      setExperiments(exps);
      if (exps.length > 0) {
        const res = await getExperimentResults(exps[0].id);
        setSelectedResult(res);
      }
    } catch (err: any) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleSelectExperiment = async (expId: string) => {
    try {
      const res = await getExperimentResults(expId);
      setSelectedResult(res);
    } catch (err: any) {
      console.error('Failed to load results:', err);
    }
  };

  if (loading && !selectedResult) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-fintech-muted">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
          <span className="text-sm">Loading recovery strategy experiments...</span>
        </div>
      </div>
    );
  }

  const comparisonChartData = selectedResult
    ? [
        {
          name: 'Recovery Rate (%)',
          Control: Number((selectedResult.control_metrics.recovery_rate * 100).toFixed(1)),
          Treatment: Number((selectedResult.treatment_metrics.recovery_rate * 100).toFixed(1)),
        },
        {
          name: 'Interventions',
          Control: selectedResult.control_metrics.interventions_count,
          Treatment: selectedResult.treatment_metrics.interventions_count,
        },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">Recovery Strategy Experiments</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30">
              A/B Control Groups
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Statistically valid, deterministic A/B testing comparing automated recovery strategies
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchExperiments}
        >
          Refresh Results
        </Button>
      </div>

      {/* Selected Experiment Spotlight */}
      {selectedResult && (
        <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-brand-500/30 space-y-6 shadow-fintech-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-fintech-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-bold text-fintech-primary">{selectedResult.name}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono">
                  {selectedResult.status}
                </span>
              </div>
              <p className="text-xs text-fintech-secondary">{selectedResult.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-fintech-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                <span className="text-[10px] uppercase font-bold block">Measured Lift</span>
                <span className="text-base font-bold font-mono">+{selectedResult.lift_percentage}%</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300">
                <span className="text-[10px] uppercase font-bold block">Incremental Revenue</span>
                <span className="text-base font-bold font-mono">
                  {formatCurrency(selectedResult.additional_revenue_generated)}
                </span>
              </div>
            </div>
          </div>

          {/* Control vs Treatment Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Group */}
            <div className="p-5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fintech-muted">
                  Variant A • Control Group
                </span>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-fintech-surface border border-fintech-border text-fintech-secondary">
                  {selectedResult.control_metrics.strategy}
                </span>
              </div>
              <p className="text-sm font-bold text-fintech-primary">{selectedResult.control_metrics.strategy_label}</p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-fintech-border">
                  <span className="text-[11px] text-fintech-muted">Recovery Rate</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {formatPercent(selectedResult.control_metrics.recovery_rate * 100)}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-fintech-border">
                  <span className="text-[11px] text-fintech-muted">Recovered Revenue</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {formatCurrency(selectedResult.control_metrics.recovered_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-fintech-border">
                  <span className="text-[11px] text-fintech-muted">Interventions</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {selectedResult.control_metrics.interventions_count}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-fintech-border">
                  <span className="text-[11px] text-fintech-muted">Avg Attempts</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {selectedResult.control_metrics.average_attempts}
                  </p>
                </div>
              </div>
            </div>

            {/* Treatment Group */}
            <div className="p-5 rounded-fintech-md bg-brand-500/5 border border-brand-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
                  Variant B • Treatment Group (Winner)
                </span>
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-brand-500/10 text-brand-700 dark:text-brand-300">
                  {selectedResult.treatment_metrics.strategy}
                </span>
              </div>
              <p className="text-sm font-bold text-fintech-primary">{selectedResult.treatment_metrics.strategy_label}</p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-brand-500/30">
                  <span className="text-[11px] text-brand-600 dark:text-brand-400">Recovery Rate</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPercent(selectedResult.treatment_metrics.recovery_rate * 100)}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-brand-500/30">
                  <span className="text-[11px] text-brand-600 dark:text-brand-400">Recovered Revenue</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(selectedResult.treatment_metrics.recovered_revenue)}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-brand-500/30">
                  <span className="text-[11px] text-brand-600 dark:text-brand-400">Interventions</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {selectedResult.treatment_metrics.interventions_count}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface rounded-fintech-sm border border-brand-500/30">
                  <span className="text-[11px] text-brand-600 dark:text-brand-400">Avg Attempts</span>
                  <p className="text-lg font-bold text-fintech-primary font-mono">
                    {selectedResult.treatment_metrics.average_attempts}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side by side chart */}
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#263247' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} tick={{ fontSize: 12 }} />
                <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f1420' : '#ffffff',
                    borderColor: isDark ? '#263247' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>{val}</span>
                  )}
                />
                <Bar dataKey="Control" fill={isDark ? '#475569' : '#94a3b8'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Treatment" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
