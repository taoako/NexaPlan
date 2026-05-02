import React from 'react';
import { Plus } from 'lucide-react';

export function AllocationView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Budget Allocation Overview</h1>
          <p className="text-[15px] text-slate-500 mt-1">Total budget distribution across all departments</p>
        </div>
        <button 
          className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all" 
          style={{ boxShadow: '0 4px 14px rgba(0,82,255,0.3)' }}
        >
          <Plus className="w-4 h-4" />New Allocation
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-5">
        {[
          {label:'Total Allocated',val:'₱5,000,000',sub:'100% distributed',c:'#10B981'},
          {label:'Pending Requests',val:'4',sub:'Requires review',c:'#D97706'},
          {label:'Approved This Month',val:'8',sub:'₱1,250,000 total',c:'#10B981'},
          {label:'Departments',val:'8',sub:'All active',c:'#0A192F'}
        ].map((k,i)=>(
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
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-[#0052FF] h-2 rounded-full" style={{width:`${pcts[i]}%`}}/>
                </div>
                <div className="w-32 text-right font-mono font-bold text-[13px] text-slate-800">₱{amounts[i].toLocaleString()}</div>
                <div className="w-12 text-right text-[13px] text-slate-500">{pcts[i]}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}