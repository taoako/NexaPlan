import React, { useState, useEffect } from 'react';
import { Zap, AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import * as api from '../../../../api/superAdminApi';
import type { TrialDto } from '../../../../api/superAdminApi';

interface TrialRequestsViewProps {
  onTrialCountChange: (count: number) => void;
}

export function TrialRequestsView({ onTrialCountChange }: TrialRequestsViewProps) {
  const [trials, setTrials] = useState<TrialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrial, setSelectedTrial] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [approvedCredentials, setApprovedCredentials] = useState<{ email: string, tempPassword: string, company: string } | null>(null);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const data = await api.getTrialRequests();
      setTrials(data);
      onTrialCountChange(data.filter(t => t.status === 'Pending').length);
    } catch (err) {
      console.error('Failed to load trials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrials(); }, []);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      const result = await api.approveTrialRequest(id, reviewNote || undefined);
      
      const req = trials.find(t => t.trialRequestID === id);
      setApprovedCredentials({
        email: req?.email || '',
        tempPassword: result.tempPassword || 'Check backend logs',
        company: req?.companyName || ''
      });
      
      setSelectedTrial(null);
      setReviewNote('');
      fetchTrials();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    setActionLoading(true);
    try {
      const result = await api.rejectTrialRequest(id, reviewNote || undefined);
      alert(`❌ ${result.message}`);
      setSelectedTrial(null);
      setReviewNote('');
      fetchTrials();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Requests</div>
          <div className="text-3xl font-black text-slate-900">{trials.length}</div>
        </div>
        <div className="bg-[#F59E0B]/5 rounded-md p-6 border border-[#F59E0B]/30 shadow-sm">
          <div className="text-xs font-medium text-[#F59E0B] uppercase tracking-wider mb-2">Pending Review</div>
          <div className="text-3xl font-black text-[#F59E0B]">{trials.filter(r => r.status === 'Pending').length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Approved</div>
          <div className="text-3xl font-black text-[#10B981]">{trials.filter(r => r.status === 'Approved').length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rejected</div>
          <div className="text-3xl font-black text-[#EF4444]">{trials.filter(r => r.status === 'Rejected').length}</div>
        </div>
      </div>

      {/* Risk notice */}
      <div className="bg-indigo-50 border border-[#4F46E5]/30 rounded-md p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-[#4F46E5] mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-bold text-[#4F46E5]">Automated Risk Scoring Active</div>
          <div className="text-xs text-slate-600 mt-0.5">Disposable email domains are auto-flagged as high risk.</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Incoming Trial Applications</h2>
          <button onClick={fetchTrials} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Risk</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trials.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">No trial requests found.</td></tr>
            ) : trials.map((req) => (
              <tr key={req.trialRequestID} className={`hover:bg-[#F8FAFC] transition-colors ${selectedTrial === req.trialRequestID ? 'bg-indigo-50/60' : ''} ${req.riskLevel === 'high' && req.status === 'Pending' ? 'border-l-4 border-l-[#EF4444]' : ''}`}>
                <td className="px-6 py-4 text-sm font-mono font-bold text-[#4F46E5]">TR-{String(req.trialRequestID).padStart(3, '0')}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.companyName}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{req.contactName}</td>
                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{req.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                    req.riskLevel === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    req.riskLevel === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#10B981]/10 text-[#10B981]'
                  }`}>
                    {req.riskLevel === 'high' && <AlertTriangle className="w-3 h-3" />}
                    {req.riskLevel === 'high' ? 'High Risk' : req.riskLevel === 'medium' ? 'Medium' : 'Low Risk'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{new Date(req.submittedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                    req.status === 'Pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    req.status === 'Approved' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'Pending' ? 'bg-[#F59E0B] animate-pulse' : req.status === 'Approved' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {req.status === 'Pending' ? (
                    <button onClick={() => { setSelectedTrial(req.trialRequestID); setReviewNote(''); }} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold hover:underline">Review →</button>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { setSelectedTrial(req.trialRequestID); setReviewNote(''); }} className="text-slate-600 hover:text-slate-900 text-sm font-bold hover:underline self-start">View Details</button>
                      <span className="text-xs text-slate-400 italic truncate max-w-[150px]" title={req.reviewNotes}>{req.reviewNotes}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Dossier */}
      {selectedTrial && (() => {
        const req = trials.find(r => r.trialRequestID === selectedTrial);
        if (!req) return null;
        return (
          <div className="bg-white rounded-md border-2 border-[#4F46E5]/40 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-[#4F46E5]/5 border-b border-[#4F46E5]/20 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-bold text-slate-900">Verification Dossier: <span className="text-[#4F46E5]">{req.companyName}</span></h2>
                <p className="text-sm text-slate-500 mt-0.5">Submitted: {new Date(req.submittedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedTrial(null)} className="p-2 hover:bg-slate-100 rounded-md"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6">
              {req.riskLevel === 'high' && (
                <div className="mb-4 p-3 bg-[#EF4444]/5 border border-[#EF4444]/30 rounded-md flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] mt-0.5 shrink-0" />
                  <div className="text-sm text-[#EF4444]"><span className="font-bold">⚠️ High Risk:</span> Disposable email domain detected. Rejection recommended.</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Company', value: req.companyName },
                  { label: 'Contact', value: req.contactName },
                  { label: 'Email', value: req.email },
                  { label: 'Phone', value: req.phone || 'N/A' },
                  { label: 'Submitted', value: new Date(req.submittedAt).toLocaleDateString() },
                  { label: 'Risk', value: req.riskLevel === 'high' ? '⚠️ High' : req.riskLevel === 'medium' ? '⚡ Medium' : '✅ Low' },
                  ...(req.status === 'Approved' ? [
                    { label: 'Trial Status', value: `Active (${Math.max(0, 14 - Math.floor((new Date().getTime() - new Date(req.reviewedAt || req.submittedAt).getTime()) / (1000 * 3600 * 24)))} days left)` },
                    { label: 'Approved On', value: req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : 'Unknown' }
                  ] : [])
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-md p-4 border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</div>
                    <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Review Notes</label>
                <textarea 
                  value={req.status === 'Pending' ? reviewNote : req.reviewNotes} 
                  onChange={e => req.status === 'Pending' && setReviewNote(e.target.value)} 
                  readOnly={req.status !== 'Pending'}
                  placeholder={req.status === 'Pending' ? "e.g. Verified business registration..." : "No notes provided"} 
                  rows={3} 
                  className={`w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none resize-none ${req.status !== 'Pending' ? 'bg-slate-50 text-slate-500' : 'bg-white'}`} 
                />
              </div>
              <div className="flex gap-4 items-center">
                {req.status === 'Pending' ? (
                  <>
                    <button onClick={() => handleApprove(req.trialRequestID)} disabled={actionLoading} className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-md font-bold shadow-lg transition-all disabled:opacity-50">
                      {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />} Approve
                    </button>
                    <button onClick={() => handleReject(req.trialRequestID)} disabled={actionLoading} className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white px-6 py-3 rounded-md font-bold shadow-lg transition-all disabled:opacity-50">
                      <X className="w-5 h-5" /> Reject
                    </button>
                    <button onClick={() => setSelectedTrial(null)} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-md font-bold">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setSelectedTrial(null)} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-bold transition-all">Close Dossier</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Approved Credentials Modal */}
      {approvedCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-[#10B981] px-6 py-8 text-center relative">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check className="w-8 h-8 text-[#10B981]" />
              </div>
              <h2 className="text-2xl font-black text-white">Trial Approved!</h2>
              <p className="text-emerald-100 font-medium mt-1">An email notification has been sent.</p>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 text-center">
                The 14-day trial for <strong className="text-slate-900">{approvedCredentials.company}</strong> has started. Please securely provide these generated credentials to the client.
              </p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-6">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Login Email</div>
                  <div className="font-mono text-slate-900 font-semibold">{approvedCredentials.email}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Temporary Password</div>
                  <div className="font-mono text-[#4F46E5] font-bold text-lg tracking-wider">{approvedCredentials.tempPassword}</div>
                </div>
              </div>
              
              <button 
                onClick={() => setApprovedCredentials(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}