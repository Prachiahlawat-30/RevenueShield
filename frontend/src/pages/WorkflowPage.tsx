import React, { useEffect, useState } from 'react';
import {
  Play,
  RotateCcw,
  FastForward,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  History,
  Network,
  Zap,
} from 'lucide-react';
import { getRevenueRisks, getRevenueRiskDetail } from '../api/risks';
import {
  runAIDiagnosis,
  executeRecoveryStep,
  runFullRecoveryWorkflow,
  manualResolveRisk,
} from '../api/recovery';
import { RevenueRisk, AIDiagnosisResult, RecoveryStepResponse } from '../types';
import { WorkflowStepper, WorkflowStage } from '../components/workflow/WorkflowStepper';
import { AIDiagnosisCard } from '../components/workflow/AIDiagnosisCard';
import { PolicyCheckCard } from '../components/workflow/PolicyCheckCard';
import { SmartRetrySchedulerCard } from '../components/workflow/SmartRetrySchedulerCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { JsonDrawer } from '../components/common/JsonDrawer';
import { formatCurrency, formatDate, getFailureTypeLabel, getActionLabel } from '../utils/formatters';
import { PlaybookTimelineVisualizer } from '../components/workflow/PlaybookTimelineVisualizer';
import { CustomerValueBadge } from '../components/customers/CustomerValueBadge';
import { PaymentDecisionGraph } from '../components/decision-graph/PaymentDecisionGraph';
import { AdaptiveAuthorizationCard } from '../components/adaptive-authorization/AdaptiveAuthorizationCard';
import { VisualDecisionPath } from '../components/adaptive-authorization/VisualDecisionPath';
import { AuthorizationStrategyTable } from '../components/adaptive-authorization/AuthorizationStrategyTable';
import { WhyThisPathPanel } from '../components/adaptive-authorization/WhyThisPathPanel';
import { WhatIfSimulator } from '../components/adaptive-authorization/WhatIfSimulator';
import { AuthorizationFunnelChart } from '../components/adaptive-authorization/AuthorizationFunnelChart';
import { AdaptiveAuthorizationLossBreakdown } from '../components/adaptive-authorization/AdaptiveAuthorizationLossBreakdown';
import { getAuthorizationByRisk } from '../api/authorization';
import { AuthorizationDecisionResponse } from '../types';
import { MainWorkflowVisualizer } from '../components/workflow/MainWorkflowVisualizer';
import { NavTab } from '../components/layout/Sidebar';

interface WorkflowPageProps {
  initialRiskId?: string | null;
  riskId?: string | null;
  onBack?: () => void;
  onNavigateToTab?: (tab: NavTab) => void;
}

export const WorkflowPage: React.FC<WorkflowPageProps> = ({
  initialRiskId,
  riskId,
  onBack,
  onNavigateToTab,
}) => {
  const [allRisks, setAllRisks] = useState<RevenueRisk[]>([]);
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(riskId || initialRiskId || null);
  const [activeView, setActiveView] = useState<'graph' | 'stepper' | 'preauth'>('graph');
  const [currentRisk, setCurrentRisk] = useState<RevenueRisk | null>(null);
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('DETECTED');
  const [latestDiagnosis, setLatestDiagnosis] = useState<AIDiagnosisResult | undefined>(undefined);
  const [latestStepResponse, setLatestStepResponse] = useState<RecoveryStepResponse | null>(null);
  const [preauthDecision, setPreauthDecision] = useState<AuthorizationDecisionResponse | null>(null);
  const [loadingPreauth, setLoadingPreauth] = useState<boolean>(false);

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [isExecutingFull, setIsExecutingFull] = useState(false);

  const [inspectorPayload, setInspectorPayload] = useState<any>(null);
  const [inspectorTitle, setInspectorTitle] = useState('');

  // Load available risks
  const loadRisks = async () => {
    try {
      const data = await getRevenueRisks({ page: 1, page_size: 20 });
      setAllRisks(data.items);
      if (!selectedRiskId && data.items.length > 0) {
        setSelectedRiskId(data.items[0].id);
      }
    } catch (err) {
      console.error('Failed to load risks', err);
    }
  };

  // Load selected risk details
  const loadRiskDetail = async (id: string) => {
    try {
      const data = await getRevenueRiskDetail(id);
      setCurrentRisk(data);

      // Determine current stage based on status and attempts
      if (data.status === 'recovered' || data.status === 'stopped' || data.status === 'escalated') {
        setCurrentStage('OUTCOME');
      } else if (data.status === 'recovering') {
        setCurrentStage('EXECUTING');
      } else {
        setCurrentStage('DETECTED');
      }

      // Populate diagnosis if available from last attempt
      if (data.recovery_attempts && data.recovery_attempts.length > 0) {
        const lastAttempt = data.recovery_attempts[data.recovery_attempts.length - 1];
        setLatestDiagnosis({
          failure_category: lastAttempt.diagnosis_category || data.detected_failure_type,
          root_cause_summary: lastAttempt.ai_rationale || 'Root cause identified.',
          confidence_score: lastAttempt.ai_confidence || 0.95,
          recommended_action: lastAttempt.proposed_action,
          action_rationale: lastAttempt.ai_rationale || '',
          suggested_cooldown_hours: 24,
        });
      }
    } catch (err) {
      console.error('Failed to fetch risk detail', err);
    }
  };

  // Load pre-auth decision
  const loadPreauth = async (id: string) => {
    try {
      setLoadingPreauth(true);
      const data = await getAuthorizationByRisk(id);
      setPreauthDecision(data);
    } catch (err) {
      console.error('Failed to load pre-auth decision', err);
    } finally {
      setLoadingPreauth(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, []);

  useEffect(() => {
    if (selectedRiskId) {
      loadRiskDetail(selectedRiskId);
      loadPreauth(selectedRiskId);
    }
  }, [selectedRiskId]);

  // Actions
  const handleDiagnoseOnly = async () => {
    if (!selectedRiskId) return;
    setIsDiagnosing(true);
    setCurrentStage('DIAGNOSING');
    try {
      const diag = await runAIDiagnosis(selectedRiskId);
      setLatestDiagnosis(diag);
      setCurrentStage('ACTION_SELECTED');
    } catch (err) {
      console.error('Diagnosis failed', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleExecuteStep = async () => {
    if (!selectedRiskId) return;
    setIsExecutingStep(true);
    try {
      const res = await executeRecoveryStep(selectedRiskId, true);
      setLatestStepResponse(res);
      if (res.diagnosis) setLatestDiagnosis(res.diagnosis);

      // Map step response to stage
      if (res.is_terminal || res.current_status === 'recovered' || res.current_status === 'escalated' || res.current_status === 'stopped') {
        setCurrentStage('OUTCOME');
      } else {
        setCurrentStage('EXECUTING');
      }

      await loadRiskDetail(selectedRiskId);
    } catch (err) {
      console.error('Execute step failed', err);
    } finally {
      setIsExecutingStep(false);
    }
  };

  const handleRunFullWorkflow = async () => {
    if (!selectedRiskId) return;
    setIsExecutingFull(true);
    try {
      const responses = await runFullRecoveryWorkflow(selectedRiskId, 5, true);
      if (responses.length > 0) {
        const finalRes = responses[responses.length - 1];
        setLatestStepResponse(finalRes);
        if (finalRes.diagnosis) setLatestDiagnosis(finalRes.diagnosis);
      }
      setCurrentStage('OUTCOME');
      await loadRiskDetail(selectedRiskId);
    } catch (err) {
      console.error('Full workflow failed', err);
    } finally {
      setIsExecutingFull(false);
    }
  };

  const handleManualResolve = async (action: 'mark_recovered' | 'write_off') => {
    if (!selectedRiskId) return;
    try {
      const updated = await manualResolveRisk(selectedRiskId, action, 'Resolved via Interactive Stepper by Operator');
      setCurrentRisk(updated);
      setCurrentStage('OUTCOME');
    } catch (err) {
      console.error('Manual resolve failed', err);
    }
  };

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Top Header & Scenario Case Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Autonomous Intelligence & State Progression</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Recovery Workflow & Decisioning
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary">
            Optimize authorization before execution, verify deterministic safety bounds, and trace the causal decision path.
          </p>
        </div>

        {/* Case Switcher Dropdown */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-fintech-muted">Case:</span>
          <select
            value={selectedRiskId || ''}
            onChange={(e) => setSelectedRiskId(e.target.value)}
            className="rounded-fintech-md border border-fintech-border bg-fintech-surface px-3 py-1.5 text-xs font-semibold text-fintech-primary focus:border-brand-500 focus:outline-none max-w-xs shadow-fintech-sm"
          >
            {allRisks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.customer?.name} — {getFailureTypeLabel(r.detected_failure_type)} ({formatCurrency(r.amount_at_risk)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary 7-Step Workflow Pipeline Visualizer */}
      <MainWorkflowVisualizer
        currentActiveStep={
          currentRisk?.status === 'recovered'
            ? 7
            : currentStage === 'EXECUTING' || currentStage === 'RECOVERY'
            ? 6
            : currentStage === 'POLICY_CHECK'
            ? 5
            : currentStage === 'ACTION_SELECTED' || currentStage === 'ACTION_PROPOSAL'
            ? 4
            : currentStage === 'DIAGNOSING' || currentStage === 'AI_DIAGNOSIS'
            ? 3
            : 2
        }
        onNavigateToTab={onNavigateToTab}
      />

      {/* View Mode Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-fintech-border pb-3">
        <button
          onClick={() => setActiveView('graph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeView === 'graph'
              ? 'bg-brand-500 text-white shadow-fintech-sm shadow-brand-500/20'
              : 'bg-fintech-surface text-fintech-secondary hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Payment Decision Graph</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeView === 'graph' ? 'bg-white/20 text-white' : 'bg-fintech-surface-subtle text-fintech-muted'}`}>
            15 Nodes
          </span>
        </button>

        <button
          onClick={() => setActiveView('preauth')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeView === 'preauth'
              ? 'bg-brand-500 text-white shadow-fintech-sm shadow-brand-500/20'
              : 'bg-fintech-surface text-fintech-secondary hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Adaptive Pre-Auth & Smart 3DS</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${activeView === 'preauth' ? 'bg-white/20 text-white' : 'bg-fintech-surface-subtle text-fintech-muted'}`}>
            Pre-Payment
          </span>
        </button>

        <button
          onClick={() => setActiveView('stepper')}
          className={`flex items-center gap-2 px-4 py-2 rounded-fintech-md text-xs font-bold transition-all ${
            activeView === 'stepper'
              ? 'bg-brand-500 text-white shadow-fintech-sm shadow-brand-500/20'
              : 'bg-fintech-surface text-fintech-secondary hover:text-fintech-primary border border-fintech-border'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Interactive Stepper & Simulation</span>
        </button>
      </div>

      {/* VIEW 1: PAYMENT DECISION GRAPH */}
      {activeView === 'graph' && selectedRiskId && (
        <PaymentDecisionGraph
          riskId={selectedRiskId}
          onRefresh={() => selectedRiskId && loadRiskDetail(selectedRiskId)}
        />
      )}

      {/* VIEW 2: ADAPTIVE PRE-AUTH & SMART 3DS */}
      {activeView === 'preauth' && (
        <div className="space-y-6">
          {loadingPreauth || !preauthDecision ? (
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center text-fintech-muted animate-pulse">
              Computing optimal pre-authorization pathway & Smart 3DS tradeoff matrix...
            </div>
          ) : (
            <>
              <AdaptiveAuthorizationCard decision={preauthDecision} />
              <VisualDecisionPath decision={preauthDecision} />
              <WhyThisPathPanel factors={preauthDecision.why_this_path} />
              <AuthorizationStrategyTable alternatives={preauthDecision.alternatives} />
              <WhatIfSimulator initialAmount={Number(preauthDecision.amount)} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AuthorizationFunnelChart />
                <AdaptiveAuthorizationLossBreakdown />
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 3: Interactive Stepper & Execution Console */}
      {activeView === 'stepper' && currentRisk && (
        <>
          <WorkflowStepper
            currentStage={currentStage}
            status={currentRisk.status}
          />

          {/* Stepper Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 shadow-fintech-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-500 border border-brand-500/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-fintech-primary">{currentRisk.customer?.name}</span>
                  <CustomerValueBadge customerId={currentRisk.customer_id} amount={currentRisk.amount_at_risk} />
                  <StatusBadge status={currentRisk.status} size="sm" />
                </div>
                <p className="text-xs text-fintech-secondary mt-0.5">
                  {getFailureTypeLabel(currentRisk.detected_failure_type)} • At Risk:{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(currentRisk.amount_at_risk)}</strong> •
                  Recovered:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(currentRisk.amount_recovered)}</strong> •
                  Attempts:{' '}
                  <span className="font-semibold text-fintech-primary font-mono">{currentRisk.attempt_count} / 3</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentRisk.status === 'escalated' ? (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    icon={CheckCircle2}
                    onClick={() => handleManualResolve('mark_recovered')}
                  >
                    Mark Recovered
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleManualResolve('write_off')}
                  >
                    Write-Off
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Brain}
                    isLoading={isDiagnosing}
                    disabled={isExecutingStep || isExecutingFull || currentRisk.status === 'recovered'}
                    onClick={handleDiagnoseOnly}
                  >
                    AI Diagnose Only
                  </Button>

                  <Button
                    size="sm"
                    variant="primary"
                    icon={Play}
                    isLoading={isExecutingStep}
                    disabled={isExecutingFull || currentRisk.status === 'recovered' || currentRisk.status === 'stopped'}
                    onClick={handleExecuteStep}
                  >
                    Step Next
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    icon={FastForward}
                    isLoading={isExecutingFull}
                    disabled={currentRisk.status === 'recovered' || currentRisk.status === 'stopped'}
                    onClick={handleRunFullWorkflow}
                  >
                    Run to Terminal
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* AI Reasoning vs PolicyEngine Deterministic Rules */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AIDiagnosisCard
              diagnosis={latestDiagnosis}
              isLoading={isDiagnosing}
            />

            <PolicyCheckCard
              evaluation={latestStepResponse?.policy_evaluation}
            />
          </div>

          {/* Feature 8: Intelligent Retry Timing (Smart Retry Scheduler) */}
          <SmartRetrySchedulerCard
            riskId={currentRisk.id}
            onScheduledConfirmed={() => loadRiskDetail(currentRisk.id)}
          />

          {/* Execution Outcome & Attempts History Table */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Gateway Execution Outcome */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3">
              <div>
                <h3 className="text-sm font-bold text-fintech-primary">Simulated Gateway Execution</h3>
                <span className="text-[11px] text-fintech-secondary">ISO 8583 payment codes & channel telemetry</span>
              </div>

              {latestStepResponse?.execution_result ? (
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-fintech-md bg-fintech-surface-subtle p-2.5 border border-fintech-border">
                    <span className="text-[10px] font-semibold uppercase text-fintech-muted block">
                      Execution Channel
                    </span>
                    <p className="font-mono text-xs font-semibold text-fintech-primary mt-0.5">
                      {latestStepResponse.execution_result.channel}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-fintech-md bg-fintech-surface-subtle p-2.5 border border-fintech-border">
                      <span className="text-[10px] font-semibold uppercase text-fintech-muted block">
                        Gateway Code
                      </span>
                      <p className="font-mono text-xs font-bold text-brand-500 mt-0.5">
                        {latestStepResponse.execution_result.raw_gateway_code || '00'}
                      </p>
                    </div>
                    <div className="rounded-fintech-md bg-fintech-surface-subtle p-2.5 border border-fintech-border">
                      <span className="text-[10px] font-semibold uppercase text-fintech-muted block">
                        Amount Recovered
                      </span>
                      <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(latestStepResponse.execution_result.amount_recovered)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-fintech-md bg-fintech-surface-subtle p-2.5 border border-fintech-border text-[11px] text-fintech-secondary">
                    <span className="text-[10px] font-semibold uppercase text-fintech-muted block mb-0.5">
                      Gateway Message
                    </span>
                    {latestStepResponse.execution_result.message}
                  </div>
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center text-center text-xs text-fintech-muted">
                  Execute a step to simulate gateway transaction responses.
                </div>
              )}
            </div>

            {/* Recovery Playbook Timeline Sequence */}
            <PlaybookTimelineVisualizer riskId={currentRisk.id} />

            {/* Recovery Attempts Audit */}
            <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-3">
              <div className="flex items-center justify-between border-b border-fintech-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-fintech-primary">Attempts Ledger</h3>
                  <span className="text-[11px] text-fintech-secondary">Chronological history</span>
                </div>
                <span className="rounded-full bg-fintech-surface-subtle border border-fintech-border px-2 py-0.5 text-[10px] font-mono font-bold text-fintech-primary">
                  {currentRisk.recovery_attempts?.length || 0} Attempts
                </span>
              </div>

              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-fintech-border text-fintech-muted uppercase font-semibold text-[10px]">
                      <th className="pb-2">Attempt</th>
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Policy</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fintech-border">
                    {currentRisk.recovery_attempts && currentRisk.recovery_attempts.length > 0 ? (
                      currentRisk.recovery_attempts.map((att) => (
                        <tr key={att.id} className="hover:bg-fintech-surface-subtle/50 transition-colors">
                          <td className="py-2 font-bold text-fintech-primary font-mono">#{att.attempt_number}</td>
                          <td className="py-2 text-fintech-secondary font-medium truncate max-w-[100px]">
                            {getActionLabel(att.proposed_action)}
                          </td>
                          <td className="py-2">
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase border ${
                                att.policy_approved
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {att.policy_approved ? 'ALLOW' : 'BLOCK'}
                            </span>
                          </td>
                          <td className="py-2">
                            <StatusBadge status={att.execution_status} size="sm" />
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => {
                                setInspectorPayload(att);
                                setInspectorTitle(`Recovery Attempt #${att.attempt_number} Payload`);
                              }}
                              className="text-[11px] font-bold text-brand-500 hover:underline"
                            >
                              Payload
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-fintech-muted">
                          No attempts recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* JSON Payload Drawer */}
      <JsonDrawer
        isOpen={Boolean(inspectorPayload)}
        onClose={() => setInspectorPayload(null)}
        title={inspectorTitle}
        data={inspectorPayload}
      />
    </div>
  );
};
