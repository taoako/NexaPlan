import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3, Users, Building2, Settings, FileText, CreditCard, TrendingUp,
  LogOut, Bell, ChevronDown, CheckCircle2, AlertCircle, X, Info
} from 'lucide-react';
import { OverviewTab } from './views/OverviewTab';
import { ForecastingTab } from './views/ForecastingTab';
import { UsersTab } from './views/UsersTab';
import { DepartmentsTab } from './views/DepartmentsTab';
import { SettingsTab } from './views/SettingsTab';
import { LogsTab } from './views/LogsTab';
import { BillingTab } from './views/BillingTab';
import * as api from '../../../api/mainAdminApi';
import { FeaturesContext, TierFeatures } from '../../../context/FeaturesContext';
import { useCurrency } from '../../../context/CurrencyContext';

type Tab = 'overview' | 'forecasting' | 'users' | 'departments' | 'settings' | 'logs' | 'billing';
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface Props { onLogout?: () => void; }

export function MainAdminSystem({ onLogout }: Props) {
  const { setCurrency } = useCurrency();
  // ── Auth: read from localStorage ──
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const tenantId: number = storedUser.tenantId ?? 0;
  const currentUserId: number = storedUser.userId ?? 0;
  const userName: string = storedUser.firstName && storedUser.lastName 
    ? `${storedUser.firstName} ${storedUser.lastName}` 
    : (storedUser.name ?? 'Main Admin');
  const userInitials: string = storedUser.firstName && storedUser.lastName
    ? (storedUser.firstName[0] + storedUser.lastName[0]).toUpperCase()
    : userName.charAt(0).toUpperCase();

  // ── UI State ──
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [filterRole, setFilterRole] = useState<string | undefined>(undefined);

  // ── Data State ──
  const [summary, setSummary] = useState<api.MainAdminSummary | null>(null);
  const [users, setUsers] = useState<api.MainAdminUser[]>([]);
  const [departments, setDepartments] = useState<api.MainAdminDepartment[]>([]);
  const [deptLabel, setDeptLabel] = useState('Department');
  const [roles, setRoles] = useState<api.RoleOption[]>([]);
  const [settings, setSettings] = useState<api.MainAdminSettings | null>(null);
  const [features, setFeatures] = useState<TierFeatures | null>(null);
  const [logs, setLogs] = useState<api.MainAdminLog[]>([]);
  const [billing, setBilling] = useState<api.MainAdminBilling | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Toast helpers ──
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  // ── Fetch functions ──
  const fetchSummary  = useCallback(async () => { if (!tenantId) return; try { setSummary(await api.getSummary(tenantId)); } catch (e: any) { addToast(e.message, 'error'); } }, [tenantId, addToast]);
  const fetchUsers    = useCallback(async () => { if (!tenantId) return; try { setUsers(await api.getUsers(tenantId)); } catch (e: any) { addToast(e.message, 'error'); } }, [tenantId, addToast]);
  const fetchDepts    = useCallback(async () => { if (!tenantId) return; try { const r = await api.getDepartments(tenantId); setDepartments(r.departments); setDeptLabel(r.label); } catch (e: any) { addToast(e.message, 'error'); } }, [tenantId, addToast]);
  const fetchRoles    = useCallback(async () => { if (!tenantId) return; try { setRoles(await api.getRoles(tenantId)); } catch {}  }, [tenantId]);
  const fetchSettings = useCallback(async () => { 
    if (!tenantId) return; 
    try { 
      const data = await api.getSettings(tenantId);
      setSettings(data);
      setFeatures(data.features);
      if (data.defaultCurrency) {
        setCurrency(data.defaultCurrency);
      }
    } catch (e: any) { 
      addToast(e.message, 'error'); 
    } 
  }, [tenantId, addToast, setCurrency]);
  const fetchBilling  = useCallback(async () => { if (!tenantId) return; try { setBilling(await api.getBilling(tenantId)); } catch (e: any) { addToast(e.message, 'error'); } }, [tenantId, addToast]);
  const fetchLogs     = useCallback(async (params?: Parameters<typeof api.getLogs>[1]) => { if (!tenantId) return; try { setLogs(await api.getLogs(tenantId, params)); } catch (e: any) { addToast(e.message, 'error'); } }, [tenantId, addToast]);

  // ── Load features once on mount ──
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Listen for upgrade requests from sub-components ──
  useEffect(() => {
    const handleNav = () => setActiveTab('billing');
    window.addEventListener('navigate-to-billing', handleNav);
    return () => window.removeEventListener('navigate-to-billing', handleNav);
  }, []);

  // ── Load on tab switch ──
  useEffect(() => {
    setLoading(true);
    const load = async () => {
      switch (activeTab) {
        case 'overview':     await Promise.all([fetchSummary(), fetchRoles()]); break;
        case 'forecasting':  await Promise.all([fetchDepts(), fetchSummary()]); break;
        case 'users':        await Promise.all([fetchUsers(), fetchDepts(), fetchRoles()]); break;
        case 'departments':  await Promise.all([fetchDepts(), fetchUsers()]); break;
        case 'settings':     await fetchSettings(); break;
        case 'logs':         await fetchLogs(); break;
        case 'billing':      await fetchBilling(); break;
      }
    };
    load().finally(() => setLoading(false));
  }, [activeTab]);

  // ── Profile dropdown close on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.reload();
    }
  };

  const NAV: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',     label: 'Overview',       icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'forecasting',  label: 'Forecasting',    icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'users',        label: 'Users & Roles',  icon: <Users className="w-4 h-4" /> },
    { id: 'departments',  label: `${deptLabel}s`,  icon: <Building2 className="w-4 h-4" /> },
    { id: 'settings',     label: 'Settings',       icon: <Settings className="w-4 h-4" /> },
    { id: 'logs',         label: 'Audit Logs',     icon: <FileText className="w-4 h-4" /> },
    { id: 'billing',      label: 'Billing',        icon: <CreditCard className="w-4 h-4" /> },
  ];

  // ── No-tenant guard ──
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Inter']">
        <div className="text-center p-10 bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Session Error</h2>
          <p className="text-slate-500 mb-6">Could not read your tenant session. Please log in again.</p>
          <button onClick={handleLogout} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#F1F5F9] font-['Inter'] overflow-hidden">
      {/* ── Top Nav ── */}
      <nav className="h-16 bg-[#0F172A] flex items-center px-6 gap-2 shrink-0 shadow-lg">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <span className="font-black text-xl text-white">Nexa<span className="text-indigo-400">Plan</span></span>
          <span className="text-slate-600 mx-2">|</span>
          <span className="text-slate-400 text-sm font-semibold">
            {storedUser.impersonated ? '👁 Impersonating' : 'Main Admin'}
          </span>
        </div>

        {/* Nav tabs — scrollable on narrow screens */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
          {NAV.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 ml-2 shrink-0 relative" ref={profileRef}>
          <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowProfile(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all"
          >
            <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-sm">
              {userInitials}
            </div>
            <span className="text-white text-sm font-semibold max-w-[120px] truncate">{userName}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          {showProfile && (
            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 w-52 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-black text-slate-900 truncate">{userName}</p>
                <p className="text-xs text-slate-500">Tenant ID: {tenantId}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto p-6">
        <FeaturesContext.Provider value={features}>
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              loading={loading}
              onRoleClick={(role) => { setFilterRole(role); setActiveTab('users'); }}
            />
          )}

          {activeTab === 'forecasting' && (
            <ForecastingTab departments={departments} />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              departments={departments}
              roles={roles}
              tenantId={tenantId}
              currentUserId={currentUserId}
              filterRole={filterRole}
              loading={loading}
              onRefresh={() => { fetchUsers(); fetchSummary(); }}
              addToast={addToast}
              onCreateUser={(data) => api.createUser(tenantId, data)}
              onUpdateUser={(id, data) => api.updateUser(tenantId, id, data)}
              onSuspendUser={(id) => api.suspendUser(tenantId, id)}
              onActivateUser={(id) => api.activateUser(tenantId, id)}
              onDeleteUser={(id) => api.deleteUser(tenantId, id)}
              onBulkAction={(ids, action, roleId) => api.bulkAction(tenantId, ids, action, roleId)}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsTab
              departments={departments}
              users={users}
              deptLabel={deptLabel}
              loading={loading}
              onRefresh={() => { fetchDepts(); fetchSummary(); }}
              addToast={addToast}
              onCreate={(data) => api.createDepartment(tenantId, data)}
              onUpdate={(id, data) => api.updateDepartment(tenantId, id, data)}
              onDelete={(id) => api.deleteDepartment(tenantId, id)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              loading={loading}
              addToast={addToast}
              onSave={(data) => api.updateSettings(tenantId, data)}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab
              logs={logs}
              loading={loading}
              onFilter={(params) => fetchLogs(params)}
            />
          )}

          {activeTab === 'billing' && (
            <BillingTab
              billing={billing}
              tenantId={tenantId}
              loading={loading}
              addToast={addToast}
              onUpgrade={(action, newTier) => api.upgradePlan(tenantId, action, newTier)}
              onCancel={() => api.cancelPlan(tenantId)}
            />
          )}
        </FeaturesContext.Provider>
      </main>

      {/* ── Toast Notifications ── */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-white ${
              t.type === 'success' ? 'bg-emerald-600 border-emerald-700' :
              t.type === 'error'   ? 'bg-red-600 border-red-700' :
              'bg-[#1E293B] border-slate-600'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
             t.type === 'error'   ? <AlertCircle  className="w-4 h-4 shrink-0" /> :
                                    <Info          className="w-4 h-4 shrink-0" />}
            <span className="text-sm font-bold">{t.message}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="ml-1 hover:opacity-70 transition-opacity">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
