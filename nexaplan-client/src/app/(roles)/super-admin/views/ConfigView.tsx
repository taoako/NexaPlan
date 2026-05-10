import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';

export function ConfigView() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGatewayKey, setShowGatewayKey] = useState({ publicKey: false, secretKey: false, webhookSecret: false });
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [maintenanceInput, setMaintenanceInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateField = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateConfig(config);
      setModalMessage({ title: 'Saved', message: 'System configuration saved successfully.', type: 'success' });
    } catch (err: any) {
      setModalMessage({ title: 'Save Failed', message: err.message || 'Failed to save configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmMaintenanceToggle = () => {
    if (maintenanceInput !== 'CONFIRM') {
      setModalMessage({ title: 'Confirmation Failed', message: 'Type CONFIRM to enable maintenance mode.', type: 'error' });
      return;
    }
    updateField('maintenance_mode', 'true');
    setConfirmMaintenance(false);
    setMaintenanceInput('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>;
  }

  const toggles = [
    { key: 'mfa_enabled', label: 'Force Multi-Factor Authentication', desc: 'All Main Admins intercepted at next login', danger: false },
    { key: 'ssl_enabled', label: 'Force SSL/TLS Encryption', desc: 'Require secure connections for all endpoints', danger: false },
    { key: 'ml_enabled', label: 'Machine Learning Forecasting Engine', desc: 'Enable Scikit-Learn budget predictions', danger: false },
    { key: 'maintenance_mode', label: 'Global Maintenance Mode', desc: 'CAUTION: Invalidates all JWTs, logs out all tenants', danger: true },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Global Toggles */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Global System Toggles</h2>
        <div className="grid grid-cols-2 gap-6">
          {toggles.map((item) => (
            <div key={item.key} className={`flex items-start justify-between gap-4 p-4 border rounded-md ${item.danger ? 'border-[#EF4444]/30 bg-[#EF4444]/5' : 'border-slate-200'}`}>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900 mb-1">{item.label}</div>
                <div className={`text-xs ${item.danger ? 'text-[#EF4444] font-semibold' : 'text-slate-600'}`}>{item.desc}</div>
              </div>
              <button
                onClick={() => {
                  if (item.danger && config[item.key] !== 'true') {
                    setConfirmMaintenance(true);
                    return;
                  }
                  updateField(item.key, config[item.key] === 'true' ? 'false' : 'true');
                }}
                className={`w-12 h-6 rounded-full relative transition-all ${config[item.key] === 'true' ? (item.danger ? 'bg-[#EF4444]' : 'bg-[#10B981]') : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config[item.key] === 'true' ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gateway Secrets Removed */}

      {/* API & Compute Settings */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-[20px] font-semibold text-slate-900 mb-6">API & Compute Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Global Request Timeout (ms)</label>
              <input type="text" value={config['api_timeout_ms'] || ''} onChange={e => updateField('api_timeout_ms', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Max Export Row Limit</label>
              <input type="text" value={config['max_export_rows'] || ''} onChange={e => updateField('max_export_rows', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">API Rate Limit (req/min)</label>
              <input type="text" value={config['api_rate_limit'] || ''} onChange={e => updateField('api_rate_limit', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Security & Authentication</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">JWT Expiration (hours)</label>
              <input type="text" value={config['jwt_expiration_hours'] || ''} onChange={e => updateField('jwt_expiration_hours', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Max Failed Login Attempts</label>
              <input type="text" value={config['max_failed_logins'] || ''} onChange={e => updateField('max_failed_logins', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Session Timeout (minutes)</label>
              <input type="text" value={config['session_timeout_minutes'] || ''} onChange={e => updateField('session_timeout_minutes', e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold shadow-lg transition-all ${saving ? 'bg-slate-400 text-white' : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'}`}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {saving ? 'Saving...' : 'Save System Configuration'}
        </button>
      </div>

      {confirmMaintenance && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Enable Maintenance Mode</h3>
            <p className="text-slate-500 text-sm mb-4">This will invalidate all sessions and log out all tenants.</p>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Type CONFIRM to proceed</label>
            <input value={maintenanceInput} onChange={e => setMaintenanceInput(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-5" placeholder="CONFIRM" />
            <div className="flex gap-3">
              <button onClick={confirmMaintenanceToggle} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold">Confirm</button>
              <button onClick={() => { setConfirmMaintenance(false); setMaintenanceInput(''); }} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className={`mb-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              modalMessage.type === 'error' ? 'bg-red-100 text-red-500' :
              modalMessage.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'
            }`}>
              {modalMessage.type === 'error' ? <AlertTriangle className="w-6 h-6" /> : <Check className="w-6 h-6" />}
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">{modalMessage.title}</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage.message}</p>
            <button onClick={() => setModalMessage(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}