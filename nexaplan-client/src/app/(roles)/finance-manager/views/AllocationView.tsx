import React, { useState, useEffect } from 'react';
import { Plus, ArrowRightLeft, X, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';

export function AllocationView() {
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ from: '', to: '', amount: '' });
  const [allocData, setAllocData] = useState<any>(null);
  
  // UI Modals
  const [showNewAlloc, setShowNewAlloc] = useState(false);
  const [modalMessage, setModalMessage] = useState<{title: string, message: string, type: 'error' | 'success' | 'info'} | null>(null);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const data = await financeManagerApi.getAllocations();
      setAllocData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.from || !transferForm.to || !transferForm.amount) return setModalMessage({ title: 'Error', message: 'Please fill out all fields.', type: 'error' });
    const amt = parseFloat(transferForm.amount);
    if (isNaN(amt) || amt <= 0) return setModalMessage({ title: 'Error', message: 'Invalid amount.', type: 'error' });
    if (transferForm.from === transferForm.to) return setModalMessage({ title: 'Error', message: 'Cannot transfer to the same department.', type: 'error' });

    try {
      await financeManagerApi.transferFunds(transferForm.from, transferForm.to, amt);
      setModalMessage({ title: 'Success', message: 'Funds transferred successfully.', type: 'success' });
      setShowTransfer(false);
      setTransferForm({ from: '', to: '', amount: '' });
      fetchAllocations();
    } catch (err: any) {
      setModalMessage({ title: 'Transfer Failed', message: err.message || 'An error occurred during transfer.', type: 'error' });
    }
  };

  if (!allocData) return <div className="p-12 text-center text-slate-500">Loading allocations...</div>;

  return (
    <div className="relative h-full flex overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${selectedDept ? 'pr-96' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[30px] font-black text-[#0A192F]">Budget Allocation Overview</h1>
            <p className="text-[15px] text-slate-500 mt-1">Total budget distribution across all departments</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />Transfer Funds
            </button>
            <button 
              onClick={() => setShowNewAlloc(true)}
              className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />New Allocation
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-5 mb-6">
          {[
            {label:'Total Allocated',val:`₱${allocData.totalAllocated.toLocaleString()}`,sub:'100% distributed',c:'#10B981'},
            {label:'Pending Requests',val:allocData.pendingRequests.toString(),sub:'Requires review',c:'#D97706'},
            {label:'Approved This Month',val:allocData.approvedCountThisMonth.toString(),sub:`₱${allocData.approvedThisMonth.toLocaleString()} total`,c:'#10B981'},
            {label:'Departments',val:allocData.activeDepartments.toString(),sub:'All active',c:'#0A192F'}
          ].map((k,i)=>(
            <div key={i} className="bg-white rounded-xl p-5 border border-[#d1d5db] shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{k.label}</div>
              <div className="text-[28px] font-black mb-1" style={{color:k.c}}>{k.val}</div>
              <div className="text-[13px] text-slate-500">{k.sub}</div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl border border-[#d1d5db] p-6 shadow-sm">
          <h2 className="text-[20px] font-bold text-slate-900 mb-5">Department Budget Distribution</h2>
          <p className="text-sm text-slate-500 mb-4">Click on any department to view their approved proposals breakdown.</p>
          <div className="space-y-4">
            {allocData.departments.map((dept: any)=>{
              return (
                <div 
                  key={dept.name} 
                  onClick={() => setSelectedDept(dept)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all border border-transparent ${selectedDept?.name === dept.name ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}
                >
                  <div className="w-28 font-bold text-[14px] text-slate-800">{dept.name}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#0052FF] h-2 rounded-full transition-all duration-500" style={{width:`${dept.pct}%`}}/>
                  </div>
                  <div className="w-32 text-right font-mono font-bold text-[13px] text-slate-800">₱{dept.amount.toLocaleString()}</div>
                  <div className="w-12 text-right text-[13px] text-slate-500">{dept.pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drill-Down Slide-Out Panel */}
      {selectedDept && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-slate-200 z-40 animate-in slide-in-from-right duration-300 flex flex-col pt-16">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-black text-lg text-slate-900">{selectedDept.name}</h3>
              <p className="text-xs text-slate-500">Approved Proposals Breakdown</p>
            </div>
            <button onClick={() => setSelectedDept(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedDept.approvedProposals.length === 0 ? (
              <div className="text-center text-slate-500 py-10">No approved proposals yet.</div>
            ) : selectedDept.approvedProposals.map((prop: any) => (
              <div key={prop.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-sm transition-all bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-sm text-slate-800">{prop.title}</div>
                  <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <div className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> ID: PRJ-{prop.id}</div>
                  <div className="font-mono font-bold text-slate-700 text-sm">₱{prop.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="text-xs font-bold text-blue-800 uppercase mb-1">Total Analyzed</div>
              <div className="text-xl font-black text-blue-900">₱{selectedDept.spent.toLocaleString()}</div>
              <div className="text-xs text-blue-600 mt-1">Remaining unallocated: ₱{(selectedDept.amount - selectedDept.spent).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-slate-900">Reallocate Funds</h3>
              <button onClick={() => setShowTransfer(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">From Department (Surplus)</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={transferForm.from}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, from: e.target.value }))}
                >
                  <option value="">Select source department...</option>
                  {allocData.departments.map((d: any) => <option key={d.name} value={d.name}>{d.name} (₱{d.amount.toLocaleString()})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">To Department (Deficit)</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={transferForm.to}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                >
                  <option value="">Select target department...</option>
                  {allocData.departments.map((d: any) => <option key={d.name} value={d.name}>{d.name} (₱{d.amount.toLocaleString()})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Amount to Transfer (₱)</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="e.g. 50000"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={handleTransfer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                <ArrowRightLeft className="w-4 h-4" /> Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Allocation Modal (Coming Soon / UI only) */}
      {showNewAlloc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-slate-900">New Allocation</h3>
              <button onClick={() => setShowNewAlloc(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-sm text-slate-600 mb-6 text-center">
              Global baseline allocations are typically generated at the beginning of the fiscal year by the platform engine. Manual arbitrary allocation creation is coming in a future update.
            </div>
            <button 
              onClick={() => setShowNewAlloc(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center transition-all"
            >
              Close
            </button>
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
              {modalMessage.type === 'error' ? <X className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">{modalMessage.title}</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage.message}</p>
            <button 
              onClick={() => setModalMessage(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}