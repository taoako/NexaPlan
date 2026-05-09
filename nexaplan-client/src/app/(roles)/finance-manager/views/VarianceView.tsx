import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Scenario } from '../FinanceManagerSystem';
import { financeManagerApi } from '../../../../api/financeManagerApi';

interface VarianceViewProps {
  activeScenario: Scenario;
}

export function VarianceView({ activeScenario }: VarianceViewProps) {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [allocData, setAllocData] = useState<any>(null);
  const [showNet, setShowNet] = useState(false); // false = Gross (with tax), true = Net (without tax)
  const VAT_RATE = 0.12;
  
  // Mock fiscal year data
  const fiscalYearElapsedPct = 65; // Let's say 65% of the year has passed
  
  useEffect(() => {
    financeManagerApi.getAllocations().then(setAllocData).catch(console.error);
  }, []);

  const handleGenerateAudit = (dept: string) => {
    setGeneratingReport(dept);
    setTimeout(() => {
      setGeneratingReport(null);
      alert(`PDF Audit Report for ${dept} generated successfully and ready to present to the CFO.`);
    }, 1500);
  };

  if (!allocData) return <div className="p-12 text-center text-slate-500">Loading variance data...</div>;

  const totalSpent = allocData.departments.reduce((acc: number, d: any) => acc + d.spent, 0);
  const displaySpent = showNet ? totalSpent / (1 + VAT_RATE) : totalSpent;
  const displayAllocated = showNet ? allocData.totalAllocated / (1 + VAT_RATE) : allocData.totalAllocated;
  const totalVariance = displayAllocated - displaySpent;
  const utilizedPct = displayAllocated > 0 ? (displaySpent / displayAllocated) * 100 : 0;
  
  let criticalCount = 0;
  allocData.departments.forEach((row: any) => {
      const p = parseFloat(((row.spent / row.amount) * 100).toFixed(1));
      if ((p - fiscalYearElapsedPct > 10) || p >= 100) criticalCount++;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Variance Analysis Dashboard</h1>
          <p className="text-[15px] text-slate-500 mt-1">Real-time tracking of budget vs. actual spending across all departments</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Gross / Net Toggle */}
          <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              !showNet ? 'bg-[#0A192F] text-white' : 'text-slate-500 hover:bg-slate-50'
            }`} onClick={() => setShowNet(false)}>Gross (With Tax)</span>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              showNet ? 'bg-[#0A192F] text-white' : 'text-slate-500 hover:bg-slate-50'
            }`} onClick={() => setShowNet(true)}>Net (Without Tax)</span>
          </div>

          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5"/>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiscal Year Pacing</div>
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{width: `${fiscalYearElapsedPct}%`}}></div>
              </div>
              <span className="text-[14px] font-black text-slate-800">{fiscalYearElapsedPct}% Elapsed</span>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-5">
        {[
          {l:'Total Budgeted',v:`₱${displayAllocated.toLocaleString(undefined,{maximumFractionDigits:0})}`,s:`FY 2026 allocation ${showNet ? '(Net)' : '(Gross)'}`,c:'#0A192F'},
          {l:'Total Spent',v:`₱${displaySpent.toLocaleString(undefined,{maximumFractionDigits:0})}`,s:`${utilizedPct.toFixed(1)}% utilized`,c:'#0A192F'},
          {l:'Variance',v:`${totalVariance >= 0 ? '-' : '+'}₱${Math.abs(totalVariance).toLocaleString(undefined,{maximumFractionDigits:0})}`,s:totalVariance >= 0 ? 'Under budget' : 'Over budget',c:totalVariance >= 0 ? '#10B981' : '#EF4444'},
          {l:'Critical Pacing Warnings',v:criticalCount.toString(),s:'Spending faster than time elapsed',c:'#EF4444'}
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
          <h2 className="text-[20px] font-bold text-slate-900">Department-Level Variance & Pacing</h2>
          <button className="flex items-center gap-2 bg-[#0A192F] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-slate-800 transition-all">
            <Download className="w-4 h-4"/>Export Master CSV
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-[#d1d5db]">
            <tr>
              {['Department','Budgeted','Actual','Variance','% Used','Pacing vs Time','Status','Audit'].map(h=>(
                <th key={h} className="px-6 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allocData.departments.map((row: any, i: number)=>{
              const displayRowSpent = showNet ? row.spent / (1 + VAT_RATE) : row.spent;
              const displayRowBudget = showNet ? row.amount / (1 + VAT_RATE) : row.amount;
              const v = displayRowBudget - displayRowSpent;
              const p = displayRowBudget > 0 ? parseFloat(((displayRowSpent / displayRowBudget) * 100).toFixed(1)) : 0;
              
              // Pacing logic:
              const pacingDiff = p - fiscalYearElapsedPct;
              let s = 'good';
              if (pacingDiff > 10 || p >= 100) s = 'critical';
              else if (pacingDiff > 0) s = 'warning';
              
              const bc = p >= 100 ? '#EF4444' : p >= 80 ? '#F59E0B' : '#10B981';
              
              const [bc2, bl] = s === 'critical'
                ? ['bg-[#EF4444]/10 text-red-500 border-[#EF4444]/30', 'CRITICAL BURN']
                : s === 'warning'
                  ? ['bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/40', 'HIGH PACING']
                  : ['bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30', 'ON TRACK'];
              
              return (
                <tr key={i} className={`hover:bg-slate-50/60 transition-colors ${s === 'critical' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-6 py-3.5 font-bold text-[14px] text-slate-900">{row.name}</td>
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-500">₱{displayRowBudget.toLocaleString(undefined,{maximumFractionDigits:0})}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-[13px] text-slate-900">₱{displayRowSpent.toLocaleString(undefined,{maximumFractionDigits:0})}</td>
                  <td className={`px-6 py-3.5 font-mono font-bold text-[13px] ${v >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
                    {v >= 0 ? '-' : '+'}₱{Math.abs(v).toLocaleString(undefined,{maximumFractionDigits:0})}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full" style={{width: `${Math.min(p, 100)}%`, backgroundColor: bc}}/>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900 w-10 text-right">{p}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold">
                      {s === 'critical' ? (
                        <><AlertTriangle className="w-3.5 h-3.5 text-red-500"/> <span className="text-red-600">+{pacingDiff.toFixed(1)}% vs Time</span></>
                      ) : s === 'warning' ? (
                        <><AlertTriangle className="w-3.5 h-3.5 text-amber-500"/> <span className="text-amber-600">+{pacingDiff.toFixed(1)}% vs Time</span></>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> <span className="text-emerald-600">Healthy</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${bc2}`}>{bl}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    {(s === 'critical' || s === 'warning') ? (
                      <button 
                        onClick={() => handleGenerateAudit(row.name)}
                        disabled={generatingReport === row.name}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        title="Generate PDF Audit Report"
                      >
                        {generatingReport === row.name ? (
                          <span className="animate-pulse">Generating...</span>
                        ) : (
                          <><FileText className="w-3.5 h-3.5"/> 1-Click Audit</>
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
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