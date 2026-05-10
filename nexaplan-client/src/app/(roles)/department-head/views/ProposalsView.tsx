import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Calendar, Edit3, Copy, RefreshCw } from 'lucide-react';
import { ModuleView } from '../DepartmentHeadSystem';
import { deptHeadApi } from '../../../../api/deptHeadApi';

interface ProposalsViewProps {
  setActiveModule: (module: ModuleView) => void;
}

export function ProposalsView({ setActiveModule }: ProposalsViewProps) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const data = await deptHeadApi.getProposals();
      setProposals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (id: number) => {
    try {
      await deptHeadApi.cloneProposal(id);
      fetchProposals();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatchStr = statusFilter.toLowerCase().replace(' ', '');
    const currentStatusStr = p.status.toLowerCase().replace(' ', '');
    const matchesStatus = statusFilter === 'all' || currentStatusStr === statusMatchStr;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'draft') return { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', dot: 'bg-[#6366F1]' };
    if (s === 'pending') return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' };
    if (s === 'changesrequested') return { bg: 'bg-[#EC4899]/10', text: 'text-[#EC4899]', dot: 'bg-[#EC4899]' };
    if (s === 'approved') return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', dot: 'bg-[#10B981]' };
    if (s === 'rejected') return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', dot: 'bg-[#EF4444]' };
    if (s === 'frozen') return { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-600' };
    return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-600' };
  };

  const getStatusText = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'frozen') return 'Frozen: Scenario Restrictions';
    if (s === 'changesrequested') return 'Changes Requested';
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">My Budget Proposals</h1>
          <p className="text-slate-600 mt-2">Track and manage all your budget requests</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProposals} className="p-3 text-slate-500 hover:bg-slate-200 rounded-xl transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setActiveModule('new-request')}
            className="flex items-center gap-2 bg-[#6366F1] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search proposals by title or category..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          />
        </div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="changesrequested">Changes Requested</option>
            <option value="draft">Draft</option>
            <option value="frozen">Frozen</option>
          </select>
          <Filter className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12">Loading proposals...</div>
        ) : filteredProposals.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No proposals found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          filteredProposals.map((proposal) => {
            const statusColor = getStatusColor(proposal.status);
            const isFrozen = proposal.status.toLowerCase() === 'frozen';
            return (
              <div key={proposal.proposalId} className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-[#6366F1] hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{proposal.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(proposal.submittedAt).toLocaleDateString()}
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">{proposal.priority}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${isFrozen ? 'bg-red-100 text-red-600' : statusColor.bg} ${isFrozen ? '' : statusColor.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                    <div className={`w-2 h-2 ${isFrozen ? 'bg-red-600' : statusColor.dot} rounded-full`}></div>
                    {getStatusText(proposal.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className={isFrozen ? 'opacity-50 grayscale' : ''}>
                    <div className="text-sm text-slate-600 mb-1">Requested Amount</div>
                    <div className="text-2xl font-black text-slate-900">₱{proposal.totalAmount?.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">Category</div>
                    <div className="text-sm font-bold text-slate-900">{proposal.category}</div>
                  </div>
                </div>

                {proposal.reviewNotes && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                    <strong>Finance Note:</strong> {proposal.reviewNotes}
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition-all">
                    View Details
                  </button>
                  {proposal.status.toLowerCase() === 'draft' || proposal.status.toLowerCase() === 'changesrequested' ? (
                    <button onClick={() => setModalMessage('Edit is not implemented in this demo.')} className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <button onClick={() => handleClone(proposal.proposalId)} className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-all">
                      <Copy className="w-4 h-4" /> Clone
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="mb-4 w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mx-auto">
              <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">Notice</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage}</p>
            <button onClick={() => setModalMessage(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}