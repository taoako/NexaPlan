import React, { useState, useEffect } from 'react';
import { DollarSign, CheckSquare, TrendingUp, GitBranch, BarChart3, AlertTriangle, FileCheck } from 'lucide-react';
import { FinanceManagerTopNav } from './layout/FinanceManagerTopNav';
import { AllocationView } from './views/AllocationView';
import { ApprovalView } from './views/ApprovalView';
import { ForecastingView } from './views/ForecastingView';
import { ScenariosView } from './views/ScenariosView';
import { VarianceView } from './views/VarianceView';
import { financeManagerApi } from '../../../api/financeManagerApi';
import { ReconciliationView } from './views/ReconciliationView';

interface FinanceManagerSystemProps { 
  onBack: () => void; 
}

export type ModuleView = 'allocation' | 'approval' | 'reconciliation' | 'forecasting' | 'scenarios' | 'variance';

export function FinanceManagerSystem({ onBack }: FinanceManagerSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('allocation');
  const [activeScenario, setActiveScenario] = useState<any>(null);

  useEffect(() => {
    fetchActiveScenario();
  }, [activeModule]);

  const fetchActiveScenario = async () => {
    try {
      const scenarios = await financeManagerApi.getScenarios();
      const active = scenarios.find((s: any) => s.isActive);
      setActiveScenario(active);
    } catch (err) {
      console.error(err);
    }
  };

  const navTabs = [
    { id: 'allocation' as ModuleView, label: 'Budget Allocation', icon: DollarSign },
    { id: 'approval' as ModuleView, label: 'Approvals', icon: CheckSquare },
    { id: 'reconciliation' as ModuleView, label: 'Reconciliation', icon: FileCheck },
    { id: 'forecasting' as ModuleView, label: 'AI Forecasting', icon: TrendingUp },
    { id: 'scenarios' as ModuleView, label: 'Scenarios', icon: GitBranch },
    { id: 'variance' as ModuleView, label: 'Variance Analysis', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] flex flex-col relative">
      {/* Global Scenario Warning Banner */}
      {activeScenario && activeScenario.multiplier !== 1.0 && (
        <div className="bg-[#F59E0B] text-[#78350F] px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-[60] shrink-0 w-full relative">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ Operating under {activeScenario.name} scenario restrictions ({(activeScenario.multiplier * 100).toFixed(0)}% of base budget). Low-priority projects may be automatically frozen.
        </div>
      )}

      {/* Extracted Top Navigation */}
      <FinanceManagerTopNav 
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        navTabs={navTabs}
        onBack={onBack}
      />

      {/* Main Content Area - Routing to Views */}
      <div className="flex-1 overflow-auto bg-[#F8FAFC]">
        {activeModule === 'allocation' && <AllocationView />}
        {activeModule === 'approval' && <ApprovalView />}
        {activeModule === 'reconciliation' && <ReconciliationView />}
        {activeModule === 'forecasting' && <ForecastingView />}
        {activeModule === 'scenarios' && <ScenariosView />}
        {activeModule === 'variance' && <VarianceView activeScenario={activeScenario} />}
      </div>
    </div>
  );
}