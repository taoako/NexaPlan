import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, CheckSquare, TrendingUp, GitBranch, BarChart3, AlertTriangle, FileCheck, X, CheckCircle2, Info, FileSignature } from 'lucide-react';
import { FinanceManagerTopNav } from './layout/FinanceManagerTopNav';
import { AllocationView } from './views/AllocationView';
import { ApprovalView } from './views/ApprovalView';
import { ForecastingView } from './views/ForecastingView';
import { ScenariosView } from './views/ScenariosView';
import { VarianceView } from './views/VarianceView';
import { financeManagerApi, pingMlService } from '../../../api/financeManagerApi';
import * as mainAdminApi from '../../../api/mainAdminApi';
import { ReconciliationView } from './views/ReconciliationView';
import { FeaturesContext, TierFeatures } from '../../../context/FeaturesContext';

import { StatementsView } from './views/StatementsView';

interface FinanceManagerSystemProps { 
  onLogout: () => void; 
}

export interface Scenario {
  id: number;
  name: string;
  desc: string;
  multiplier: number;
  isActive: boolean;
}

export type ModuleView = 'allocation' | 'approval' | 'reconciliation' | 'forecasting' | 'scenarios' | 'variance' | 'statements';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; }

export function FinanceManagerSystem({ onLogout }: FinanceManagerSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('allocation');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [features, setFeatures] = useState<TierFeatures | null>(null);

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const tenantId: number = storedUser.tenantId ?? 0;

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);

  // Wake up ML microservice on Render as early as possible
  useEffect(() => {
    pingMlService();
  }, []);

  useEffect(() => {
    fetchActiveScenario();
    fetchFeatures();
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

  const fetchFeatures = async () => {
    if (!tenantId) return;
    try {
      const data = await mainAdminApi.getSettings(tenantId);
      setFeatures(data.features);
    } catch (err) {
      console.error("Failed to load tier features", err);
    }
  };

  const navTabs = [
    { id: 'allocation' as ModuleView, label: 'Budget Allocation', icon: DollarSign },
    { id: 'approval' as ModuleView, label: 'Approvals', icon: CheckSquare },
    { id: 'reconciliation' as ModuleView, label: 'Reconciliation', icon: FileCheck },
    { id: 'forecasting' as ModuleView, label: 'AI Forecasting', icon: TrendingUp },
    { id: 'scenarios' as ModuleView, label: 'Scenarios', icon: GitBranch },
    { id: 'variance' as ModuleView, label: 'Variance Analysis', icon: BarChart3 },
    { id: 'statements' as ModuleView, label: 'Statements', icon: FileSignature },
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
        onLogout={onLogout}
      />

      {/* Main Content Area - Routing to Views */}
      <div className="flex-1 overflow-auto bg-[#F8FAFC]">
        <FeaturesContext.Provider value={features}>
          {activeModule === 'allocation' && <AllocationView />}
          {activeModule === 'approval' && <ApprovalView />}
          {activeModule === 'reconciliation' && <ReconciliationView addToast={addToast} />}
          {activeModule === 'forecasting' && <ForecastingView />}
          {activeModule === 'scenarios' && <ScenariosView />}
          {activeModule === 'variance' && <VarianceView activeScenario={activeScenario} />}
          {activeModule === 'statements' && <StatementsView />}
        </FeaturesContext.Provider>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 min-w-[320px] max-w-md ${
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {t.type === 'error' && <X className="w-5 h-5 text-red-500" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            <span className="text-[13px] font-bold flex-1">{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}