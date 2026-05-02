import React, { useState } from 'react';
import { X, Play, Database, Check } from 'lucide-react';

interface ProvisionTenantModalProps {
  onClose: () => void;
  onProvision: (data: any) => void;
}

export function ProvisionTenantModal({ onClose, onProvision }: ProvisionTenantModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    orgName: '',
    schemaPrefix: '',
    adminEmail: '',
    adminName: '',
    plan: 'Starter'
  });

  const handleNext = () => {
    if (step === 1 && (!formData.orgName || !formData.schemaPrefix)) return;
    if (step === 2 && (!formData.adminEmail || !formData.adminName)) return;
    if (step < 3) setStep(step + 1);
    else onProvision(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-md w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#4F46E5]" /> 
            Provision New Tenant
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#4F46E5] z-0 transition-all duration-300" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            
            {[
              { num: 1, label: 'Organization' },
              { num: 2, label: 'Admin Setup' },
              { num: 3, label: 'Review & Init' }
            ].map(s => (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                  step >= s.num ? 'bg-[#4F46E5] border-[#4F46E5] text-white' : 'bg-white border-slate-300 text-slate-400'
                }`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs font-bold ${step >= s.num ? 'text-[#4F46E5]' : 'text-slate-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Organization Details</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Official Organization Name</label>
                <input 
                  type="text" 
                  value={formData.orgName}
                  onChange={e => {
                    const name = e.target.value;
                    const schema = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
                    setFormData({...formData, orgName: name, schemaPrefix: `tenant_${schema}`});
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  placeholder="e.g. Department of Finance"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">PostgreSQL Schema Prefix (Auto-generated)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-mono">
                    public.
                  </span>
                  <input 
                    type="text" 
                    value={formData.schemaPrefix}
                    onChange={e => setFormData({...formData, schemaPrefix: e.target.value})}
                    className="flex-1 w-full px-4 py-2 border border-slate-200 rounded-r-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none font-mono bg-slate-50"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">This isolates the tenant's data at the database level.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Initial Admin Account</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Full Name</label>
                <input 
                  type="text" 
                  value={formData.adminName}
                  onChange={e => setFormData({...formData, adminName: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  placeholder="e.g. Maria Santos"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Admin Email Address (Login ID)</label>
                <input 
                  type="email" 
                  value={formData.adminEmail}
                  onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                  placeholder="e.g. msantos@dof.gov.ph"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Review</h3>
              
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-3 font-mono text-sm">
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-slate-500">Operation:</span>
                  <span className="text-[#4F46E5] font-bold">CREATE_TENANT</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-slate-500">Schema Exec:</span>
                  <span className="text-slate-800">CREATE SCHEMA IF NOT EXISTS {formData.schemaPrefix}</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-slate-500">Migrations:</span>
                  <span className="text-[#10B981]">Ready (52 tables)</span>
                </div>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-slate-500">Admin Seed:</span>
                  <span className="text-slate-800">INSERT INTO {formData.schemaPrefix}.users ({formData.adminEmail})</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-[#4F46E5]/30 rounded text-sm text-[#4F46E5] font-semibold text-center">
                Click "Initialize Tenant" to execute database scripts and send standard welcome email via SendGrid.
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-2 rounded-md text-sm font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={(step === 1 && (!formData.orgName || !formData.schemaPrefix)) || (step === 2 && (!formData.adminEmail || !formData.adminName))}
          >
            {step === 3 ? (
              <><Play className="w-4 h-4 fill-current" /> Initialize Tenant</>
            ) : (
              'Continue →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}