import React, { useState, useEffect } from 'react';
import { Plus, ArrowRightLeft, X, FileText, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';
import { useCurrency } from '../../../../context/CurrencyContext';

export function AllocationView() {
  const { fmt, symbol } = useCurrency();
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ from: '', to: '', amount: '' });
  const [pendingTransfer, setPendingTransfer] = useState<{ from: string; to: string; amount: number } | null>(null);
  const [allocData, setAllocData] = useState<any>(null);
  const [allocForm, setAllocForm] = useState({ departmentId: '', amount: '', mode: 'add' as 'add' | 'subtract' | 'set' });
  const [capWarning, setCapWarning] = useState<string | null>(null);
  
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

    setPendingTransfer({ from: transferForm.from, to: transferForm.to, amount: amt });
  };

  const confirmTransfer = async () => {
    if (!pendingTransfer) return;

    try {
      await financeManagerApi.transferFunds(pendingTransfer.from, pendingTransfer.to, pendingTransfer.amount);
      setModalMessage({ title: 'Success', message: 'Funds transferred successfully.', type: 'success' });
      setShowTransfer(false);
      setTransferForm({ from: '', to: '', amount: '' });
      setPendingTransfer(null);
      fetchAllocations();
    } catch (err: any) {
      setModalMessage({ title: 'Transfer Failed', message: err.message || 'An error occurred during transfer.', type: 'error' });
      setPendingTransfer(null);
    }
  };

  const handleSetAllocation = async () => {
    if (!allocForm.departmentId || !allocForm.amount) return setModalMessage({ title: 'Error', message: 'Please select a department and amount.', type: 'error' });
    const amt = parseFloat(allocForm.amount);
    if (isNaN(amt) || amt < 0) return setModalMessage({ title: 'Error', message: 'Invalid amount.', type: 'error' });

    try {
      const result = await financeManagerApi.adjustAllocation(parseInt(allocForm.departmentId, 10), amt, allocForm.mode);
      if (result.warning) {
        setCapWarning(result.warning);
        fetchAllocations();
      } else {
        setModalMessage({ title: 'Success', message: 'Allocation updated successfully.', type: 'success' });
        setShowNewAlloc(false);
        setAllocForm({ departmentId: '', amount: '', mode: 'add' });
        setCapWarning(null);
        fetchAllocations();
      }
    } catch (err: any) {
      setModalMessage({ title: 'Update Failed', message: err.message || 'Failed to update allocation.', type: 'error' });
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
            {label:'Company Budget',val:fmt(allocData.totalCompanyBudget),sub:'Total pool',c:'#0F172A'},
            {label:'Total Allocated',val:fmt(allocData.totalAllocated),sub:`${(((allocData.totalAllocated || 0) / (allocData.totalCompanyBudget || 1)) * 100).toFixed(1)}% distributed`,c:'#0052FF'},
            {label:'Pending Requests',val:(allocData.pendingRequests || 0).toString(),sub:'Requires review',c:'#D97706'},
            {label:'Approved This Month',val:(allocData.approvedCountThisMonth || 0).toString(),sub:`${fmt(allocData.approvedThisMonth)} total`,c:'#10B981'},
          ].map((k,i)=>(
            <div key={i} className="bg-white rounded-xl p-5 border border-[#d1d5db] shadow-sm relative overflow-hidden group">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">{k.label}</div>
              <div className="text-[26px] font-black mb-1 relative z-10" style={{color:k.c}}>{k.val}</div>
              <div className="text-[13px] text-slate-500 relative z-10">{k.sub}</div>
              {i === 1 && (
                <div className="absolute bottom-0 left-0 h-1 bg-blue-100 w-full">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${Math.min(100, ((allocData.totalAllocated || 0) / (allocData.totalCompanyBudget || 1)) * 100)}%`}} />
                </div>
              )}
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
                    <div className="bg-[#0052FF] h-2 rounded-full transition-all duration-500" style={{width:`${dept.pct || 0}%`}}/>
                  </div>
                  <div className="w-32 text-right font-mono font-bold text-[13px] text-slate-800">{fmt(dept.amount)}</div>
                  <div className="w-12 text-right text-[13px] text-slate-500">{(dept.pct || 0).toFixed(1)}%</div>
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
                  <div className="font-mono font-bold text-slate-700 text-sm">{fmt(prop.amount)}</div>
                </div>
              </div>
            ))}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="text-xs font-bold text-blue-800 uppercase mb-1">Total Analyzed</div>
              <div className="text-xl font-black text-blue-900">{fmt(selectedDept.spent)}</div>
              <div className="text-xs text-blue-600 mt-1">Remaining unallocated: {fmt((selectedDept.amount || 0) - (selectedDept.spent || 0))}</div>
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
                  {allocData.departments.map((d: any) => <option key={d.name} value={d.name}>{d.name} ({fmt(d.amount)})</option>)}
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
                  {allocData.departments.map((d: any) => <option key={d.name} value={d.name}>{d.name} ({fmt(d.amount)})</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Amount to Transfer ({symbol})</label>
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

      {/* New Allocation Modal */}
      {showNewAlloc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900">Set Department Cap</h3>
                  <p className="text-xs text-slate-500">Update the annual budget ceiling for a department</p>
                </div>
              </div>
              <button onClick={() => { setShowNewAlloc(false); setCapWarning(null); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Select Department</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                  value={allocForm.departmentId}
                  onChange={(e) => setAllocForm(prev => ({ ...prev, departmentId: e.target.value }))}
                >
                  <option value="">-- Choose a Department --</option>
                  {allocData.departments.map((d: any) => (
                    <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                  ))}
                </select>
              </div>

              {allocForm.departmentId && (() => {
                const d = allocData.departments.find((x: any) => x.departmentId === parseInt(allocForm.departmentId));
                if (!d) return null;
                const remainingGlobal = allocData.totalCompanyBudget - allocData.totalAllocated + d.amount;
                
                return (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Current Allocation</div>
                      <div className="font-mono font-bold text-slate-700">{fmt(d.amount)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Actual Spent</div>
                      <div className="font-mono font-bold text-emerald-600">{fmt(d.spent)}</div>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Global Budget Remaining</div>
                      <div className="font-mono font-bold text-blue-600">{fmt(remainingGlobal)}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight italic">
                        Max amount you can allocate to this department without exceeding the company's total annual budget.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {capWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-0.5">ML Allocation Advisory</div>
                    <p className="text-xs text-amber-700 leading-relaxed">{capWarning}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Adjustment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'add', label: 'Add to Budget' },
                    { id: 'subtract', label: 'Subtract from Budget' },
                    { id: 'set', label: 'Set Absolute Cap' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setAllocForm(p => ({ ...p, mode: mode.id as any }))}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        allocForm.mode === mode.id 
                          ? 'bg-[#0052FF] border-[#0052FF] text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                  {allocForm.mode === 'add' ? `Amount to Add (${symbol})` : allocForm.mode === 'subtract' ? `Amount to Subtract (${symbol})` : `New Annual Cap (${symbol})`}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-10 py-4 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none font-mono text-xl font-black text-slate-900"
                    placeholder="0"
                    value={allocForm.amount}
                    onChange={(e) => setAllocForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSetAllocation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <CheckCircle2 className="w-5 h-5" /> Update Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Confirmation */}
      {pendingTransfer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="mb-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-blue-100 text-blue-500">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">Confirm Transfer</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Move {fmt(pendingTransfer.amount)} from {pendingTransfer.from} to {pendingTransfer.to}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmTransfer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setPendingTransfer(null)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
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