import React, { useState, useEffect } from 'react';
import { CreditCard, RefreshCw, CheckCircle2, AlertCircle, Clock, ArrowUp, XCircle, RotateCcw, AlertTriangle, Zap, Calendar } from 'lucide-react';
import type { MainAdminBilling } from '../../../../api/mainAdminApi';
import { getPricing, PricingPlan } from '../../../../api/superAdminApi';

interface Props {
  billing: MainAdminBilling | null;
  tenantId: number;
  loading: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpgrade: (action: string, newTier?: string) => Promise<{ checkoutUrl: string }>;
  onCancel: () => Promise<{ message: string }>;
}

const TIERS = [
  { id: 'Starter',      price: '₱499/mo',  seats: 15,  desc: 'Up to 15 seats' },
  { id: 'Professional', price: '₱1,499/mo', seats: 50,  desc: 'Up to 50 seats' },
  { id: 'Enterprise',   price: '₱3,999/mo', seats: 200, desc: 'Up to 200 seats' },
];

export function BillingTab({ billing, tenantId, loading, addToast, onUpgrade, onCancel }: Props) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [dynamicTiers, setDynamicTiers] = useState<PricingPlan[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const tiers = await getPricing();
        setDynamicTiers(tiers);
      } catch (err) {
        console.error('Failed to load pricing tiers:', err);
      } finally {
        setLoadingTiers(false);
      }
    })();
  }, []);

  const handleUpgrade = async (tier: string, action: string) => {
    setActioning(true);
    try {
      const res = await onUpgrade(action, tier);
      if (res.checkoutUrl) {
        addToast('Redirecting to payment…', 'info');
        setTimeout(() => { window.location.href = res.checkoutUrl; }, 800);
      }
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setActioning(false);
    }
  };

  const handleCancel = async () => {
    setActioning(true);
    try {
      const res = await onCancel();
      addToast(res.message, 'info');
      setShowCancelConfirm(false);
    } catch (e: any) {
      addToast(e.message, 'error');
    } finally {
      setActioning(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><RefreshCw className="w-7 h-7 animate-spin text-indigo-400" /></div>;
  if (!billing) return <div className="text-center text-slate-400 py-16">No billing data available.</div>;

  const statusIcon = (s: string) => {
    if (s === 'Paid') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === 'Overdue') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-amber-400" />;
  };
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Paid: 'bg-emerald-100 text-emerald-700', Overdue: 'bg-red-100 text-red-700', Pending: 'bg-amber-100 text-amber-700' };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[s] || 'bg-slate-100 text-slate-500'}`}>{s}</span>;
  };

  const isCancellationPending = billing.status === 'CancellationPending';

  // Calculate remaining days for progress bar
  const daysInCycle = 30; // Assuming monthly cycle for simplicity
  const remainingDays = billing.daysUntilDue || 0;
  const progressPercent = Math.max(0, Math.min(100, (remainingDays / daysInCycle) * 100));

  return (
    <div className="space-y-6 w-full">
      {/* Plan Card */}
      <div className="bg-[#0F172A] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Current Plan
              </span>
              {isCancellationPending && (
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300">
                  Cancellation Pending
                </span>
              )}
            </div>
            <h2 className="text-4xl font-black mt-1 flex items-center gap-3">
              {billing.plan} <Zap className="w-8 h-8 text-indigo-400 fill-indigo-400" />
            </h2>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Subscription {billing.status}
              </div>
              <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4 text-indigo-400" /> Renews on {billing.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <CreditCard className="w-8 h-8 text-indigo-400" />
          </div>
        </div>

        {billing.nextBillingDate && (
          <div className="mt-8 relative z-10">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Time Remaining</p>
                <p className="text-2xl font-black text-white">
                  {billing.daysUntilDue} Days <span className="text-slate-500 text-sm font-normal">until next renewal</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-indigo-400 font-black text-lg">{Math.round(progressPercent)}%</span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">of cycle left</p>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${remainingDays <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-8 flex gap-3 relative z-10">
          {!isCancellationPending && (
            <>
              <button onClick={() => setShowUpgradeModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-sm">
                <ArrowUp className="w-4 h-4" /> Manage Subscription
              </button>
              <button onClick={() => handleUpgrade('Renew', billing.plan)} disabled={actioning} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm disabled:opacity-50">
                <RotateCcw className="w-4 h-4" /> Quick Renew
              </button>
              <button onClick={() => setShowCancelConfirm(true)} className="flex items-center gap-2 text-slate-500 hover:text-red-400 font-bold px-5 py-3 rounded-xl transition-all text-sm ml-auto">
                <XCircle className="w-4 h-4" /> Cancel Plan
              </button>
            </>
          )}
          {isCancellationPending && (
            <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-4 text-amber-200 text-sm font-bold flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <p>Cancellation request is being processed.</p>
                <p className="text-xs font-medium text-amber-200/60 mt-0.5">Your access will continue until {billing.nextBillingDate ? new Date(billing.nextBillingDate).toLocaleDateString() : 'the end of the cycle'}.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-black text-slate-900">Invoice History</h3>
          <p className="text-xs text-slate-500 mt-0.5">Your last {billing.invoices.length} invoices</p>
        </div>
        {billing.invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No invoices yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>{['Invoice #','Amount','Due Date','Payment Method','Status'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {billing.invoices.map(inv => (
                <tr key={inv.invoiceId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">₱{inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(inv.dueDate).toLocaleDateString('en-PH')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">{inv.paymentMethod}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2">{statusIcon(inv.status)}{statusBadge(inv.status)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-black text-slate-900 text-2xl mb-1">Upgrade your strategy</h3>
                <p className="text-slate-500 text-sm">Select a plan to unlock more seats and AI capabilities.</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <XCircle className="w-6 h-6 text-slate-300" />
              </button>
            </div>

            {loadingTiers ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading latest tiers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {dynamicTiers.map(t => (
                  <div 
                    key={t.planID} 
                    onClick={() => handleUpgrade('Upgrade', t.name)} 
                    className={`group flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/30 ${billing.plan === t.name ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' : 'border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-slate-900 text-lg">{t.name}</p>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{t.maxSeats} Seats Included</p>
                      </div>
                      {billing.plan === t.name && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div className="mt-auto">
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2 h-8">{t.description}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-slate-900 text-xl">₱{t.monthlyPrice.toLocaleString()}</span>
                        <span className="text-slate-400 text-[10px] font-bold">/mo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 py-4 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all">Back to dashboard</button>
              <button className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black shadow-xl">Contact Sales for Custom</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4"><XCircle className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Cancel Subscription</h3>
            <p className="text-slate-500 text-sm mb-6">Your plan will remain active until the end of the current billing cycle. This action can be reversed by contacting support.</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={actioning} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">
                {actioning ? 'Processing…' : 'Confirm Cancel'}
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
