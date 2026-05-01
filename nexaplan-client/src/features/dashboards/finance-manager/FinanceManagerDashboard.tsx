import React, { useState, useRef, useEffect } from 'react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";
import {
  DollarSign, CheckSquare, TrendingUp, GitBranch, BarChart3,
  Bell, Search, LogOut, User, Lock, ChevronDown,
  Plus, Download, Clock, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';

interface FinanceManagerDashboardProps { onBack: () => void; }
type ModuleView = 'allocation' | 'approval' | 'forecasting' | 'scenarios' | 'variance';

export function FinanceManagerDashboard({ onBack }: FinanceManagerDashboardProps) {
  const [activeModule, setActiveModule] = useState<ModuleView>('allocation');
  const [selectedProposal, setSelectedProposal] = useState('1');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSparkline = (data: number[], color: string) => {
    const w = 64, h = 22, pad = 2;
    const mn = Math.min(...data), mx = Math.max(...data), r = mx - mn || 1;
    const pts = data.map((v, i) =>
      `${(pad + i * ((w - 2*pad) / (data.length - 1))).toFixed(1)},${(h - pad - ((v - mn) / r) * (h - 2*pad)).toFixed(1)}`
    ).join(' ');
    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg>;
  };

  const proposals = [
    { id: '1', title: 'Q3 IT Infrastructure Upgrade', department: 'IT', amount: 145000, status: 'pending', submittedBy: 'Carlos Reyes' },
    { id: '2', title: 'Marketing Q2 Campaign', department: 'Marketing', amount: 85000, status: 'draft', submittedBy: 'Lena Aguilar' },
    { id: '3', title: 'HR Training Software', department: 'HR', amount: 12500, status: 'approved', submittedBy: 'Jose Mendoza' },
  ];

  const handleApprove = () => { alert('Budget request approved!\n\nProposal: Q3 IT Infrastructure Upgrade\nAmount: ₱145,000'); setReviewNotes(''); };
  const handleRequestChanges = () => { alert('Change request sent\n\nNotes: ' + (reviewNotes || 'Please provide additional justification')); setReviewNotes(''); };
  const handleReject = () => { if (confirm('Reject this budget request?')) { alert('Budget request rejected'); setReviewNotes(''); } };

  const navTabs = [
    { id: 'allocation' as ModuleView, label: 'Budget Allocation', icon: DollarSign },
    { id: 'approval' as ModuleView, label: 'Approvals', icon: CheckSquare },
    { id: 'forecasting' as ModuleView, label: 'AI Forecasting', icon: TrendingUp },
    { id: 'scenarios' as ModuleView, label: 'Scenarios', icon: GitBranch },
    { id: 'variance' as ModuleView, label: 'Variance Analysis', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter']">
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Finance Manager</div>
          </div>
        </div>

        <div className="flex gap-1">
          {navTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveModule(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${activeModule === id ? 'bg-[#4F46E5] text-white' : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all">
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">FM</div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">Maria Santos</div>
                <div className="text-xs text-slate-400 mt-0.5">Finance Manager</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Maria Santos</div>
                  <div className="text-xs text-slate-500">finance@nexaplan.ph</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><User className="w-4 h-4 text-slate-400" />Profile Settings</button>
                  <button onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Lock className="w-4 h-4 text-slate-400" />Security</button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button onClick={() => { setShowProfileDropdown(false); onBack(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold"><LogOut className="w-4 h-4" />Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="p-8">
        {/* ── Allocation ── */}
        {activeModule === 'allocation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[30px] font-black text-[#0A192F]">Budget Allocation Overview</h1>
                <p className="text-[15px] text-slate-500 mt-1">Total budget distribution across all departments</p>
              </div>
              <button className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all" style={{ boxShadow: '0 4px 14px rgba(0,82,255,0.3)' }}>
                <Plus className="w-4 h-4" />New Allocation
              </button>
            </div>
            <div className="grid grid-cols-4 gap-5">
              {[{label:'Total Allocated',val:'₱5,000,000',sub:'100% distributed',c:'#10B981'},{label:'Pending Requests',val:'4',sub:'Requires review',c:'#D97706'},{label:'Approved This Month',val:'8',sub:'₱1,250,000 total',c:'#10B981'},{label:'Departments',val:'8',sub:'All active',c:'#0A192F'}].map((k,i)=>(
                <div key={i} className="bg-white rounded-xl p-5 border border-[#d1d5db]" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{k.label}</div>
                  <div className="text-[28px] font-black mb-1" style={{color:k.c}}>{k.val}</div>
                  <div className="text-[13px] text-slate-500">{k.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#d1d5db] p-6" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              <h2 className="text-[20px] font-bold text-slate-900 mb-5">Department Budget Distribution</h2>
              <div className="space-y-4">
                {['IT','Marketing','Sales','HR','Operations','Finance','Legal','Procurement'].map((dept,i)=>{
                  const amounts=[850000,620000,540000,380000,720000,450000,280000,360000];
                  const pcts=[17,12.4,10.8,7.6,14.4,9,5.6,7.2];
                  return (
                    <div key={dept} className="flex items-center gap-4">
                      <div className="w-28 font-bold text-[14px] text-slate-800">{dept}</div>
                      <div className="flex-1 bg-slate-100 rounded-full h-2"><div className="bg-[#0052FF] h-2 rounded-full" style={{width:`${pcts[i]}%`}}/></div>
                      <div className="w-32 text-right font-mono font-bold text-[13px] text-slate-800">₱{amounts[i].toLocaleString()}</div>
                      <div className="w-12 text-right text-[13px] text-slate-500">{pcts[i]}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Approvals ── */}
        {activeModule === 'approval' && (
          <div className="space-y-6">
            <div><h1 className="text-[30px] font-black text-[#0A192F]">Budget Approval Workflow</h1><p className="text-[15px] text-slate-500 mt-1">Review and approve department budget requests</p></div>
            <div className="flex gap-6">
              <div className="w-[36%] space-y-3">
                {proposals.map(p=>(
                  <button key={p.id} onClick={()=>setSelectedProposal(p.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selectedProposal===p.id?'border-[#0052FF] bg-[#0052FF]/5':'border-[#d1d5db] hover:border-slate-300 bg-white'}`}
                    style={{boxShadow:selectedProposal===p.id?'0 4px 14px rgba(0,82,255,0.1)':'0 2px 8px rgba(0,0,0,0.04)'}}>
                    <h3 className="font-bold text-[14px] text-slate-900 mb-1">{p.title}</h3>
                    <p className="text-[12px] text-slate-500 mb-3">{p.department} · {p.submittedBy}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[18px] font-black text-slate-900">₱{p.amount.toLocaleString()}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${p.status==='pending'?'bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/40':p.status==='approved'?'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30':'bg-slate-100 text-slate-600 border border-slate-200'}`}>{p.status.toUpperCase()}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-xl p-7 border border-[#d1d5db]" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <h2 className="text-[24px] font-bold text-slate-900 mb-6">Q3 IT Infrastructure Upgrade</h2>
                  <div className="flex items-center gap-8 mb-6 pb-6 border-b border-slate-100">
                    {[{icon:CheckCircle2,label:'Dept Head Approved',sub:'Carlos Reyes · Mar 18',c:'#10B981'},{icon:Clock,label:'Finance Review Pending',sub:'Awaiting approval',c:'#D97706'},{icon:AlertCircle,label:'CFO Sign-off',sub:'Pending',c:'#cbd5e1'}].map(({icon:Icon,label,sub,c},i)=>(
                      <div key={i} className="flex items-center gap-3"><Icon className="w-5 h-5 shrink-0" style={{color:c}}/><div><div className="font-bold text-[13px]" style={{color:c}}>{label}</div><div className="text-[11px] text-slate-400">{sub}</div></div></div>
                    ))}
                  </div>
                  <table className="w-full mb-5 text-[13px]">
                    <thead className="bg-slate-50 border-b border-[#d1d5db]"><tr>{['Item','Qty','Unit Cost','Total'].map(h=><th key={h} className="px-4 py-2.5 text-left font-black text-[11px] text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                    <tbody>
                      <tr className="border-b border-slate-100"><td className="px-4 py-3">Server Rack X1</td><td className="px-4 py-3">2</td><td className="px-4 py-3 font-mono">₱15,000</td><td className="px-4 py-3 font-mono font-bold">₱30,000</td></tr>
                      <tr className="border-b border-slate-100"><td className="px-4 py-3">Cloud Security Auth</td><td className="px-4 py-3">1</td><td className="px-4 py-3 font-mono">₱115,000</td><td className="px-4 py-3 font-mono font-bold">₱115,000</td></tr>
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200"><tr><td colSpan={3} className="px-4 py-3 text-right text-[13px] font-bold">Total Request:</td><td className="px-4 py-3 font-mono font-black text-[17px]">₱145,000</td></tr></tfoot>
                  </table>
                  <div className="bg-slate-50 rounded-xl p-5 border border-[#e5e7eb]">
                    <h3 className="font-bold text-[14px] text-slate-900 mb-3">Finance Manager Review</h3>
                    <textarea value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} placeholder="Add review notes or conditions..." className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg mb-4 focus:ring-2 focus:ring-[#0052FF]/30 outline-none text-[13px] bg-white" rows={3}/>
                    <div className="flex gap-2.5">
                      <button onClick={handleApprove} className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all"><CheckCircle2 className="w-4 h-4"/>Approve</button>
                      <button onClick={handleRequestChanges} className="flex-1 border-2 border-[#F59E0B] text-[#D97706] hover:bg-[#F59E0B]/5 px-5 py-2.5 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 transition-all"><AlertCircle className="w-4 h-4"/>Request Changes</button>
                      <button onClick={handleReject} className="px-5 py-2.5 text-red-500 hover:bg-red-50 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all"><XCircle className="w-4 h-4"/>Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AI Forecasting ── */}
        {activeModule === 'forecasting' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[30px] font-black text-[#0A192F]">AI-Powered Financial Forecasting</h1>
                <p className="text-[15px] text-slate-500 mt-1">Scikit-Learn Random Forest — 94.2% model accuracy with bootstrap confidence intervals</p>
              </div>
              <button className="flex items-center gap-2 border border-[#d1d5db] bg-white text-slate-700 px-4 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-all" style={{boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
                <Download className="w-4 h-4"/>Export Report
              </button>
            </div>

            <div className="grid grid-cols-4 gap-5">
              {[{label:'Model Accuracy',val:'94.2%',sub:'Prediction confidence',c:'#10B981'},{label:'Training Records',val:'24,847',sub:'Historical data points',c:'#0A192F'},{label:'Q3 2026 Forecast',val:'₱5.2M',sub:'Total predicted',c:'#0052FF'},{label:'Variance Risk',val:'Medium',sub:'±8.5% margin',c:'#D97706'}].map((k,i)=>(
                <div key={i} className="bg-white rounded-xl p-5 border border-[#d1d5db]" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{k.label}</div>
                  <div className="text-[28px] font-black mb-1" style={{color:k.c}}>{k.val}</div>
                  <div className="text-[13px] text-slate-500">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* SVG Line Chart with CI */}
            <div className="bg-white rounded-xl border border-[#d1d5db] p-6" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-[20px] font-bold text-slate-900">12-Month Budget Forecast</h2>
                  <p className="text-[13px] text-slate-500 mt-0.5">95% Confidence Interval band — narrows near current data, widens toward prediction horizon</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2"><svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round"/></svg><span className="text-[12px] text-slate-600">Actual</span></div>
                  <div className="flex items-center gap-2"><svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#10B981" strokeWidth="2.5" strokeDasharray="6,3" strokeLinecap="round"/></svg><span className="text-[12px] text-slate-600">AI Predicted</span></div>
                  <div className="flex items-center gap-2"><div className="w-6 h-4 rounded bg-[#10B981]/20 border border-[#10B981]/40"/><span className="text-[12px] text-slate-600">95% CI</span></div>
                </div>
              </div>
              <svg viewBox="0 0 860 300" className="w-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="ciFMGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.18"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.03"/>
                  </linearGradient>
                </defs>
                {[20,80,140,200,260].map((y,i)=>(
                  <g key={y}>
                    <line x1="60" y1={y} x2="840" y2={y} stroke="#f1f5f9" strokeWidth="1"/>
                    <text x="54" y={y+4} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace,monospace">{['₱660K','₱580K','₱500K','₱420K','₱350K'][i]}</text>
                  </g>
                ))}
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>(
                  <text key={m} x={60+i*70.9} y={287} textAnchor="middle" fill="#94a3b8" fontSize="10">{m}</text>
                ))}
                <line x1="521" y1="16" x2="521" y2="267" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5,4"/>
                <text x="680" y="14" textAnchor="middle" fill="#94a3b8" fontSize="9" letterSpacing="0.08em">AI PREDICTED ZONE</text>
                <path d="M 485.5 125 L 556.4 94 L 627.3 59 L 698.2 101 L 769.1 82 L 840 47 L 840 132 L 769.1 152 L 698.2 156 L 627.3 144 L 556.4 132 L 485.5 125 Z" fill="url(#ciFMGrad)"/>
                <path d="M 485.5 125 L 556.4 94 L 627.3 59 L 698.2 101 L 769.1 82 L 840 47" fill="none" stroke="#10B981" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3,3"/>
                <path d="M 485.5 125 L 556.4 132 L 627.3 144 L 698.2 156 L 769.1 152 L 840 132" fill="none" stroke="#10B981" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3,3"/>
                <path d="M 60 183 L 130.9 206 L 201.8 159 L 272.7 171 L 343.6 152 L 414.5 136 L 485.5 125" fill="none" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 485.5 125 L 556.4 113 L 627.3 101 L 698.2 128 L 769.1 117 L 840 90" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8,4"/>
                {[[60,183],[130.9,206],[201.8,159],[272.7,171],[343.6,152],[414.5,136],[485.5,125]].map(([cx,cy],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="4.5" fill="#0052FF" stroke="white" strokeWidth="2"/>
                ))}
                {[[556.4,113],[627.3,101],[698.2,128],[769.1,117],[840,90]].map(([cx,cy],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="4" fill="#10B981" stroke="white" strokeWidth="2"/>
                ))}
              </svg>
            </div>

            {/* Predictions Table */}
            <div className="bg-white rounded-xl border border-[#d1d5db] overflow-hidden" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              <div className="px-6 py-4 border-b border-[#d1d5db] flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-slate-900">Q3 Department Predictions</h2>
                <span className="text-[12px] text-slate-500">Sorted by AI confidence</span>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-[#d1d5db]">
                  <tr>{['Department','Q2 Actual','Q3 Predicted','Change','AI Accuracy (%)','Prediction Range'].map(h=><th key={h} className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    {dept:'HR',q2:285000,q3:295000,acc:97,spark:[93,94,95,94,96,97]},
                    {dept:'Finance',q2:320000,q3:340000,acc:94,spark:[92,93,94,94,94,94]},
                    {dept:'IT',q2:524000,q3:568000,acc:94,spark:[89,91,90,93,94,94]},
                    {dept:'Legal',q2:195000,q3:205000,acc:93,spark:[91,92,93,93,93,93]},
                    {dept:'Sales',q2:380000,q3:420000,acc:91,spark:[88,89,90,90,91,91]},
                    {dept:'Procurement',q2:260000,q3:285000,acc:90,spark:[87,88,89,90,90,90]},
                    {dept:'Marketing',q2:445000,q3:485000,acc:89,spark:[85,87,86,88,89,89]},
                    {dept:'Operations',q2:610000,q3:655000,acc:88,spark:[84,86,87,88,88,88]},
                  ].map((row,i)=>{
                    const pct=((( row.q3-row.q2)/row.q2)*100).toFixed(1);
                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-[15px] text-slate-900">{row.dept}</td>
                        <td className="px-6 py-3.5 font-mono text-[13px] text-slate-500">₱{row.q2.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-mono font-bold text-[15px] text-[#0052FF]">₱{row.q3.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-bold text-[13px] text-[#10B981]">+{pct}%</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5"><div className="bg-[#10B981] h-1.5 rounded-full" style={{width:`${row.acc}%`}}/></div>
                            <span className="text-[13px] font-bold text-slate-900 w-9 text-right">{row.acc}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">{renderSparkline(row.spark,'#0052FF')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Model Info */}
            <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#d1d5db]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center shrink-0" style={{boxShadow:'0 2px 8px rgba(0,82,255,0.25)'}}>
                  <TrendingUp className="w-5 h-5 text-white"/>
                </div>
                <div className="flex-1">
                  <h3 className="text-[17px] font-bold text-slate-900 mb-1">About This AI Model</h3>
                  <p className="text-[13px] text-slate-600 mb-4 leading-relaxed">Scikit-Learn Random Forest Regressor trained on 24 months of historical transaction data. Confidence intervals use bootstrap aggregation — the CI band narrows near observed data and widens as the prediction horizon extends.</p>
                  <div className="flex gap-3">
                    {[{l:'Algorithm',v:'Random Forest'},{l:'Last Updated',v:'2 days ago'},{l:'Next Retrain',v:'In 5 days'},{l:'CI Method',v:'Bootstrap 95%'}].map(({l,v})=>(
                      <div key={l} className="bg-white px-4 py-2 rounded-lg border border-[#d1d5db]">
                        <div className="text-[11px] text-slate-500">{l}</div>
                        <div className="text-[13px] font-bold text-slate-900">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Scenarios ── */}
        {activeModule === 'scenarios' && (
          <div className="space-y-6">
            <div><h1 className="text-[30px] font-black text-[#0A192F]">Scenario Planning &amp; What-If Analysis</h1><p className="text-[15px] text-slate-500 mt-1">Model different financial scenarios to prepare for any business condition</p></div>
            <div className="grid grid-cols-3 gap-6">
              {[{title:'Base Case',badge:'CURRENT',amount:'₱5,000,000',desc:'Standard operating budget with approved allocations and normal growth assumptions.',color:'#0052FF',rows:[['Revenue Growth','+5%'],['Expense Inflation','+3%'],['Headcount','Stable']]},{title:'Worst Case (-25%)',badge:'STRESS TEST',amount:'₱3,750,000',desc:'Economic downturn scenario with budget cuts and cost reduction measures.',color:'#EF4444',rows:[['Revenue Growth','-10%'],['Expense Cuts','-25%'],['Headcount','Reduced']]},{title:'Growth Case (+40%)',badge:'EXPANSION',amount:'₱7,000,000',desc:'Aggressive expansion with increased hiring, marketing spend, and new initiatives.',color:'#10B981',rows:[['Revenue Growth','+25%'],['Expense Increase','+40%'],['Headcount','+30%']]}].map((s,i)=>(
                <div key={i} className="bg-white rounded-xl p-6 border-2" style={{borderColor:s.color,boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[17px] font-bold" style={{color:s.color}}>{s.title}</h3>
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold" style={{backgroundColor:`${s.color}14`,color:s.color}}>{s.badge}</span>
                  </div>
                  <div className="text-[28px] font-black text-slate-900 mb-3">{s.amount}</div>
                  <p className="text-[13px] text-slate-500 mb-5">{s.desc}</p>
                  <div className="space-y-2">{s.rows.map(([k,v])=><div key={k} className="flex justify-between text-[13px]"><span className="text-slate-500">{k}</span><span className="font-bold" style={{color:i>0?s.color:'#0A192F'}}>{v}</span></div>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Variance ── */}
        {activeModule === 'variance' && (
          <div className="space-y-6">
            <div><h1 className="text-[30px] font-black text-[#0A192F]">Variance Analysis Dashboard</h1><p className="text-[15px] text-slate-500 mt-1">Real-time tracking of budget vs. actual spending across all departments</p></div>
            <div className="grid grid-cols-4 gap-5">
              {[{l:'Total Budgeted',v:'₱5,000,000',s:'FY 2026 allocation',c:'#0A192F'},{l:'Total Spent',v:'₱3,019,000',s:'60.4% utilized',c:'#0A192F'},{l:'Variance',v:'-₱1,981,000',s:'Under budget',c:'#10B981'},{l:'At-Risk Depts',v:'2',s:'Over 90% utilized',c:'#D97706'}].map((k,i)=>(
                <div key={i} className="bg-white rounded-xl p-5 border border-[#d1d5db]" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{k.l}</div>
                  <div className="text-[22px] font-black mb-1" style={{color:k.c}}>{k.v}</div>
                  <div className="text-[13px] text-slate-500">{k.s}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#d1d5db] overflow-hidden" style={{boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
              <div className="px-6 py-4 border-b border-[#d1d5db] flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-slate-900">Department-Level Variance</h2>
                <button className="flex items-center gap-2 bg-[#0A192F] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-slate-800 transition-all"><Download className="w-4 h-4"/>Export CSV</button>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-[#d1d5db]"><tr>{['Department','Budgeted','Actual','Variance','% Used','Status'].map(h=><th key={h} className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {[{dept:'IT',b:850000,a:524000,s:'good'},{dept:'Marketing',b:620000,a:580000,s:'warning'},{dept:'Sales',b:540000,a:320000,s:'good'},{dept:'HR',b:380000,a:185000,s:'good'},{dept:'Operations',b:720000,a:685000,s:'warning'},{dept:'Finance',b:450000,a:295000,s:'good'},{dept:'Legal',b:280000,a:280000,s:'critical'},{dept:'Procurement',b:360000,a:150000,s:'good'}].map((row,i)=>{
                    const v=row.b-row.a;
                    const p=((row.a/row.b)*100).toFixed(1);
                    const bc=parseFloat(p)>=95?'#EF4444':parseFloat(p)>=80?'#F59E0B':'#10B981';
                    const [bc2,bl]=row.s==='critical'?['bg-[#EF4444]/10 text-red-500 border-[#EF4444]/30','AT LIMIT']:row.s==='warning'?['bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/40','HIGH USE']:['bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30','ON TRACK'];
                    return (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-[14px] text-slate-900">{row.dept}</td>
                        <td className="px-6 py-3.5 font-mono text-[13px] text-slate-500">₱{row.b.toLocaleString()}</td>
                        <td className="px-6 py-3.5 font-mono font-bold text-[13px] text-slate-900">₱{row.a.toLocaleString()}</td>
                        <td className={`px-6 py-3.5 font-mono font-bold text-[13px] ${v>=0?'text-[#10B981]':'text-red-500'}`}>{v>=0?'-':'+'}₱{Math.abs(v).toLocaleString()}</td>
                        <td className="px-6 py-3.5"><div className="flex items-center gap-2"><div className="w-20 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full" style={{width:`${Math.min(parseFloat(p),100)}%`,backgroundColor:bc}}/></div><span className="text-[13px] font-bold text-slate-900 w-10 text-right">{p}%</span></div></td>
                        <td className="px-6 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${bc2}`}>{bl}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}