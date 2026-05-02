import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  TrendingUp,
  FileText,
  Calendar
} from 'lucide-react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";

interface BudgetPlanningSystemProps {
  onBack: () => void;
}

type ViewType = 'proposals' | 'approvals' | 'scenarios' | 'reports';
type ProposalStatus = 'draft' | 'pending' | 'changes-requested' | 'approved' | 'rejected';

interface Proposal {
  id: string;
  title: string;
  department: string;
  amount: number;
  status: ProposalStatus;
  submittedBy: string;
}

export function BudgetPlanningSystem({ onBack }: BudgetPlanningSystemProps) {
  const [currentView, setCurrentView] = useState<ViewType>('proposals');
  const [selectedProposal, setSelectedProposal] = useState<string>('1');
  const [reviewNotes, setReviewNotes] = useState('');

  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Q3 IT Infrastructure Upgrade',
      department: 'IT Department',
      amount: 145000,
      status: 'pending',
      submittedBy: 'IT Dept Head'
    },
    {
      id: '2',
      title: 'Marketing Q2 Campaign',
      department: 'Marketing',
      amount: 85000,
      status: 'draft',
      submittedBy: 'Marketing Director'
    },
    {
      id: '3',
      title: 'HR Training Software',
      department: 'Human Resources',
      amount: 12500,
      status: 'approved',
      submittedBy: 'HR Manager'
    }
  ];

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return { bg: 'bg-[#6366F1]/10', text: 'text-[#6366F1]', dot: 'bg-[#6366F1]' };
      case 'pending': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' };
      case 'changes-requested': return { bg: 'bg-[#EC4899]/10', text: 'text-[#EC4899]', dot: 'bg-[#EC4899]' };
      case 'approved': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', dot: 'bg-[#10B981]' };
      case 'rejected': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', dot: 'bg-[#EF4444]' };
    }
  };

  const getStatusText = (status: ProposalStatus) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending': return 'Pending Finance Review';
      case 'changes-requested': return 'Changes Requested';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] font-['Inter']">
      {/* Top Navigation - Navy Blue */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 shrink-0 border-b border-white/10">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Budget Planning</div>
          </div>
        </div>

        {/* Center: Menu Items */}
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentView('proposals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
              currentView === 'proposals' ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Proposals
          </button>
          <button
            onClick={() => setCurrentView('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
              currentView === 'approvals' ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            Approvals
          </button>
          <button
            onClick={() => setCurrentView('scenarios')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
              currentView === 'scenarios' ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Scenarios
          </button>
          <button
            onClick={() => setCurrentView('reports')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
              currentView === 'reports' ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Reports
          </button>
        </div>

        {/* Right: Notifications, Profile */}
        <div className="flex items-center gap-4">
          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#F59E0B] rounded-full" />
          </button>
          <div className="flex items-center gap-2.5 pl-4 border-l border-white/10">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">FM</span>
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white leading-none">Finance Manager</div>
              <div className="text-xs text-slate-400 mt-0.5">Budget Planning</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sub-Header Context Bar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        {/* Left: Fiscal Year & Department Dropdowns */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
              <option>FY 2026</option>
              <option>FY 2025</option>
              <option>FY 2024</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
              <option>View: All Departments</option>
              <option>View: IT Department</option>
              <option>View: Marketing</option>
              <option>View: Human Resources</option>
              <option>View: Operations</option>
            </select>
          </div>
        </div>

        {/* Right: Budget Cap Progress */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Corporate Budget Cap: <span className="font-bold text-slate-900">65% Allocated</span>
          </div>
          <div className="w-64 bg-slate-100 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] h-2.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
          <div className="text-sm font-mono font-bold text-slate-900">
            $3.2M / $5.0M
          </div>
        </div>
      </div>

      {/* Main Content - Master-Detail Split (35/65) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (35%) - Proposal Inbox */}
        <div className="w-[35%] bg-white border-r border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Active Budget Requests</h2>
            <div className="flex gap-3">
              <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
                <option>Status: Pending Review</option>
                <option>Status: All</option>
                <option>Status: Draft</option>
                <option>Status: Approved</option>
              </select>
              <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]">
                <option>Sort by: Amount - High to Low</option>
                <option>Sort by: Date - Newest</option>
                <option>Sort by: Department</option>
              </select>
            </div>
          </div>

          {/* Proposal Cards */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {proposals.map((proposal) => {
              const statusColor = getStatusColor(proposal.status);
              const isSelected = selectedProposal === proposal.id;

              return (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal.id)}
                  className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-[#6366F1] bg-[#6366F1]/5 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <h3 className="text-base font-bold text-slate-900 mb-2">{proposal.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">Submitted by {proposal.submittedBy}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black font-mono text-slate-900">
                      ${proposal.amount.toLocaleString()}.00
                    </div>
                    <div className={`flex items-center gap-2 ${statusColor.bg} ${statusColor.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                      <div className={`w-2 h-2 ${statusColor.dot} rounded-full ${proposal.status === 'pending' ? 'animate-pulse' : ''}`}></div>
                      {getStatusText(proposal.status)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel (65%) - Transaction & Approval Details */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Section A: Proposal Header & Multi-Tier Tracker */}
            <div className="bg-white rounded-lg border border-slate-200 p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Q3 IT Infrastructure Upgrade</h1>
                  <p className="text-sm text-slate-600">Submitted by IT Dept Head • IT Department</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600 mb-1">Total Amount</div>
                  <div className="text-4xl font-black font-mono text-slate-900">$145,000.00</div>
                </div>
              </div>

              {/* Visual Step-Tracker (Multi-tier Workflow) */}
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200"></div>
                <div className="absolute top-6 left-0 w-1/2 h-1 bg-[#10B981]"></div>

                <div className="relative grid grid-cols-4 gap-4">
                  {/* Step 1 - Completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center mb-3 shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 text-center mb-1">Created by IT Dept Head</div>
                    <div className="text-xs text-slate-500">Mar 15, 2026</div>
                  </div>

                  {/* Step 2 - Completed */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center mb-3 shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 text-center mb-1">Approved by IT Director</div>
                    <div className="text-xs text-slate-500">Mar 18, 2026</div>
                  </div>

                  {/* Step 3 - Current */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-[#F59E0B] rounded-full flex items-center justify-center mb-3 shadow-lg animate-pulse">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-xs font-bold text-[#F59E0B] text-center mb-1">Pending Finance Manager Review</div>
                    <div className="text-xs text-slate-500">Awaiting</div>
                  </div>

                  {/* Step 4 - Pending */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-400 text-center mb-1">Final CFO Sign-off</div>
                    <div className="text-xs text-slate-400">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Line-Item Data Grid */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Budget Proposal Line Items</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Item Description</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Unit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Total Request</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Justification/ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">Hardware</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">Server Rack X1</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">2</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">$15,000.00</td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">$30,000.00</td>
                      <td className="px-6 py-4 text-sm text-slate-600">Required for load balancing.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-700">Software</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">Cloud Security Auth</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">1</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">$115,000.00</td>
                      <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">$115,000.00</td>
                      <td className="px-6 py-4 text-sm text-slate-600">Mandatory compliance upgrade.</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-slate-900">Total Request:</td>
                      <td className="px-6 py-4 text-lg font-black font-mono text-slate-900">$145,000.00</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Section C: Action Console (Finance Manager View) */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Finance Manager Review</h3>

              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes or conditions..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] mb-4"
                rows={4}
              ></textarea>

              <div className="flex gap-3">
                <button className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Approve Request
                </button>
                <button className="flex-1 border-2 border-[#EC4899] text-[#EC4899] hover:bg-[#EC4899]/5 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Request Changes
                </button>
                <button className="px-6 py-3 text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
