import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Receipt, AlertTriangle, Filter, ArrowUpDown } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';

export function ReconciliationView() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmReconcileId, setConfirmReconcileId] = useState<number | null>(null);
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error' | 'success' | 'info' } | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [filterStatus]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await financeManagerApi.getExpenses(filterStatus || undefined);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (id: number) => {
    setConfirmReconcileId(id);
  };

  const confirmReconcile = async () => {
    if (!confirmReconcileId) return;
    try {
      await financeManagerApi.reconcileExpense(confirmReconcileId);
      fetchExpenses();
    } catch (err: any) {
      setModalMessage({ title: 'Reconcile Failed', message: err.message || 'Failed to reconcile.', type: 'error' });
    }
    setConfirmReconcileId(null);
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return setModalMessage({ title: 'Reason Required', message: 'Please provide a reason for rejection.', type: 'error' });
    try {
      await financeManagerApi.rejectExpense(rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      fetchExpenses();
    } catch (err: any) {
      setModalMessage({ title: 'Reject Failed', message: err.message || 'Failed to reject.', type: 'error' });
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'Pending').length;
  const reconciledTotal = expenses.filter(e => e.status === 'Reconciled').reduce((acc, e) => acc + e.actualAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reconciled': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> CLEARED</span>;
      case 'Pending':    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> PENDING</span>;
      case 'Rejected':   return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200"><XCircle className="w-3 h-3"/> REJECTED</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Expense Reconciliation</h1>
          <p className="text-[15px] text-slate-500 mt-1">Review and clear submitted expense receipts to update actual spend figures.</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Reconciled">Reconciled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Awaiting Review</div>
            <div className="text-[28px] font-black text-slate-900">{pendingCount}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Reconciled Spend</div>
            <div className="text-[22px] font-black text-slate-900">₱{reconciledTotal.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Submissions</div>
            <div className="text-[28px] font-black text-slate-900">{expenses.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Date', 'Department', 'Project / Proposal', 'Budgeted', 'Actual Spent', 'Variance', 'Receipt', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading expenses...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">No expenses found.</td></tr>
            ) : expenses.map(exp => {
              const isPositive = exp.variance >= 0;
              return (
                <tr key={exp.id} className={`hover:bg-slate-50/60 transition-colors ${exp.status === 'Pending' ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-5 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">{exp.submittedDate}</td>
                  <td className="px-5 py-3.5 font-bold text-[13px] text-slate-900">{exp.department}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[13px] text-slate-900">{exp.proposalTitle}</div>
                    <div className="text-[11px] font-mono text-slate-500">PRJ-{exp.proposalId}</div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[13px] text-slate-500">₱{exp.proposalBudget.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-[14px] text-slate-900">₱{exp.actualAmount.toLocaleString()}</td>
                  <td className={`px-5 py-3.5 font-mono font-bold text-[13px] ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? '-' : '+'}₱{Math.abs(exp.variance).toLocaleString()}
                    {!isPositive && <span className="ml-1 text-[10px] font-bold">OVER</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {exp.receiptUrl ? (
                      <a href="#" className="text-[12px] font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2">View</a>
                    ) : (
                      <span className="text-slate-400 text-xs italic">None</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">{getStatusBadge(exp.status)}</td>
                  <td className="px-5 py-3.5">
                    {exp.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReconcile(exp.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Clear
                        </button>
                        <button
                          onClick={() => setRejectingId(exp.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 transition-all"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Reject Expense</h3>
                <p className="text-sm text-slate-500">Provide a reason to send back to the department head.</p>
              </div>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Receipt is blurry. Please resubmit a clearer image."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-400 bg-slate-50 mb-5"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={handleReject} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Confirm */}
      {confirmReconcileId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Confirm Reconciliation</h3>
                <p className="text-sm text-slate-500">This will update the department's actual spend.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={confirmReconcile} className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-all">Confirm</button>
              <button onClick={() => setConfirmReconcileId(null)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Message Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className={`mb-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              modalMessage.type === 'error' ? 'bg-red-100 text-red-500' :
              modalMessage.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'
            }`}>
              {modalMessage.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
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
