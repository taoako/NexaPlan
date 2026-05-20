import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react';
import {
  Lock, Shield, Download, Bell, Search, Filter, ChevronDown, CheckCircle2,
  XCircle, AlertTriangle, FileText, Eye, Calendar, Users, User, ChevronRight,
  MapPin, ExternalLink, LayoutDashboard, ScrollText, FolderOpen, ListChecks, LogOut,
  X, BarChart3
} from 'lucide-react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";
import { OverviewView } from './views/OverviewView';
import { AuditTrailsView } from './views/AuditTrailsView';
import { ComplianceScansView } from './views/ComplianceScansView';
import { FinancialStatementsView } from './views/FinancialStatementsView';
import { VarianceSummaryView } from './views/VarianceSummaryView';
import { auditorApi } from '../../../api/auditorApi';
import { UserProfileView } from '../../../components/shared/UserProfileView';
import { UserSecurityView } from '../../../components/shared/UserSecurityView';

export type ModuleView = 'overview' | 'audit-trails' | 'compliance-scans' | 'financial-statements' | 'variance-summary';

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

// Global filter context
interface FilterContextType {
  dateRange: string;
  targetDept: string;
  getDateRange: () => { from: string; to: string };
}
export const FilterContext = createContext<FilterContextType>({
  dateRange: 'Q1 2026 - Q4 2026',
  targetDept: 'all',
  getDateRange: () => ({ from: '2026-01-01', to: '2026-12-31' }),
});
export const useAuditorFilters = () => useContext(FilterContext);

interface ComplianceAuditSystemProps {
  onLogout?: () => void;
}

export function ComplianceAuditSystem({ onLogout }: ComplianceAuditSystemProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [subView, setSubView] = useState<'profile' | 'security' | null>(null);

  const [dateRange, setDateRange] = useState('Q1 2026 - Q4 2026');
  const [targetDept, setTargetDept] = useState('all');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const exportRef  = useRef<HTMLDivElement>(null);

  // Pre-filter state that AuditTrailsView reads (e.g. from clicking flagged card or compliance deep-link)
  const [auditTrailPreFilter, setAuditTrailPreFilter] = useState<{
    flaggedOnly?: boolean;
    actionType?: string;
    from?: string;
    to?: string;
    departmentId?: string;
  } | null>(null);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (parsed.requireMfa && !parsed.mfaEnabled) {
        setAlertState({
          show: true,
          title: 'MFA REQUIRED',
          message: 'MFA Setup is required for your account. Please configure it under Security in the profile dropdown.',
          type: 'info'
        });
      }
    }
  }, []);

  const handleProfileUpdate = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  };

  const auditorName = user
    ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || 'Auditor')
    : 'Auditor';
  const auditorInitials = auditorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  // Modal State
  const [alertState, setAlertState] = useState<{ show: boolean; title: string; message: string; type: 'info' | 'success' | 'error' }>({ show: false, title: '', message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState<{ show: boolean; title: string; message: string; onConfirm: (() => void) | null }>({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node))
        setShowProfileDropdown(false);
      if (exportRef.current && !exportRef.current.contains(event.target as Node))
        setShowExportMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bug Fix #4: Date range derivation from quarter selection
  const getDateRange = (): { from: string; to: string } => {
    const map: Record<string, { from: string; to: string }> = {
      'Q1 2026 - Q4 2026': { from: '2026-01-01', to: '2026-12-31' },
      'Q1 2026 - Q2 2026': { from: '2026-01-01', to: '2026-06-30' },
      'FY 2025':           { from: '2025-01-01', to: '2025-12-31' },
      'Last 30 Days':      { from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
    };
    return map[dateRange] ?? { from: '2026-01-01', to: '2026-12-31' };
  };

  // Section 5: Export report
  const handleExport = async (reportType: 'audit-trail' | 'compliance', format: string = 'csv') => {
    try {
      const { from, to } = getDateRange();
      const deptParam = targetDept !== 'all' ? targetDept : undefined;
      await auditorApi.downloadReport(
        reportType,
        { from, to, format },
        `nexaplan-${reportType}-${from}.${format}`
      );
      setAlertState({ show: true, title: 'Downloaded', message: 'Report downloaded successfully.', type: 'success' });
    } catch (err: any) {
      setAlertState({ show: true, title: 'Export Failed', message: err.message || 'Export failed.', type: 'error' });
    }
    setShowExportMenu(false);
  };

  // Section 3: Navigate to audit trails with flaggedOnly pre-filter
  const handleNavigateToAuditTrails = (filter: { flaggedOnly?: boolean; actionType?: string; from?: string; to?: string; departmentId?: string }) => {
    setAuditTrailPreFilter(filter);
    setActiveModule('audit-trails');
  };

  // Section 4: Deep-link from compliance scan violations
  const handleDeepLinkToLog = (logId: number) => {
    setActiveModule('audit-trails');
  };

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const alertType = type === 'warning' ? 'info' : type;
    setAlertState({ show: true, title: type.toUpperCase(), message, type: alertType });
  }, []);

  const modalContextValue = {
    showAlert: (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
      setAlertState({ show: true, title, message, type });
    },
    showConfirm: (title: string, message: string, onConfirm: () => void) => {
      setConfirmState({ show: true, title, message, onConfirm });
    }
  };

  const filterContextValue = {
    dateRange,
    targetDept,
    getDateRange,
  };

  const modules = [
    { id: 'overview'              as ModuleView, label: 'Overview',             icon: LayoutDashboard },
    { id: 'audit-trails'          as ModuleView, label: 'Audit Trails',          icon: ScrollText },
    { id: 'financial-statements'  as ModuleView, label: 'Financial Statements',  icon: FolderOpen },
    { id: 'compliance-scans'      as ModuleView, label: 'Compliance Scans',      icon: ListChecks },
    { id: 'variance-summary'      as ModuleView, label: 'Variance Summary',      icon: BarChart3 },
  ];

  return (
    <ModalContext.Provider value={modalContextValue}>
      <FilterContext.Provider value={filterContextValue}>
        <div className="min-h-screen bg-[#F1F5F9] font-['Inter'] flex flex-col">

          {/* Top Navigation */}
          <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
            {/* Brand */}
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

            {/* Module Navigation */}
            <div className="flex gap-1">
              {modules.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveModule(id); setAuditTrailPreFilter(null); setSubView(null); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                    activeModule === id
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* Section 5: Generate Report dropdown */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-all"
                >
                  <ScrollText className="w-4 h-4" />
                  Generate Report
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-2 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Export</div>
                    <button
                      onClick={() => handleExport('audit-trail', 'csv')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-indigo-500" /> Audit Trail (CSV)
                    </button>
                    <button
                      onClick={() => handleExport('compliance', 'csv')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <Download className="w-4 h-4 text-emerald-500" /> Compliance Scan (CSV)
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => { window.print(); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-slate-400" /> Print current view (PDF)
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
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
                      <div className="text-xs text-slate-500">{user?.email || 'auditor@nexaplan.ph'}</div>
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
                      <button onClick={() => { setShowProfileDropdown(false); onLogout?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          {/* Sub-Header Context Bar — Bug Fix #4: Filter values passed to views */}
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
                  <option value="all">All Departments</option>
                  <option value="it">IT Department</option>
                  <option value="marketing">Marketing</option>
                  <option value="finance">Finance</option>
                  <option value="hr">HR</option>
                  <option value="operations">Operations</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#10B981]/10 px-4 py-2 rounded-lg border border-[#10B981]/20">
              <Lock className="w-4 h-4 text-[#10B981]" />
              <span className="text-sm font-bold text-slate-900">All data points cryptographically verified</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto bg-[#F1F5F9] p-8">
            {activeModule === 'overview' && (
              <OverviewView onNavigate={handleNavigateToAuditTrails} />
            )}
            {activeModule === 'audit-trails' && (
              <AuditTrailsView preFilter={auditTrailPreFilter} />
            )}
            {activeModule === 'compliance-scans' && (
              <ComplianceScansView
                onDeepLink={handleDeepLinkToLog}
                onNavigateToAuditTrails={handleNavigateToAuditTrails}
              />
            )}
            {activeModule === 'financial-statements' && <FinancialStatementsView />}
            {activeModule === 'variance-summary' && <VarianceSummaryView />}
          </div>

          {/* ─── Profile & Security Modals ─── */}
          {subView === 'profile' && (
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
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
            <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
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



          {/* Alert Modal */}
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

          {/* Confirm Modal */}
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
      </FilterContext.Provider>
    </ModalContext.Provider>
  );
}
