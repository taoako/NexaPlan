import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Scenario, Proposal } from '../FinanceManagerSystem'; // Adjust path if needed

interface ScenariosViewProps {
  scenarios: Scenario[];
  setScenarios: React.Dispatch<React.SetStateAction<Scenario[]>>;
  proposals: Proposal[];
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>;
}

export function ScenariosView({ scenarios, setScenarios, proposals, setProposals }: ScenariosViewProps) {
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);
  const [newScenarioData, setNewScenarioData] = useState({ name: '', multiplier: 1.0 });
  const [scenarioToActivate, setScenarioToActivate] = useState<Scenario | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Scenario Planning &amp; What-If Analysis</h1>
          <p className="text-[15px] text-slate-500 mt-1">Model different financial scenarios to prepare for any business condition</p>
        </div>
        <button 
          onClick={() => setShowNewScenarioModal(true)} 
          className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all" 
          style={{ boxShadow: '0 4px 14px rgba(0,82,255,0.3)' }}
        >
          <Plus className="w-4 h-4" />Create New Scenario
        </button>
      </div>
      
      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-3 gap-6">
        {scenarios.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-6 border-2 flex flex-col" style={{ borderColor: s.isActive ? s.color : '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: s.isActive ? s.color : '#64748b' }}>{s.name}</h3>
              {s.isActive && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ backgroundColor: `${s.color}14`, color: s.color }}>ACTIVE</span>}
            </div>
            <div className="text-[28px] font-black text-slate-900 mb-3">₱{(5000000 * s.multiplier).toLocaleString()}</div>
            <p className="text-[13px] text-slate-500 mb-5 flex-1">{s.desc}</p>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[13px]">
                <span className="text-slate-500">Adjustment</span>
                <span className="font-bold text-[#0A192F]">{s.multiplier === 1 ? 'None' : s.multiplier < 1 ? `-${((1 - s.multiplier) * 100).toFixed(0)}%` : `+${((s.multiplier - 1) * 100).toFixed(0)}%`}</span>
              </div>
            </div>
            {!s.isActive && (
              <button 
                onClick={() => setScenarioToActivate(s)} 
                className="w-full py-2.5 rounded-lg border-2 font-bold text-[13px] transition-all hover:bg-slate-50" 
                style={{ borderColor: s.color, color: s.color }}
              >
                Activate This Scenario
              </button>
            )}
            {s.isActive && (
              <div className="w-full py-2.5 rounded-lg font-bold text-[13px] text-center bg-slate-100 text-slate-400">
                Currently Active
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Create New Scenario */}
      {showNewScenarioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Scenario</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scenario Name</label>
                <input 
                  type="text" 
                  value={newScenarioData.name} 
                  onChange={e => setNewScenarioData({ ...newScenarioData, name: e.target.value })} 
                  placeholder="e.g. Pandemic Playbook" 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0052FF]/30 outline-none text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adjustment Multiplier (e.g. 0.75 for -25%)</label>
                <input 
                  type="number" 
                  step="0.05" 
                  value={newScenarioData.multiplier} 
                  onChange={e => setNewScenarioData({ ...newScenarioData, multiplier: parseFloat(e.target.value) })} 
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0052FF]/30 outline-none text-sm" 
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNewScenarioModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button 
                onClick={() => {
                  setScenarios([...scenarios, { id: Date.now().toString(), name: newScenarioData.name, multiplier: newScenarioData.multiplier, isActive: false, color: '#D97706', desc: `Custom scenario with ${(newScenarioData.multiplier * 100).toFixed(0)}% budget adjustment.` }]);
                  setShowNewScenarioModal(false);
                  setNewScenarioData({ name: '', multiplier: 1.0 });
                }} 
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#0052FF] text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Scenario Activation */}
      {scenarioToActivate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-5 h-5"/>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Are you sure?</h2>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Activating the <strong>{scenarioToActivate.name}</strong> Scenario will instantly adjust all departmental budgets to <strong>{scenarioToActivate.multiplier * 100}%</strong>.
              {scenarioToActivate.multiplier < 1.0 && " Low-Priority projects will be automatically frozen."}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setScenarioToActivate(null)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button 
                onClick={() => {
                  setScenarios(scenarios.map(s => ({ ...s, isActive: s.id === scenarioToActivate.id })));
                  // Trigger freezing of low priority items if it's a budget cut scenario
                  if (scenarioToActivate.multiplier < 1.0) {
                    setProposals(proposals.map(p => p.priority === 'Low' ? { ...p, status: 'frozen' } : p));
                    alert(`Notice: Global budget scenario changed to ${scenarioToActivate.name}. Automated email dispatched to Unit Heads regarding frozen proposals.`);
                  }
                  setScenarioToActivate(null);
                }} 
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Activate Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}