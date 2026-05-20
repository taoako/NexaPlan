import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, RefreshCw, ArrowLeft, CheckCircle2, Briefcase } from 'lucide-react';
import { apiUrl } from '../../config/api';

interface UserProfileViewProps {
  onBack: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onProfileUpdate?: () => void;
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function UserProfileView({ onBack, addToast, onProfileUpdate }: UserProfileViewProps) {
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const token = localStorage.getItem('token') || '';

  const [form, setForm] = useState<ProfileForm>({
    firstName: storedUser.firstName || '',
    lastName:  storedUser.lastName  || '',
    email:     storedUser.email     || '',
    phone:     '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const roleLabel = (() => {
    switch (storedUser.roleId) {
      case 1: return 'Super Admin';
      case 2: return 'Main Admin';
      case 3: return 'Finance Manager';
      case 4: return 'Department Head';
      case 5: return 'Auditor';
      default: return 'User';
    }
  })();

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      addToast('First and last name are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Tenant-Id': String(storedUser.tenantId || 0),
          'X-User-Id': String(storedUser.userId || 0),
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Update failed.' }));
        throw new Error(err.message);
      }
      // Persist updated name to localStorage
      const updated = { ...storedUser, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), name: `${form.firstName.trim()} ${form.lastName.trim()}` };
      localStorage.setItem('user', JSON.stringify(updated));
      addToast('Profile updated successfully.', 'success');
      setSaved(true);
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      addToast(e.message || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Profile Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update your personal information</p>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">
          {(form.firstName[0] || '?').toUpperCase()}{(form.lastName[0] || '').toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{form.firstName} {form.lastName}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-500">{form.email || 'No email set'}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <h3 className="font-black text-slate-900 text-base">Personal Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                placeholder="First name"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                placeholder="Last name"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
