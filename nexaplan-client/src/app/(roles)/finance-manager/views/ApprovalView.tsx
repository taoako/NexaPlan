import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Proposal } from '../FinanceManagerSystem'; // Make sure this path points to your main system file

interface ApprovalViewProps {
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
}

export function ApprovalView({ proposals, setProposals }: ApprovalViewProps) {
  const [selectedProposal, setSelectedProposal] = useState('1');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleApprove = () => { 
    alert('Budget request approved!\n\nProposal: Q3 IT Infrastructure Upgrade\nAmount: ₱145,000'); 
    setReviewNotes(''); 
  };
  
  const handleRequestChanges = () => { 
    alert('Change request sent\n\nNotes: ' + (reviewNotes || 'Please provide additional justification')); 
    setReviewNotes(''); 
  };
  
  const handleReject = () => { 
    if (confirm('Reject this budget request?')) { 
      alert('Budget request rejected'); 
      setReviewNotes(''); 
    } 
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div>
        <h1 className="text-[30px] font-black text-[#0A192F]">Budget Approval Workflow</h1>
        <p className="text-[15px] text-slate-500 mt-1">Review and approve department budget requests</p>
      </div>
      
      <div className="flex gap-6">
        {/* Left: Proposal List */}
        <div className="w-[36%] space-y-3">
          {proposals.map(p => (
            <button key={p.id} onClick={() => setSelectedProposal(p.id)}
              className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedProposal === p.id ? 'border-[#0052FF] bg-[#0052FF]/5' : 'border-[#d1d5db] hover:border-slate-300 bg-white'}`}
              style={{ boxShadow: selectedProposal === p.id ? '0 4px 14px rgba(0,82,255,0.1)' : '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <h3 className="font-bold text-[14px] text-slate-900 mb-1">{p.title}</h3>
              <p className="text-[12px] text-slate-500 mb-3">{p.department} · {p.submittedBy}</p>
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-black text-slate-900">₱{p.amount.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  {p.priority === 'Low' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">Low Prio</span>}
                  {p.priority === 'Mission Critical' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">Critical</span>}
                  {p.priority === 'High' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wider">High Prio</span>}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${p.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/40' : p.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : p.status === 'frozen' ? 'bg-red-100 text-red-500 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Proposal Details */}
        <div className="flex-1">
          <div className="bg-white rounded-xl p-7 border border-[#d1d5db]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h2 className="text-[24px] font-bold text-slate-900 mb-6">Q3 IT Infrastructure Upgrade</h2>
            
            {/* Approval Pipeline */}
            <div className="flex items-center gap-8 mb-6 pb-6 border-b border-slate-100">
              {[
                { icon: CheckCircle2, label: 'Dept Head Approved', sub: 'Carlos Reyes · Mar 18', c: '#10B981' },
                { icon: Clock, label: 'Finance Review Pending', sub: 'Awaiting approval', c: '#D97706' },
                { icon: AlertCircle, label: 'CFO Sign-off', sub: 'Pending', c: '#cbd5e1' }
              ].map(({ icon: Icon, label, sub, c }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" style={{ color: c }} />
                  <div>
                    <div className="font-bold text-[13px]" style={{ color: c }}>{label}</div>
                    <div className="text-[11px] text-slate-400">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-5 text-[13px]">
              <thead className="bg-slate-50 border-b border-[#d1d5db]">
                <tr>
                  {['Item', 'Qty', 'Unit Cost', 'Total'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-black text-[11px] text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">Server Rack X1</td>
                  <td className="px-4 py-3">2</td>
                  <td className="px-4 py-3 font-mono">₱15,000</td>
                  <td className="px-4 py-3 font-mono font-bold">₱30,000</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3">Cloud Security Auth</td>
                  <td className="px-4 py-3">1</td>
                  <td className="px-4 py-3 font-mono">₱115,000</td>
                  <td className="px-4 py-3 font-mono font-bold">₱115,000</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-[13px] font-bold">Total Request:</td>
                  <td className="px-4 py-3 font-mono font-black text-[17px]">₱145,000</td>
                </tr>
              </tfoot>
            </table>

            {/* Review Console */}
            <div className="bg-slate-50 rounded-xl p-5 border border-[#e5e7eb]">
              <h3 className="font-bold text-[14px] text-slate-900 mb-3">Finance Manager Review</h3>
              <textarea 
                value={reviewNotes} 
                onChange={e => setReviewNotes(e.target.value)} 
                placeholder="Add review notes or conditions..." 
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
                <button onClick={handleReject} className="px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all">
                  <XCircle className="w-4 h-4" />Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}