import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

interface EditTenantModalProps {
  tenant: { id: number; name: string; schema: string; status: string; users: number; admin: string };
  onClose: () => void;
  onSave: (id: number, config: any) => void;
}

export function EditTenantModal({ tenant, onClose, onSave }: EditTenantModalProps) {
  const [config, setConfig] = useState({
    name: tenant.name,
    adminEmail: tenant.admin,
    status: tenant.status,
    storageLimit: '500',
    plan: 'Professional',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-md w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">Tenant Configuration</h2>
            <p className="text-sm text-slate-500 font-mono mt-0.5">Schema: {tenant.schema}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-md transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-bold">Caution:</span> Modifying the active plan or storage limit may affect billing cycles. Suspending the tenant revokes all API tokens immediately.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Organization Name</label>
                <input 
                  type="text" 
                  value={config.name}
                  onChange={e => setConfig({...config, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Primary Admin Email</label>
                <input 
                  type="email" 
                  value={config.adminEmail}
                  onChange={e => setConfig({...config, adminEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Status</label>
                <select 
                  value={config.status}
                  onChange={e => setConfig({...config, status: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                >
                  <option value="active">Active (Billing)</option>
                  <option value="trial">Trial Period</option>
                  <option value="suspended">Suspended (Lockout)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subscription Plan</label>
                <select 
                  value={config.plan}
                  onChange={e => setConfig({...config, plan: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                >
                  <option value="Starter">Starter (₱4,950/mo)</option>
                  <option value="Professional">Professional (₱12,900/mo)</option>
                  <option value="Enterprise">Enterprise (Custom)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Storage Quota (GB)</label>
                <input 
                  type="number" 
                  value={config.storageLimit}
                  onChange={e => setConfig({...config, storageLimit: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSave(tenant.id, config)}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-2 rounded-md text-sm font-bold shadow-md transition-all"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}