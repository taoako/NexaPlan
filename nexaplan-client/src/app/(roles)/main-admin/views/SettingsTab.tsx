import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Shield, Clock, Globe, Calendar } from 'lucide-react';
import type { MainAdminSettings } from '../../../../api/mainAdminApi';

interface Props {
  settings: MainAdminSettings | null;
  loading: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSave: (data: { fiscalYearStartMonth: number; defaultCurrency: string; requireMfa: boolean }) => Promise<void>;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CURRENCIES = ['PHP','USD','EUR','SGD','JPY'];

export function SettingsTab({ settings, loading, addToast, onSave }: Props) {
  const [form, setForm] = useState({ fiscalYearStartMonth: 1, defaultCurrency: 'PHP', requireMfa: false });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({ fiscalYearStartMonth: settings.fiscalYearStartMonth, defaultCurrency: settings.defaultCurrency, requireMfa: settings.requireMfa });
      setIsDirty(false);
    }
  }, [settings]);

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(p => ({ ...p, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      addToast('Settings saved successfully.', 'success');
      setIsDirty(false);
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><RefreshCw className="w-7 h-7 animate-spin text-indigo-400" /></div>;

  const sectionHdr = (icon: React.ReactNode, title: string, desc: string) => (
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-5">
      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">{icon}</div>
      <div><div className="font-black text-slate-900">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
    </div>
  );

  const inputCls = 'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Unsaved warning */}
      {isDirty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-sm font-bold">You have unsaved changes. Click "Save Settings" to apply them.</span>
        </div>
      )}

      {/* Security */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {sectionHdr(<Shield className="w-4 h-4 text-indigo-600" />, 'Security Policy', 'Control authentication and access requirements')}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">Require Multi-Factor Authentication</div>
            <div className="text-xs text-slate-500 mt-0.5">Force all users to set up MFA before accessing the system</div>
          </div>
          <button
            onClick={() => update('requireMfa', !form.requireMfa)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.requireMfa ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.requireMfa ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Fiscal Year */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {sectionHdr(<Calendar className="w-4 h-4 text-indigo-600" />, 'Fiscal & Reporting', 'Configure your financial reporting periods')}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Fiscal Year Start Month</label>
            <select value={form.fiscalYearStartMonth} onChange={e => update('fiscalYearStartMonth', +e.target.value)} className={inputCls}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Default Currency</label>
            <select value={form.defaultCurrency} onChange={e => update('defaultCurrency', e.target.value)} className={inputCls}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || !isDirty} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black shadow-md transition-all">
        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}
