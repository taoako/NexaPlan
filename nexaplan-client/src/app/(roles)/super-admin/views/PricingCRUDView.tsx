import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Star, Info } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';
import type { PricingPlan, PricingBenefit } from '../../../../api/superAdminApi';

export function PricingCRUDView() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Partial<PricingPlan> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await api.getPricingPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async () => {
    if (!editingPlan || !editingPlan.name) return;
    setSaving(true);
    try {
      if (editingPlan.planID) {
        await api.updatePricingPlan(editingPlan.planID, editingPlan);
      } else {
        await api.createPricingPlan(editingPlan);
      }
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('Failed to save plan:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.deletePricingPlan(id);
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan:', err);
    }
  };

  const addBenefit = () => {
    if (!editingPlan) return;
    const benefits = [...(editingPlan.benefits || []), { benefitID: 0, benefitText: '', isIncluded: true }];
    setEditingPlan({ ...editingPlan, benefits });
  };

  const updateBenefit = (index: number, text: string) => {
    if (!editingPlan || !editingPlan.benefits) return;
    const benefits = [...editingPlan.benefits];
    benefits[index].benefitText = text;
    setEditingPlan({ ...editingPlan, benefits });
  };

  const removeBenefit = (index: number) => {
    if (!editingPlan || !editingPlan.benefits) return;
    const benefits = editingPlan.benefits.filter((_, i) => i !== index);
    setEditingPlan({ ...editingPlan, benefits });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-black text-[#0A192F]">Dynamic Pricing Plans</h2>
        <button
          onClick={() => setEditingPlan({ name: '', description: '', monthlyPrice: 0, annualPrice: 0, maxSeats: 0, isPopular: false, isActive: true, benefits: [] })}
          className="flex items-center gap-2 bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" /> Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.planID} className={`bg-white rounded-2xl border-2 p-6 shadow-sm relative transition-all hover:shadow-md ${plan.isPopular ? 'border-[#4F46E5]' : 'border-slate-200'}`}>
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-[#0A192F]">{plan.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPlan({ ...plan })} className="p-2 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(plan.planID)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0A192F]">₱{plan.monthlyPrice.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-bold">/mo</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">₱{plan.annualPrice.toLocaleString()}/mo billed annually</div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Plan Benefits</div>
              {plan.benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{b.benefitText}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Max Seats: {plan.maxSeats}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {plan.isActive ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-[#0F172A] flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black text-white">{editingPlan.planID ? 'Edit Pricing Plan' : 'Create New Plan'}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Plan Name</label>
                  <input type="text" value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none font-bold" placeholder="e.g. Professional" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Short Description</label>
                  <input type="text" value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none" placeholder="e.g. For growing companies with complex needs" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Monthly Price (₱)</label>
                  <input type="number" value={editingPlan.monthlyPrice} onChange={e => setEditingPlan({ ...editingPlan, monthlyPrice: parseFloat(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Annual Price / Mo (₱)</label>
                  <input type="number" value={editingPlan.annualPrice} onChange={e => setEditingPlan({ ...editingPlan, annualPrice: parseFloat(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-2">Max Seats / Users</label>
                  <input type="number" value={editingPlan.maxSeats} onChange={e => setEditingPlan({ ...editingPlan, maxSeats: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#4F46E5] outline-none font-bold" />
                </div>
                <div className="flex items-center gap-8 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={editingPlan.isPopular} onChange={e => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-[#4F46E5]">Most Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={editingPlan.isActive} onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-500">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-black text-slate-500 uppercase">Plan Benefits</label>
                  <button onClick={addBenefit} className="text-[10px] font-black text-[#4F46E5] uppercase hover:underline">+ Add Benefit</button>
                </div>
                <div className="space-y-2">
                  {editingPlan.benefits?.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                      <input
                        type="text"
                        value={b.benefitText}
                        onChange={e => updateBenefit(i, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5] outline-none"
                        placeholder="Benefit description..."
                      />
                      <button onClick={() => removeBenefit(i)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />} {saving ? 'Saving...' : 'Save Plan'}
              </button>
              <button onClick={() => setEditingPlan(null)} className="px-6 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-white transition-all">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
