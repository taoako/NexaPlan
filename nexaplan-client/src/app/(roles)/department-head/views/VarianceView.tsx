import React, { useState } from 'react';
import { Download, AlertCircle, X, Zap, ArrowDownNarrowWide, Info, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Proposal } from '../DepartmentHeadSystem';

interface VarianceViewProps {
  proposals: Proposal[];
}

export function VarianceView({ proposals }: VarianceViewProps) {
  const [timeFilter, setTimeFilter] = useState<string>('FY2026');
  const [previewScenarioMultiplier, setPreviewScenarioMultiplier] = useState<number>(1.0);
  const [previewScenarioName, setPreviewScenarioName] = useState('Base Case');
  const [isScenarioTransitioning, setIsScenarioTransitioning] = useState(false);
  
  const baseBudget = 850000;

  const handleScenarioChange = (multiplier: number, name: string) => {
    setIsScenarioTransitioning(true);
    setPreviewScenarioMultiplier(multiplier);
    setPreviewScenarioName(name);
    setTimeout(() => setIsScenarioTransitioning(false), 500);
  };

  const getVarianceData = () => {
    if (timeFilter === 'MTD') {
      return [
        { category: 'Hardware', budgeted: 25000, actual: 18000 },
        { category: 'Software Licenses', budgeted: 32000, actual: 28000 },
        { category: 'Cloud Services', budgeted: 15000, actual: 16000 }
      ];
    } else if (timeFilter === 'QTD') {
      return [
        { category: 'Hardware', budgeted: 75000, actual: 60000 },
        { category: 'Software Licenses', budgeted: 96000, actual: 85000 },
        { category: 'Cloud Services', budgeted: 45000, actual: 42000 }
      ];
    }
    return [
      { category: 'Hardware', budgeted: 250000, actual: 180000 },
      { category: 'Software Licenses', budgeted: 320000, actual: 285000 },
      { category: 'Cloud Services', budgeted: 150000, actual: 42000 },
      { category: 'Training & Development', budgeted: 80000, actual: 12000 },
      { category: 'Professional Services', budgeted: 50000, actual: 5000 }
    ];
  };

  const getProjectImpact = (proposalList: Proposal[]) => {
    return proposalList.map(p => {
      let willFreeze = false;
      if (previewScenarioMultiplier <= 0.8 && p.priority === 'Low') willFreeze = true;
      if (previewScenarioMultiplier <= 0.7 && p.priority === 'High') willFreeze = true;
      return { ...p, willFreeze };
    });
  };

  const currentVarianceData = getVarianceData();
  const adjustedVarianceData = currentVarianceData.map(row => ({ ...row, budgeted: row.budgeted * previewScenarioMultiplier }));
  const totalBudgeted = adjustedVarianceData.reduce((acc, row) => acc + row.budgeted, 0);
  const totalActual = adjustedVarianceData.reduce((acc, row) => acc + row.actual, 0);
  const totalVariance = totalBudgeted - totalActual;
  const varianceIsUnder = totalVariance >= 0;
  const projectImpacts = getProjectImpact(proposals);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Department Variance Analysis</h1>
          <p className="text-slate-600 mt-2">Compare budgeted vs. actual spending for IT Department</p>
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
              ₱{totalBudgeted.toLocaleString()}
            </motion.div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Actual Spent ({timeFilter})</div>
          <div className="text-4xl font-black text-slate-900">₱{totalActual.toLocaleString()}</div>
        </div>
        
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${varianceIsUnder ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></div>
          <div className="text-sm font-bold text-slate-600 mb-2">Scenario Variance</div>
          <div className={`text-4xl font-black ${varianceIsUnder ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {varianceIsUnder ? '-' : '+'}₱{Math.abs(totalVariance).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Impact Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Projected Impact Analysis</h2>
            <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PRIORITY-DRIVEN</div>
          </div>
          <div className="p-6 space-y-4">
            {projectImpacts.map((project) => (
              <motion.div 
                key={project.id}
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
      </div>
    </div>
  );
}