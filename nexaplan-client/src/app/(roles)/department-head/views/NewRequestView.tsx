import React, { useState, useEffect } from 'react';
import { CheckCircle2, Save, Plus, X, Upload } from 'lucide-react';
import { ModuleView, PriorityLevel } from '../DepartmentHeadSystem';
import { deptHeadApi } from '../../../../api/deptHeadApi';

interface NewRequestViewProps {
  setActiveModule: (module: ModuleView) => void;
}

export function NewRequestView({ setActiveModule }: NewRequestViewProps) {
  const [requestTitle, setRequestTitle] = useState('');
  const [requestCategory, setRequestCategory] = useState('Equipment');
  const [requestPriority, setRequestPriority] = useState<PriorityLevel>('High');
  const [requestJustification, setRequestJustification] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: '', unitCost: '', total: 0, isVatInclusive: true }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [modalMessage, setModalMessage] = useState<{title: string, message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [guardInfo, setGuardInfo] = useState<{ totalAllocatedCap: number; committedFunds: number; remainingCap: number } | null>(null);

  // Auto-save logic placeholder (could be connected to real API if wanted, but standard local save indicator for now)
  useEffect(() => {
    if (requestTitle || lineItems[0].description) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [requestTitle, requestCategory, lineItems, requestJustification, requestPriority]);

  const refreshGuard = async () => {
    try {
      const guard = await deptHeadApi.getAllocationGuard();
      if (guard) {
        setGuardInfo({
          totalAllocatedCap: guard.totalAllocatedCap ?? 0,
          committedFunds: guard.committedFunds ?? 0,
          remainingCap: guard.remainingCap ?? 0,
        });
      }
    } catch (err) {
      console.error('Failed to load allocation guard', err);
    }
  };

  useEffect(() => {
    refreshGuard();
  }, []);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '', unitCost: '', total: 0, isVatInclusive: true }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitCost') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const cost = parseFloat(updated[index].unitCost) || 0;
      updated[index].total = qty * cost;
    }
    setLineItems(updated);
  };

  const totalRequestAmount = lineItems.reduce((sum, item) => sum + item.total, 0);
  const VAT_RATE = 0.12;
  const vatInclusiveTotal = lineItems.filter(li => li.isVatInclusive).reduce((s, li) => s + li.total, 0);
  const vatExclusiveTotal = lineItems.filter(li => !li.isVatInclusive).reduce((s, li) => s + li.total, 0);
  const estimatedVat = vatInclusiveTotal - (vatInclusiveTotal / (1 + VAT_RATE));
  const estimatedBase = vatInclusiveTotal / (1 + VAT_RATE) + vatExclusiveTotal;

  const resolvePriorityRank = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Mission Critical': return 1;
      case 'High': return 2;
      case 'Low': return 3;
      default: return 4;
    }
  };

  const handleSubmitRequest = async (saveAsDraft = false) => {
    if (!requestTitle) return setModalMessage({ title: 'Missing Title', message: 'Please add a request title before submitting.', type: 'error' });
    try {
      setIsSaving(true);
      if (!saveAsDraft) {
        const guard = await deptHeadApi.getAllocationGuard();
        const committed = guard?.committedFunds ?? 0;
        const cap = guard?.totalAllocatedCap ?? 0;
        if (cap > 0 && (committed + totalRequestAmount) > cap) {
          return setModalMessage({
            title: 'Request Exceeds Allocation',
            message: `Request exceeds the allocated departmental ceiling set by the Main Admin. Cap: ₱${cap.toLocaleString()} · Committed: ₱${committed.toLocaleString()} · Requested: ₱${totalRequestAmount.toLocaleString()}.`,
            type: 'error'
          });
        }
      }
      await deptHeadApi.createProposal({
        title: requestTitle,
        category: requestCategory,
        priority: requestPriority,
        priorityRank: resolvePriorityRank(requestPriority),
        justification: requestJustification,
        saveAsDraft,
        isTaxInclusive: lineItems.every(li => li.isVatInclusive),
        lineItems: lineItems.map(li => ({
          description: li.description || "Unnamed Item",
          quantity: parseFloat(li.quantity) || 1,
          unitCost: parseFloat(li.unitCost) || 0,
          isVatInclusive: li.isVatInclusive
        }))
      });
      setModalMessage({ title: 'Success', message: saveAsDraft ? 'Draft saved.' : 'Proposal submitted for review.', type: 'success' });
      refreshGuard();
      setActiveModule('proposals');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error && err.message ? err.message : 'Unable to save the request. Please try again.';
      setModalMessage({ title: 'Save Failed', message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Submit New Budget Request</h1>
          <p className="text-slate-600 mt-2">Create a detailed budget proposal for finance approval</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200">
          {isSaving ? (
            <><div className="w-4 h-4 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div> Saving...</>
          ) : lastSaved ? (
            <><CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Saved at {lastSaved.toLocaleTimeString()}</>
          ) : (
            <><Save className="w-4 h-4" /> Not saved yet</>
          )}
        </div>
      </div>

      {guardInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-blue-700 uppercase tracking-wider">Allocation Guard</div>
            <div className="text-sm text-blue-900">Cap / Committed / Remaining</div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <div className="text-[11px] text-blue-600">Cap</div>
              <div className="font-mono font-bold text-blue-900">₱{guardInfo.totalAllocatedCap.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-blue-600">Committed</div>
              <div className="font-mono font-bold text-blue-900">₱{guardInfo.committedFunds.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-blue-600">Remaining</div>
              <div className={`font-mono font-bold ${guardInfo.remainingCap < 0 ? 'text-red-600' : 'text-blue-900'}`}>
                ₱{guardInfo.remainingCap.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Request Title</label>
              <input
                type="text"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                placeholder="e.g., Q4 Server Infrastructure"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Category</label>
              <select
                value={requestCategory}
                onChange={(e) => setRequestCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] outline-none"
              >
                <option>Equipment</option>
                <option>Software</option>
                <option>Services</option>
                <option>Training</option>
                <option>Technology</option>
                <option>Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">Business Priority</label>
              <select
                value={requestPriority}
                onChange={(e) => setRequestPriority(e.target.value as PriorityLevel)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] outline-none"
              >
                <option value="Mission Critical">Mission Critical</option>
                <option value="High">High Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-bold text-slate-900 mb-2">Business Justification</label>
            <textarea
              value={requestJustification}
              onChange={(e) => setRequestJustification(e.target.value)}
              placeholder="Explain why this budget is necessary..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] outline-none h-24"
            />
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Line Items</h2>
            <button
              onClick={addLineItem}
              className="flex items-center gap-2 bg-[#6366F1] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Line Item
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6366F1] outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Qty</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6366F1] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Unit Cost (₱)</label>
                  <input
                    type="number"
                    value={item.unitCost}
                    onChange={(e) => updateLineItem(index, 'unitCost', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6366F1] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Total</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-900">
                    ₱{item.total.toLocaleString()}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">VAT Inclusive</label>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...lineItems];
                      updated[index] = { ...updated[index], isVatInclusive: !updated[index].isVatInclusive };
                      setLineItems(updated);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                      item.isVatInclusive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded border-2 flex items-center justify-center shrink-0 ${
                      item.isVatInclusive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400'
                    }`}>
                      {item.isVatInclusive && <span className="text-white text-[8px] leading-none">✓</span>}
                    </span>
                    {item.isVatInclusive ? 'Incl. VAT' : 'Excl. VAT'}
                  </button>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => removeLineItem(index)}
                    className="w-full p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="bg-[#6366F1]/10 px-6 py-4 rounded-xl space-y-1">
              <div className="text-sm font-bold text-slate-600 mb-1">Total Request Amount</div>
              <div className="text-3xl font-black text-[#6366F1]">₱{totalRequestAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              {estimatedVat > 0 && (
                <div className="text-xs text-slate-500 space-y-0.5 pt-1 border-t border-[#6366F1]/20 mt-2">
                  <div className="flex justify-between gap-8">
                    <span>Estimated Base (ex-VAT):</span>
                    <span className="font-mono font-bold">₱{estimatedBase.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between gap-8 text-emerald-600">
                    <span>Estimated 12% VAT:</span>
                    <span className="font-mono font-bold">₱{estimatedVat.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handleSubmitRequest(false)}
            disabled={totalRequestAmount === 0 || !requestTitle}
            className="flex-1 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-6 h-6" />
            Submit for Approval
          </button>
          <button 
            onClick={() => handleSubmitRequest(true)}
            disabled={!requestTitle}
            className="px-8 py-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            Save as Draft
          </button>
        </div>
      </div>
      </div>

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
    </>
  );
}