import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  Lock, Shield, Download, Bell, Search, Filter, ChevronDown, CheckCircle2,
  XCircle, AlertTriangle, FileText, Eye, Calendar, Users, User, ChevronRight,
  MapPin, ExternalLink, LayoutDashboard, ScrollText, FolderOpen, ListChecks, LogOut,
  X
} from 'lucide-react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";
import { OverviewView } from './views/OverviewView';
import { AuditTrailsView } from './views/AuditTrailsView';
import { ComplianceScansView } from './views/ComplianceScansView';
import { FinancialStatementsView } from './views/FinancialStatementsView';

export type ModuleView = 'overview' | 'audit-trails' | 'compliance-scans' | 'financial-statements';

// Simple context for UI Modals to replace alert/confirm
interface ModalContextType {
  showAlert: (title: string, message: string, type?: 'info' | 'success' | 'error') => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const ModalContext = createContext<ModalContextType>({
  showAlert: () => {},
  showConfirm: () => {},
});

export const useAuditorModal = () => useContext(ModalContext);

interface ComplianceAuditSystemProps {
  onLogout?: () => void;
}

export function ComplianceAuditSystem({ onLogout }: ComplianceAuditSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [dateRange, setDateRange] = useState('Q1 2026 - Q4 2026');
  const [targetDept, setTargetDept] = useState('All Departments');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const auditorName = user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name) : 'Auditor';
  const auditorInitials = user && user.firstName && user.lastName
    ? (user.firstName[0] + user.lastName[0]).toUpperCase()
    : auditorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  // Modal State
  const [alertState, setAlertState] = useState<{show: boolean, title: string, message: string, type: 'info' | 'success' | 'error'}>({ show: false, title: '', message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState<{show: boolean, title: string, message: string, onConfirm: (() => void) | null}>({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateReport = () => {
    setAlertState({
      show: true,
      title: 'Generating Report',
      message: 'Generating comprehensive audit report...\nThis will include:\n- Full audit trail logs\n- Policy compliance summary\n- Financial statements\n- Violation details\n\nExport format: PDF',
      type: 'info'
    });
  };

  const handleDeepLinkToLog = (logId: number) => {
    setActiveModule('audit-trails');
  };

  const modalContextValue = {
    showAlert: (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
      setAlertState({ show: true, title, message, type });
    },
    showConfirm: (title: string, message: string, onConfirm: () => void) => {
      setConfirmState({ show: true, title, message, onConfirm });
    }
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <div className="min-h-screen bg-[#F1F5F9] font-['Inter'] flex flex-col">
        {/* Top Navigation */}
        <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
            <div>
              <div className="font-black text-xl leading-none text-white">NexaPlan</div>
              <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1 rounded-full border border-slate-600 ml-2">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Read Only</span>
            </div>
          </div>

          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'audit-trails', label: 'Audit Trails', icon: ScrollText },
              { id: 'financial-statements', label: 'Financial Statements', icon: FolderOpen },
              { id: 'compliance-scans', label: 'Compliance Scans', icon: ListChecks },
            ].map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id as ModuleView)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    activeModule === module.id
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {module.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              <Download className="w-4 h-4" />
              Generate Report
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
            
            <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">
                  {auditorInitials}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-white leading-none">{auditorName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="text-sm font-bold text-slate-900">{auditorName}</div>
                    <div className="text-xs text-slate-500">{user.email || 'auditor@nexaplan.ph'}</div>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { setShowProfileDropdown(false); modalContextValue.showAlert('Notice', 'Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="w-4 h-4 text-slate-400" /> Profile Settings
                    </button>
                    <button onClick={() => { setShowProfileDropdown(false); modalContextValue.showAlert('Notice', 'Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Lock className="w-4 h-4 text-slate-400" /> Security
                    </button>
                  </div>
                  <div className="py-1 border-t border-slate-100">
                    <button onClick={() => { setShowProfileDropdown(false); onLogout?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Sub-Header Context Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-20 z-40 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-600 font-semibold">Showing:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option>Q1 2026 - Q4 2026</option>
                <option>Q1 2026 - Q2 2026</option>
                <option>FY 2025</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <select
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option>All Departments</option>
                <option>IT Department</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>HR</option>
                <option>Operations</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#10B981]/10 px-4 py-2 rounded-lg border border-[#10B981]/20">
            <Lock className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm font-bold text-slate-900">All data points cryptographically verified</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-[#F1F5F9]">
          {activeModule === 'overview' && <OverviewView />}
          {activeModule === 'audit-trails' && <AuditTrailsView />}
          {activeModule === 'compliance-scans' && <ComplianceScansView onDeepLink={handleDeepLinkToLog} />}
          {activeModule === 'financial-statements' && <FinancialStatementsView />}
        </div>

        {/* UI Modals */}
        {alertState.show && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className={`mb-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                alertState.type === 'error' ? 'bg-red-100 text-red-500' :
                alertState.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'
              }`}>
                {alertState.type === 'error' ? <XCircle className="w-6 h-6" /> : 
                 alertState.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : 
                 <AlertTriangle className="w-6 h-6" />}
              </div>
              <h3 className="font-black text-lg text-slate-900 text-center mb-2">{alertState.title}</h3>
              <p className="text-sm text-slate-600 text-center mb-6 whitespace-pre-wrap">{alertState.message}</p>
              <button 
                onClick={() => setAlertState({ ...alertState, show: false })}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}

        {confirmState.show && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <div className="mb-4 w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-900 text-center mb-2">{confirmState.title}</h3>
              <p className="text-sm text-slate-600 text-center mb-6 whitespace-pre-wrap">{confirmState.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmState({ ...confirmState, show: false })}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (confirmState.onConfirm) confirmState.onConfirm();
                    setConfirmState({ ...confirmState, show: false });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalContext.Provider>
  );
}
