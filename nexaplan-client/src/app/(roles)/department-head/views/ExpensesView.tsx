import React, { useState, useEffect } from 'react';
import { Upload, Receipt, Plus, X, Search, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { deptHeadApi } from '../../../../api/deptHeadApi';

export function ExpensesView() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [approvedProposals, setApprovedProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    proposalId: '',
    amount: '',
    receiptUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expData, propData] = await Promise.all([
        deptHeadApi.getExpenses(),
        deptHeadApi.getApprovedProposals()
      ]);
      setExpenses(expData);
      setApprovedProposals(propData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proposalId || !formData.amount) return alert('Please select a proposal and enter an amount.');
    
    try {
      await deptHeadApi.submitExpense(
        parseInt(formData.proposalId), 
        parseFloat(formData.amount), 
        formData.receiptUrl || undefined
      );
      alert('Expense submitted successfully for reconciliation.');
      setShowModal(false);
      setFormData({ proposalId: '', amount: '', receiptUrl: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit expense.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reconciled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3"/> RECONCILED</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-3 h-3"/> PENDING REVIEW</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-3 h-3"/> REJECTED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading expenses...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Expense Reconciliation</h1>
          <p className="text-[15px] text-slate-500 mt-1">Log actual expenditures and submit receipts against approved budgets.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />Log New Expense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Expenses</div>
            <div className="text-[24px] font-black text-slate-900">{expenses.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Reconciled</div>
            <div className="text-[24px] font-black text-slate-900">{expenses.filter(e => e.status === 'Reconciled').length}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6"/>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Review</div>
            <div className="text-[24px] font-black text-slate-900">{expenses.filter(e => e.status === 'Pending').length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500"/> Recent Expense Logs
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search expenses..." className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-white border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Date Submitted</th>
              <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Proposal / Project</th>
              <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Actual Spent</th>
              <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Receipt</th>
              <th className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No expenses logged yet.</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-[13px] font-medium text-slate-600">{exp.submittedDate}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-[14px] text-slate-900">{exp.proposalTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono">ID: PRJ-{exp.proposalId}</div>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-[14px] text-slate-900">₱{exp.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  {exp.receiptUrl ? (
                    <a href="#" className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-800"><FileText className="w-3.5 h-3.5"/> View Receipt</a>
                  ) : (
                    <span className="text-slate-400 text-xs italic">No receipt</span>
                  )}
                </td>
                <td className="px-6 py-4">{getStatusBadge(exp.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600"/> Log New Expense</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Link to Approved Proposal</label>
                <select 
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={formData.proposalId}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposalId: e.target.value }))}
                >
                  <option value="">Select an approved project...</option>
                  {approvedProposals.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (Approved: ₱{p.amount.toLocaleString()})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">You can only log expenses against fully approved budgets.</p>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Actual Amount Spent (₱)</label>
                <input 
                  type="number"
                  required
                  step="0.01"
                  min="1"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="e.g. 145000"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Upload Receipt / Invoice</label>
                <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mb-2" />
                  <span className="text-sm font-bold text-slate-700">Click to upload or drag and drop</span>
                  <span className="text-xs text-slate-500 mt-1">PDF, JPG, PNG up to 10MB</span>
                </div>
                {/* Mocked file upload for now */}
                <input 
                  type="hidden" 
                  value={formData.receiptUrl} 
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptUrl: e.target.value }))} 
                />
              </div>
              
              <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit for Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
