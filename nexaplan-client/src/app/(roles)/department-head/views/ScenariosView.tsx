import React, { useState, useEffect } from 'react';
import { Share, SlidersHorizontal, Target, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { deptHeadApi } from '../../../../api/deptHeadApi';

export function ScenariosView() {
  const [customScenarioPercent, setCustomScenarioPercent] = useState<number>(0);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseBudget, setBaseBudget] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sData = await deptHeadApi.getScenarios();
      setScenarios(sData);

      const oData = await deptHeadApi.getOverview();
      setBaseBudget(oData.allocatedBudget || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (multiplier: number) => {
    if (multiplier === 1.0) return <Target className="w-5 h-5 text-[#6366F1]" />;
    if (multiplier < 1.0) return <AlertCircle className="w-5 h-5 text-[#F59E0B]" />;
    return <TrendingUp className="w-5 h-5 text-[#10B981]" />;
  };

  const getColor = (multiplier: number) => {
    if (multiplier === 1.0) return 'border-[#6366F1] text-[#6366F1]';
    if (multiplier < 1.0) return 'border-[#F59E0B] text-[#F59E0B]';
    return 'border-[#10B981] text-[#10B981]';
  };

  if (loading) return <div className="p-12 text-center flex items-center justify-center gap-3"><RefreshCw className="animate-spin w-5 h-5 text-indigo-500" /> Loading scenarios...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Budget Scenario Planning</h1>
          <p className="text-slate-600 mt-2">Model different budget scenarios and operational trade-offs</p>
        </div>
        <button className="flex items-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg" onClick={() => alert("Scenario Pitch feature coming soon")}>
          <Share className="w-5 h-5" />
          Submit Scenario Pitch
        </button>
      </div>

      {/* Custom Scenario Generator */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#6366F1]" />
          Custom Scenario Generator
        </h2>
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1">
            <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
              <span>Conservative (-50%)</span>
              <span className="text-[#6366F1] font-black">{customScenarioPercent > 0 ? '+' : ''}{customScenarioPercent}%</span>
              <span>Growth (+50%)</span>
            </div>
            <input 
              type="range" 
              min="-50" max="50" step="5"
              value={customScenarioPercent}
              onChange={(e) => setCustomScenarioPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
            />
          </div>
          <div className="w-full lg:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projected Budget</div>
            <div className="text-2xl font-black text-slate-900">
              ₱{(baseBudget * (1 + customScenarioPercent / 100)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Scenarios created by Finance Manager */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map(s => (
          <div key={s.id} className={`bg-white rounded-xl p-6 border-2 shadow-lg relative overflow-hidden ${s.isActive ? getColor(s.multiplier) : 'border-slate-200 text-slate-900'}`}>
            {s.isActive && (
              <div className="absolute top-0 right-0 bg-[#0F172A] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                ACTIVE
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              {getIcon(s.multiplier)}
              <h3 className={`text-lg font-bold ${s.isActive ? '' : 'text-slate-800'}`}>{s.name}</h3>
            </div>
            <div className="text-3xl font-black mb-4">₱{(baseBudget * s.multiplier).toLocaleString()}</div>
            <p className="text-sm text-slate-600 mb-4">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}