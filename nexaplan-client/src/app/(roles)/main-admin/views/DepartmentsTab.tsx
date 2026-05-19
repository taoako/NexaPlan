import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw, X, Check, DollarSign, Users, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import type { MainAdminDepartment, MainAdminUser } from '../../../../api/mainAdminApi';
import { useCurrency } from '../../../../context/CurrencyContext';

interface Props {
  departments: MainAdminDepartment[];
  users: MainAdminUser[];
  deptLabel: string;
  loading: boolean;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onCreate: (data: { name: string; headUserId: number; budgetCap: number }) => Promise<void>;
  onUpdate: (id: number, data: { name: string; headUserId: number; budgetCap: number }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function DepartmentsTab({ departments, users, deptLabel, loading, onRefresh, addToast, onCreate, onUpdate, onDelete }: Props) {
  const { fmt, symbol } = useCurrency();
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<MainAdminDepartment | null>(null);
  const [form, setForm] = useState({ name: '', headUserId: 0, budgetCap: 0 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editDept) setForm({ name: editDept.name, headUserId: editDept.headUserId ?? 0, budgetCap: editDept.budgetCap });
    else setForm({ name: '', headUserId: 0, budgetCap: 0 });
  }, [editDept]);

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium';

  const handleSave = async () => {
    if (!form.name.trim()) { addToast('Department name is required.', 'error'); return; }
    setSaving(true);
    try {
      if (editDept) {
        await onUpdate(editDept.departmentId, form);
        addToast(`${deptLabel} updated.`, 'success');
        setEditDept(null);
      } else {
        await onCreate(form);
        addToast(`${deptLabel} created.`, 'success');
        setShowModal(false);
        setForm({ name: '', headUserId: 0, budgetCap: 0 });
      }
      onRefresh();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      await onDelete(id);
      addToast(`${deptLabel} removed.`, 'success');
      setDeleteId(null);
      onRefresh();
    } catch (e: any) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── Shared modal body (rendered inline — NOT as a nested component to preserve input focus) ──
  const modalContent = (isEdit: boolean) => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="px-8 py-6 bg-[#0F172A] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-black text-white">{isEdit ? 'Edit' : 'New'} {deptLabel}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{isEdit ? `Editing: ${editDept?.name}` : `Create a new ${deptLabel.toLowerCase()}`}</p>
          </div>
          <button onClick={() => { isEdit ? setEditDept(null) : setShowModal(false); }} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">{deptLabel} Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className={inputCls}
              placeholder={`e.g. ${deptLabel === 'Bureau' ? 'Bureau of Customs' : 'Finance'}`}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Head / Lead</label>
            <select value={form.headUserId} onChange={e => setForm(p => ({ ...p, headUserId: +e.target.value }))} className={inputCls}>
              <option value={0}>None / Unassigned</option>
              {users.filter(u => u.roleId === 4).map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-2">Annual Budget Cap ({symbol})</label>
            <input
              type="number"
              min={0}
              value={form.budgetCap || ''}
              onChange={e => setForm(p => ({ ...p, budgetCap: +e.target.value }))}
              className={inputCls}
              placeholder="0 = No cap"
            />
            <p className="text-xs text-slate-400 mt-1">Set 0 to remove budget access</p>
          </div>
        </div>
        <div className="px-8 py-5 border-t bg-slate-50 flex gap-3 shrink-0">
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {isEdit ? 'Save Changes' : `Create ${deptLabel}`}
          </button>
          <button onClick={() => { isEdit ? setEditDept(null) : setShowModal(false); }} className="px-5 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-white">Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">{deptLabel}s & Permissions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage organizational units and budget access controls.</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditDept(null); setForm({ name: '', headUserId: 0, budgetCap: 0 }); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md">
          <Plus className="w-4 h-4" /> New {deptLabel}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><RefreshCw className="w-7 h-7 animate-spin text-indigo-400" /></div>
      ) : departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 py-20 text-center text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No {deptLabel.toLowerCase()}s yet.</p>
          <p className="text-sm mt-1">Create your first organizational unit to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {departments.map(d => (
            <div key={d.departmentId} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-indigo-700 font-black text-lg">{d.name.charAt(0)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setEditDept(d)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(d.departmentId)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <h3 className="font-black text-slate-900 text-base mb-1">{d.name}</h3>
              <p className="text-xs text-slate-500 mb-4">Head: <span className="font-semibold text-slate-700">{d.headName}</span></p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500"><Users className="w-3.5 h-3.5" /> Members</div>
                  <span className="font-bold text-slate-900">{d.memberCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500"><DollarSign className="w-3.5 h-3.5" /> Budget Cap</div>
                  <span className={`font-bold ${d.budgetCap > 0 ? 'text-indigo-700' : 'text-slate-400'}`}>{fmt(d.budgetCap)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-xs">Budget Access</span>
                  {d.budgetAccess
                    ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><ToggleRight className="w-4 h-4" />Active</span>
                    : <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><ToggleLeft className="w-4 h-4" />Restricted</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals rendered inline (NOT as nested components) to prevent React from unmounting them on re-render */}
      {showModal && !editDept && modalContent(false)}
      {editDept && modalContent(true)}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Remove {deptLabel}</h3>
            <p className="text-slate-500 text-sm mb-6">Users assigned to this {deptLabel.toLowerCase()} will become unassigned.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">Confirm</button>
              <button onClick={() => setDeleteId(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
