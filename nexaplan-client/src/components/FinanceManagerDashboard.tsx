import React, { useState } from 'react';
import {
  DollarSign,
  CheckSquare,
  TrendingUp,
  GitBranch,
  BarChart3,
  Bell,
  Search,
  LogOut,
  User,
  Calendar,
  Building2,
  Zap,
  Plus,
  Download,
  Filter,
  ChevronDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface FinanceManagerDashboardProps {
  onBack: () => void;
}

type ModuleView = 'allocation' | 'approval' | 'forecasting' | 'scenarios' | 'variance';

export function FinanceManagerDashboard({ onBack }: FinanceManagerDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('allocation');
  const [selectedProposal, setSelectedProposal] = useState('1');
  const [reviewNotes, setReviewNotes] = useState('');

  const proposals = [
    { id: '1', title: 'Q3 IT Infrastructure Upgrade', department: 'IT', amount: 145000, status: 'pending', submittedBy: 'Carlos Reyes' },
    { id: '2', title: 'Marketing Q2 Campaign', department: 'Marketing', amount: 85000, status: 'draft', submittedBy: 'Lena Aguilar' },
    { id: '3', title: 'HR Training Software', department: 'HR', amount: 12500, status: 'approved', submittedBy: 'Jose Mendoza' },
  ];

  const handleApprove = () => {
    alert('Budget request approved!\n\nProposal: Q3 IT Infrastructure Upgrade\nAmount: ₱145,000\nStatus: Approved by Finance Manager');
    setReviewNotes('');
  };

  const handleRequestChanges = () => {
    alert('Change request sent to Department Head\n\nNotes: ' + (reviewNotes || 'Please provide additional justification'));
    setReviewNotes('');
  };

  const handleReject = () => {
    if (confirm('Are you sure you want to reject this budget request?')) {
      alert('Budget request rejected');
      setReviewNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter']">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-gradient-to-r from-[#0A192F] via-[#1A2B3C] to-[#0A192F] flex items-center justify-between px-8 sticky top-0 z-50 shadow-xl border-b border-white/10">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0052FF] to-[#0041cc] rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <div>
            <div className="font-black text-2xl leading-none">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-white">Plan</span>
            </div>
            <div className="text-xs font-bold text-slate-400 mt-0.5">FINANCE MANAGER</div>
          </div>
        </div>

        {/* Center: Module Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModule('allocation')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'allocation'
                ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Budget Allocation
          </button>
          <button
            onClick={() => setActiveModule('approval')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'approval'
                ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            Approvals
          </button>
          <button
            onClick={() => setActiveModule('forecasting')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'forecasting'
                ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            AI Forecasting
          </button>
          <button
            onClick={() => setActiveModule('scenarios')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'scenarios'
                ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <GitBranch className="w-5 h-5" />
            Scenarios
          </button>
          <button
            onClick={() => setActiveModule('variance')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              activeModule === 'variance'
                ? 'bg-[#0052FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Variance Analysis
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
            <div className="bg-gradient-to-br from-[#0052FF] to-[#0041cc] text-white rounded-xl w-10 h-10 flex items-center justify-center font-bold shadow-lg">
              FM
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-white">Finance Manager</div>
              <div className="text-xs text-slate-400">Maria Santos</div>
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
        {/* Budget Allocation Module */}
        {activeModule === 'allocation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-[#0A192F]">Budget Allocation Overview</h1>
                <p className="text-slate-600 mt-2">Total budget distribution across all departments</p>
              </div>
              <button className="flex items-center gap-2 bg-[#0052FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">
                <Plus className="w-5 h-5" />
                New Allocation
              </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Total Allocated</div>
                <div className="text-3xl font-black text-slate-900 mb-1">₱5,000,000</div>
                <div className="text-sm text-[#10B981]">100% distributed</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Pending Requests</div>
                <div className="text-3xl font-black text-[#F59E0B]">4</div>
                <div className="text-sm text-slate-600">Requires review</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Approved This Month</div>
                <div className="text-3xl font-black text-[#10B981]">8</div>
                <div className="text-sm text-slate-600">₱1,250,000 total</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Departments</div>
                <div className="text-3xl font-black text-slate-900">8</div>
                <div className="text-sm text-slate-600">All active</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Department Budget Distribution</h2>
              <div className="space-y-4">
                {['IT', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Legal', 'Procurement'].map((dept, i) => {
                  const amounts = [850000, 620000, 540000, 380000, 720000, 450000, 280000, 360000];
                  const percentages = [17, 12.4, 10.8, 7.6, 14.4, 9, 5.6, 7.2];
                  return (
                    <div key={dept} className="flex items-center gap-4">
                      <div className="w-32 font-bold text-slate-900">{dept}</div>
                      <div className="flex-1">
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-[#0052FF] to-[#0041cc] h-3 rounded-full"
                            style={{ width: `${percentages[i]}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-32 text-right font-mono font-bold text-slate-900">₱{amounts[i].toLocaleString()}</div>
                      <div className="w-20 text-right text-sm text-slate-600">{percentages[i]}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Budget Approval Module */}
        {activeModule === 'approval' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Budget Approval Workflow</h1>
              <p className="text-slate-600 mt-2">Review and approve department budget requests</p>
            </div>

            <div className="flex gap-6">
              {/* Proposal List */}
              <div className="w-[35%] space-y-4">
                {proposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    onClick={() => setSelectedProposal(proposal.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      selectedProposal === proposal.id
                        ? 'border-[#0052FF] bg-[#0052FF]/5 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-bold text-slate-900 mb-2">{proposal.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{proposal.department} • {proposal.submittedBy}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-black text-slate-900">₱{proposal.amount.toLocaleString()}</div>
                      <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        proposal.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                        proposal.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {proposal.status.toUpperCase()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Proposal Details */}
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Q3 IT Infrastructure Upgrade</h2>

                  {/* Approval Workflow Tracker */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                        <div>
                          <div className="font-bold text-sm">Department Head Approved</div>
                          <div className="text-xs text-slate-500">Carlos Reyes • Mar 18</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-[#F59E0B]" />
                        <div>
                          <div className="font-bold text-sm text-[#F59E0B]">Pending Finance Review</div>
                          <div className="text-xs text-slate-500">Awaiting approval</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-slate-300" />
                        <div>
                          <div className="font-bold text-sm text-slate-400">Final CFO Sign-off</div>
                          <div className="text-xs text-slate-400">Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <table className="w-full mb-6">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Unit Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm">Server Rack X1</td>
                        <td className="px-4 py-3 text-sm">2</td>
                        <td className="px-4 py-3 text-sm font-mono">₱15,000</td>
                        <td className="px-4 py-3 text-sm font-mono font-bold">₱30,000</td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-3 text-sm">Cloud Security Auth</td>
                        <td className="px-4 py-3 text-sm">1</td>
                        <td className="px-4 py-3 text-sm font-mono">₱115,000</td>
                        <td className="px-4 py-3 text-sm font-mono font-bold">₱115,000</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Total Request:</td>
                        <td className="px-4 py-3 text-lg font-mono">₱145,000</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Review Section */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h3 className="font-bold text-slate-900 mb-4">Finance Manager Review</h3>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add review notes or conditions..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:ring-2 focus:ring-[#0052FF] outline-none"
                      rows={3}
                    ></textarea>
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Approve Request
                      </button>
                      <button
                        onClick={handleRequestChanges}
                        className="flex-1 border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/5 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <AlertCircle className="w-5 h-5" />
                        Request Changes
                      </button>
                      <button
                        onClick={handleReject}
                        className="px-6 py-3 text-[#EF4444] hover:bg-[#EF4444]/5 rounded-xl font-bold flex items-center gap-2 transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Forecasting Module */}
        {activeModule === 'forecasting' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">AI-Powered Financial Forecasting</h1>
              <p className="text-slate-600 mt-2">Machine learning predictions for future budget requirements</p>
            </div>

            {/* Model Performance Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Model Accuracy</div>
                <div className="text-3xl font-black text-[#10B981] mb-1">94.2%</div>
                <div className="text-sm text-slate-600">Prediction confidence</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Training Data Points</div>
                <div className="text-3xl font-black text-slate-900 mb-1">24,847</div>
                <div className="text-sm text-slate-600">Historical records</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Q3 2026 Forecast</div>
                <div className="text-3xl font-black text-[#0052FF] mb-1">₱5.2M</div>
                <div className="text-sm text-slate-600">Total predicted</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Variance Risk</div>
                <div className="text-3xl font-black text-[#F59E0B] mb-1">Medium</div>
                <div className="text-sm text-slate-600">±8.5% margin</div>
              </div>
            </div>

            {/* Prediction Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">12-Month Budget Forecast</h2>
              <div className="flex items-end gap-2 h-80 border-b border-l border-slate-200 pb-4 pl-4">
                {[
                  { month: 'Jan', actual: 450000, predicted: null },
                  { month: 'Feb', actual: 420000, predicted: null },
                  { month: 'Mar', actual: 480000, predicted: null },
                  { month: 'Apr', actual: 465000, predicted: null },
                  { month: 'May', actual: 490000, predicted: null },
                  { month: 'Jun', actual: 510000, predicted: null },
                  { month: 'Jul', actual: 525000, predicted: null },
                  { month: 'Aug', actual: null, predicted: 540000 },
                  { month: 'Sep', actual: null, predicted: 555000 },
                  { month: 'Oct', actual: null, predicted: 520000 },
                  { month: 'Nov', actual: null, predicted: 535000 },
                  { month: 'Dec', actual: null, predicted: 570000 }
                ].map((data, i) => {
                  const maxValue = 600000;
                  const actualHeight = data.actual ? (data.actual / maxValue) * 280 : 0;
                  const predictedHeight = data.predicted ? (data.predicted / maxValue) * 280 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                      {data.actual && (
                        <div
                          className="bg-gradient-to-t from-[#0052FF] to-[#0041cc] rounded-t hover:from-[#0041cc] hover:to-[#0052FF] transition-all cursor-pointer"
                          style={{ height: `${actualHeight}px` }}
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ₱{(data.actual / 1000).toFixed(0)}K
                          </div>
                        </div>
                      )}
                      {data.predicted && (
                        <div
                          className="bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-t border-2 border-dashed border-white hover:from-[#34D399] hover:to-[#10B981] transition-all cursor-pointer"
                          style={{ height: `${predictedHeight}px` }}
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ₱{(data.predicted / 1000).toFixed(0)}K (AI)
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-center text-slate-500 mt-2 font-semibold">
                        {data.month}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-[#0052FF] to-[#0041cc] rounded"></div>
                  <span className="text-sm text-slate-600">Actual Historical Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-[#10B981] to-[#34D399] rounded border-2 border-dashed border-slate-400"></div>
                  <span className="text-sm text-slate-600">AI Predicted (Scikit-Learn)</span>
                </div>
              </div>
            </div>

            {/* Department Predictions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Q3 Department Predictions</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Q2 Actual</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Q3 Predicted</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { dept: 'IT', q2: 524000, q3: 568000, confidence: 92 },
                    { dept: 'Marketing', q2: 445000, q3: 485000, confidence: 89 },
                    { dept: 'Sales', q2: 380000, q3: 420000, confidence: 91 },
                    { dept: 'HR', q2: 285000, q3: 295000, confidence: 95 },
                    { dept: 'Operations', q2: 610000, q3: 655000, confidence: 88 },
                    { dept: 'Finance', q2: 320000, q3: 340000, confidence: 94 },
                    { dept: 'Legal', q2: 195000, q3: 205000, confidence: 93 },
                    { dept: 'Procurement', q2: 260000, q3: 285000, confidence: 90 }
                  ].map((row, i) => {
                    const change = row.q3 - row.q2;
                    const percentChange = ((change / row.q2) * 100).toFixed(1);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{row.dept}</td>
                        <td className="px-6 py-4 font-mono text-slate-700">₱{row.q2.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#10B981]">₱{row.q3.toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-[#F59E0B]">+{percentChange}%</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-2 rounded-full"
                                style={{ width: `${row.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 w-12">{row.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Model Information */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0052FF] rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">About This AI Model</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Our forecasting engine uses Scikit-Learn's Random Forest Regressor trained on 24 months of historical transaction data. The model analyzes seasonal patterns, departmental trends, and variance history to predict future budget requirements with industry-leading accuracy.
                  </p>
                  <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                      <div className="text-xs text-slate-600">Algorithm</div>
                      <div className="text-sm font-bold text-slate-900">Random Forest</div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                      <div className="text-xs text-slate-600">Last Updated</div>
                      <div className="text-sm font-bold text-slate-900">2 days ago</div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-blue-200">
                      <div className="text-xs text-slate-600">Next Retrain</div>
                      <div className="text-sm font-bold text-slate-900">In 5 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Planning Module */}
        {activeModule === 'scenarios' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Scenario Planning & What-If Analysis</h1>
              <p className="text-slate-600 mt-2">Model different financial scenarios to prepare for any business condition</p>
            </div>

            {/* Scenario Cards */}
            <div className="grid grid-cols-3 gap-6">
              {/* Base Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#0052FF] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#0052FF]">Base Case</h3>
                  <div className="px-3 py-1 bg-[#0052FF]/10 text-[#0052FF] rounded-lg text-xs font-bold">CURRENT</div>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱5,000,000</div>
                <p className="text-sm text-slate-600 mb-6">Standard operating budget with approved allocations and normal growth assumptions</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue Growth</span>
                    <span className="font-bold">+5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expense Inflation</span>
                    <span className="font-bold">+3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Headcount</span>
                    <span className="font-bold">Stable</span>
                  </div>
                </div>
              </div>

              {/* Worst Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#EF4444] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#EF4444]">Worst Case (-25%)</h3>
                  <div className="px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-lg text-xs font-bold">STRESS TEST</div>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱3,750,000</div>
                <p className="text-sm text-slate-600 mb-6">Economic downturn scenario with budget cuts and cost reduction measures</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue Growth</span>
                    <span className="font-bold text-[#EF4444]">-10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expense Cuts</span>
                    <span className="font-bold text-[#EF4444]">-25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Headcount</span>
                    <span className="font-bold text-[#EF4444]">Reduced</span>
                  </div>
                </div>
              </div>

              {/* Growth Case */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#10B981] shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#10B981]">Growth Case (+40%)</h3>
                  <div className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] rounded-lg text-xs font-bold">EXPANSION</div>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-4">₱7,000,000</div>
                <p className="text-sm text-slate-600 mb-6">Aggressive expansion with increased hiring, marketing spend, and new initiatives</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue Growth</span>
                    <span className="font-bold text-[#10B981]">+25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Expense Increase</span>
                    <span className="font-bold text-[#10B981]">+40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Headcount</span>
                    <span className="font-bold text-[#10B981]">+30%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Impact Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Department Impact by Scenario</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Base Case</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-[#EF4444] uppercase">Worst Case</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-[#10B981] uppercase">Growth Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { dept: 'IT', base: 850000, worst: 637500, growth: 1190000 },
                      { dept: 'Marketing', base: 620000, worst: 465000, growth: 868000 },
                      { dept: 'Sales', base: 540000, worst: 405000, growth: 756000 },
                      { dept: 'HR', base: 380000, worst: 285000, growth: 532000 },
                      { dept: 'Operations', base: 720000, worst: 540000, growth: 1008000 },
                      { dept: 'Finance', base: 450000, worst: 337500, growth: 630000 },
                      { dept: 'Legal', base: 280000, worst: 210000, growth: 392000 },
                      { dept: 'Procurement', base: 360000, worst: 270000, growth: 504000 }
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{row.dept}</td>
                        <td className="px-6 py-4 font-mono text-slate-900">₱{row.base.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#EF4444]">₱{row.worst.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#10B981]">₱{row.growth.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                    <tr>
                      <td className="px-6 py-4 font-black text-slate-900">Total</td>
                      <td className="px-6 py-4 font-mono font-black text-slate-900">₱5,000,000</td>
                      <td className="px-6 py-4 font-mono font-black text-[#EF4444]">₱3,750,000</td>
                      <td className="px-6 py-4 font-mono font-black text-[#10B981]">₱7,000,000</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Scenario Actions */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Create Custom Scenario</h3>
                <p className="text-sm text-slate-600 mb-4">Build your own scenario with custom parameters and assumptions</p>
                <button className="w-full bg-[#0052FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
                  Build New Scenario
                </button>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Export Scenario Report</h3>
                <p className="text-sm text-slate-600 mb-4">Generate comprehensive PDF report for executive review</p>
                <button className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                  Generate PDF Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Variance Analysis Module */}
        {activeModule === 'variance' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black text-[#0A192F]">Variance Analysis Dashboard</h1>
              <p className="text-slate-600 mt-2">Real-time tracking of budget vs. actual spending across all departments</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Total Budgeted</div>
                <div className="text-3xl font-black text-slate-900 mb-1">₱5,000,000</div>
                <div className="text-sm text-slate-600">FY 2026 allocation</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Total Spent</div>
                <div className="text-3xl font-black text-slate-900 mb-1">₱3,019,000</div>
                <div className="text-sm text-slate-600">60.4% utilized</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">Variance</div>
                <div className="text-3xl font-black text-[#10B981] mb-1">-₱1,981,000</div>
                <div className="text-sm text-[#10B981]">Under budget</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-sm font-bold text-slate-600 mb-2">At-Risk Depts</div>
                <div className="text-3xl font-black text-[#F59E0B] mb-1">2</div>
                <div className="text-sm text-slate-600">Over 90% utilized</div>
              </div>
            </div>

            {/* Detailed Variance Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Department-Level Variance</h2>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Budgeted</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Actual</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Variance</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">% Used</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { dept: 'IT', budgeted: 850000, actual: 524000, status: 'good' },
                      { dept: 'Marketing', budgeted: 620000, actual: 580000, status: 'warning' },
                      { dept: 'Sales', budgeted: 540000, actual: 320000, status: 'good' },
                      { dept: 'HR', budgeted: 380000, actual: 185000, status: 'good' },
                      { dept: 'Operations', budgeted: 720000, actual: 685000, status: 'warning' },
                      { dept: 'Finance', budgeted: 450000, actual: 295000, status: 'good' },
                      { dept: 'Legal', budgeted: 280000, actual: 280000, status: 'critical' },
                      { dept: 'Procurement', budgeted: 360000, actual: 150000, status: 'good' }
                    ].map((row, i) => {
                      const variance = row.budgeted - row.actual;
                      const percentUsed = ((row.actual / row.budgeted) * 100).toFixed(1);
                      const isOver = variance < 0;
                      return (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">{row.dept}</td>
                          <td className="px-6 py-4 font-mono text-slate-700">₱{row.budgeted.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900">₱{row.actual.toLocaleString()}</td>
                          <td className={`px-6 py-4 font-mono font-bold ${isOver ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                            {isOver ? '+' : '-'}₱{Math.abs(variance).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    parseFloat(percentUsed) >= 95 ? 'bg-[#EF4444]' :
                                    parseFloat(percentUsed) >= 80 ? 'bg-[#F59E0B]' :
                                    'bg-[#10B981]'
                                  }`}
                                  style={{ width: `${Math.min(parseFloat(percentUsed), 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-slate-900 w-12">{percentUsed}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                              row.status === 'critical' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                              row.status === 'warning' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                              'bg-[#10B981]/10 text-[#10B981]'
                            }`}>
                              {row.status === 'critical' ? 'AT LIMIT' :
                               row.status === 'warning' ? 'HIGH USE' :
                               'ON TRACK'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trending Analysis */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">7-Month Variance Trend</h2>
              <div className="flex items-end gap-3 h-64 border-b border-l border-slate-200 pb-4 pl-4">
                {[
                  { month: 'Jan', variance: 45000 },
                  { month: 'Feb', variance: 52000 },
                  { month: 'Mar', variance: 48000 },
                  { month: 'Apr', variance: 61000 },
                  { month: 'May', variance: 55000 },
                  { month: 'Jun', variance: 72000 },
                  { month: 'Jul', variance: 68000 }
                ].map((data, i) => {
                  const maxValue = 80000;
                  const height = (data.variance / maxValue) * 220;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                      <div
                        className="bg-gradient-to-t from-[#10B981] to-[#34D399] rounded-t hover:from-[#34D399] hover:to-[#10B981] transition-all cursor-pointer"
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₱{(data.variance / 1000).toFixed(0)}K under
                        </div>
                      </div>
                      <div className="text-xs text-center text-slate-500 mt-2 font-semibold">
                        {data.month}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Overall trend shows <span className="font-bold text-[#10B981]">consistent under-budget performance</span> with average variance of <span className="font-bold">₱57,286</span> per month
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
