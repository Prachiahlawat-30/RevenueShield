import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Activity,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { getIncidents, detectAnomalies, resolveIncident } from '../api/tier2';
import { PaymentIncident, AnomalyDetectionResult } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<PaymentIncident[]>([]);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyDetectionResult | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<PaymentIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const list = await getIncidents();
      setIncidents(list);
      if (list.length > 0) {
        setSelectedIncident(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleScanAnomalies = async () => {
    try {
      setScanning(true);
      const res = await detectAnomalies();
      setAnomalyResult(res);
      await fetchIncidents();
      setFeedback(res.message);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error('Failed to scan anomalies:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      const resolved = await resolveIncident(incidentId);
      setIncidents((prev) => prev.map((inc) => (inc.id === incidentId ? resolved : inc)));
      setSelectedIncident(resolved);
      setFeedback(`Incident ${resolved.incident_code} marked as RESOLVED.`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to resolve incident:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-fintech-primary tracking-tight">Payment Incidents & Anomaly Radar</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-mono">
              Degradation Tracker
            </span>
          </div>
          <p className="text-sm text-fintech-secondary mt-1">
            Statistical failure surge detection, automated incident synthesis, and evidence-backed root cause analysis
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={RefreshCw}
          isLoading={scanning}
          onClick={handleScanAnomalies}
        >
          {scanning ? 'Scanning Stream...' : 'Scan For Anomalies'}
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-fintech-md bg-brand-500/10 border border-brand-500/30 text-brand-700 dark:text-brand-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-brand-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Incidents List & Incident Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents Queue */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-fintech-muted uppercase tracking-wider font-mono">
            Operational Incidents ({incidents.length})
          </h2>

          <div className="space-y-3">
            {incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;
              const isActive = inc.status === 'ACTIVE';
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-4 rounded-fintech-lg border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-brand-500/5 border-brand-500 shadow-fintech-sm'
                      : 'bg-fintech-surface border-fintech-border hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-fintech-primary">{inc.incident_code}</span>
                      <span
                        className={`px-2 py-0.2 text-[10px] font-bold rounded uppercase font-mono ${
                          isActive
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-rose-600 dark:text-rose-400">
                      {formatCurrency(inc.estimated_revenue_impact)}/hr
                    </span>
                  </div>

                  <p className="text-xs font-bold text-fintech-primary leading-snug">{inc.title}</p>

                  <div className="flex items-center justify-between text-xs text-fintech-muted pt-1 border-t border-fintech-border font-mono text-[11px]">
                    <span>Gateway: <strong className="text-fintech-primary">{inc.affected_gateway}</strong></span>
                    <span>{formatDate(inc.detected_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Incident Detailed Dossier */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="p-6 rounded-fintech-lg bg-fintech-surface border border-fintech-border space-y-6 shadow-fintech-sm">
              <div className="flex items-center justify-between border-b border-fintech-border pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                    {selectedIncident.incident_code}
                  </span>
                  <h3 className="text-base font-bold text-fintech-primary mt-0.5">{selectedIncident.title}</h3>
                </div>
                {selectedIncident.status === 'ACTIVE' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolve(selectedIncident.id)}
                  >
                    Mark as Resolved
                  </Button>
                )}
              </div>

              {/* Degradation Alert Banner if Active */}
              {selectedIncident.status === 'ACTIVE' && (
                <div className="p-4 rounded-fintech-md bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        ⚠️ Payment Degradation Detected
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                        SURGE: +340% TIMEOUTS
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-900 dark:text-rose-200">
                      Failure rate increased <strong>4.8×</strong> in the last 30 minutes. System-wide anomaly detected on <strong>{selectedIncident.affected_gateway}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Metric stats (4-column strip) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-fintech-surface-subtle rounded-fintech-md border border-fintech-border">
                  <span className="text-[10px] text-fintech-muted uppercase font-semibold">Affected Gateway</span>
                  <p className="text-xs font-bold text-fintech-primary mt-0.5 font-mono">{selectedIncident.affected_gateway}</p>
                </div>
                <div className="p-3 bg-fintech-surface-subtle rounded-fintech-md border border-fintech-border">
                  <span className="text-[10px] text-fintech-muted uppercase font-semibold">Affected Method</span>
                  <p className="text-xs font-bold text-fintech-primary mt-0.5 uppercase font-mono">
                    {selectedIncident.affected_payment_method || 'UPI'}
                  </p>
                </div>
                <div className="p-3 bg-fintech-surface-subtle rounded-fintech-md border border-fintech-border">
                  <span className="text-[10px] text-fintech-muted uppercase font-semibold">Affected Region</span>
                  <p className="text-xs font-bold text-fintech-primary mt-0.5 font-mono">
                    North India
                  </p>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-fintech-md border border-rose-500/30">
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-semibold">Revenue at Risk</span>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mt-0.5 font-mono">
                    {formatCurrency(selectedIncident.estimated_revenue_impact)}/hr
                  </p>
                </div>
              </div>

              {/* Root Cause Hypothesis */}
              <div className="p-4 rounded-fintech-md bg-brand-500/5 border border-brand-500/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" />
                  <span className="text-xs font-bold text-fintech-primary uppercase tracking-wider">
                    Root Cause Hypothesis
                  </span>
                  <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 ml-auto font-bold">
                    Confidence: {Math.round(Number(selectedIncident.confidence) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-fintech-secondary leading-relaxed">
                  {selectedIncident.root_cause_summary}
                </p>
              </div>

              {/* Evidence Checklist */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-fintech-muted uppercase tracking-wider block font-mono">
                  Deterministic Evidence Checklist
                </span>
                <div className="space-y-2">
                  {selectedIncident.evidence_list?.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-fintech-sm bg-fintech-surface-subtle border border-fintech-border text-xs text-fintech-primary flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-fintech-muted bg-fintech-surface rounded-fintech-lg border border-fintech-border shadow-fintech-sm">
              Select an incident to view root-cause evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
