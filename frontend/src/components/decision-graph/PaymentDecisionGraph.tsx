import React, { useState, useEffect } from 'react';
import {
  Network,
  Download,
  RefreshCw,
  Info,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { PaymentDecisionGraphResponse, DecisionGraphNode as NodeType } from '../../types';
import { getPaymentDecisionGraph } from '../../api/recovery';
import { DecisionGraphNode } from './DecisionGraphNode';
import { DecisionGraphEdge } from './DecisionGraphEdge';
import { PolicyDecisionPanel } from './PolicyDecisionPanel';
import { DecisionFactorPanel } from './DecisionFactorPanel';
import { DecisionTimeline } from './DecisionTimeline';
import { JsonDrawer } from '../common/JsonDrawer';
import { Button } from '../ui/Button';

interface Props {
  riskId: string;
  onRefresh?: () => void;
}

export const PaymentDecisionGraph: React.FC<Props> = ({ riskId, onRefresh }) => {
  const [graphData, setGraphData] = useState<PaymentDecisionGraphResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'governance' | 'financial' | 'risk'>('all');
  const [jsonDrawerOpen, setJsonDrawerOpen] = useState<boolean>(false);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentDecisionGraph(riskId);
      setGraphData(data);
      // default select the policy engine node for quick insight
      const polNode = data.nodes.find((n) => n.type === 'policy_engine');
      if (polNode) setSelectedNode(polNode);
    } catch (err: any) {
      console.error('Failed to load decision graph:', err);
      setError(err?.response?.data?.detail || 'Failed to construct Payment Decision Graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (riskId) {
      fetchGraph();
    }
  }, [riskId]);

  if (loading) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center shadow-fintech-sm">
        <div className="inline-flex p-3 rounded-fintech-md bg-brand-500/10 border border-brand-500/20 text-brand-500 mb-3 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-fintech-primary mb-1">Synthesizing 15-Node Decision Graph</h3>
        <p className="text-xs text-fintech-secondary max-w-md mx-auto">
          Querying causal chains across customer telemetry, gateway health, probability engines, and deterministic policy invariants...
        </p>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="rounded-fintech-lg border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <div className="inline-flex p-3 rounded-fintech-md bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-3">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-fintech-primary mb-1">Decision Graph Unavailable</h3>
        <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md mx-auto mb-4">{error || 'Unknown error occurred.'}</p>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchGraph}>
          Retry
        </Button>
      </div>
    );
  }

  // Filter nodes according to selected mode
  const filteredNodes = graphData.nodes.filter((node) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'governance') {
      return ['ai_proposal', 'policy_engine', 'final_decision', 'execution', 'outcome'].includes(node.type);
    }
    if (filterMode === 'financial') {
      return ['transaction', 'expected_recovery', 'recovery_cost', 'ai_proposal', 'outcome'].includes(node.type);
    }
    if (filterMode === 'risk') {
      return ['customer', 'failure', 'customer_risk', 'gateway_health', 'recovery_probability', 'retry_timing'].includes(node.type);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Flagship Header */}
      <div className="rounded-fintech-lg border border-brand-500/20 bg-fintech-surface p-5 shadow-fintech-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-fintech-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-fintech-sm bg-brand-500/10 text-brand-500 border border-brand-500/20">
                <Network className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-fintech-primary">Payment Decision Graph</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                Flagship Explainer
              </span>
            </div>
            <p className="text-xs text-fintech-secondary font-medium leading-relaxed max-w-3xl">
              {graphData.differentiator_slogan}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={() => setJsonDrawerOpen(true)}
            >
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={RefreshCw}
              onClick={() => {
                fetchGraph();
                if (onRefresh) onRefresh();
              }}
            >
              Recompute
            </Button>
          </div>
        </div>

        {/* Metadata & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-fintech-muted">
          <div className="flex items-center gap-3 font-mono text-[11px] flex-wrap">
            <span>
              Decision ID: <strong className="text-fintech-primary">{graphData.decision_id}</strong>
            </span>
            <span>•</span>
            <span>
              Version: <strong className="text-fintech-primary">{graphData.decision_version}</strong>
            </span>
            <span>•</span>
            <span>
              Policy: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{graphData.policy_version}</strong>
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-fintech-surface-subtle p-1 rounded-fintech-md border border-fintech-border self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-fintech-sm text-[11px] font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-secondary hover:text-fintech-primary'
              }`}
            >
              All 15 Nodes
            </button>
            <button
              onClick={() => setFilterMode('governance')}
              className={`px-2.5 py-1 rounded-fintech-sm text-[11px] font-semibold transition-colors ${
                filterMode === 'governance'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-secondary hover:text-fintech-primary'
              }`}
            >
              AI vs Policy
            </button>
            <button
              onClick={() => setFilterMode('financial')}
              className={`px-2.5 py-1 rounded-fintech-sm text-[11px] font-semibold transition-colors ${
                filterMode === 'financial'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-secondary hover:text-fintech-primary'
              }`}
            >
              Economic Yield
            </button>
            <button
              onClick={() => setFilterMode('risk')}
              className={`px-2.5 py-1 rounded-fintech-sm text-[11px] font-semibold transition-colors ${
                filterMode === 'risk'
                  ? 'bg-brand-500 text-white shadow-fintech-sm'
                  : 'text-fintech-secondary hover:text-fintech-primary'
              }`}
            >
              Risk & Health
            </button>
          </div>
        </div>
      </div>

      {/* TOP FLAGSHIP SECTION: Full-Width AI vs Policy Governance Panel */}
      <PolicyDecisionPanel policyNode={graphData.nodes.find((n) => n.type === 'policy_engine')} />

      {/* Main Grid: 15-Node Interactive Visual Matrix + Inspection Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): 15-Node Visual Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Phase 1: Ingestion & Telemetry (Nodes 1 - 4) */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-3 shadow-fintech-sm">
            <div className="flex items-center justify-between border-b border-fintech-border pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-fintech-muted">
                Phase 1: Ingestion & Telemetry
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">● Ingestion Active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {filteredNodes
                .filter((n) => ['customer', 'transaction', 'payment_method', 'failure'].includes(n.type))
                .map((n) => (
                  <DecisionGraphNode
                    key={n.id}
                    node={n}
                    isSelected={selectedNode?.id === n.id}
                    onClick={() => setSelectedNode(n)}
                  />
                ))}
            </div>
          </div>

          {/* Phase 2: Predictive & Risk Intelligence (Nodes 5 - 10) */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-3 shadow-fintech-sm">
            <div className="flex items-center justify-between border-b border-fintech-border pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Phase 2: Predictive & Health Intelligence
              </span>
              <span className="text-[10px] text-brand-500 font-mono font-bold">● Multi-Engine Inference</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredNodes
                .filter((n) =>
                  [
                    'customer_risk',
                    'gateway_health',
                    'recovery_probability',
                    'retry_timing',
                    'expected_recovery',
                    'recovery_cost',
                  ].includes(n.type)
                )
                .map((n) => (
                  <DecisionGraphNode
                    key={n.id}
                    node={n}
                    isSelected={selectedNode?.id === n.id}
                    onClick={() => setSelectedNode(n)}
                  />
                ))}
            </div>
          </div>

          {/* Phase 3: AI Proposal vs Deterministic Policy Governance (Nodes 11 - 13) */}
          <div className="rounded-fintech-lg border border-brand-500/30 bg-fintech-surface p-4 space-y-3 shadow-fintech-sm">
            <div className="flex items-center justify-between border-b border-fintech-border pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Phase 3: AI Proposal vs Policy Guardrails
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                ● 100% Policy Bound
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {filteredNodes
                .filter((n) => ['ai_proposal', 'policy_engine', 'final_decision'].includes(n.type))
                .map((n) => (
                  <DecisionGraphNode
                    key={n.id}
                    node={n}
                    isSelected={selectedNode?.id === n.id}
                    onClick={() => setSelectedNode(n)}
                  />
                ))}
            </div>
          </div>

          {/* Phase 4: Execution & Settlement (Nodes 14 - 15) */}
          <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-4 space-y-3 shadow-fintech-sm">
            <div className="flex items-center justify-between border-b border-fintech-border pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Phase 4: Execution & Outcome Settlement
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">● ISO 8583 Complete</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredNodes
                .filter((n) => ['execution', 'outcome'].includes(n.type))
                .map((n) => (
                  <DecisionGraphNode
                    key={n.id}
                    node={n}
                    isSelected={selectedNode?.id === n.id}
                    onClick={() => setSelectedNode(n)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Node Factor Inspector & Timeline */}
        <div className="lg:col-span-4 space-y-4">
          {/* Node Factor Inspector */}
          {selectedNode ? (
            <DecisionFactorPanel node={selectedNode} />
          ) : (
            <div className="rounded-fintech-lg border border-dashed border-fintech-border bg-fintech-surface p-6 text-center text-xs text-fintech-muted">
              Select any node from the causal graph on the left to inspect its telemetry and reasoning.
            </div>
          )}

          {/* Chronological Causal Timeline */}
          <DecisionTimeline timeline={graphData.timeline} />
        </div>
      </div>

      {/* JSON Payload Drawer */}
      <JsonDrawer
        isOpen={jsonDrawerOpen}
        onClose={() => setJsonDrawerOpen(false)}
        title={`Payment Decision Graph Export (${graphData.decision_id})`}
        data={graphData}
      />
    </div>
  );
};
