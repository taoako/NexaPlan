import React, { useState, useRef, useEffect } from 'react';
import logoImg from "../../../assets/brand/nexaplan-logo.png"; // Kept your original logo path
import {
  Search, Bell, LogOut, Plus, BarChart3, FileText, 
  Activity, User, Lock, ChevronDown, GitBranch
} from 'lucide-react';

// Import your new Views (We will create these next)
import { OverviewView } from './views/OverviewView';
import { ProposalsView } from './views/ProposalsView';
import { NewRequestView } from './views/NewRequestView';
import { VarianceView } from './views/VarianceView';
import { ScenariosView } from './views/ScenariosView';

interface DepartmentHeadSystemProps {
  onBack: () => void;
}

export type ModuleView = 'overview' | 'proposals' | 'new-request' | 'variance' | 'scenarios';
export type ProposalStatus = 'draft' | 'pending' | 'changes-requested' | 'approved' | 'rejected' | 'frozen';
export type PriorityLevel = 'Mission Critical' | 'High' | 'Low';

export interface Proposal {
  id: string;
  title: string;
  amount: number;
  status: ProposalStatus;
  submittedDate: string;
  category: string;
  priority: PriorityLevel;
}

export function DepartmentHeadSystem({ onBack }: DepartmentHeadSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Shared State
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: '1',
      title: 'Q3 IT Infrastructure Upgrade',
      amount: 145000,
      status: 'pending',
      submittedDate: 'Mar 18, 2026',
      category: 'Equipment',
      priority: 'Mission Critical'
    },
    // ... add the rest of your initial proposals here
  ]);

  const [activeScenarioMultiplier, setActiveScenarioMultiplier] = useState<number>(1.0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter'] relative flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-40 border-b border-white/10 shrink-0">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Department Head</div>
          </div>
        </div>

        {/* Center: Module Navigation */}
        <div className="flex gap-1">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'proposals', icon: FileText, label: 'My Proposals' },
            { id: 'new-request', icon: Plus, label: 'New Request' },
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

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Include your Search and Bell icons here as they were in Source 1 */}
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">
                CR
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">Carlos Reyes</div>
                <div className="text-xs text-slate-400 mt-0.5">IT Department Head</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Carlos Reyes</div>
                  <div className="text-xs text-slate-500">carlos@nexaplan.ph</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />Profile Settings
                  </button>
                  <button
                    onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />Security
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={() => { setShowProfileDropdown(false); onBack(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area - Routing to Views */}
      <div className="p-8">
        {activeModule === 'overview' && <OverviewView />}
        
        {activeModule === 'proposals' && (
          <ProposalsView 
            proposals={proposals} 
            setActiveModule={setActiveModule} 
          />
        )}
        
        {activeModule === 'new-request' && (
          <NewRequestView 
            proposals={proposals} 
            setProposals={setProposals} 
            setActiveModule={setActiveModule} 
          />
        )}
        
        {activeModule === 'variance' && (
  <VarianceView 
    proposals={proposals} 
  />
)}
        
        {activeModule === 'scenarios' && (
          <ScenariosView 
            setActiveScenarioMultiplier={setActiveScenarioMultiplier} 
          />
        )}
      </div>
    </div>
  );
}