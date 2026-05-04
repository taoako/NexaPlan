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
    { description: '', quantity: '', unitCost: '', total: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '', unitCost: '', total: 0 }]);
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

  const handleSubmitRequest = async (saveAsDraft = false) => {
    if (!requestTitle) return alert("Title is required");
    try {
      setIsSaving(true);
      await deptHeadApi.createProposal({
        title: requestTitle,
        category: requestCategory,
        priority: requestPriority,
        justification: requestJustification,
        saveAsDraft,
        lineItems: lineItems.map(li => ({
          description: li.description || "Unnamed Item",
          quantity: parseFloat(li.quantity) || 1,
          unitCost: parseFloat(li.unitCost) || 0
        }))
      });
      alert(saveAsDraft ? "Draft saved!" : "Proposal submitted for review!");
      setActiveModule('proposals');
    } catch (err) {
      console.error(err);
      alert("Error saving request.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
                <div className="col-span-5">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#6366F1] outline-none"
                  />
                </div>
                <div className="col-span-2">
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
            <div className="bg-[#6366F1]/10 px-6 py-4 rounded-xl">
              <div className="text-sm font-bold text-slate-600 mb-1">Total Request Amount</div>
              <div className="text-3xl font-black text-[#6366F1]">₱{totalRequestAmount.toLocaleString()}</div>
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
  );
}