import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { CommandSearchModal } from './components/ui/CommandSearchModal';
import { DashboardPage } from './pages/DashboardPage';
import { RecoveryControlCenterPage } from './pages/RecoveryControlCenterPage';
import { PredictiveRiskPage } from './pages/PredictiveRiskPage';
import { RecoveryIntelligencePage } from './pages/RecoveryIntelligencePage';
import { RevenueLeakagePage } from './pages/RevenueLeakagePage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { RisksPage } from './pages/RisksPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { CustomersPage } from './pages/CustomersPage';
import { StrategySimulatorPage } from './pages/StrategySimulatorPage';
import { PolicyPlaygroundPage } from './pages/PolicyPlaygroundPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { AutonomyControlPage } from './pages/AutonomyControlPage';
import { ApprovalQueuePage } from './pages/ApprovalQueuePage';
import { DecisionReplayPage } from './pages/DecisionReplayPage';
import { RecommendationsFeedPage } from './pages/RecommendationsFeedPage';
import { MerchantIntelligencePage } from './pages/MerchantIntelligencePage';
import { LeaderboardsAndReportsPage } from './pages/LeaderboardsAndReportsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { DemoLabPage } from './pages/DemoLabPage';
import { PolicyOptimizerPage } from './pages/PolicyOptimizerPage';
import { SpecializedUseCasesPage } from './pages/SpecializedUseCasesPage';
import { GlobalPaymentIntelligencePage } from './pages/GlobalPaymentIntelligencePage';
import { BatchRunnerModal } from './components/workflow/BatchRunnerModal';
import { OperatorCopilotDrawer } from './components/copilot/OperatorCopilotDrawer';
import { seedDemoDatabase } from './api/simulation';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeWorkflowRiskId, setActiveWorkflowRiskId] = useState<string | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  // Global ⌘K / Ctrl+K and ⌘B / Ctrl+B keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigateToRisk = (riskId: string) => {
    setActiveWorkflowRiskId(riskId);
    setCurrentTab('workflow');
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoDatabase(true);
      setSeedSuccessMessage(
        `Seeded ${res.seeded_customers} failure personas across multiple merchants and gateways!`
      );
      setTimeout(() => setSeedSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Seeding failed', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-fintech-bg text-fintech-primary antialiased font-sans transition-colors">
      {/* Collapsible Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 min-w-0 overflow-x-hidden ${
          isSidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <Navbar
          currentTab={currentTab}
          onOpenBatchRunner={() => setIsBatchModalOpen(true)}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Feedback Notification Banner */}
        {seedSuccessMessage && (
          <div className="fixed top-20 right-8 z-50 rounded-fintech-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/90 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-fintech-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            ✓ {seedSuccessMessage}
          </div>
        )}

        {/* Constrained Responsive Workspace */}
        <main className="flex-1 w-full max-w-[1600px] p-4 sm:p-5 md:p-6 space-y-5 min-w-0">
          {currentTab === 'control-center' && (
            <RecoveryControlCenterPage onNavigateToWorkflow={handleNavigateToRisk} />
          )}
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigateToRisk={handleNavigateToRisk}
              onNavigateToWorkflow={handleNavigateToRisk}
              onNavigateToRecommendations={() => setCurrentTab('recommendations')}
              onNavigateToTab={(t) => setCurrentTab(t as NavTab)}
            />
          )}
          {currentTab === 'predictive' && <PredictiveRiskPage />}
          {currentTab === 'recommendations' && (
            <RecommendationsFeedPage onNavigateToTab={(t) => setCurrentTab(t as NavTab)} />
          )}
          {currentTab === 'merchant-intelligence' && <MerchantIntelligencePage />}
          {currentTab === 'reports-leaderboard' && <LeaderboardsAndReportsPage />}
          {currentTab === 'intelligence' && <RecoveryIntelligencePage />}
          {currentTab === 'leakage' && <RevenueLeakagePage />}
          {currentTab === 'experiments' && <ExperimentsPage />}
          {currentTab === 'risks' && <RisksPage onSelectRisk={handleNavigateToRisk} />}
          {currentTab === 'incidents' && <IncidentsPage />}
          {currentTab === 'workflow' && (
            <WorkflowPage
              riskId={activeWorkflowRiskId}
              onBack={() => setCurrentTab('risks')}
              onNavigateToTab={(t) => setCurrentTab(t as NavTab)}
            />
          )}
          {currentTab === 'approval-queue' && <ApprovalQueuePage />}
          {currentTab === 'customers' && <CustomersPage />}
          {currentTab === 'simulator' && <StrategySimulatorPage />}
          {currentTab === 'policy-optimizer' && <PolicyOptimizerPage />}
          {currentTab === 'playground' && <PolicyPlaygroundPage />}
          {currentTab === 'decision-replay' && <DecisionReplayPage />}
          {currentTab === 'autonomy' && <AutonomyControlPage />}
          {currentTab === 'system-health' && <SystemHealthPage />}
          {currentTab === 'audit' && <AuditTrailPage />}
          {currentTab === 'demo-lab' && (
            <DemoLabPage onNavigateToTab={(t) => setCurrentTab(t as NavTab)} />
          )}
          {currentTab === 'specialized-use-cases' && <SpecializedUseCasesPage />}
          {currentTab === 'global-intelligence' && (
            <GlobalPaymentIntelligencePage onSelectTab={(t) => setCurrentTab(t as NavTab)} />
          )}
        </main>
      </div>

      {/* Global ⌘K Command Palette Search Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTab={setCurrentTab}
        onNavigateToRisk={handleNavigateToRisk}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Batch Runner Modal */}
      {isBatchModalOpen && (
        <BatchRunnerModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          onComplete={() => {}}
        />
      )}

      {/* Operator Copilot Drawer */}
      <OperatorCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
