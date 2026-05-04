import React, { useState, useRef, useEffect } from 'react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";
import { Search, Bell, LogOut, Plus, BarChart3, FileText, Activity, User, Lock, ChevronDown, GitBranch, AlertTriangle, Receipt } from 'lucide-react';

import { OverviewView } from './views/OverviewView';
import { ProposalsView } from './views/ProposalsView';
import { NewRequestView } from './views/NewRequestView';
import { VarianceView } from './views/VarianceView';
import { ScenariosView } from './views/ScenariosView';
import { ExpensesView } from './views/ExpensesView';
import { deptHeadApi } from '../../../api/deptHeadApi';

interface DepartmentHeadSystemProps {
  onBack: () => void;
}

export type ModuleView = 'overview' | 'proposals' | 'new-request' | 'variance' | 'scenarios' | 'expenses';

export function DepartmentHeadSystem({ onBack }: DepartmentHeadSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchActiveScenario = async () => {
      try {
        const res = await deptHeadApi.getScenarios();
        const active = res.find((s: any) => s.isActive);
        setActiveScenario(active);
      } catch (err) {
        console.error("Failed to load active scenario", err);
      }
    };
    fetchActiveScenario();
  }, [activeModule]); // Refresh when changing modules

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] relative flex flex-col">
      {/* Global Warning Banner if scenario is not Base Case */}
      {activeScenario && activeScenario.multiplier < 1.0 && (
        <div className="bg-[#F59E0B] text-[#78350F] px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-[60] shrink-0 w-full relative">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ Operating under {activeScenario.name} scenario restrictions ({(activeScenario.multiplier * 100).toFixed(0)}% of base budget). Low-priority projects may be automatically frozen.
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-40 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Department Head</div>
          </div>
        </div>

        <div className="flex gap-1">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'proposals', icon: FileText, label: 'My Proposals' },
            { id: 'new-request', icon: Plus, label: 'New Request' },
            { id: 'expenses', icon: Receipt, label: 'Log Expenses' },
            { id: 'variance', icon: BarChart3, label: 'Variance' },
            { id: 'scenarios', icon: GitBranch, label: 'Scenarios' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as ModuleView)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                activeModule === tab.id ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm uppercase">
                {user.name ? user.name.substring(0, 2) : 'DH'}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">{user.name || 'Dept Head'}</div>
                <div className="text-xs text-slate-400 mt-0.5">Department Head</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">{user.name || 'Dept Head'}</div>
                  <div className="text-xs text-slate-500">{user.email || 'depthead@nexaplan.ph'}</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowProfileDropdown(false); onBack(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-8">
        {activeModule === 'overview' && <OverviewView />}
        {activeModule === 'proposals' && <ProposalsView setActiveModule={setActiveModule} />}
        {activeModule === 'new-request' && <NewRequestView setActiveModule={setActiveModule} />}
        {activeModule === 'expenses' && <ExpensesView />}
        {activeModule === 'variance' && <VarianceView />}
        {activeModule === 'scenarios' && <ScenariosView />}
      </div>
    </div>
  );
}