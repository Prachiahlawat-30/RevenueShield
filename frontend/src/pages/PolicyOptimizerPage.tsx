import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import {
  PolicyPerformanceOverview,
  PolicyProposalResponse,
  PolicySimulationResponse,
  PolicyHistoryItem,
} from '../types';
import {
  getPolicyOverview,
  getPolicyProposals,
  simulatePolicyProposal,
  approvePolicyProposal,
  rejectPolicyProposal,
  rollbackPolicy,
  getPolicyHistory,
} from '../api/policy_optimizer';
import { PolicyPerformanceCard } from '../components/policy-optimizer/PolicyPerformanceCard';
import { PolicyProposalCard } from '../components/policy-optimizer/PolicyProposalCard';
import { PolicySimulationPanel } from '../components/policy-optimizer/PolicySimulationPanel';
import { PolicyApprovalModal } from '../components/policy-optimizer/PolicyApprovalModal';
import { PolicyRejectionModal } from '../components/policy-optimizer/PolicyRejectionModal';
import { PolicyHistoryTimeline } from '../components/policy-optimizer/PolicyHistoryTimeline';
import { Button } from '../components/ui/Button';

export const PolicyOptimizerPage: React.FC = () => {
  const [overview, setOverview] = useState<PolicyPerformanceOverview | null>(null);
  const [proposals, setProposals] = useState<PolicyProposalResponse[]>([]);
  const [history, setHistory] = useState<PolicyHistoryItem[]>([]);
  const [simulationData, setSimulationData] = useState<PolicySimulationResponse | null>(null);

  const [selectedApproveProp, setSelectedApproveProp] = useState<PolicyProposalResponse | null>(null);
  const [selectedRejectProp, setSelectedRejectProp] = useState<PolicyProposalResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [ov, props, hist] = await Promise.all([
        getPolicyOverview(),
        getPolicyProposals(),
        getPolicyHistory(),
      ]);
      setOverview(ov);
      setProposals(props);
      setHistory(hist);

      // Auto-simulate top proposal if available
      if (props.length > 0) {
        try {
          const sim = await simulatePolicyProposal(props[0].proposal_id);
          setSimulationData(sim);
        } catch (err) {
          console.error('Initial auto-simulation error', err);
        }
      }
    } catch (err) {
      console.error('Failed to load Policy Optimizer data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSimulate = async (proposalId: string) => {
    try {
      setSimulatingId(proposalId);
      const sim = await simulatePolicyProposal(proposalId);
      setSimulationData(sim);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleApproveConfirm = async (proposalId: string, operatorName: string, reason: string) => {
    try {
      setActionLoading(true);
      await approvePolicyProposal(proposalId, { operator_name: operatorName, reason });
      setSelectedApproveProp(null);
      await loadAllData();
    } catch (err: any) {
      alert(`Approval error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (proposalId: string, operatorName: string, reason: string, notes?: string) => {
    try {
      setActionLoading(true);
      await rejectPolicyProposal(proposalId, { operator_name: operatorName, reason, notes });
      setSelectedRejectProp(null);
      await loadAllData();
    } catch (err: any) {
      alert(`Rejection error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRollback = async (targetVersion?: number) => {
    try {
      setActionLoading(true);
      await rollbackPolicy({
        operator_name: 'Human Operator (Emergency Lead)',
        reason: 'Restored baseline policy parameters.',
        target_version: targetVersion,
      });
      await loadAllData();
    } catch (err: any) {
      alert(`Rollback error: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="rounded-fintech-lg border border-fintech-border bg-fintech-surface p-12 text-center text-fintech-muted text-xs animate-pulse">
        Analyzing historical recovery telemetry and evaluating policy opportunities...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fintech-fade">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Autonomous Intelligence • Human Governance</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-fintech-primary sm:text-3xl">
            Self-Learning Policy Optimizer
          </h1>
          <p className="mt-1 text-xs text-fintech-secondary max-w-3xl leading-relaxed">
            RevenueShield continuously evaluates recovery telemetry to discover high-yield policy improvements and submits candidate recommendations for human review before updating production bounds.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          isLoading={loading}
          onClick={loadAllData}
        >
          Refresh Analysis
        </Button>
      </div>

      {/* 1. Policy Performance Card */}
      <PolicyPerformanceCard overview={overview} />

      {/* 2. Candidate Policy Proposals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <h3 className="text-base font-bold text-fintech-primary">Candidate Policy Improvement Proposals</h3>
          </div>
          <span className="text-xs font-mono text-fintech-muted">
            {proposals.filter((p) => p.status === 'PENDING_REVIEW').length} Pending Human Review
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proposals.map((prop) => (
            <PolicyProposalCard
              key={prop.proposal_id}
              proposal={prop}
              onSimulate={handleSimulate}
              onApprove={(p) => setSelectedApproveProp(p)}
              onReject={(p) => setSelectedRejectProp(p)}
              isSimulating={simulatingId === prop.proposal_id}
            />
          ))}
        </div>
      </div>

      {/* 3. Counterfactual Simulation Panel */}
      {simulationData && (
        <div className="space-y-3">
          <PolicySimulationPanel simulation={simulationData} />
        </div>
      )}

      {/* 4. Immutable Policy Version History */}
      <PolicyHistoryTimeline
        history={history}
        onRollback={handleRollback}
        isLoading={actionLoading}
      />

      {/* Approval Modal */}
      {selectedApproveProp && (
        <PolicyApprovalModal
          proposal={selectedApproveProp}
          onClose={() => setSelectedApproveProp(null)}
          onConfirm={handleApproveConfirm}
          isLoading={actionLoading}
        />
      )}

      {/* Rejection Modal */}
      {selectedRejectProp && (
        <PolicyRejectionModal
          proposal={selectedRejectProp}
          onClose={() => setSelectedRejectProp(null)}
          onConfirm={handleRejectConfirm}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
