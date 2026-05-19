import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Check, X, Archive, LogIn, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SuperAdminTopNav } from './layout/SuperAdminTopNav';
import { OverviewView } from './views/OverviewView';
import { TenantsView } from './views/TenantsView';
import { BillingView } from './views/BillingView';
import { PricingCRUDView } from './views/PricingCRUDView';
import { AdminsView } from './views/AdminsView';
import { TrialRequestsView } from './views/TrialRequestsView';
import { ConfigView } from './views/ConfigView';
import { MaintenanceView } from './views/MaintenanceView';
import * as api from '../../../api/superAdminApi';
import type { TenantDto, SummaryDto } from '../../../api/superAdminApi';

export type DashboardView = 'overview' | 'tenants' | 'billing' | 'pricing' | 'admins' | 'config' | 'maintenance' | 'trial-requests';

interface SuperAdminSystemProps { onLogout: () => void; }

export default function SuperAdminSystem({ onLogout }: SuperAdminSystemProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTrialCount, setPendingTrialCount] = useState(0);

  // Shared data from API
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [summary, setSummary] = useState<SummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Provision modal state
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionStep, setProvisionStep] = useState(0);
  const [provisionData, setProvisionData] = useState({ orgName: '', adminFirst: '', adminLast: '', adminEmail: '', tier: 'starter' });
  const [provisionLoading, setProvisionLoading] = useState(false);

  // Edit tenant state
  const [editTenant, setEditTenant] = useState<TenantDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Archive tenant state
  const [archiveTenantId, setArchiveTenantId] = useState<number | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Impersonate state
  const [impersonateTenant, setImpersonateTenant] = useState<TenantDto | null>(null);
  const [impersonateSessionActive, setImpersonateSessionActive] = useState(false);

  // Toast system
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // ── Data fetching ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tenantsData, summaryData] = await Promise.all([
        api.getTenants(searchQuery || undefined),
        api.getSummary(),
      ]);
      setTenants(tenantsData);
      setSummary(summaryData);
      setPendingTrialCount(summaryData.pendingTrials);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getPageTitle = () => {
    switch (currentView) {
      case 'overview': return 'Global Dashboard';
      case 'tenants': return 'Tenant Management';
      case 'billing': return 'Subscription & Billing Engine';
      case 'admins': return 'Main Admin Accounts';
      case 'config': return 'System Configuration';
      case 'maintenance': return 'Maintenance & Backups';
      case 'trial-requests': return 'Trial Request Management';
      default: return 'Global Dashboard';
    }
  };

  // ── Provision Tenant ──
  const handleProvisionTenant = async () => {
    setProvisionLoading(true);
    try {
      const result = await api.provisionTenant({
        orgName: provisionData.orgName,
        adminFirstName: provisionData.adminFirst,
        adminLastName: provisionData.adminLast,
        adminEmail: provisionData.adminEmail,
        tier: provisionData.tier,
      });
      addToast(result.message, 'success');
      setShowProvisionModal(false);
      setProvisionStep(0);
      setProvisionData({ orgName: '', adminFirst: '', adminLast: '', adminEmail: '', tier: 'starter' });
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Provisioning failed', 'error');
    } finally {
      setProvisionLoading(false);
    }
  };

  // ── Edit Tenant ──
  const handleSaveEditTenant = async () => {
    if (!editTenant) return;
    setEditLoading(true);
    try {
      await api.updateTenant(editTenant.tenantID, {
        companyName: editTenant.companyName,
        contactPerson: editTenant.contactPerson,
        contactEmail: editTenant.contactEmail,
        phone: editTenant.phone,
        subscriptionTier: editTenant.subscriptionTier,
        registrationStatus: editTenant.registrationStatus,
        tempPassword: (editTenant as any).tempPassword,
      });
      addToast(`Tenant "${editTenant.companyName}" updated successfully.`, 'success');
      setEditTenant(null);
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Archive Tenant ──
  const handleArchiveTenant = async () => {
    if (!archiveTenantId) return;
    setArchiveLoading(true);
    try {
      const result = await api.archiveTenant(archiveTenantId);
      addToast(result.message, 'success');
      setArchiveTenantId(null);
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Archive failed', 'error');
    } finally {
      setArchiveLoading(false);
    }
  };

  // ── Impersonate ──
  const handleImpersonate = async () => {
    if (!impersonateTenant) return;
    setImpersonateSessionActive(true);
    try {
      const result = await api.impersonateTenant(impersonateTenant.tenantID);
      addToast(`Unlocking session for ${impersonateTenant.companyName}...`, 'info');
      
      // Simulate real impersonation by storing token and redirecting
      setTimeout(() => {
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify({
          name: impersonateTenant.contactPerson,
          email: result.email,
          role: 'MainAdmin',
          roleId: 2,
          tenantId: result.tenantId,
          userId: result.userId ?? 0,
          impersonated: true
        }));
        // Reload the SPA — App.jsx will read localStorage and route to main-admin
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      addToast(err.message || 'Impersonation failed', 'error');
      setImpersonateSessionActive(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F1F5F9] font-['Inter']">
      <SuperAdminTopNav currentView={currentView} setCurrentView={setCurrentView} onLogout={onLogout} pendingTrialCount={pendingTrialCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[72px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold text-[#0A192F] tracking-tight">{getPageTitle()}</h1>
            {currentView === 'trial-requests' && pendingTrialCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full text-sm font-bold">
                <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse"></span>
                {pendingTrialCount} Pending Review
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search tenants, invoices..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[320px] pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </div>
            <button className="relative p-2 hover:bg-slate-50 rounded-md transition-all" onClick={() => addToast('Notifications are coming soon.', 'info')}>
              <Bell className="w-5 h-5 text-slate-600" />
              {pendingTrialCount > 0 && <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></div>}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {loading && currentView === 'overview' ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" />
            </div>
          ) : (
            <>
              {currentView === 'overview' && (
                <OverviewView setCurrentView={setCurrentView} tenants={tenants} summary={summary} onRefresh={fetchData} />
              )}
              {currentView === 'tenants' && (
                <TenantsView
                  tenants={tenants}
                  addToast={addToast}
                  onProvision={() => { setShowProvisionModal(true); setProvisionStep(0); }}
                  onEdit={(t) => setEditTenant({ ...t })}
                  onArchive={(id) => setArchiveTenantId(id)}
                  onImpersonate={(t) => setImpersonateTenant(t)}
                />
              )}
              {currentView === 'billing' && <BillingView addToast={addToast} />}
              {currentView === 'pricing' && <PricingCRUDView />}
              {currentView === 'admins' && <AdminsView addToast={addToast} />}
              {currentView === 'trial-requests' && <TrialRequestsView onTrialCountChange={(c) => setPendingTrialCount(c)} />}
              {currentView === 'config' && <ConfigView />}
              {currentView === 'maintenance' && <MaintenanceView />}
            </>
          )}
        </main>
      </div>

      {/* ═══ Provision Modal ═══ */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-[#0F172A] px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white">Provision New Tenant</h2>
                <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2">
                {['Organization Details', 'Admin Account', 'Subscription Tier'].map((step, i) => (
                  <div key={i} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${i <= provisionStep ? 'bg-[#4F46E5]' : 'bg-white/20'}`}></div>
                    <div className={`text-xs mt-1.5 font-semibold ${i <= provisionStep ? 'text-white' : 'text-slate-500'}`}>Step {i + 1}: {step}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8">
              {provisionStep === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Organization Name *</label>
                    <input type="text" value={provisionData.orgName} onChange={e => setProvisionData(p => ({ ...p, orgName: e.target.value }))} placeholder="e.g. Davao City Government" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                  </div>
                </div>
              )}
              {provisionStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-2">Create the Main Admin account. Temp credentials dispatched via SMTP.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                      <input type="text" value={provisionData.adminFirst} onChange={e => setProvisionData(p => ({ ...p, adminFirst: e.target.value }))} placeholder="Juan" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label>
                      <input type="text" value={provisionData.adminLast} onChange={e => setProvisionData(p => ({ ...p, adminLast: e.target.value }))} placeholder="Dela Cruz" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Admin Email *</label>
                    <input type="email" value={provisionData.adminEmail} onChange={e => setProvisionData(p => ({ ...p, adminEmail: e.target.value }))} placeholder="admin@organization.ph" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                  </div>
                </div>
              )}
              {provisionStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 mb-2">This bypasses PayMongo checkout. Billing set up separately.</p>
                  {[
                    { value: 'starter', label: 'Starter', price: '₱4,950/mo', desc: 'Up to 3 managers, 5 departments' },
                    { value: 'professional', label: 'Professional', price: '₱12,900/mo', desc: 'Up to 15 managers, unlimited depts' },
                    { value: 'enterprise', label: 'Enterprise', price: '₱29,900/mo', desc: 'Unlimited everything, 24/7 support' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setProvisionData(p => ({ ...p, tier: opt.value }))} className={`w-full p-4 border-2 rounded-lg text-left transition-all ${provisionData.tier === opt.value ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <div><div className="font-bold text-slate-900">{opt.label}</div><div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div></div>
                        <div className="font-black text-[#4F46E5]">{opt.price}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-8">
                <button onClick={() => { if (provisionStep === 0) setShowProvisionModal(false); else setProvisionStep(s => s - 1); }} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-all">
                  {provisionStep === 0 ? 'Cancel' : '← Back'}
                </button>
                {provisionStep < 2 ? (
                  <button onClick={() => { if (provisionStep === 0 && !provisionData.orgName) return; if (provisionStep === 1 && (!provisionData.adminFirst || !provisionData.adminEmail)) return; setProvisionStep(s => s + 1); }} className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-bold transition-all shadow-md">Next →</button>
                ) : (
                  <button onClick={handleProvisionTenant} disabled={provisionLoading} className="px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                    {provisionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {provisionLoading ? 'Provisioning...' : 'Provision Tenant'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editTenant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 bg-[#0F172A] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-white">Advanced Tenant Editor</h2>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Organization ID: {editTenant.tenantID}</p>
              </div>
              <button onClick={() => setEditTenant(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Basic Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-6 bg-[#4F46E5] rounded-full"></div>
                  <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">General Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Organization Name</label>
                    <input type="text" value={editTenant.companyName} onChange={e => setEditTenant(t => t ? { ...t, companyName: e.target.value } : null)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:bg-white outline-none transition-all font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Main Admin</label>
                    <input type="text" value={editTenant.contactPerson} onChange={e => setEditTenant(t => t ? { ...t, contactPerson: e.target.value } : null)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:bg-white outline-none transition-all font-semibold" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Contact Email</label>
                    <input type="email" value={editTenant.contactEmail} onChange={e => setEditTenant(t => t ? { ...t, contactEmail: e.target.value } : null)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:bg-white outline-none transition-all font-semibold" />
                  </div>
                </div>
              </section>

              {/* Status & Tier Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-6 bg-[#10B981] rounded-full"></div>
                  <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Subscription & Status</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Subscription Tier</label>
                    <select value={editTenant.subscriptionTier} onChange={e => setEditTenant(t => t ? { ...t, subscriptionTier: e.target.value } : null)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:bg-white outline-none transition-all font-bold">
                      <option value="Starter">Starter (₱4,950)</option>
                      <option value="Professional">Professional (₱12,900)</option>
                      <option value="Enterprise">Enterprise (₱29,900)</option>
                      <option value="Trial">Trial (Free)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">System Status</label>
                    <select value={editTenant.registrationStatus} onChange={e => setEditTenant(t => t ? { ...t, registrationStatus: e.target.value } : null)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] focus:bg-white outline-none transition-all font-bold">
                      <option value="Active">Active</option>
                      <option value="Trial">Trial Period</option>
                      <option value="Pending">Pending Payment</option>
                      <option value="Archived">Suspended / Archived</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Security Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-1.5 h-6 bg-[#EF4444] rounded-full"></div>
                  <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Security & Auth</h3>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs text-red-700 font-medium mb-3">To update the Main Admin's password, enter it below. This will take effect immediately upon saving.</p>
                  <label className="block text-xs font-black text-red-900 uppercase mb-2">Reset Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      onChange={e => setEditTenant(t => t ? { ...t, tempPassword: e.target.value } : null)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all" 
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="px-8 py-6 border-t border-slate-200 bg-slate-50 flex gap-4 shrink-0">
              <button onClick={handleSaveEditTenant} disabled={editLoading} className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3.5 rounded-xl font-black shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                {editLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Commit Changes
              </button>
              <button onClick={() => setEditTenant(null)} className="px-6 py-3.5 border border-slate-300 rounded-xl text-slate-700 font-black hover:bg-white hover:shadow-md transition-all">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast System ═══ */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300 border ${
            t.type === 'success' ? 'bg-[#10B981] border-[#059669] text-white' :
            t.type === 'error' ? 'bg-[#EF4444] border-red-700 text-white' :
            'bg-[#0F172A] border-slate-700 text-white'
          }`}>
            {t.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : t.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5 animate-spin" />}
            <span className="font-bold text-sm">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {/* ═══ Archive Confirmation ═══ */}
      {archiveTenantId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#EF4444]/10 rounded-xl flex items-center justify-center shrink-0"><Archive className="w-6 h-6 text-[#EF4444]" /></div>
              <div><h2 className="text-lg font-black text-slate-900">Archive Tenant</h2><p className="text-sm text-slate-500">"{tenants.find(t => t.tenantID === archiveTenantId)?.companyName}"</p></div>
            </div>
            <div className="space-y-3 mb-6">
              {['isArchived flag set in database', 'PayMongo billing cancelled', 'Tenant UI access blocked', 'Data retained for 30-day grace period'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700"><div className="w-2 h-2 rounded-full shrink-0 bg-[#EF4444]"></div>{item}</div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleArchiveTenant} disabled={archiveLoading} className="flex-1 bg-[#EF4444] hover:bg-red-700 text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                {archiveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} Confirm Archive
              </button>
              <button onClick={() => setArchiveTenantId(null)} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Impersonation Modal ═══ */}
      {impersonateTenant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#4F46E5]/10 rounded-xl flex items-center justify-center shrink-0"><LogIn className="w-6 h-6 text-[#4F46E5]" /></div>
              <div><h2 className="text-lg font-black text-slate-900">Impersonation Protocol</h2><p className="text-sm text-slate-500">{impersonateTenant.companyName}</p></div>
            </div>
            <div className="space-y-3 mb-6">
              {['Read-only session — no data modifications', 'Full audit log of your actions', 'Auto-expires in 15 minutes', 'Client password not required'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-slate-700"><Check className="w-4 h-4 text-[#10B981] shrink-0" />{item}</div>
              ))}
            </div>
            {impersonateSessionActive ? (
              <div className="flex items-center justify-center gap-3 py-3"><RefreshCw className="w-5 h-5 text-[#4F46E5] animate-spin" /><span className="text-sm font-bold text-[#4F46E5]">Generating session token…</span></div>
            ) : (
              <div className="flex gap-3">
                <button onClick={handleImpersonate} className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Start Session</button>
                <button onClick={() => setImpersonateTenant(null)} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}