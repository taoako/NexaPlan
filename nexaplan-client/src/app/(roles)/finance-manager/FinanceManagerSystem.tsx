import React, { useState } from 'react';
import { DollarSign, CheckSquare, TrendingUp, GitBranch, BarChart3, AlertTriangle } from 'lucide-react';

// Import Layout
import { FinanceManagerTopNav } from './layout/FinanceManagerTopNav';

// Import Views
import { AllocationView } from './views/AllocationView';
import { ApprovalView } from './views/ApprovalView';
import { ForecastingView } from './views/ForecastingView';
import { ScenariosView } from './views/ScenariosView';
import { VarianceView } from './views/VarianceView';

interface FinanceManagerSystemProps { 
  onBack: () => void; 
}

export type ModuleView = 'allocation' | 'approval' | 'forecasting' | 'scenarios' | 'variance';

export interface Scenario {
  id: string;
  name: string;
  multiplier: number;
  isActive: boolean;
  color: string;
  desc: string;
}

export interface Proposal {
  id: string;
  title: string;
  department: string;
  amount: number;
  status: string;
  submittedBy: string;
  priority: 'Mission Critical' | 'High' | 'Low';
}

export function FinanceManagerSystem({ onBack }: FinanceManagerSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('allocation');

  // Shared Global State
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: 'base', name: 'Base Case', multiplier: 1.0, isActive: true, color: '#0052FF', desc: 'Standard operating budget with approved allocations and normal growth assumptions.' },
    { id: 'worst', name: 'Worst Case (-25%)', multiplier: 0.75, isActive: false, color: '#EF4444', desc: 'Economic downturn scenario with budget cuts and cost reduction measures.' },
    { id: 'growth', name: 'Growth Case (+40%)', multiplier: 1.40, isActive: false, color: '#10B981', desc: 'Aggressive expansion with increased hiring, marketing spend, and new initiatives.' }
  ]);

  const [proposals, setProposals] = useState<Proposal[]>([
    { id: '1', title: 'Q3 IT Infrastructure Upgrade', department: 'IT', amount: 145000, status: 'pending', submittedBy: 'Carlos Reyes', priority: 'Mission Critical' },
    { id: '2', title: 'Marketing Q2 Campaign', department: 'Marketing', amount: 85000, status: 'draft', submittedBy: 'Lena Aguilar', priority: 'Low' },
    { id: '3', title: 'HR Training Software', department: 'HR', amount: 12500, status: 'approved', submittedBy: 'Jose Mendoza', priority: 'High' },
  ]);

  const activeScenario = scenarios.find(s => s.isActive) || scenarios[0];

  const navTabs = [
    { id: 'allocation' as ModuleView, label: 'Budget Allocation', icon: DollarSign },
    { id: 'approval' as ModuleView, label: 'Approvals', icon: CheckSquare },
    { id: 'forecasting' as ModuleView, label: 'AI Forecasting', icon: TrendingUp },
    { id: 'scenarios' as ModuleView, label: 'Scenarios', icon: GitBranch },
    { id: 'variance' as ModuleView, label: 'Variance Analysis', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] flex flex-col relative">
      {/* Global Scenario Warning Banner */}
      {!activeScenario.isActive || activeScenario.id !== 'base' ? (
        <div className="bg-[#F59E0B] text-[#78350F] px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-[60] shrink-0 w-full relative">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ Operating under {activeScenario.name} scenario restrictions ({(activeScenario.multiplier * 100).toFixed(0)}% of base budget). Low-priority projects may be automatically frozen.
        </div>
      ) : null}

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
        
        {activeModule === 'approval' && (
          <ApprovalView proposals={proposals} setProposals={setProposals} />
        )}
        
        {activeModule === 'forecasting' && (
          <ForecastingView />
        )}
        
        {activeModule === 'scenarios' && (
          <ScenariosView 
            scenarios={scenarios} 
            setScenarios={setScenarios} 
            proposals={proposals} 
            setProposals={setProposals} 
          />
        )}
        
        {activeModule === 'variance' && (
          <VarianceView activeScenario={activeScenario} />
        )}
      </div>
    </div>
  );
}