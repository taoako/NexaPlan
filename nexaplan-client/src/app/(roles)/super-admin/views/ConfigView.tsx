import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, RefreshCw, Shield, Cpu, Lock } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';

interface ConfigViewProps {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ConfigView({ addToast }: ConfigViewProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        addToast('Failed to load configuration.', 'error');
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
      addToast('System configuration saved successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save configuration.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = () => {
    if (config['maintenance_mode'] === 'true') {
      // Turning off — no confirmation needed
      updateField('maintenance_mode', 'false');
    } else {
      // Turning on — require confirmation modal
      setConfirmMaintenance(true);
    }
  };

  const confirmMaintenanceEnable = () => {
    if (maintenanceInput !== 'CONFIRM') {
      addToast('Type CONFIRM to enable maintenance mode.', 'error');
      return;
    }
    updateField('maintenance_mode', 'true');
    setConfirmMaintenance(false);
    setMaintenanceInput('');
    addToast('Maintenance mode will be enabled when you save.', 'info');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  const toggles = [
    {
      key: 'global_mfa_enforced',
      label: 'Force Multi-Factor Authentication',
      desc: 'All tenants required to complete MFA at next login',
      icon: Shield,
      danger: false,
    },
    {
      key: 'global_ssl_enforced',
      label: 'Force SSL/TLS Encryption',
      desc: 'Require secure connections for all endpoints',
      icon: Lock,
      danger: false,
    },
    {
      key: 'ml_engine_enabled',
      label: 'Machine Learning Forecasting Engine',
      desc: 'Enable Scikit-Learn budget predictions via ML microservice',
      icon: Cpu,
      danger: false,
    },
    {
      key: 'maintenance_mode',
      label: 'Global Maintenance Mode',
      desc: 'CAUTION: Invalidates all JWTs, logs out all tenants',
      icon: AlertTriangle,
      danger: true,
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">

      {/* Global System Toggles */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#4F46E5] rounded-full inline-block" />
          Global System Toggles
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {toggles.map((item) => {
            const Icon = item.icon;
            const isOn = config[item.key] === 'true';
            return (
              <div
                key={item.key}
                className={`flex items-start justify-between gap-4 p-5 border rounded-lg transition-all ${
                  item.danger
                    ? 'border-red-200 bg-red-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.danger ? 'bg-red-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${item.danger ? 'text-red-500' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-0.5">{item.label}</div>
                    <div className={`text-xs leading-relaxed ${
                      item.danger ? 'text-red-600 font-semibold' : 'text-slate-500'
                    }`}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (item.key === 'maintenance_mode') {
                      handleMaintenanceToggle();
                    } else {
                      updateField(item.key, isOn ? 'false' : 'true');
                    }
                  }}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 mt-1 ${
                    isOn
                      ? item.danger ? 'bg-red-500' : 'bg-[#10B981]'
                      : 'bg-slate-200'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    isOn ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* API & Compute + Security side by side */}
      <div className="grid grid-cols-2 gap-6">
        {/* API & Compute Settings */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#3B82F6] rounded-full inline-block" />
            API &amp; Compute Settings
          </h2>
          <div className="space-y-5">
            {[
              { label: 'Global Request Timeout (ms)', key: 'api_request_timeout_ms', placeholder: '4000' },
              { label: 'Max Export Row Limit', key: 'max_export_rows', placeholder: '50000' },
              { label: 'API Rate Limit (req/min)', key: 'api_rate_limit_per_min', placeholder: '1000' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                <input
                  type="text"
                  value={config[key] || ''}
                  onChange={e => updateField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none font-mono text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#10B981] rounded-full inline-block" />
            Security &amp; Authentication
          </h2>
          <div className="space-y-5">
            {[
              { label: 'JWT Expiration (hours)', key: 'jwt_expiration_hours', placeholder: '24' },
              { label: 'Max Failed Login Attempts', key: 'max_failed_login_attempts', placeholder: '5' },
              { label: 'Session Timeout (minutes)', key: 'session_timeout_minutes', placeholder: '60' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
                <input
                  type="text"
                  value={config[key] || ''}
                  onChange={e => updateField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none font-mono text-sm bg-slate-50 focus:bg-white transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${
            saving
              ? 'bg-slate-400 text-white cursor-not-allowed'
              : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white hover:shadow-xl active:scale-95'
          }`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save System Configuration'}
        </button>
      </div>

      {/* ─── Maintenance Mode Confirmation Modal ─── */}
      {confirmMaintenance && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Enable Maintenance Mode?</h3>
            <p className="text-slate-500 text-sm mb-2">
              This will immediately invalidate <strong>all active sessions</strong> and log out every tenant.
              Only Super Admin routes will remain accessible.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
              <p className="text-xs text-red-700 font-semibold">⚠ This action invalidates all JWTs platform-wide.</p>
            </div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Type <span className="text-red-600">CONFIRM</span> to proceed
            </label>
            <input
              value={maintenanceInput}
              onChange={e => setMaintenanceInput(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none mb-5"
              placeholder="CONFIRM"
            />
            <div className="flex gap-3">
              <button
                onClick={confirmMaintenanceEnable}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold transition-all"
              >
                Enable Maintenance Mode
              </button>
              <button
                onClick={() => { setConfirmMaintenance(false); setMaintenanceInput(''); }}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}