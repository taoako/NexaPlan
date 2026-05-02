import React, { useState } from 'react';
import { Plus, Search, Filter, FileText, Calendar, Edit3, Copy } from 'lucide-react';
import { Proposal, ModuleView } from '../DepartmentHeadSystem'; // Adjust import path if needed

interface ProposalsViewProps {
  proposals: Proposal[];
  setActiveModule: (module: ModuleView) => void;
}

export function ProposalsView({ proposals, setActiveModule }: ProposalsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', dot: 'bg-[#6366F1]' };
      case 'pending': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' };
      case 'changes-requested': return { bg: 'bg-[#EC4899]/10', text: 'text-[#EC4899]', dot: 'bg-[#EC4899]' };
      case 'approved': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', dot: 'bg-[#10B981]' };
      case 'rejected': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', dot: 'bg-[#EF4444]' };
      case 'frozen': return { bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-600' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-600' };
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'frozen') return 'Frozen: Scenario Restrictions';
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">My Budget Proposals</h1>
          <p className="text-slate-600 mt-2">Track and manage all your budget requests</p>
        </div>
        <button
          onClick={() => setActiveModule('new-request')}
          className="flex items-center gap-2 bg-[#6366F1] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Filtering and Search */}
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
            <option value="changes-requested">Changes Requested</option>
            <option value="draft">Draft</option>
          </select>
          <Filter className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Proposal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProposals.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No proposals found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          filteredProposals.map((proposal) => {
            const statusColor = getStatusColor(proposal.status);
            return (
              <div key={proposal.id} className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-[#6366F1] hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{proposal.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{proposal.submittedDate}</div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">{proposal.priority}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 ${proposal.status === 'frozen' ? 'bg-red-100 text-red-600' : statusColor.bg} ${proposal.status === 'frozen' ? '' : statusColor.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                    <div className={`w-2 h-2 ${proposal.status === 'frozen' ? 'bg-red-600' : statusColor.dot} rounded-full`}></div>
                    {getStatusText(proposal.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className={proposal.status === 'frozen' ? 'opacity-50 grayscale' : ''}>
                    <div className="text-sm text-slate-600 mb-1">Requested Amount</div>
                    <div className="text-2xl font-black text-slate-900">₱{proposal.amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">Category</div>
                    <div className="text-sm font-bold text-slate-900">{proposal.category}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                    View Details
                  </button>
                  {proposal.status === 'draft' || proposal.status === 'changes-requested' ? (
                    <button onClick={() => setActiveModule('new-request')} className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <button className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-all">
                      <Copy className="w-4 h-4" /> Clone
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}