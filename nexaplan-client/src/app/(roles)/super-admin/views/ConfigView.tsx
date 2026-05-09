import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';

export function ConfigView() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGatewayKey, setShowGatewayKey] = useState({ publicKey: false, secretKey: false, webhookSecret: false });

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
      alert('✅ System configuration saved successfully!');
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
                    const confirm = window.prompt('Type "CONFIRM" to enable maintenance mode:');
                    if (confirm !== 'CONFIRM') return;
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
    </div>
  );
}