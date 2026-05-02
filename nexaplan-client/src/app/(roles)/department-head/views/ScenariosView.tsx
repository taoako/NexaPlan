import React, { useState } from 'react';
import { Share, SlidersHorizontal, Target, AlertCircle, TrendingUp, CheckCircle2, X } from 'lucide-react';

interface ScenariosViewProps {
  setActiveScenarioMultiplier: (val: number) => void;
}

export function ScenariosView({ setActiveScenarioMultiplier }: ScenariosViewProps) {
  const [customScenarioPercent, setCustomScenarioPercent] = useState<number>(0);
  const baseBudget = 850000;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Budget Scenario Planning</h1>
          <p className="text-slate-600 mt-2">Model different budget scenarios and operational trade-offs</p>
        </div>
        <button className="flex items-center gap-2 bg-[#10B981] hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg">
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
        <div className="flex items-center gap-8">
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
          <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projected Budget</div>
            <div className="text-2xl font-black text-slate-900">
              ₱{(baseBudget * (1 + customScenarioPercent / 100)).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Predefined Scenarios */}
      <div className="grid grid-cols-3 gap-6">
        {/* Base Case */}
        <div className="bg-white rounded-xl p-6 border-2 border-[#6366F1] shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#6366F1]" />
            <h3 className="text-lg font-bold text-[#6366F1]">Base Case</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-4">₱{baseBudget.toLocaleString()}</div>
          <p className="text-sm text-slate-600 mb-4">Current approved budget</p>
        </div>

        {/* Conservative Case */}
        <div className="bg-white rounded-xl p-6 border-2 border-[#F59E0B] shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
            <h3 className="text-lg font-bold text-[#F59E0B]">Conservative (-20%)</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-4">₱{(baseBudget * 0.8).toLocaleString()}</div>
          <p className="text-sm text-slate-600 mb-4">Reduced budget scenario</p>
        </div>

        {/* Growth Case */}
        <div className="bg-white rounded-xl p-6 border-2 border-[#10B981] shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
            <h3 className="text-lg font-bold text-[#10B981]">Growth (+30%)</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-4">₱{(baseBudget * 1.3).toLocaleString()}</div>
          <p className="text-sm text-slate-600 mb-4">Expansion budget</p>
        </div>
      </div>
    </div>
  );
}