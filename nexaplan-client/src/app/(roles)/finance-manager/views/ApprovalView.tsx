import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, Activity, ToggleLeft, ToggleRight, TriangleAlert } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';
import { deptHeadApi } from '../../../../api/deptHeadApi'; // Reuse getLineItems if needed

export function ApprovalView() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [rejectedItems, setRejectedItems] = useState<number[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await financeManagerApi.getProposals();
      setProposals(data);
      if (data.length > 0 && !selectedProposal) {
        handleSelectProposal(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProposal = async (p: any) => {
    setSelectedProposal(p);
    setReviewNotes('');
    setRejectedItems([]);
    setLoadingItems(true);
    try {
      // DeptHead API can fetch line items by ID, or we can add it to FinanceManager API. 
      // Reusing deptHeadApi here for line items is fine since it's the same signature.
      const items = await deptHeadApi.getLineItems(p.id);
      setLineItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const activeTotal = lineItems.filter(li => !rejectedItems.includes(li.lineItemId)).reduce((acc, li) => acc + li.total, 0);
  const deptCap = selectedProposal?.departmentCap || 0;
  const deptSpent = selectedProposal?.departmentSpent || 0;
  const isOverBudget = deptCap > 0 && (deptSpent + activeTotal) > deptCap;

  const toggleItemRejection = (itemId: number) => {
    setRejectedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleApprove = async () => {
    if (!selectedProposal) return;
    try {
      await financeManagerApi.approveProposal(selectedProposal.id, rejectedItems);
      alert('Budget request approved!');
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleRequestChanges = async () => {
    if (!selectedProposal) return;
    if (!reviewNotes) return alert('Please provide notes when requesting changes.');
    try {
      await financeManagerApi.requestChanges(selectedProposal.id, reviewNotes);
      alert('Change request sent.');
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleReject = async () => {
    if (!selectedProposal) return;
    if (!reviewNotes) return alert('Please provide a reason for rejection.');
    if (confirm('Reject this budget request?')) {
      try {
        await financeManagerApi.rejectProposal(selectedProposal.id, reviewNotes);
        alert('Budget request rejected.');
        fetchProposals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading && proposals.length === 0) return <div className="p-12 flex justify-center text-slate-500"><Activity className="animate-spin" /> Loading approvals...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div>
        <h1 className="text-[30px] font-black text-[#0A192F]">Budget Approval Workflow</h1>
        <p className="text-[15px] text-slate-500 mt-1">Review and approve department budget requests</p>
      </div>
      
      <div className="flex gap-6">
        <div className="w-[36%] space-y-3">
          {proposals.length === 0 ? (
            <div className="text-center p-8 bg-white border border-slate-200 rounded-xl">No pending proposals.</div>
          ) : proposals.map(p => (
            <button key={p.id} onClick={() => handleSelectProposal(p)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedProposal?.id === p.id ? 'border-[#0052FF] bg-[#0052FF]/5' : 'border-[#d1d5db] hover:border-slate-300 bg-white'}`}
            >
              <h3 className="font-bold text-[14px] text-slate-900 mb-1">{p.title}</h3>
              <p className="text-[12px] text-slate-500 mb-3">{p.department} · {p.submittedBy}</p>
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-black text-slate-900">₱{p.amount.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    p.status.toLowerCase() === 'pending' ? 'bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/40' : 
                    p.status.toLowerCase() === 'approved' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 
                    p.status.toLowerCase() === 'frozen' ? 'bg-red-100 text-red-500 border border-red-200' : 
                    p.status.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex-1">
          {selectedProposal ? (
            <div className="bg-white rounded-xl p-7 border border-[#d1d5db] shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[24px] font-bold text-slate-900">{selectedProposal.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedProposal.department} · {selectedProposal.category}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">Priority: {selectedProposal.priority}</span>
                </div>
              </div>

              {selectedProposal.justification && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                  <strong>Justification:</strong><br/>
                  {selectedProposal.justification}
                </div>
              )}
              
              <table className="w-full mb-5 text-[13px]">
                <thead className="bg-slate-50 border-b border-[#d1d5db]">
                  <tr>
                    {['Item', 'Qty', 'Unit Cost', 'Total', 'Action'].map(h => (
                      <th key={h} className={`px-4 py-2.5 font-black text-[11px] text-slate-500 uppercase tracking-wider ${h === 'Action' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingItems ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">Loading items...</td></tr>
                  ) : lineItems.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-slate-500">No line items attached.</td></tr>
                  ) : lineItems.map((li: any) => {
                    const isRejected = rejectedItems.includes(li.lineItemId);
                    return (
                    <tr key={li.lineItemId} className={`border-b border-slate-100 ${isRejected ? 'opacity-50 bg-slate-50' : ''}`}>
                      <td className={`px-4 py-3 ${isRejected ? 'line-through text-slate-400' : ''}`}>{li.description}</td>
                      <td className={`px-4 py-3 ${isRejected ? 'line-through text-slate-400' : ''}`}>{li.quantity}</td>
                      <td className={`px-4 py-3 font-mono ${isRejected ? 'line-through text-slate-400' : ''}`}>₱{li.unitCost.toLocaleString()}</td>
                      <td className={`px-4 py-3 font-mono font-bold ${isRejected ? 'line-through text-slate-400' : ''}`}>₱{li.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => toggleItemRejection(li.lineItemId)} className="flex items-center gap-1 justify-end text-xs font-bold w-full">
                          {isRejected ? (
                            <span className="text-slate-400 flex items-center gap-1"><ToggleLeft className="w-4 h-4" /> Excluded</span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1"><ToggleRight className="w-4 h-4" /> Included</span>
                          )}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-[13px] font-bold">Adjusted Total:</td>
                    <td colSpan={2} className="px-4 py-3 font-mono font-black text-[17px] text-[#0052FF]">
                      ₱{activeTotal.toLocaleString()}
                      {rejectedItems.length > 0 && <span className="ml-2 text-xs font-normal text-slate-400 line-through">₱{selectedProposal.amount.toLocaleString()}</span>}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {selectedProposal.status.toLowerCase() === 'pending' && (
                <div className="bg-slate-50 rounded-xl p-5 border border-[#e5e7eb]">
                  <h3 className="font-bold text-[14px] text-slate-900 mb-3">Finance Manager Review</h3>
                  
                  {isOverBudget && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex gap-3 text-sm">
                      <TriangleAlert className="w-5 h-5 shrink-0 text-red-500" />
                      <div>
                        <strong>Budget Impact Warning:</strong> Approving this request will push the {selectedProposal.department} department over its allocated budget cap for the quarter.
                        <div className="mt-1 font-mono text-xs text-red-600">Cap: ₱{deptCap.toLocaleString()} · Spent + Request: ₱{(deptSpent + activeTotal).toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  <textarea 
                    value={reviewNotes} 
                    onChange={e => setReviewNotes(e.target.value)} 
                    placeholder="Add review notes or conditions (Required for rejection/changes)..." 
                    className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg mb-4 focus:ring-2 focus:ring-[#0052FF]/30 outline-none text-[13px] bg-white" 
                    rows={3} 
                  />
                  <div className="flex gap-2.5">
                    <button onClick={handleApprove} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all">
                      <CheckCircle2 className="w-4 h-4" />Approve
                    </button>
                    <button onClick={handleRequestChanges} className="flex-1 border-2 border-[#F59E0B] text-[#D97706] hover:bg-[#F59E0B]/5 px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all">
                      <AlertCircle className="w-4 h-4" />Request Changes
                    </button>
                    <button onClick={handleReject} className="px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all border border-transparent">
                      <XCircle className="w-4 h-4" />Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-12 text-center text-slate-400 border border-slate-200">
              Select a proposal to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}