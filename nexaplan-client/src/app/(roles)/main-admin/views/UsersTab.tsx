import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, UserCheck, UserX, RefreshCw, Check, X, Key, Search, Eye, EyeOff } from 'lucide-react';
import type { MainAdminUser, MainAdminDepartment, RoleOption } from '../../../../api/mainAdminApi';
import { TablePagination } from '../../../../components/TablePagination';

interface Props {
  users: MainAdminUser[];
  departments: MainAdminDepartment[];
  roles: RoleOption[];
  tenantId: number;
  currentUserId: number;
  filterRole?: string;
  loading: boolean;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onCreateUser: (data: { name: string; email: string; roleId: number; departmentId: number; requestedByUserId: number }) => Promise<{ tempPassword: string }>;
  onUpdateUser: (id: number, data: { name: string; email: string; roleId: number; departmentId: number; requestedByUserId: number; tempPassword?: string }) => Promise<void>;
  onSuspendUser: (id: number) => Promise<void>;
  onActivateUser: (id: number) => Promise<void>;
  onDeleteUser: (id: number) => Promise<void>;
  onBulkAction: (ids: number[], action: string, roleId?: number) => Promise<void>;
}

export function UsersTab({ users, departments, roles, tenantId, currentUserId, filterRole, loading, onRefresh, addToast, onCreateUser, onUpdateUser, onSuspendUser, onActivateUser, onDeleteUser, onBulkAction }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState(filterRole || 'All');
  const [selected, setSelected] = useState<number[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editUser, setEditUser] = useState<MainAdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [showTempPwd, setShowTempPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { setRoleFilter(filterRole || 'All'); }, [filterRole]);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });
  const pagedFiltered = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSelect = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(u => u.userId));
  const isFinanceManager = (roleId: number) => roleId === 3;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { Active: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700', Suspended: 'bg-red-100 text-red-700' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
  };

  const [form, setForm] = useState({ name: '', email: '', roleId: 3, departmentId: 0 });
  const [editForm, setEditForm] = useState({ name: '', email: '', roleId: 3, departmentId: 0, tempPassword: '' });

  useEffect(() => {
    if (editUser) {
      setEditForm({ name: editUser.name, email: editUser.email, roleId: editUser.roleId, departmentId: editUser.departmentId ?? 0, tempPassword: '' });
      setShowTempPwd(false);
      setShowNewPwd(false);
    }
  }, [editUser]);

  const handleInvite = async () => {
    if (!form.name || !form.email) { addToast('Name and email are required.', 'error'); return; }
    setActionLoading(true);
    try {
      const res = await onCreateUser({ ...form, requestedByUserId: currentUserId });
      setInviteResult(`Invited! Temp password: ${res.tempPassword}`);
      setForm({ name: '', email: '', roleId: 3, departmentId: 0 });
      onRefresh();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      await onUpdateUser(editUser.userId, { ...editForm, requestedByUserId: currentUserId, tempPassword: editForm.tempPassword || undefined });
      addToast('User updated.', 'success');
      setEditUser(null);
      onRefresh();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const handleBulk = async (action: string) => {
    if (!selected.length) { addToast('Select users first.', 'info'); return; }
    setActionLoading(true);
    try {
      await onBulkAction(selected, action);
      addToast(`Bulk ${action} applied to ${selected.length} users.`, 'success');
      setSelected([]);
      onRefresh();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setActionLoading(false); }
  };

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or email…" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
          <option>All</option><option>Active</option><option>Pending</option><option>Suspended</option>
        </select>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="All">All Roles</option>
          {roles.filter(r => r.roleId !== 1 && r.roleId !== 2).map(r => <option key={r.roleId} value={r.roleName}>{r.roleName}</option>)}
        </select>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-2 border-l pl-3">
            <span className="text-xs font-bold text-slate-500">{selected.length} selected</span>
            <button onClick={() => handleBulk('activate')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1"><UserCheck className="w-3 h-3" />Activate</button>
            <button onClick={() => handleBulk('suspend')} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 flex items-center gap-1"><UserX className="w-3 h-3" />Suspend</button>
            <button onClick={() => handleBulk('delete')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button>
          </div>
        )}
        <button onClick={() => { setShowInviteModal(true); setInviteResult(null); }} className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Invite User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded" /></th>
              {['Name','Email','Department','Role','Status','Last Login','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="py-16 text-center"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center text-slate-400 text-sm">No users found. Invite someone to get started.</td></tr>
            ) : pagedFiltered.map(u => (
              <tr key={u.userId} className={`hover:bg-slate-50 transition-colors ${u.isLocked ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(u.userId)} onChange={() => toggleSelect(u.userId)} className="rounded" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-bold text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">{u.email}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{isFinanceManager(u.roleId) ? <span className="italic text-slate-400">N/A</span> : u.department}</td>
                <td className="px-4 py-3"><span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{u.role}</span></td>
                <td className="px-4 py-3">{statusBadge(u.status)}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{u.lastLogin}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    {u.isLocked
                      ? <button onClick={async () => { setActionLoading(true); try { await onActivateUser(u.userId); addToast(`${u.name} activated.`, 'success'); onRefresh(); } catch(e:any){addToast(e.message,'error');} finally{setActionLoading(false);} }} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Activate"><UserCheck className="w-3.5 h-3.5" /></button>
                      : <button onClick={async () => { setActionLoading(true); try { await onSuspendUser(u.userId); addToast(`${u.name} suspended.`, 'success'); onRefresh(); } catch(e:any){addToast(e.message,'error');} finally{setActionLoading(false);} }} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-600" title="Suspend"><UserX className="w-3.5 h-3.5" /></button>
                    }
                    <button onClick={() => setDeleteId(u.userId)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
        />
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 bg-[#0F172A] flex items-center justify-between shrink-0">
              <div><h2 className="text-xl font-black text-white">Invite New User</h2><p className="text-xs text-slate-400 mt-0.5">Temp credentials will be generated</p></div>
              <button onClick={() => setShowInviteModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              {inviteResult && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold">{inviteResult}</div>}
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Full Name *</label><input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} className={inputCls} placeholder="Juan dela Cruz" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({...p,email:e.target.value}))} className={inputCls} placeholder="juan@company.ph" /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Role</label>
                <select value={form.roleId} onChange={e => setForm(p => ({...p,roleId:+e.target.value}))} className={inputCls}>
                  {roles.filter(r => r.roleId !== 1 && r.roleId !== 2).map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                </select>
              </div>
              {!isFinanceManager(form.roleId) && (
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Department</label>
                  <select value={form.departmentId} onChange={e => setForm(p => ({...p,departmentId:+e.target.value}))} className={inputCls}>
                    <option value={0}>Unassigned</option>
                    {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                  </select>
                </div>
              )}
              {isFinanceManager(form.roleId) && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
                  Finance Managers are not assigned to a specific department — they have cross-department budget oversight.
                </div>
              )}
            </div>
            <div className="px-8 py-5 border-t bg-slate-50 flex gap-3 shrink-0">
              <button onClick={handleInvite} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Send Invite
              </button>
              <button onClick={() => setShowInviteModal(false)} className="px-5 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-8 py-6 bg-[#0F172A] flex items-center justify-between shrink-0">
              <div><h2 className="text-xl font-black text-white">Edit User</h2><p className="text-xs text-slate-400 mt-0.5">ID: {editUser.userId}</p></div>
              <button onClick={() => setEditUser(null)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-5">
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Full Name</label><input value={editForm.name} onChange={e => setEditForm(p=>({...p,name:e.target.value}))} className={inputCls} /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(p=>({...p,email:e.target.value}))} className={inputCls} /></div>
              <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Role</label>
                <select value={editForm.roleId} onChange={e => setEditForm(p=>({...p,roleId:+e.target.value}))} className={inputCls}>
                  {roles.filter(r => r.roleId !== 1 && r.roleId !== 2).map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
                </select>
              </div>
              {!isFinanceManager(editForm.roleId) ? (
                <div><label className="block text-xs font-black text-slate-500 uppercase mb-2">Department</label>
                  <select value={editForm.departmentId} onChange={e => setEditForm(p=>({...p,departmentId:+e.target.value}))} className={inputCls}>
                    <option value={0}>Unassigned</option>
                    {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">Finance Managers have cross-department access — no specific department assignment.</div>
              )}

              {/* Last Temp Password (viewable) */}
              {editUser.lastTempPassword && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Last Temp Password</label>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      {showTempPwd ? editUser.lastTempPassword : '•'.repeat(editUser.lastTempPassword.length)}
                    </span>
                    <button onClick={() => setShowTempPwd(p => !p)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="Toggle visibility">
                      {showTempPwd ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Reset Password */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs text-red-600 font-medium mb-2">Leave blank to keep existing password. Filling this will unlock the account.</p>
                <label className="block text-xs font-black text-red-800 uppercase mb-2">Set New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input type={showNewPwd ? 'text' : 'password'} placeholder="New password…" value={editForm.tempPassword} onChange={e => setEditForm(p=>({...p,tempPassword:e.target.value}))} className="w-full pl-10 pr-12 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-400 outline-none text-sm" />
                  <button onClick={() => setShowNewPwd(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600">
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 border-t bg-slate-50 flex gap-3 shrink-0">
              <button onClick={handleSaveEdit} disabled={actionLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
              </button>
              <button onClick={() => setEditUser(null)} className="px-5 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold">Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Remove User</h3>
            <p className="text-slate-500 text-sm mb-6">This will permanently remove this user from your organization.</p>
            <div className="flex gap-3">
              <button onClick={async () => { setActionLoading(true); try { await onDeleteUser(deleteId); addToast('User removed.','success'); setDeleteId(null); onRefresh(); } catch(e:any){addToast(e.message,'error');} finally{setActionLoading(false);} }} disabled={actionLoading} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">Confirm Remove</button>
              <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
