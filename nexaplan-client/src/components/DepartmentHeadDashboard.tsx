import React, { useState } from 'react';
import {
  Search,
  Bell,
  LogOut,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  GitBranch,
  BarChart3,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  Target,
  Activity
} from 'lucide-react';

interface DepartmentHeadDashboardProps {
  onBack: () => void;
}

type ModuleView = 'overview' | 'proposals' | 'new-request' | 'variance' | 'scenarios';
type ProposalStatus = 'draft' | 'pending' | 'changes-requested' | 'approved' | 'rejected';

interface Proposal {
  id: string;
  title: string;
  amount: number;
  status: ProposalStatus;
  submittedDate: string;
  category: string;
}

export function DepartmentHeadDashboard({ onBack }: DepartmentHeadDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('overview');
  const [selectedProposal, setSelectedProposal] = useState('1');

  // New Request Form State
  const [requestTitle, setRequestTitle] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [requestCategory, setRequestCategory] = useState('Equipment');
  const [requestJustification, setRequestJustification] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: '', unitCost: '', total: 0 }
  ]);

  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Q3 IT Infrastructure Upgrade',
      amount: 145000,
      status: 'pending',
      submittedDate: 'Mar 18, 2026',
      category: 'Equipment'
    },
    {
      id: '2',
      title: 'Cloud Server Migration',
      amount: 89000,
      status: 'approved',
      submittedDate: 'Feb 28, 2026',
      category: 'Technology'
    },
    {
      id: '3',
      title: 'Team Training Budget',
      amount: 25000,
      status: 'changes-requested',
      submittedDate: 'Mar 5, 2026',
      category: 'Training'
    },
    {
      id: '4',
      title: 'Office Equipment',
      amount: 12500,
      status: 'draft',
      submittedDate: 'Mar 20, 2026',
      category: 'Equipment'
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
      case 'pending': return 'Pending Review';
      case 'changes-requested': return 'Changes Requested';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
    }
  };

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

  const handleSubmitRequest = () => {
    alert(`Budget Request Submitted!\n\nTitle: ${requestTitle}\nAmount: ₱${totalRequestAmount.toLocaleString()}\nCategory: ${requestCategory}\n\nYour request has been submitted to Finance Manager for review.`);
    // Reset form
    setRequestTitle('');
    setRequestAmount('');
    setRequestJustification('');
    setLineItems([{ description: '', quantity: '', unitCost: '', total: 0 }]);
    setActiveModule('proposals');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter']">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-gradient-to-r from-[#0A192F] via-[#1A2B3C] to-[#0A192F] flex items-center justify-between px-8 sticky top-0 z-50 shadow-xl border-b border-white/10">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <div>
            <div className="font-black text-2xl leading-none">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-white">Plan</span>
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">DEPARTMENT HEAD - IT DEPARTMENT</div>
          </div>
        </div>

        {/* Center: Module Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModule('overview')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'overview'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Activity className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveModule('proposals')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'proposals'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-5 h-5" />
            My Proposals
          </button>
          <button
            onClick={() => setActiveModule('new-request')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'new-request'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Plus className="w-5 h-5" />
            New Request
          </button>
          <button
            onClick={() => setActiveModule('variance')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'variance'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Variance
          </button>
          <button
            onClick={() => setActiveModule('scenarios')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'scenarios'
                ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <GitBranch className="w-5 h-5" />
            Scenarios
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-5">
          <button className="text-slate-300 hover:text-white transition-all hover:scale-110">
            <Search className="w-6 h-6" />
          </button>
          <button className="relative text-slate-300 hover:text-white transition-all hover:scale-110">
            <Bell className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
          </button>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] text-white rounded-xl w-10 h-10 flex items-center justify-center font-bold shadow-lg">
              DH
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">Carlos Reyes</div>
              <div className="text-xs text-slate-400">IT Department Head</div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        {/* Overview Module */}
        {activeModule === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">IT Department Overview</h1>
              <p className="text-slate-600 mt-2">Budget performance and departmental metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Allocated Budget</div>
                <div className="text-3xl font-black text-slate-900 mb-1">₱850,000</div>
                <div className="text-sm text-[#6366F1]">FY 2026</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Spent to Date</div>
                <div className="text-3xl font-black text-slate-900 mb-1">₱524,000</div>
                <div className="text-sm text-slate-600">61.6% utilized</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Remaining</div>
                <div className="text-3xl font-black text-[#10B981] mb-1">₱326,000</div>
                <div className="text-sm text-slate-600">38.4% available</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Active Proposals</div>
                <div className="text-3xl font-black text-[#F59E0B] mb-1">2</div>
                <div className="text-sm text-slate-600">Under review</div>
              </div>
            </div>

            {/* Budget Utilization Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Monthly Budget Utilization</h2>
              <div className="flex items-end gap-3 h-64 border-b border-slate-200 pb-4">
                {[45, 52, 48, 61, 55, 72, 68, 0, 0, 0, 0, 0].map((percent, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end">
                    <div className="relative group">
                      {percent > 0 && (
                        <>
                          <div
                            className="bg-gradient-to-t from-[#6366F1] to-[#8B5CF6] rounded-t hover:from-[#8B5CF6] hover:to-[#6366F1] transition-all cursor-pointer"
                            style={{ height: `${(percent / 100) * 200}px` }}
                          ></div>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {percent}%
                          </div>
                        </>
                      )}
                      {percent === 0 && (
                        <div className="bg-slate-100 rounded-t h-4"></div>
                      )}
                    </div>
                    <div className="text-xs text-center text-slate-500 mt-2 font-semibold">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded"></div>
                  <span className="text-sm text-slate-600">Budget Utilization</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-100 rounded"></div>
                  <span className="text-sm text-slate-600">Future Months</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {[
                  { action: 'Budget request approved', detail: 'Cloud Server Migration - ₱89,000', time: '2 days ago', status: 'approved' },
                  { action: 'Changes requested', detail: 'Team Training Budget - ₱25,000', time: '5 days ago', status: 'changes' },
                  { action: 'Budget request submitted', detail: 'Q3 IT Infrastructure Upgrade - ₱145,000', time: '1 week ago', status: 'pending' },
                  { action: 'Expense recorded', detail: 'Office365 Licenses - ₱12,400', time: '1 week ago', status: 'expense' }
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'approved' ? 'bg-[#10B981]' :
                        activity.status === 'changes' ? 'bg-[#F59E0B]' :
                        activity.status === 'pending' ? 'bg-[#6366F1]' :
                        'bg-slate-400'
                      }`}></div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{activity.action}</div>
                        <div className="text-xs text-slate-600">{activity.detail}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* My Proposals Module */}
        {activeModule === 'proposals' && (
          <div className="space-y-6">
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

            {/* Proposal Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {proposals.map((proposal) => {
                const statusColor = getStatusColor(proposal.status);
                return (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-[#6366F1] hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{proposal.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {proposal.submittedDate}
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 ${statusColor.bg} ${statusColor.text} px-3 py-1.5 rounded-lg text-xs font-bold`}>
                        <div className={`w-2 h-2 ${statusColor.dot} rounded-full ${proposal.status === 'pending' ? 'animate-pulse' : ''}`}></div>
                        {getStatusText(proposal.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Requested Amount</div>
                        <div className="text-2xl font-black text-slate-900">₱{proposal.amount.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-1">Category</div>
                        <div className="text-sm font-bold text-slate-900">{proposal.category}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition-all">
                        View Details
                      </button>
                      {proposal.status === 'draft' && (
                        <button className="flex items-center gap-2 bg-[#6366F1] hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Request Module */}
        {activeModule === 'new-request' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Submit New Budget Request</h1>
              <p className="text-slate-600 mt-2">Create a detailed budget proposal for finance approval</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-2 gap-6">
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
                </div>
              </div>

              {/* Line Items */}
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

              {/* Justification */}
              <div className="mb-8">
                <label className="block text-xl font-bold text-slate-900 mb-4">Business Justification & ROI</label>
                <textarea
                  value={requestJustification}
                  onChange={(e) => setRequestJustification(e.target.value)}
                  placeholder="Explain why this budget is needed, expected benefits, and return on investment..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#6366F1] outline-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Submit for Approval
                </button>
                <button className="px-8 py-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-lg transition-all flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variance Analysis Module */}
        {activeModule === 'variance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Department Variance Analysis</h1>
              <p className="text-slate-600 mt-2">Compare budgeted vs. actual spending for IT Department</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Budgeted Amount</div>
                <div className="text-3xl font-black text-slate-900">₱850,000</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Actual Spent</div>
                <div className="text-3xl font-black text-slate-900">₱524,000</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Variance</div>
                <div className="text-3xl font-black text-[#10B981]">-₱326,000</div>
                <div className="text-sm text-[#10B981] mt-1">Under budget (38.4%)</div>
              </div>
            </div>

            {/* Detailed Variance Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Category Breakdown</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Budgeted</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Variance</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">% Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { category: 'Hardware', budgeted: 250000, actual: 180000 },
                    { category: 'Software Licenses', budgeted: 320000, actual: 285000 },
                    { category: 'Cloud Services', budgeted: 150000, actual: 42000 },
                    { category: 'Training & Development', budgeted: 80000, actual: 12000 },
                    { category: 'Professional Services', budgeted: 50000, actual: 5000 }
                  ].map((row, i) => {
                    const variance = row.budgeted - row.actual;
                    const percentDiff = ((variance / row.budgeted) * 100).toFixed(1);
                    const isUnder = variance > 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">{row.category}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">₱{row.budgeted.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">₱{row.actual.toLocaleString()}</td>
                        <td className={`px-6 py-4 font-mono font-bold ${isUnder ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isUnder ? '-' : '+'}₱{Math.abs(variance).toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 font-bold ${isUnder ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isUnder ? '-' : '+'}{percentDiff}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scenario Planning Module */}
        {activeModule === 'scenarios' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Budget Scenario Planning</h1>
              <p className="text-slate-600 mt-2">Model different budget scenarios for strategic planning</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Base Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#6366F1] shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#6366F1]" />
                  <h3 className="text-lg font-bold text-[#6366F1]">Base Case</h3>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱850,000</div>
                <p className="text-sm text-slate-600 mb-4">Current approved budget with standard operations</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>All planned projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Regular maintenance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Standard training</span>
                  </li>
                </ul>
              </div>

              {/* Conservative Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#F59E0B] shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="text-lg font-bold text-[#F59E0B]">Conservative (-20%)</h3>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱680,000</div>
                <p className="text-sm text-slate-600 mb-4">Reduced budget scenario for cost-cutting</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-[#EF4444]" />
                    <span>Deferred upgrades</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Critical projects only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-[#EF4444]" />
                    <span>Minimal training</span>
                  </li>
                </ul>
              </div>

              {/* Growth Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#10B981] shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#10B981]" />
                  <h3 className="text-lg font-bold text-[#10B981]">Growth (+30%)</h3>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱1,105,000</div>
                <p className="text-sm text-slate-600 mb-4">Expansion budget for aggressive growth</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>All projects accelerated</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Additional headcount</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Premium tools & training</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Scenario Comparison Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Scenario Comparison</h2>
              <div className="space-y-4">
                {[
                  { name: 'Base Case', amount: 850000, color: 'from-[#6366F1] to-[#8B5CF6]', width: 70 },
                  { name: 'Conservative', amount: 680000, color: 'from-[#F59E0B] to-[#FBBF24]', width: 56 },
                  { name: 'Growth', amount: 1105000, color: 'from-[#10B981] to-[#34D399]', width: 91 }
                ].map((scenario, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">{scenario.name}</span>
                      <span className="font-mono font-bold text-slate-900">₱{scenario.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-8">
                      <div
                        className={`bg-gradient-to-r ${scenario.color} h-8 rounded-full flex items-center justify-end px-4 transition-all duration-1000`}
                        style={{ width: `${scenario.width}%` }}
                      >
                        <span className="text-white text-sm font-bold">{scenario.width}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
