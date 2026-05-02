import React from 'react';
import { Download } from 'lucide-react';
import { Scenario } from '../FinanceManagerSystem';

interface VarianceViewProps {
  activeScenario: Scenario;
}

export function VarianceView({ activeScenario }: VarianceViewProps) {
  // We use activeScenario to demonstrate that the view is aware of the global state,
  // though the core table data here acts as a static snapshot for the Figma export.
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div>
        <h1 className="text-[30px] font-black text-[#0A192F]">Variance Analysis Dashboard</h1>
        <p className="text-[15px] text-slate-500 mt-1">Real-time tracking of budget vs. actual spending across all departments</p>
      </div>
      
      <div className="grid grid-cols-4 gap-5">
        {[
          {l:'Total Budgeted',v:'₱5,000,000',s:'FY 2026 allocation',c:'#0A192F'},
          {l:'Total Spent',v:'₱3,019,000',s:'60.4% utilized',c:'#0A192F'},
          {l:'Variance',v:'-₱1,981,000',s:'Under budget',c:'#10B981'},
          {l:'At-Risk Depts',v:'2',s:'Over 90% utilized',c:'#D97706'}
        ].map((k,i)=>(
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
          <button className="flex items-center gap-2 bg-[#0A192F] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-slate-800 transition-all">
            <Download className="w-4 h-4"/>Export CSV
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-[#d1d5db]">
            <tr>
              {['Department','Budgeted','Actual','Variance','% Used','Status'].map(h=>(
                <th key={h} className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              {dept:'IT',b:850000,a:524000,s:'good'},
              {dept:'Marketing',b:620000,a:580000,s:'warning'},
              {dept:'Sales',b:540000,a:320000,s:'good'},
              {dept:'HR',b:380000,a:185000,s:'good'},
              {dept:'Operations',b:720000,a:685000,s:'warning'},
              {dept:'Finance',b:450000,a:295000,s:'good'},
              {dept:'Legal',b:280000,a:280000,s:'critical'},
              {dept:'Procurement',b:360000,a:150000,s:'good'}
            ].map((row,i)=>{
              const v=row.b-row.a;
              const p=((row.a/row.b)*100).toFixed(1);
              const bc=parseFloat(p)>=95?'#EF4444':parseFloat(p)>=80?'#F59E0B':'#10B981';
              const [bc2,bl]=row.s==='critical'
                ? ['bg-[#EF4444]/10 text-red-500 border-[#EF4444]/30','AT LIMIT']
                : row.s==='warning'
                  ? ['bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/40','HIGH USE']
                  : ['bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30','ON TRACK'];
              
              return (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-[14px] text-slate-900">{row.dept}</td>
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-500">₱{row.b.toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-[13px] text-slate-900">₱{row.a.toLocaleString()}</td>
                  <td className={`px-6 py-3.5 font-mono font-bold text-[13px] ${v>=0?'text-[#10B981]':'text-red-500'}`}>
                    {v>=0?'-':'+'}₱{Math.abs(v).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{width:`${Math.min(parseFloat(p),100)}%`,backgroundColor:bc}}/>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900 w-10 text-right">{p}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${bc2}`}>{bl}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}