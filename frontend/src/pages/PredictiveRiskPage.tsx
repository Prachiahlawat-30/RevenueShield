import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Zap,
  RefreshCw,
  ArrowRight,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  getPredictiveRiskSummary,
  getRevenueForecastSummary,
  getSinglePreventionDecision,
} from '../api/tier3';
import {
  PredictiveRiskSummaryResponse,
  RevenueForecastResponse,
  PreventionDecisionResult,
} from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { RevenueRiskHeatmap } from '../components/heatmap/RevenueRiskHeatmap';
import { PreventionDecisionModal } from '../components/prevention/PreventionDecisionModal';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

export const PredictiveRiskPage: React.FC = () => {
  const { isDark } = useTheme();
  const [summary, setSummary] = useState<PredictiveRiskSummaryResponse | null>(null);
  const [forecast, setForecast] = useState<RevenueForecastResponse | null>(null);
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<string>('ALL');
  const [selectedDecision, setSelectedDecision] = useState<PreventionDecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluatingDecision, setEvaluatingDecision] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sum, fc] = await Promise.all([
        getPredictiveRiskSummary(),
        getRevenueForecastSummary(),
      ]);
      setSummary(sum);
      setForecast(fc);
    } catch (err: any) {
      console.error('Failed to load predictive data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDecision = async (customerId: string) => {
    try {
      setEvaluatingDecision(true);
      const dec = await getSinglePreventionDecision(customerId);
      setSelectedDecision(dec);
    } catch (err: any) {
      console.error('Failed to load prevention decision:', err);
    } finally {
      setEvaluatingDecision(false);
    }
  };

  const handleActionSuccess = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-fintech-muted">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
          <span className="text-sm">Evaluating pre-failure risk models and forecasting horizons...</span>
        </div>
      </div>
    );
  }

  const filteredAccounts = summary
    ? summary.predictive_accounts.filter((acc) => {
        if (selectedHealthFilter === 'ALL') return true;
        return acc.payment_method_health.toUpperCase() === selectedHealthFilter.toUpperCase();
      })
    : [];

  const chartData = forecast
    ? forecast.daily_forecasts.map((pt) => ({
        day: pt.day_label,
        Volume: Number(pt.expected_payment_volume),
        'Failure Exposure (Predicted)': Number(pt.predicted_failure_exposure),
        'Recoverable (Predicted)': Number(pt.predicted_recoverable_revenue),
        confidence: pt.confidence_percentage,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 rounded-fintech-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">
              Predictive Revenue Protection & Risk Forecast
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-mono">
              PREDICTED (NOT ACTUAL)
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Pre-failure risk scoring, forward loss exposure forecasting, and proactive interventions before payment failure occurs
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={fetchData}
        >
          Recalibrate Models
        </Button>
      </div>

      {/* Multi-Horizon KPI Cards */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 24 Hours */}
          <div className="p-5 rounded-fintech-lg bg-fintech-surface border border-fintech-border space-y-4 shadow-fintech-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
                {forecast.horizon_24h.horizon_label}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                PREDICTED
              </span>
            </div>
            <div>
              <span className="text-[11px] text-fintech-muted block">Predicted Failure Exposure</span>
              <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(forecast.horizon_24h.predicted_failure_exposure)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-fintech-border text-xs">
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Volume</span>
                <span className="font-mono font-bold text-fintech-primary">{formatCurrency(forecast.horizon_24h.expected_payment_volume)}</span>
              </div>
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Recoverable</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(forecast.horizon_24h.expected_recoverable_revenue)}</span>
              </div>
            </div>
          </div>

          {/* 7 Days */}
          <div className="p-5 rounded-fintech-lg bg-brand-500/5 border border-brand-500/30 space-y-4 shadow-fintech-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-mono">
                {forecast.horizon_7d.horizon_label}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                PREDICTED
              </span>
            </div>
            <div>
              <span className="text-[11px] text-fintech-muted block">Predicted Failure Exposure</span>
              <p className="text-2xl font-black font-mono text-brand-600 dark:text-brand-300 mt-0.5">
                {formatCurrency(forecast.horizon_7d.predicted_failure_exposure)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-500/20 text-xs">
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Volume</span>
                <span className="font-mono font-bold text-fintech-primary">{formatCurrency(forecast.horizon_7d.expected_payment_volume)}</span>
              </div>
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Recoverable</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(forecast.horizon_7d.expected_recoverable_revenue)}</span>
              </div>
            </div>
          </div>

          {/* 30 Days */}
          <div className="p-5 rounded-fintech-lg bg-fintech-surface border border-fintech-border space-y-4 shadow-fintech-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
                {forecast.horizon_30d.horizon_label}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                PREDICTED
              </span>
            </div>
            <div>
              <span className="text-[11px] text-fintech-muted block">Predicted Failure Exposure</span>
              <p className="text-2xl font-black font-mono text-fintech-primary mt-0.5">
                {formatCurrency(forecast.horizon_30d.predicted_failure_exposure)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-fintech-border text-xs">
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Volume</span>
                <span className="font-mono font-bold text-fintech-primary">{formatCurrency(forecast.horizon_30d.expected_payment_volume)}</span>
              </div>
              <div>
                <span className="text-fintech-muted block text-[10px]">Expected Recoverable</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(forecast.horizon_30d.expected_recoverable_revenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 3: Revenue Risk Heatmap Component */}
      <RevenueRiskHeatmap />

      {/* 7-Day Time-Series Chart & Top Risk Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Daily Curve */}
        <div className="lg:col-span-8 p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-4">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3">
            <div>
              <h2 className="text-sm font-bold text-fintech-primary">Daily Revenue Exposure Forecast</h2>
              <p className="text-xs text-fintech-secondary">Day-by-day projected payment volume vs forward failure risk</p>
            </div>
            <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 font-bold">7-Day Projection</span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#263247' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="day" stroke={isDark ? '#64748b' : '#94a3b8'} tick={{ fontSize: 12 }} />
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
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}>{val}</span>
                  )}
                />
                <Bar dataKey="Volume" fill={isDark ? '#334155' : '#cbd5e1'} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="Failure Exposure (Predicted)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ fill: '#f43f5e', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Recoverable (Predicted)"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#10b981', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Top Risk Drivers */}
        <div className="lg:col-span-4 p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-4">
          <div className="border-b border-fintech-border pb-3">
            <h2 className="text-sm font-bold text-fintech-primary">Top Forward Risk Drivers</h2>
            <p className="text-xs text-fintech-secondary">Key categories driving forward payment loss</p>
          </div>

          <div className="space-y-3">
            {forecast?.top_risk_drivers.map((driver, idx) => (
              <div key={idx} className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fintech-primary">{driver.category}</span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase font-mono ${
                      driver.urgency === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30'
                    }`}
                  >
                    {driver.urgency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="font-mono text-fintech-muted">{formatCurrency(driver.exposure_amount)}</span>
                  <span className="font-mono text-fintech-primary font-bold">{driver.share_pct}% Share</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Failure Ranked Accounts Dossier */}
      <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border shadow-fintech-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-fintech-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-fintech-primary">
                Pre-Failure Risk Accounts & Decision Matrix ({filteredAccounts.length})
              </h2>
            </div>
            <p className="text-xs text-fintech-secondary mt-0.5">
              Ranked subscription renewals with automated 3-way Prevention vs Recovery economic evaluation
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-fintech-surface-subtle p-1 rounded-fintech-md border border-fintech-border">
            {['ALL', 'CRITICAL', 'DEGRADING', 'HEALTHY'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedHealthFilter(filter)}
                className={`px-3 py-1 text-xs font-semibold rounded-fintech-sm transition-all ${
                  selectedHealthFilter === filter
                    ? 'bg-brand-500 text-white shadow-fintech-sm'
                    : 'text-fintech-muted hover:text-fintech-primary'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {filteredAccounts.map((acc) => {
            const isCritical = acc.payment_method_health === 'CRITICAL';
            const isDegrading = acc.payment_method_health === 'DEGRADING';

            return (
              <div
                key={acc.customer_id}
                className={`p-5 rounded-fintech-md border transition-all space-y-4 ${
                  isCritical
                    ? 'bg-rose-500/5 border-rose-500/30'
                    : isDegrading
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-fintech-surface-subtle border-fintech-border'
                }`}
              >
                {/* Top Row: Customer info + Exposure */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-fintech-primary">{acc.customer_name}</span>
                      <span className="text-xs text-fintech-muted">({acc.merchant_name})</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase font-mono ${
                          isCritical
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            : isDegrading
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {acc.payment_method_health}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-fintech-muted">{acc.customer_email}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-fintech-muted block uppercase font-semibold">Next Invoice</span>
                      <span className="text-sm font-bold font-mono text-fintech-primary">
                        {formatCurrency(acc.upcoming_amount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase font-semibold">Predicted Exposure</span>
                      <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(acc.predicted_revenue_at_risk)}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-fintech-sm bg-fintech-surface border border-fintech-border text-center">
                      <span className="text-[9px] text-fintech-muted block uppercase">Failure Prob.</span>
                      <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                        {formatPercent(acc.probability_of_failure * 100)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Explainable Evidence Checklist */}
                <div className="p-3.5 rounded-fintech-sm bg-fintech-surface border border-fintech-border space-y-2">
                  <div className="flex items-center justify-between text-xs text-fintech-muted">
                    <span className="font-semibold text-fintech-primary">Deterministic Pre-Failure Evidence:</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400">Horizon: {acc.risk_horizon}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {acc.risk_reasons.map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-fintech-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Proactive Recommended Intervention & 3-Way Decision Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs pt-1 border-t border-fintech-border">
                  <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
                    <Zap className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>
                      <strong>Recommended Proactive Action:</strong> {acc.recommended_proactive_action}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Scale}
                    onClick={() => handleOpenDecision(acc.customer_id)}
                  >
                    Evaluate Prevention Decision (A vs B vs C)
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prevention Decision Modal */}
      {selectedDecision && (
        <PreventionDecisionModal
          decision={selectedDecision}
          onClose={() => setSelectedDecision(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};
