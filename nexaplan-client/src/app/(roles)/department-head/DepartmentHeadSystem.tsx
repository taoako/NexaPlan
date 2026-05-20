import React, { useState, useRef, useEffect, useCallback } from 'react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";
import { Search, Bell, LogOut, Plus, BarChart3, FileText, Activity, User, Lock, ChevronDown, GitBranch, AlertTriangle, Receipt, X, CheckCircle2, Info } from 'lucide-react';

import { OverviewView } from './views/OverviewView';
import { ProposalsView } from './views/ProposalsView';
import { NewRequestView } from './views/NewRequestView';
import { VarianceView } from './views/VarianceView';
import { ScenariosView } from './views/ScenariosView';
import { ExpensesView } from './views/ExpensesView';
import { deptHeadApi } from '../../../api/deptHeadApi';
import * as mainAdminApi from '../../../api/mainAdminApi';
import { FeaturesContext, TierFeatures } from '../../../context/FeaturesContext';
import { UserProfileView } from '../../../components/shared/UserProfileView';
import { UserSecurityView } from '../../../components/shared/UserSecurityView';

interface DepartmentHeadSystemProps {
  onLogout: () => void;
}

export type ModuleView = 'overview' | 'proposals' | 'new-request' | 'variance' | 'scenarios' | 'expenses';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; }

export function DepartmentHeadSystem({ onLogout }: DepartmentHeadSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [editingProposalId, setEditingProposalId] = useState<number | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [subView, setSubView] = useState<'profile' | 'security' | null>(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const handleProfileUpdate = () => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    } catch (e) {
      console.error(e);
    }
  };

  const tenantId: number = user.tenantId ?? 0;
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : (user.name ?? 'Dept Head');
  const userInitials = user.firstName && user.lastName
    ? (user.firstName[0] + user.lastName[0]).toUpperCase()
    : userName.substring(0, 2).toUpperCase();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [features, setFeatures] = useState<TierFeatures | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [activeScenario, setActiveScenario] = useState<any>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);

  // ── MFA Required Warning ──
  useEffect(() => {
    if (user.requireMfa && !user.mfaEnabled) {
      addToast('MFA Setup is required for your account. Please configure it under Security in the profile dropdown.', 'info');
    }
  }, [user.requireMfa, user.mfaEnabled, addToast]);

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
        if (active) {
          // Normalize both old (multiplier/scenarioName/name) and new (adjustmentMultiplier/title) shapes
          setActiveScenario({
            title: active.title ?? active.scenarioName ?? active.name ?? 'Active Scenario',
            adjustmentMultiplier:
              typeof active.adjustmentMultiplier === 'number'
                ? active.adjustmentMultiplier
                : typeof active.multiplier === 'number'
                  ? active.multiplier
                  : 1.0,
          });
        } else {
          setActiveScenario(null);
        }
      } catch (err) {
        console.error('Failed to load active scenario', err);
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

    fetchActiveScenario();
    fetchFeatures();
  }, [activeModule]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] relative flex flex-col">
      {/* Global Warning Banner if scenario is not Base Case */}
      {activeScenario && activeScenario.adjustmentMultiplier < 1.0 && (
        <div className="bg-[#F59E0B] text-[#78350F] px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-[60] shrink-0 w-full relative">
          <AlertTriangle className="w-4 h-4" />
          ⚠️ Operating under &ldquo;{activeScenario.title}&rdquo; scenario restrictions ({Math.round((1 - activeScenario.adjustmentMultiplier) * 100)}% budget reduction). Low-priority projects may be automatically frozen.
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
              onClick={() => { setActiveModule(tab.id as ModuleView); setSubView(null); }}
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
                {userInitials}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">{userName}</div>
                <div className="text-xs text-slate-400 mt-0.5">Department Head</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

             {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">{userName}</div>
                  <div className="text-xs text-slate-500">{user.email || 'depthead@nexaplan.ph'}</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowProfileDropdown(false); setSubView('profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-semibold">
                    <User className="w-4 h-4 text-slate-400" />Profile Settings
                  </button>
                  <button onClick={() => { setShowProfileDropdown(false); setSubView('security'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors font-semibold">
                    <Lock className="w-4 h-4 text-slate-400" />Security
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button onClick={() => { setShowProfileDropdown(false); onLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-8 flex-1">
        <FeaturesContext.Provider value={features}>
          {activeModule === 'overview' && <OverviewView onNavigateToScenarios={() => setActiveModule('scenarios')} />}
          {activeModule === 'proposals' && (
            <ProposalsView 
              setActiveModule={setActiveModule} 
              addToast={addToast} 
              onEdit={(id) => { setEditingProposalId(id); setActiveModule('new-request'); }}
            />
          )}
          {activeModule === 'new-request' && (
            <NewRequestView 
              setActiveModule={setActiveModule} 
              addToast={addToast} 
              editingProposalId={editingProposalId}
              onClearEdit={() => setEditingProposalId(null)}
            />
          )}
          {activeModule === 'expenses' && <ExpensesView addToast={addToast} />}
          {activeModule === 'variance' && <VarianceView />}
          {activeModule === 'scenarios' && <ScenariosView />}
        </FeaturesContext.Provider>
      </div>

      {/* ─── Profile & Security Modals ─── */}
      {subView === 'profile' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#F8FAFC] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative border border-slate-200">
            <button 
              onClick={() => setSubView(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <UserProfileView onBack={() => setSubView(null)} addToast={addToast} onProfileUpdate={handleProfileUpdate} />
          </div>
        </div>
      )}

      {subView === 'security' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#F8FAFC] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative border border-slate-200">
            <button 
              onClick={() => setSubView(null)} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <UserSecurityView onBack={() => setSubView(null)} addToast={addToast} />
          </div>
        </div>
      )}


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