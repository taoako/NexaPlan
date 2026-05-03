import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, DollarSign, X } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';
import type { InvoiceDto } from '../../../../api/superAdminApi';

export function BillingView() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleSync = async () => {
    try {
      setLoading(true);
      await api.syncInvoices();
      await fetchInvoices();
    } catch (err) {
      console.error('Failed to sync invoices:', err);
      alert('Failed to sync with PayMongo.');
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedInvoice) return;
    setRefundLoading(true);
    try {
      const partial = refundType === 'partial' && partialAmount ? parseFloat(partialAmount) : undefined;
      const result = await api.refundInvoice(selectedInvoice.invoiceID, partial);
      alert(`✅ ${result.message}`);
      setSelectedInvoice(null);
      setPartialAmount('');
      fetchInvoices();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setRefundLoading(false);
    }
  };

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Invoices</div>
          <div className="text-3xl font-black text-slate-900">{invoices.length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Paid Revenue</div>
          <div className="text-3xl font-black text-[#10B981]">₱{totalPaid.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pending</div>
          <div className="text-3xl font-black text-[#F59E0B]">₱{totalPending.toLocaleString()}</div>
          <div className="text-xs text-slate-600 mt-2">{invoices.filter(i => i.status === 'Pending').length} invoices</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue</div>
          <div className="text-3xl font-black text-[#EF4444]">₱{totalOverdue.toLocaleString()}</div>
          <div className="text-xs text-slate-600 mt-2">{invoices.filter(i => i.status === 'Overdue').length} invoices</div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Invoice Management</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleSync} className="bg-[#4F46E5] hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Sync PayMongo
            </button>
            <button onClick={fetchInvoices} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Method</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No invoices found.</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv.invoiceID} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => { setSelectedInvoice(inv); setRefundType('full'); setPartialAmount(''); }}>
                <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{inv.tenantName}</td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">₱{inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{inv.paymentMethod || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                    inv.statusColor === 'green' ? 'bg-[#10B981]/10 text-[#10B981]' :
                    inv.statusColor === 'red' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    inv.statusColor === 'gray' ? 'bg-slate-100 text-slate-500' :
                    'bg-[#F59E0B]/10 text-[#F59E0B]'
                  }`}>{inv.status}</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 bg-[#0F172A] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">{selectedInvoice.invoiceNumber}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedInvoice.payMongoPaymentIntentId || 'No PayMongo ID'}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Tenant', value: selectedInvoice.tenantName },
                  { label: 'Amount', value: `₱${selectedInvoice.amount.toLocaleString()}` },
                  { label: 'Method', value: selectedInvoice.paymentMethod || 'N/A' },
                  { label: 'Due Date', value: new Date(selectedInvoice.dueDate).toLocaleDateString() },
                  { label: 'Status', value: selectedInvoice.status },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</div>
                    <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
              {(selectedInvoice.status === 'Paid' || selectedInvoice.status === 'Overdue') && (
                <div className="border border-slate-200 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#4F46E5]" /> Issue Refund</h3>
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => setRefundType('full')} className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-bold transition-all ${refundType === 'full' ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-[#4F46E5]' : 'border-slate-200 text-slate-600'}`}>Full Refund</button>
                    <button onClick={() => setRefundType('partial')} className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-bold transition-all ${refundType === 'partial' ? 'border-[#4F46E5] bg-[#4F46E5]/5 text-[#4F46E5]' : 'border-slate-200 text-slate-600'}`}>Partial</button>
                  </div>
                  {refundType === 'partial' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Amount (₱)</label>
                      <input type="number" value={partialAmount} onChange={e => setPartialAmount(e.target.value)} max={selectedInvoice.amount} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                  )}
                  <button onClick={handleRefund} disabled={refundLoading || (refundType === 'partial' && !partialAmount)} className="w-full bg-[#EF4444] hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2">
                    {refundLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Process Refund
                  </button>
                </div>
              )}
              <button onClick={() => setSelectedInvoice(null)} className="w-full py-2.5 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}