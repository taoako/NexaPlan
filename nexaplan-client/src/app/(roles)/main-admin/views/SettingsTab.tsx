import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Shield, Clock, Globe, Calendar, Building2, User, Mail, Phone, Bell, Zap, Database } from 'lucide-react';
import type { MainAdminSettings } from '../../../../api/mainAdminApi';
import { useCurrency } from '../../../../context/CurrencyContext';

interface Props {
  settings: MainAdminSettings | null;
  loading: boolean;
  addToast: (msg: string, type: 'success' | 'error') => void;
  onSave: (data: Partial<MainAdminSettings>) => Promise<void>;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['PHP','USD','EUR','GBP','JPY','SGD','AUD','CAD','CNY','KRW','THB','MYR','IDR','INR','HKD'];

export function SettingsTab({ settings, loading, addToast, onSave }: Props) {
  const { setCurrency } = useCurrency();
  const [form, setForm] = useState({ 
    fiscalYearStartMonth: 1, 
    defaultCurrency: 'PHP', 
    requireMfa: false, 
    totalCompanyBudget: 0,
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    phone: '',
    // Security
    sessionTimeoutMinutes: 30,
    minPasswordLength: 8,
    maxFailedLoginAttempts: 5,
    // Notifications
    notificationPreferences: {
      emailOnBudgetOverrun: true,
      emailOnScenarioActivated: true,
      emailOnProposalSubmitted: false,
      emailOnReconciliationCleared: false,
      emailOnUserInvited: true
    }
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      let notifyPrefs = {
        emailOnBudgetOverrun: true,
        emailOnScenarioActivated: true,
        emailOnProposalSubmitted: false,
        emailOnReconciliationCleared: false,
        emailOnUserInvited: true
      };
      if (settings.notificationPreferences) {
        try {
          notifyPrefs = { ...notifyPrefs, ...JSON.parse(settings.notificationPreferences) };
        } catch (e) { console.error("Failed to parse notify prefs", e); }
      }

      setForm({ 
        fiscalYearStartMonth: settings.fiscalYearStartMonth, 
        defaultCurrency: settings.defaultCurrency, 
        requireMfa: settings.requireMfa,
        totalCompanyBudget: settings.totalCompanyBudget || 0,
        companyName: settings.companyName || '',
        contactPerson: settings.contactPerson || '',
        contactEmail: settings.contactEmail || '',
        phone: settings.phone || '',
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes || 30,
        minPasswordLength: settings.minPasswordLength || 8,
        maxFailedLoginAttempts: settings.maxFailedLoginAttempts || 5,
        notificationPreferences: notifyPrefs
      });
      setIsDirty(false);
    }
  }, [settings]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(p => ({ ...p, [key]: value }));
    setIsDirty(true);
  };

  const updateNotify = (key: keyof typeof form.notificationPreferences) => {
    const newPrefs = { ...form.notificationPreferences, [key]: !form.notificationPreferences[key] };
    update('notificationPreferences', newPrefs);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        notificationPreferences: JSON.stringify(form.notificationPreferences)
      };
      await onSave(payload as any);
      setCurrency(form.defaultCurrency);
      addToast('Settings saved successfully.', 'success');
      setIsDirty(false);
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><RefreshCw className="w-7 h-7 animate-spin text-indigo-400" /></div>;

  // ── Local Helper Components ──
  const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-8">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-black text-slate-900 leading-tight">{title}</h3>
        <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">
      {children}
    </label>
  );

  const InputWrapper = ({ icon, children }: { icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {icon}
      </div>
      {children}
    </div>
  );

  const inputCls = 'w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium';
  const selectCls = 'w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-bold text-slate-700';

  return (
    <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* ── Page Header (Surgically Aligned) ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Organization Settings</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-sm text-slate-500 font-medium">Control system-wide behavior and identity</p>
            {isDirty && (
              <>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest animate-pulse bg-amber-50 px-2 py-0.5 rounded">
                  Unsaved Changes
                </span>
              </>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving || !isDirty} 
          className={`h-14 flex items-center gap-3 px-8 rounded-2xl font-black transition-all active:scale-95 shadow-xl ${
            isDirty 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
          }`}
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Processing...' : 'Save All Settings'}
        </button>
      </div>

      <div className="flex flex-col gap-10">
        {/* ── ROW 1: Identity & Security (Perfect Height Alignment) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          
          {/* Company Profile Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 flex flex-col h-full">
            <SectionHeader 
              icon={<Building2 className="w-5 h-5" />} 
              title="Company Profile" 
              desc="General information and contact details" 
            />
            <div className="space-y-6 flex-grow">
              <div>
                <Label>Organization Name</Label>
                <InputWrapper icon={<Building2 className="w-4 h-4" />}>
                  <input type="text" value={form.companyName} onChange={e => update('companyName', e.target.value)} className={inputCls} placeholder="e.g. NexaPlan Corp" />
                </InputWrapper>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Contact</Label>
                  <InputWrapper icon={<User className="w-4 h-4" />}>
                    <input type="text" value={form.contactPerson} onChange={e => update('contactPerson', e.target.value)} className={inputCls} placeholder="Full Name" />
                  </InputWrapper>
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <InputWrapper icon={<Phone className="w-4 h-4" />}>
                    <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputCls} placeholder="+63..." />
                  </InputWrapper>
                </div>
              </div>

              <div>
                <Label>Administrative Email</Label>
                <InputWrapper icon={<Mail className="w-4 h-4" />}>
                  <input type="email" value={form.contactEmail} onChange={e => update('contactEmail', e.target.value)} className={inputCls} placeholder="admin@company.com" />
                </InputWrapper>
              </div>
            </div>
          </div>

          {/* Security Policy Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 flex flex-col h-full">
            <SectionHeader 
              icon={<Shield className="w-5 h-5" />} 
              title="Security Policy" 
              desc="Access controls and authentication rules" 
            />
            <div className="space-y-8 flex-grow">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Multi-Factor Authentication</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Enforce MFA across all organization users</p>
                </div>
                <button
                  onClick={() => update('requireMfa', !form.requireMfa)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.requireMfa ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.requireMfa ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <Label>Session Timeout</Label>
                  <select value={form.sessionTimeoutMinutes} onChange={e => update('sessionTimeoutMinutes', +e.target.value)} className={selectCls}>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                  </select>
                </div>
                <div>
                  <Label>Min Password</Label>
                  <select value={form.minPasswordLength} onChange={e => update('minPasswordLength', +e.target.value)} className={selectCls}>
                    {[8, 10, 12, 16].map(len => <option key={len} value={len}>{len} Characters</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Lockout Threshold</Label>
                <select value={form.maxFailedLoginAttempts} onChange={e => update('maxFailedLoginAttempts', +e.target.value)} className={selectCls}>
                  <option value={3}>3 Failed Attempts</option>
                  <option value={5}>5 Failed Attempts</option>
                  <option value={10}>10 Failed Attempts</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Fiscal & Notifications (Perfect Height Alignment) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
          
          {/* Fiscal Configuration Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 flex flex-col h-full">
            <SectionHeader 
              icon={<Calendar className="w-5 h-5" />} 
              title="Fiscal Configuration" 
              desc="Financial periods and monetary defaults" 
            />
            <div className="space-y-6 flex-grow">
              <div>
                <Label>Total Annual Budget Cap</Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-indigo-600 transition-colors">₱</div>
                  <input 
                    type="number" 
                    value={form.totalCompanyBudget} 
                    onChange={e => update('totalCompanyBudget', +e.target.value)} 
                    className={`${inputCls} pl-10 text-lg font-black text-indigo-600`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-3 font-medium px-1 leading-relaxed">The global pool available for redistribution. All departmental caps must sum to this amount or less.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div>
                  <Label>FY Start Month</Label>
                  <select value={form.fiscalYearStartMonth} onChange={e => update('fiscalYearStartMonth', +e.target.value)} className={selectCls}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Default Currency</Label>
                  <select value={form.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)} className={selectCls}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Hub Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 flex flex-col h-full">
            <SectionHeader 
              icon={<Bell className="w-5 h-5" />} 
              title="Notification Hub" 
              desc="Critical email alert preferences" 
            />
            <div className="space-y-2 flex-grow">
              {[
                { key: 'emailOnBudgetOverrun', label: 'Budget Overrun Alerts' },
                { key: 'emailOnScenarioActivated', label: 'Scenario State Changes' },
                { key: 'emailOnProposalSubmitted', label: 'New Proposal Submissions' },
                { key: 'emailOnUserInvited', label: 'Member Invitations' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
                  <span className="text-xs font-black text-slate-700">{item.label}</span>
                  <button
                    onClick={() => updateNotify(item.key as any)}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${form.notificationPreferences[item.key as keyof typeof form.notificationPreferences] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.notificationPreferences[item.key as keyof typeof form.notificationPreferences] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Workspace Metadata (Full Width alignment) ── */}
        {settings && (
          <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 tracking-tight">Workspace Metadata</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Immutable system identifiers</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Plan</div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-wider">
                  {((settings.subscriptionTier || 'Trial').charAt(0).toUpperCase() + (settings.subscriptionTier || 'Trial').slice(1).toLowerCase())}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workspace ID</div>
                <div className="text-base font-mono font-black text-slate-700 tracking-tighter">
                  #{ (settings.tenantId || 0).toString().padStart(6, '0') }
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data Retention</div>
                <div className="text-base font-black text-slate-700">
                  {(settings.subscriptionTier || '').toLowerCase().includes('starter') ? '12 Months' : 
                   (settings.subscriptionTier || '').toLowerCase().includes('professional') ? '24 Months' : 'Unlimited'}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Infrastructure</div>
                <div className="text-base font-black text-slate-700">Corporate-A1</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
