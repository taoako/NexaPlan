import React, { useState } from 'react';
import { CreditCard, RefreshCw, CheckCircle2, AlertCircle, Clock, ArrowUp, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import type { MainAdminBilling } from '../../../../api/mainAdminApi';

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

  return (
    <div className="space-y-6 w-full">
      {/* Plan Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Current Plan</p>
            <h2 className="text-3xl font-black mt-1">{billing.plan} Plan</h2>
            <p className="text-indigo-200 mt-1">
              Status: <span className={`font-bold ${isCancellationPending ? 'text-amber-300' : 'text-white'}`}>{billing.status}</span>
            </p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center"><CreditCard className="w-7 h-7" /></div>
        </div>

        {billing.nextBillingDate && (
          <div className="mt-6 bg-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Next Invoice Due</p>
              <p className="text-2xl font-black">{new Date(billing.nextBillingDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {billing.daysUntilDue !== null && billing.daysUntilDue <= 7 && (
              <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-300/30 rounded-xl px-4 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-300" />
                <span className="text-amber-200 text-sm font-bold">{billing.daysUntilDue} day{billing.daysUntilDue !== 1 ? 's' : ''} left</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          {!isCancellationPending && (
            <>
              <button onClick={() => setShowUpgradeModal(true)} className="flex items-center gap-2 bg-white text-indigo-700 font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-all shadow text-sm">
                <ArrowUp className="w-4 h-4" /> Upgrade / Change Plan
              </button>
              <button onClick={() => handleUpgrade('Renew', billing.plan)} disabled={actioning} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50">
                <RotateCcw className="w-4 h-4" /> Renew Current Plan
              </button>
              <button onClick={() => setShowCancelConfirm(true)} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 font-bold px-4 py-2.5 rounded-xl transition-all text-sm ml-auto">
                <XCircle className="w-4 h-4" /> Cancel Plan
              </button>
            </>
          )}
          {isCancellationPending && (
            <div className="w-full bg-amber-400/20 border border-amber-300/30 rounded-xl px-4 py-3 text-amber-200 text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Cancellation pending — your plan is active until end of billing cycle. Contact support to undo.
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
            <h3 className="font-black text-slate-900 text-xl mb-1">Change Plan</h3>
            <p className="text-slate-500 text-sm mb-6">Select a plan to upgrade or downgrade. You'll be redirected to checkout.</p>
            <div className="space-y-3">
              {TIERS.map(t => (
                <div key={t.id} onClick={() => handleUpgrade('Upgrade', t.id)} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50 ${billing.plan === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                  <div>
                    <p className="font-black text-slate-900">{t.id} {billing.plan === t.id && <span className="text-xs text-indigo-600 ml-2">Current</span>}</p>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </div>
                  <span className="font-black text-indigo-700 text-sm">{t.price}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowUpgradeModal(false)} className="mt-5 w-full py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50">Close</button>
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
