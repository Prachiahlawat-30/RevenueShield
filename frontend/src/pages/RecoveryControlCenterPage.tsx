import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Bot,
  Flame,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  getControlCenterSummary,
  getLiveEventsStream,
  getIncidentPlaybooks,
  simulateIncidentMitigation,
  executeIncidentMitigation,
  approveQueuedAction,
} from '../api/tier3';
import {
  ControlCenterSummaryResponse,
  LiveEventItem,
  IncidentPlaybookItem,
  IncidentMitigationSimulationResponse,
} from '../types';
import { formatCurrency } from '../utils/formatters';
import { Button } from '../components/ui/Button';

interface RecoveryControlCenterPageProps {
  onNavigateToWorkflow?: (riskId: string) => void;
}

export const RecoveryControlCenterPage: React.FC<RecoveryControlCenterPageProps> = ({
  onNavigateToWorkflow,
}) => {
  const [data, setData] = useState<ControlCenterSummaryResponse | null>(null);
  const [liveEvents, setLiveEvents] = useState<LiveEventItem[]>([]);
  const [playbooks, setPlaybooks] = useState<IncidentPlaybookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQueueTab, setActiveQueueTab] = useState<'RISKS' | 'INCIDENTS' | 'APPROVALS' | 'PLAYBOOKS'>('RISKS');

  // Mitigation Simulation Modal
  const [selectedIncident, setSelectedIncident] = useState<IncidentPlaybookItem | null>(null);
  const [simulationResult, setSimulationResult] = useState<IncidentMitigationSimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sum, pbs] = await Promise.all([
        getControlCenterSummary(),
        getIncidentPlaybooks(),
      ]);
      setData(sum);
      setLiveEvents(sum.recent_events || []);
      setPlaybooks(pbs);
    } catch (err) {
      console.error('Failed to load control center data', err);
    } finally {
      setLoading(false);
    }
  };

  // Periodic Telemetry Event Polling (every 5 seconds)
  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const evRes = await getLiveEventsStream(12);
        setLiveEvents(evRes.events);
      } catch (e) {
        // silent polling error
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenSimulation = async (incident: IncidentPlaybookItem) => {
    setSelectedIncident(incident);
    setIsSimulating(true);
    try {
      const sim = await simulateIncidentMitigation({
        incident_id: incident.incident_id,
        current_gateway_share_pct: 70,
        proposed_gateway_share_pct: 30,
        target_gateway_share_pct: 70,
      });
      setSimulationResult(sim);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDeployMitigation = async () => {
    if (!selectedIncident) return;
    setIsDeploying(true);
    try {
      const res = await executeIncidentMitigation({
        incident_id: selectedIncident.incident_id,
        target_gateway: selectedIncident.target_gateway,
        proposed_share_pct: 70,
        operator_notes: 'Deployed from Live Control Center console',
      });
      setActionNotice(`Mitigation active: ${res.action_taken}. Audit: ${res.audit_event_logged}.`);
      setSelectedIncident(null);
      setSimulationResult(null);
      setTimeout(() => setActionNotice(null), 5000);
      loadData();
    } catch (err) {
      console.error('Mitigation deployment failed', err);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleQuickApprove = async (riskId: string) => {
    try {
      const res = await approveQueuedAction(riskId, 'Quick approved from Control Center');
      setActionNotice(`Action executed. Audit: ${res.audit_event_logged}.`);
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err) {
      console.error('Quick approve failed', err);
    }
  };

  const getEventBadgeColor = (col: string) => {
    switch (col) {
      case 'GREEN':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'BLUE':
        return 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border-brand-500/30';
      case 'PURPLE':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30';
      case 'AMBER':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header with Live Heartbeat Pulse */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>LIVE RECOVERY OPERATIONS</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
              {data?.system_health_status || 'OPTIMAL'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Recovery Control Center
          </h1>
          <p className="mt-1 text-sm text-fintech-secondary">
            Real-time unified command console for live queues, failure containment, and automated recovery telemetry.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={loadData}
        >
          Refresh Console
        </Button>
      </div>

      {/* The Central RevenueShield Differentiator Statement */}
      <div className="rounded-fintech-lg border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-fintech-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-fintech-primary leading-relaxed">
            "RevenueShield doesn't ask AI how to move money. It uses AI to understand revenue risk, while deterministic policy decides what the system is allowed to do."
          </p>
        </div>
      </div>

      {/* RevenueShield Live Recommendations Ticker Strip */}
      <div className="rounded-fintech-lg border border-brand-500/30 bg-brand-500/5 p-4 space-y-2 shadow-fintech-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider font-mono">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>REVENUESHIELD LIVE PROACTIVE RECOMMENDATIONS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm">
            <span className="text-rose-600 dark:text-rose-400 font-bold block">🔥 Shift Traffic from Gateway Alpha</span>
            <span className="text-[11px] text-fintech-secondary">Potential protection: <strong>$57,000.00/hr (₹5.7L/hr)</strong></span>
          </div>
          <div className="p-3 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm">
            <span className="text-amber-600 dark:text-amber-400 font-bold block">⚠️ Contact 128 High-Risk Accounts</span>
            <span className="text-[11px] text-fintech-secondary">Potential protection: <strong>$43,000.00 (₹4.3L)</strong></span>
          </div>
          <div className="p-3 rounded-fintech-md bg-fintech-surface border border-fintech-border shadow-fintech-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold block">💡 Reminder → Retry Outperforms</span>
            <span className="text-[11px] text-fintech-secondary">Expected additional recovery: <strong>+$18,000.00 (₹1.8L)</strong></span>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="rounded-fintech-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top 7 Macro KPIs Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {/* 1. Revenue At Risk */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Revenue At Risk
          </span>
          <span className="mt-1 text-lg font-black font-mono text-fintech-primary block truncate">
            {formatCurrency(data?.kpis.revenue_at_risk || 0)}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-semibold">Active Exposure</span>
        </div>

        {/* 2. Expected Recovery */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Expected Recovery
          </span>
          <span className="mt-1 text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block truncate">
            {formatCurrency(data?.kpis.expected_recovery || 0)}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono font-semibold">78.4% Likelihood</span>
        </div>

        {/* 3. Recovered Today */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Recovered Today
          </span>
          <span className="mt-1 text-lg font-black font-mono text-sky-600 dark:text-sky-300 block truncate">
            {formatCurrency(data?.kpis.recovered_today || 0)}
          </span>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono font-semibold">Settled Funds</span>
        </div>

        {/* 4. Active Recoveries */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Active Recoveries
          </span>
          <span className="mt-1 text-lg font-black font-mono text-fintech-primary block">
            {data?.kpis.active_recoveries_count || 0}
          </span>
          <span className="text-[10px] text-fintech-muted font-mono">In-Flight Runs</span>
        </div>

        {/* 5. Pending Approvals */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Pending Approvals
          </span>
          <span className="mt-1 text-lg font-black font-mono text-amber-600 dark:text-amber-400 block">
            {data?.kpis.pending_approvals_count || 0}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-500 font-mono font-semibold">Human Gate</span>
        </div>

        {/* 6. Open Incidents */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Open Incidents
          </span>
          <span className="mt-1 text-lg font-black font-mono text-purple-600 dark:text-purple-400 block">
            {data?.kpis.open_incidents_count || 0}
          </span>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">Gateway Health</span>
        </div>

        {/* 7. Predicted Risk */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-fintech-muted block">
            Predicted Risk
          </span>
          <span className="mt-1 text-lg font-black font-mono text-brand-600 dark:text-brand-300 block truncate">
            {formatCurrency(data?.kpis.predicted_risk_volume || 0)}
          </span>
          <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono font-semibold">Pre-Failure 24h</span>
        </div>
      </div>

      {/* Main Operations Split: Live Queues (Left) + Real-Time Telemetry Stream (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: 4 Live Operational Queues */}
        <div className="lg:col-span-2 space-y-4">
          {/* Queue Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 border-b border-fintech-border pb-3">
            <button
              onClick={() => setActiveQueueTab('RISKS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-fintech-md text-xs font-bold transition-all ${
                activeQueueTab === 'RISKS'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/40 shadow-fintech-sm'
                  : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Critical Revenue Risks ({data?.critical_revenue_risks?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveQueueTab('INCIDENTS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-fintech-md text-xs font-bold transition-all ${
                activeQueueTab === 'INCIDENTS'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/40 shadow-fintech-sm'
                  : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Payment Incidents ({data?.payment_incidents?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveQueueTab('APPROVALS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-fintech-md text-xs font-bold transition-all ${
                activeQueueTab === 'APPROVALS'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-fintech-sm'
                  : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Human Approvals ({data?.human_approvals?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveQueueTab('PLAYBOOKS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-fintech-md text-xs font-bold transition-all ${
                activeQueueTab === 'PLAYBOOKS'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-fintech-sm'
                  : 'bg-fintech-surface text-fintech-muted hover:text-fintech-primary border border-fintech-border'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Playbooks ({data?.active_playbooks?.length || 0})</span>
            </button>
          </div>

          {/* Queue Content Panel */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3 min-h-[380px]">
            {/* 1. Critical Revenue Risks Queue */}
            {activeQueueTab === 'RISKS' && (
              <div className="space-y-3">
                {data?.critical_revenue_risks?.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-fintech-primary text-xs">{r.customer_name}</span>
                        <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/30 uppercase font-mono">
                          {r.priority_band}
                        </span>
                      </div>
                      <p className="text-[11px] text-fintech-muted font-mono mt-0.5">
                        {r.failure_type?.replace('_', ' ').toUpperCase()} • Attempts: {r.attempt_count}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <span className="text-sm font-black font-mono text-fintech-primary">
                        {formatCurrency(r.amount)}
                      </span>
                      {onNavigateToWorkflow && (
                        <button
                          onClick={() => onNavigateToWorkflow(r.id)}
                          className="rounded-fintech-sm bg-fintech-surface hover:bg-slate-200 dark:hover:bg-slate-800 p-1.5 text-fintech-secondary transition-all border border-fintech-border"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Payment Incidents Queue */}
            {activeQueueTab === 'INCIDENTS' && (
              <div className="space-y-3">
                {playbooks.map((pb) => (
                  <div
                    key={pb.incident_id}
                    className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 border border-purple-500/30 font-mono">
                          {pb.severity}
                        </span>
                        <span className="font-bold text-fintech-primary text-xs">{pb.incident_title}</span>
                      </div>
                      <span className="font-mono text-rose-600 dark:text-rose-400 text-xs font-bold">
                        {formatCurrency(pb.revenue_at_risk_hourly)} / hr
                      </span>
                    </div>

                    <p className="text-xs text-fintech-secondary font-medium">
                      Mitigation: <span className="text-emerald-600 dark:text-emerald-400">{pb.recommended_mitigation}</span>
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-fintech-border text-[11px]">
                      <span className="text-fintech-muted font-mono">
                        Expected Lift: <strong className="text-emerald-600 dark:text-emerald-400">+{pb.expected_improvement_pct}%</strong>
                      </span>

                      <Button
                        size="sm"
                        variant="primary"
                        icon={Sliders}
                        onClick={() => handleOpenSimulation(pb)}
                      >
                        Simulate Mitigation
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Human Approvals Queue */}
            {activeQueueTab === 'APPROVALS' && (
              <div className="space-y-3">
                {data?.human_approvals?.length === 0 ? (
                  <p className="text-xs text-fintech-muted text-center py-8">No items pending approval.</p>
                ) : (
                  data?.human_approvals?.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-fintech-primary text-xs">{item.customer_name}</span>
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30 uppercase font-mono">
                            {item.urgency_tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-fintech-muted mt-0.5">{item.ai_recommendation}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-fintech-primary">
                          {formatCurrency(item.amount)}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleQuickApprove(item.risk_id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Active Playbooks Queue */}
            {activeQueueTab === 'PLAYBOOKS' && (
              <div className="space-y-3">
                {data?.active_playbooks?.map((pb: any) => (
                  <div
                    key={pb.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-fintech-primary text-xs">{pb.name}</span>
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase font-mono">
                          {pb.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-fintech-muted mt-0.5 font-mono">Trigger: {pb.trigger}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                        {pb.success_rate_pct}% Success
                      </span>
                      <span className="text-[10px] text-fintech-muted font-mono">{pb.active_runs} active runs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Feature 16 Real-Time Event Stream Ticker */}
        <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
          <div className="flex items-center justify-between border-b border-fintech-border pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="font-bold text-fintech-primary text-xs uppercase tracking-wider font-mono">
                Live Telemetry Stream
              </span>
            </div>
            <span className="text-[10px] text-fintech-muted font-mono">Polling 5s</span>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {liveEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1 text-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-fintech-muted font-semibold">
                    {ev.timestamp_str}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border font-mono ${getEventBadgeColor(
                      ev.badge_color
                    )}`}
                  >
                    {ev.event_type.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-bold text-fintech-primary text-[11px] leading-tight">{ev.headline}</p>
                <p className="text-[10px] text-fintech-muted truncate">{ev.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature 18: Incident Mitigation Simulation Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-fintech-xl border border-fintech-border bg-fintech-surface p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-fintech-border pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 font-mono">
                  Zero-Mutation Pre-Flight Simulation
                </span>
                <h3 className="text-base font-bold text-fintech-primary mt-0.5">
                  Simulate Incident Mitigation: {selectedIncident.gateway_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="rounded-fintech-sm bg-fintech-surface-subtle p-1 text-fintech-muted hover:text-fintech-primary"
              >
                ✕
              </button>
            </div>

            {/* Simulation Comparison Matrix */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3 space-y-1">
                  <span className="text-fintech-muted font-semibold text-[10px] uppercase font-mono">Current Gateway Allocation</span>
                  <p className="font-mono text-fintech-primary font-bold">70% Gateway Alpha, 30% Beta</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">Success Rate: 91.2%</p>
                </div>

                <div className="rounded-fintech-md border border-purple-500/40 bg-purple-500/5 p-3 space-y-1">
                  <span className="text-purple-700 dark:text-purple-400 font-semibold text-[10px] uppercase font-mono">Proposed Mitigation Allocation</span>
                  <p className="font-mono text-fintech-primary font-bold">30% Gateway Alpha, 70% Beta</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">Success Rate: 96.4% (+5.2%)</p>
                </div>
              </div>

              {/* Economic Projection Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
                  <span className="text-fintech-muted text-[10px] uppercase block font-mono">Protected Revenue</span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(simulationResult?.expected_protected_revenue_hourly || 8700)} / hr
                  </span>
                </div>

                <div className="rounded-fintech-md border border-fintech-border bg-fintech-surface-subtle p-3">
                  <span className="text-fintech-muted text-[10px] uppercase block font-mono">Estimated Latency Impact</span>
                  <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                    +{simulationResult?.estimated_latency_delta_ms || 40} ms
                  </span>
                </div>
              </div>

              <div className="rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border p-3 text-[11px] text-fintech-secondary leading-relaxed font-medium">
                {simulationResult?.simulation_summary ||
                  'Simulating shift to 30% Gateway Alpha, 70% Gateway Beta: Expected success rate increases from 91.2% to 96.4% (+5.2 pp), protecting $8,700.00/hour.'}
              </div>
            </div>

            {/* PolicyEngine Warning & Deploy Action */}
            <div className="flex items-center justify-between pt-2 border-t border-fintech-border text-xs">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Requires Operator Deployment
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIncident(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isDeploying}
                  onClick={handleDeployMitigation}
                >
                  Deploy Safe Mitigation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
