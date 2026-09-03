import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  ShieldAlert,
  Activity,
  CreditCard,
  Cpu,
  UserX,
  CheckCircle2,
  AlertOctagon,
  Zap,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  getDemoScenarios,
  getGuidedDemoScenes,
  runDemoScenario,
  resetDemoDatabase,
} from '../api/tier3';
import {
  DemoScenarioInfo,
  DemoScenarioExecutionResponse,
  GuidedDemoSceneItem,
} from '../types';
import { Button } from '../components/ui/Button';

interface DemoLabPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const DemoLabPage: React.FC<DemoLabPageProps> = ({ onNavigateToTab }) => {
  const [scenarios, setScenarios] = useState<DemoScenarioInfo[]>([]);
  const [scenes, setScenes] = useState<GuidedDemoSceneItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('high_value_failure');
  const [executionResult, setExecutionResult] = useState<DemoScenarioExecutionResponse | null>(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guided demo tour tab index (0 to 8)
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);

  const fetchCatalog = async () => {
    try {
      setLoadingScenarios(true);
      setErrorMessage(null);
      const [scList, scScenes] = await Promise.all([
        getDemoScenarios(),
        getGuidedDemoScenes(),
      ]);
      setScenarios(scList);
      setScenes(scScenes);
      if (scList.length > 0) {
        setSelectedScenarioId(scList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load demo catalog', err);
      setErrorMessage(err?.response?.data?.detail || 'Failed to load demo catalog.');
    } finally {
      setLoadingScenarios(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleRunScenario = async (scId: string) => {
    try {
      setExecuting(true);
      setErrorMessage(null);
      setSelectedScenarioId(scId);
      const res = await runDemoScenario(scId);
      setExecutionResult(res);
      // Smooth scroll to execution trace
      setTimeout(() => {
        const traceEl = document.getElementById('execution-trace-panel');
        if (traceEl) {
          traceEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to run demo scenario', err);
      setErrorMessage(err?.response?.data?.detail || 'Scenario execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      setErrorMessage(null);
      const res = await resetDemoDatabase();
      setResetNotice(
        `Demo database restored to baseline (${res.restored_customers} accounts & ${res.restored_risks} risks).`
      );
      setExecutionResult(null);
      setTimeout(() => setResetNotice(null), 4500);
    } catch (err: any) {
      console.error('Failed to reset demo database', err);
      setErrorMessage(err?.response?.data?.detail || 'Demo reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const getScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return ShieldAlert;
      case 'Activity':
        return Activity;
      case 'Cpu':
        return Cpu;
      case 'UserX':
        return UserX;
      case 'CheckCircle2':
        return CheckCircle2;
      case 'AlertOctagon':
        return AlertOctagon;
      case 'Zap':
        return Zap;
      default:
        return CreditCard;
    }
  };

  const activeScene = scenes[activeSceneIndex];

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <FlaskConical className="h-4 w-4" />
            <span>Interactive Evaluation Sandbox</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Demo Scenario Builder & Lab
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary max-w-3xl">
            Execute pre-packaged evaluation scenarios with deterministic reliability, or follow the guided 9-scene live tour.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={RotateCcw}
          isLoading={resetting}
          onClick={handleResetDemo}
        >
          {resetting ? 'Resetting...' : 'Reset Demo State'}
        </Button>
      </div>

      {/* Notifications */}
      {resetNotice && (
        <div className="rounded-fintech-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{resetNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-fintech-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Central Differentiator Statement */}
      <div className="rounded-fintech-lg border border-brand-500/30 bg-brand-500/5 p-5 shadow-fintech-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
              The RevenueShield Differentiator
            </span>
            <p className="text-sm sm:text-base font-bold text-fintech-primary mt-0.5 leading-relaxed">
              "RevenueShield doesn't ask AI how to move money. It uses AI to diagnose revenue risk, while deterministic policy decides what the system is allowed to do."
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: 9-Scene Hackathon Guided Pitch Flow */}
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-wider">
              5-Minute Demo Walkthrough
            </span>
            <h2 className="text-base font-bold text-fintech-primary mt-0.5">
              Guided 9-Scene Live Pitch Tour
            </h2>
          </div>
          <span className="text-xs font-mono text-fintech-muted">
            Scene {activeSceneIndex + 1} of {scenes.length}
          </span>
        </div>

        {/* Scene Progress Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {scenes.map((sc, idx) => (
            <button
              key={sc.scene_number}
              onClick={() => setActiveSceneIndex(idx)}
              className={`px-3 py-1.5 rounded-fintech-md font-mono text-xs font-bold transition-all shrink-0 ${
                activeSceneIndex === idx
                  ? 'bg-brand-500 text-white shadow-fintech-sm font-bold'
                  : 'bg-fintech-surface-subtle text-fintech-secondary border border-fintech-border hover:text-fintech-primary'
              }`}
            >
              Scene {sc.scene_number}
            </button>
          ))}
        </div>

        {/* Active Scene Display */}
        {activeScene && (
          <div className="rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-fintech-primary">{activeScene.title}</h3>
              {onNavigateToTab && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() => onNavigateToTab(activeScene.target_tab)}
                >
                  {activeScene.action_button_label}
                </Button>
              )}
            </div>

            <p className="text-xs text-fintech-secondary leading-relaxed font-medium bg-fintech-surface p-3 rounded-fintech-md border border-fintech-border">
              {activeScene.narrative_hook}
            </p>

            {/* Key Scene Metrics */}
            <div className="flex flex-wrap gap-2 pt-1">
              {activeScene.highlight_metrics.map((m, i) => (
                <span
                  key={i}
                  className="rounded px-2 py-0.5 text-[11px] font-mono text-brand-600 dark:text-brand-400 bg-brand-500/10 border border-brand-500/20"
                >
                  ✓ {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: 8 Executable Demo Scenarios Grid */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-fintech-primary">8 Pre-Packaged Demo Scenarios</h2>
          <p className="text-xs text-fintech-secondary">
            Execute any scenario to trace its end-to-end diagnosis, policy check, and settlement workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {scenarios.map((sc) => {
            const Icon = getScenarioIcon(sc.icon_name);
            const isSelected = selectedScenarioId === sc.id;

            return (
              <div
                key={sc.id}
                className={`rounded-fintech-lg border p-4 transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-brand-500/50 bg-brand-500/5 shadow-fintech-md'
                    : 'border-fintech-border bg-fintech-surface hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-fintech-md bg-brand-500/10 text-brand-500 border border-brand-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="rounded bg-fintech-surface-subtle border border-fintech-border px-1.5 py-0.5 text-[9px] font-mono text-fintech-muted font-bold">
                      {sc.key_concept}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-fintech-primary leading-tight">{sc.title}</h3>
                  <p className="text-[11px] text-fintech-secondary leading-relaxed min-h-[44px]">
                    {sc.description}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={isSelected ? 'primary' : 'outline'}
                  icon={Play}
                  isLoading={executing && isSelected}
                  onClick={() => handleRunScenario(sc.id)}
                  className="w-full"
                >
                  {executing && isSelected ? 'Running...' : 'Run Scenario'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Execution Output Trace */}
      {executionResult && (
        <div
          id="execution-trace-panel"
          className="rounded-fintech-lg border border-brand-500/40 bg-fintech-surface p-5 shadow-fintech-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fintech-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-fintech-primary">
                  Executed: {executionResult.scenario_title}
                </h3>
                <span className="text-xs font-mono text-fintech-muted">
                  Account: {executionResult.customer_name} • Exposure: {executionResult.amount_formatted}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Status: {executionResult.final_status}
              </span>
              <span className="rounded bg-fintech-surface-subtle px-2 py-0.5 text-[10px] font-mono text-fintech-muted border border-fintech-border">
                {executionResult.audit_trace_id}
              </span>
            </div>
          </div>

          {/* 4 Sequential Workflow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-fintech-md bg-fintech-surface-subtle border border-fintech-border space-y-1">
              <span className="text-[10px] font-bold uppercase text-fintech-muted block">1. Diagnosis</span>
              <p className="text-fintech-primary font-medium">{executionResult.step_1_diagnosis}</p>
            </div>

            <div className="p-3.5 rounded-fintech-md bg-brand-500/5 border border-brand-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-brand-500 block">2. AI Proposal</span>
              <p className="text-fintech-primary font-medium">{executionResult.step_2_ai_recommendation}</p>
            </div>

            <div className="p-3.5 rounded-fintech-md bg-purple-500/5 border border-purple-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-500 block">3. Policy Gate</span>
              <p className="text-fintech-primary font-medium">{executionResult.step_3_policy_gate}</p>
            </div>

            <div className="p-3.5 rounded-fintech-md bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-500 block">4. Execution Outcome</span>
              <p className="text-fintech-primary font-medium">{executionResult.step_4_execution_result}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
