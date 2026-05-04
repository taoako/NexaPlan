import React, { useState, useEffect } from 'react';
import { Download, X, Zap, CheckCircle2, Lock, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { deptHeadApi } from '../../../../api/deptHeadApi';

export function VarianceView() {
  const [timeFilter, setTimeFilter] = useState<string>('FY2026');
  const [data, setData] = useState<any>(null);
  const [previewScenarioMultiplier, setPreviewScenarioMultiplier] = useState<number>(1.0);
  const [previewScenarioName, setPreviewScenarioName] = useState('Base Case');
  const [isScenarioTransitioning, setIsScenarioTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchVariance();
  }, [timeFilter]);

  const fetchVariance = async () => {
    setLoading(true);
    try {
      const res = await deptHeadApi.getVariance(timeFilter);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (multiplier: number, name: string) => {
    setIsScenarioTransitioning(true);
    setPreviewScenarioMultiplier(multiplier);
    setPreviewScenarioName(name);
    if (multiplier < 1.0) {
      try {
        const pData = await deptHeadApi.getPreview(multiplier);
        setPreviewData(pData);
      } catch (err) {
        console.error(err);
      }
    } else {
      setPreviewData(null);
    }
    setTimeout(() => setIsScenarioTransitioning(false), 500);
  };

  if (loading && !data) return <div className="p-12 text-center flex items-center justify-center gap-3"><Activity className="animate-spin w-5 h-5 text-indigo-500" /> Loading variance data...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load variance data</div>;

  // Apply preview multiplier to variance rows
  const varianceRows = data.rows || [];
  const adjustedVarianceData = varianceRows.map((row: any) => ({ 
    ...row, 
    budgeted: row.budgeted * previewScenarioMultiplier 
  }));
  
  const totalBudgeted = adjustedVarianceData.reduce((acc: number, row: any) => acc + row.budgeted, 0);
  const totalActual = adjustedVarianceData.reduce((acc: number, row: any) => acc + row.actual, 0);
  const totalVariance = totalBudgeted - totalActual;
  const varianceIsUnder = totalVariance >= 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Department Variance Analysis</h1>
          <p className="text-slate-600 mt-2">Compare budgeted vs. actual spending for {data.departmentName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-[#0F172A]/5 p-1 rounded-xl border border-[#0F172A]/10">
            <div className="px-3 py-1.5 text-xs font-black text-slate-500 uppercase tracking-wider">Preview Engine</div>
            <select 
              value={previewScenarioMultiplier}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const name = e.target.options[e.target.selectedIndex].text.split(': ')[1] || 'Base Case';
                handleScenarioChange(val, name);
              }}
              className="px-4 py-2 bg-white text-[#0A192F] border border-slate-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-sm cursor-pointer"
            >
              <option value={1.0}>Scenario: Base Case</option>
              <option value={0.8}>Scenario: Conservative Cut (-20%)</option>
              <option value={0.7}>Scenario: Crisis Response (-30%)</option>
            </select>
          </div>
          
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 bg-white rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-sm"
          >
            <option value="FY2026">Fiscal Year 2026</option>
            <option value="QTD">Quarter-to-Date (QTD)</option>
            <option value="MTD">Month-to-Date (MTD)</option>
          </select>
          <button className="flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {previewScenarioMultiplier < 1.0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-black text-indigo-900 uppercase tracking-tight">Active Preview: {previewScenarioName}</div>
              <div className="text-xs text-indigo-700 font-medium">Currently simulating operational impact of a {(100 - (previewScenarioMultiplier * 100)).toFixed(0)}% budget reduction.</div>
            </div>
          </div>
          <button 
            onClick={() => handleScenarioChange(1.0, 'Base Case')}
            className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Reset Preview
          </button>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="text-sm font-bold text-slate-600 mb-2">Projected Budget ({timeFilter})</div>
          <div className="flex items-baseline gap-2">
            <motion.div animate={{ scale: isScenarioTransitioning ? 1.05 : 1 }} className="text-4xl font-black text-[#0A192F]">
              ₱{totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </motion.div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Actual Spent ({timeFilter})</div>
          <div className="text-4xl font-black text-slate-900">₱{totalActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${varianceIsUnder ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
          <div className="text-sm font-bold text-slate-600 mb-2">Scenario Variance</div>
          <div className={`text-4xl font-black ${varianceIsUnder ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {varianceIsUnder ? '-' : '+'}₱{Math.abs(totalVariance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Impact Analysis (Only shows when previewing a cut) */}
        {previewData && previewData.proposals && previewData.proposals.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-2 lg:col-span-1">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Projected Impact Analysis</h2>
              <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PRIORITY-DRIVEN</div>
            </div>
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
              {previewData.proposals.map((project: any) => (
                <motion.div 
                  key={project.proposalId}
                  animate={{ opacity: project.willFreeze ? 0.6 : 1, x: project.willFreeze ? 4 : 0 }}
                  className={`p-4 rounded-xl border-2 transition-all ${project.willFreeze ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-[#4F46E5]/30'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{project.title}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded">{project.priority}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900">₱{project.amount.toLocaleString()}</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {project.willFreeze ? (
                        <div className="flex items-center gap-1.5 text-red-600 text-xs font-black"><Lock className="w-3.5 h-3.5" /> PROJECT FROZEN</div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#10B981] text-xs font-black"><CheckCircle2 className="w-3.5 h-3.5" /> REMAINS ACTIVE</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories breakdown */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${previewData && previewData.proposals && previewData.proposals.length > 0 ? 'col-span-2 lg:col-span-1' : 'col-span-2'}`}>
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Category Breakdown</h2>
          </div>
          <div className="p-6 space-y-4">
            {adjustedVarianceData.length === 0 ? (
              <div className="text-slate-500 text-center py-8">No spent data for this period.</div>
            ) : adjustedVarianceData.map((row: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                <div className="font-medium text-slate-700">{row.category}</div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">₱{row.actual.toLocaleString()} spent</div>
                  <div className="text-xs text-slate-500">Budget: ₱{row.budgeted.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}