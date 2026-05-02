import React, { useState, useEffect } from 'react';
import { Plus, Shield, AlertCircle, Clock, Key, CheckCircle2, Check, X, RefreshCw } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';
import type { AdminDto } from '../../../../api/superAdminApi';

export function AdminsView() {
  const [admins, setAdmins] = useState<AdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ firstName: '', lastName: '', email: '', org: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [unlockAdminId, setUnlockAdminId] = useState<number | null>(null);
  const [editAdminId, setEditAdminId] = useState<number | null>(null);
  const [editAdminData, setEditAdminData] = useState<Partial<AdminDto>>({});

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreateAdmin = async () => {
    setCreateLoading(true);
    try {
      const result = await api.createAdmin(createData);
      alert(`✅ ${result.message}`);
      setShowCreateModal(false);
      setCreateData({ firstName: '', lastName: '', email: '', org: '' });
      fetchAdmins();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUnlockAdmin = async (id: number, forceReset: boolean) => {
    try {
      const result = await api.unlockAdmin(id, forceReset);
      alert(`✅ ${result.message}`);
      setUnlockAdminId(null);
      fetchAdmins();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleLockAdmin = async (id: number) => {
    if (!window.confirm('Disable this admin account?')) return;
    try {
      await api.lockAdmin(id);
      alert('✅ Admin account locked.');
      fetchAdmins();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleSaveAdminEdit = async () => {
    if (!editAdminId) return;
    try {
      await api.updateAdmin(editAdminId, {
        name: editAdminData.name || '',
        email: editAdminData.email || '',
        org: editAdminData.org || '',
      });
      alert('✅ Admin updated.');
      setEditAdminId(null);
      setEditAdminData({});
      fetchAdmins();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Main Admins</div>
          <div className="text-3xl font-black text-slate-900">{admins.length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">MFA Enabled</div>
          <div className="text-3xl font-black text-[#10B981]">{admins.filter(a => a.mfaEnabled).length}</div>
          <div className="text-xs text-slate-600 mt-2">{admins.length > 0 ? Math.round((admins.filter(a => a.mfaEnabled).length / admins.length) * 100) : 0}% coverage</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Active</div>
          <div className="text-3xl font-black text-[#4F46E5]">{admins.filter(a => a.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Locked Accounts</div>
          <div className="text-3xl font-black text-[#EF4444]">{admins.filter(a => a.isLocked).length}</div>
          <div className="text-xs text-[#EF4444] font-semibold mt-2">{admins.filter(a => a.isLocked).length > 0 ? 'Requires attention' : 'All clear'}</div>
        </div>
      </div>

      {/* MFA Security Posture */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <h2 className="text-[18px] font-semibold text-slate-900 mb-4">Security Posture — MFA Adoption</h2>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-slate-600">MFA Adoption Rate</span>
              <span className="text-[#10B981]">{admins.length > 0 ? Math.round((admins.filter(a => a.mfaEnabled).length / admins.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4">
              <div className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-4 rounded-full transition-all" style={{ width: `${admins.length > 0 ? Math.round((admins.filter(a => a.mfaEnabled).length / admins.length) * 100) : 0}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{admins.filter(a => a.mfaEnabled).length} protected</span>
              <span>{admins.filter(a => !a.mfaEnabled).length} unprotected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Main Admin Accounts</h2>
          <button onClick={() => setShowCreateModal(true)} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Create Admin Account
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Admin Name</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">MFA</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {admins.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No admin accounts found.</td></tr>
            ) : admins.map((admin) => (
              <tr key={admin.userID} className={`hover:bg-[#F8FAFC] transition-colors ${admin.isLocked ? 'bg-red-50/30' : ''}`}>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{admin.name}</td>
                <td className="px-6 py-4 text-sm text-slate-700 font-mono">{admin.email}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{admin.org}</td>
                <td className="px-6 py-4">
                  {admin.mfaEnabled ? (
                    <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold"><Shield className="w-3 h-3" /> Enabled</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-xs font-bold"><AlertCircle className="w-3 h-3" /> Disabled</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> {admin.lastLogin}</div></td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${admin.status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                    {admin.status === 'active' ? 'Active' : '🔒 Locked'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    {admin.isLocked ? (
                      <button onClick={() => setUnlockAdminId(admin.userID)} className="text-[#10B981] hover:text-[#059669] text-sm font-bold hover:underline flex items-center gap-1"><Key className="w-3 h-3" /> Unlock</button>
                    ) : (
                      <>
                        <button onClick={() => { setEditAdminId(admin.userID); setEditAdminData({ name: admin.name, email: admin.email, org: admin.org }); }} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold hover:underline">Edit</button>
                        <button onClick={() => handleLockAdmin(admin.userID)} className="text-[#EF4444] hover:text-red-700 text-sm font-bold hover:underline">Disable</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">Create Admin Account</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">First Name *</label>
                  <input type="text" value={createData.firstName} onChange={e => setCreateData(p => ({ ...p, firstName: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Last Name *</label>
                  <input type="text" value={createData.lastName} onChange={e => setCreateData(p => ({ ...p, lastName: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                <input type="email" value={createData.email} onChange={e => setCreateData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Organization *</label>
                <input type="text" value={createData.org} onChange={e => setCreateData(p => ({ ...p, org: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateAdmin} disabled={!createData.firstName || !createData.email || createLoading} className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2">
                {createLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
              </button>
              <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {unlockAdminId && (() => {
        const admin = admins.find(a => a.userID === unlockAdminId);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center shrink-0"><Key className="w-6 h-6 text-[#10B981]" /></div>
                <div><h2 className="text-lg font-black text-slate-900">Account Lockout Management</h2><p className="text-sm text-slate-500">{admin?.name} — {admin?.org}</p></div>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => handleUnlockAdmin(unlockAdminId, true)} className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-lg font-bold shadow-md flex items-center justify-center gap-2"><Key className="w-4 h-4" /> Unlock + Force Password Reset</button>
                <button onClick={() => handleUnlockAdmin(unlockAdminId, false)} className="w-full border-2 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/5 py-3 rounded-lg font-bold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Unlock Only</button>
                <button onClick={() => setUnlockAdminId(null)} className="w-full py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Modal */}
      {editAdminId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">Edit Admin</h2>
              <button onClick={() => { setEditAdminId(null); setEditAdminData({}); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Name</label><input type="text" value={editAdminData.name || ''} onChange={e => setEditAdminData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Email</label><input type="email" value={editAdminData.email || ''} onChange={e => setEditAdminData(p => ({ ...p, email: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Organization</label><input type="text" value={editAdminData.org || ''} onChange={e => setEditAdminData(p => ({ ...p, org: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveAdminEdit} className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
              <button onClick={() => { setEditAdminId(null); setEditAdminData({}); }} className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}