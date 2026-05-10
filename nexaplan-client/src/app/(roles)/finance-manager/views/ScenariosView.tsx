import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Activity, Archive, Save, X, Settings2 } from 'lucide-react';
import { financeManagerApi } from '../../../../api/financeManagerApi';

export function ScenariosView() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [archivedScenarios, setArchivedScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<any>(null);
  
  // Advanced Scenario Data
  const [newScenarioData, setNewScenarioData] = useState({ 
    name: '', 
    multiplier: 1.0, 
    desc: '' 
  });
  
  // Granular Overrides
  const [departments] = useState(['IT', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Legal', 'Procurement']);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  
  const [scenarioToActivate, setScenarioToActivate] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const data = await financeManagerApi.getScenarios();
      // Split mock archived scenarios vs active
      const active = data.filter((s: any) => !s.isArchived);
      const archived = data.filter((s: any) => s.isArchived);
      
      setScenarios(active);
      setArchivedScenarios(archived);
      
      // If no archived from API, let's mock some for history
      if (archived.length === 0) {
        setArchivedScenarios([
          { id: 901, name: 'Q1 2024 Market Dip', multiplier: 0.85, desc: '15% reduction due to slow Q1 sales.', isActive: false, isArchived: true, overrides: { 'IT': 1.0 } },
          { id: 902, name: '2023 Rapid Growth', multiplier: 1.20, desc: '20% budget increase for expansion.', isActive: false, isArchived: true, overrides: { 'Marketing': 1.5 } }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideChange = (dept: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setOverrides(prev => ({ ...prev, [dept]: num }));
    }
  };

  const handleCreateScenario = async () => {
    if (!newScenarioData.name) return setModalMessage({ title: 'Name Required', message: 'Scenario name is required.', type: 'error' });
    try {
      // Encode overrides into the description since backend API only takes desc
      const descWithOverrides = JSON.stringify({
        text: newScenarioData.desc,
        overrides: overrides
      });
      
      await financeManagerApi.createScenario(newScenarioData.name, newScenarioData.multiplier, descWithOverrides);
      setShowNewScenarioModal(false);
      setNewScenarioData({ name: '', multiplier: 1.0, desc: '' });
      setOverrides({});
      fetchScenarios();
    } catch (err) {
      console.error(err);
      setModalMessage({ title: 'Create Failed', message: 'Failed to create scenario.', type: 'error' });
    }
  };

  const handleActivateScenario = async () => {
    if (!scenarioToActivate) return;
    try {
      await financeManagerApi.activateScenario(scenarioToActivate.id);

      const message = scenarioToActivate.multiplier < 1.0
        ? `Global budget scenario changed to ${scenarioToActivate.name}. Department caps are now restricted.`
        : `Scenario ${scenarioToActivate.name} activated.`;
      setModalMessage({ title: 'Scenario Activated', message, type: 'success' });

      setScenarioToActivate(null);
      fetchScenarios();
      
      window.location.reload();
    } catch (err) {
      console.error(err);
      setModalMessage({ title: 'Activation Failed', message: 'Failed to activate scenario.', type: 'error' });
    }
  };

  const handleArchiveScenario = (scenario: any) => {
    setConfirmArchive(scenario);
  };

  const confirmArchiveScenario = () => {
    if (!confirmArchive) return;
    setScenarios(prev => prev.filter(s => s.id !== confirmArchive.id));
    setArchivedScenarios(prev => [...prev, { ...confirmArchive, isArchived: true, isActive: false }]);
    setModalMessage({ title: 'Archived', message: `Scenario "${confirmArchive.name}" archived.`, type: 'success' });
    setConfirmArchive(null);
  };

  const getColor = (multiplier: number) => {
    if (multiplier === 1.0) return '#0052FF';
    if (multiplier < 1.0) return '#EF4444';
    return '#10B981';
  };
  
  const parseDesc = (s: any) => {
    try {
      const parsed = JSON.parse(s.desc);
      return { text: parsed.text, overrides: parsed.overrides || {} };
    } catch {
      return { text: s.desc, overrides: s.overrides || {} };
    }
  };

  if (loading) return <div className="p-12 flex justify-center text-slate-500"><Activity className="animate-spin mr-2" /> Loading scenarios...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-black text-[#0A192F]">Scenario Planning &amp; What-If Analysis</h1>
          <p className="text-[15px] text-slate-500 mt-1">Model granular financial scenarios and review historical planning</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-all shadow-sm"
          >
            <Archive className="w-4 h-4" />{showArchived ? 'View Active Scenarios' : 'Archive History'}
          </button>
          {!showArchived && (
            <button 
              onClick={() => setShowNewScenarioModal(true)} 
              className="flex items-center gap-2 bg-[#0052FF] text-white px-5 py-2.5 rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all" 
              style={{ boxShadow: '0 4px 14px rgba(0,82,255,0.3)' }}
            >
              <Plus className="w-4 h-4" />Create New Scenario
            </button>
          )}
        </div>
      </div>
      
      {showArchived ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Archive className="w-5 h-5 text-slate-500"/> Historical Scenarios Archive</h2>
          {archivedScenarios.length === 0 ? (
            <div className="text-center text-slate-500 py-10">No archived scenarios found.</div>
          ) : (
            <div className="space-y-4">
              {archivedScenarios.map(s => {
                const { text, overrides } = parseDesc(s);
                return (
                  <div key={s.id} className="bg-white p-5 border border-slate-200 rounded-lg flex justify-between items-center shadow-sm">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{s.name} <span className="text-sm font-normal text-slate-500 ml-2">(Multiplier: {s.multiplier})</span></h3>
                      <p className="text-sm text-slate-600 mt-1">{text}</p>
                      {Object.keys(overrides).length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500 uppercase">Protected/Taxed Units:</span>
                          {Object.entries(overrides).map(([k, v]) => (
                            <span key={k} className="text-xs bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                              {k}: {Number(v) * 100}%
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-all">Restore</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {scenarios.map((s) => {
            const color = getColor(s.multiplier);
            const { text, overrides } = parseDesc(s);
            
            return (
              <div key={s.id} className="bg-white rounded-xl p-6 border-2 flex flex-col relative group" style={{ borderColor: s.isActive ? color : '#e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                {!s.isActive && (
                  <button 
                    onClick={() => handleArchiveScenario(s)}
                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Archive Scenario"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                
                <div className="flex items-center justify-between mb-4 pr-10">
                  <h3 className="text-[17px] font-bold" style={{ color: s.isActive ? color : '#64748b' }}>{s.name}</h3>
                  {s.isActive && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ backgroundColor: `${color}14`, color: color }}>ACTIVE</span>}
                </div>
                <div className="text-[28px] font-black text-slate-900 mb-1">Global: {(s.multiplier * 100).toFixed(0)}%</div>
                <p className="text-[13px] text-slate-500 mb-5 flex-1">{text}</p>
                
                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase mb-2">
                    <Settings2 className="w-4 h-4"/> Granular Rules
                  </div>
                  {Object.keys(overrides).length === 0 ? (
                    <div className="text-xs text-slate-500">Applied uniformly across all departments.</div>
                  ) : (
                    Object.entries(overrides).map(([dept, val]) => (
                      <div key={dept} className="flex justify-between text-[13px]">
                        <span className="font-semibold text-slate-700">{dept}</span>
                        <span className="font-mono font-bold" style={{ color: Number(val) < 1 ? '#EF4444' : Number(val) > 1 ? '#10B981' : '#0052FF'}}>
                          {Number(val) * 100}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
                
                {!s.isActive && (
                  <button 
                    onClick={() => setScenarioToActivate(s)} 
                    className="w-full py-2.5 rounded-lg border-2 font-bold text-[13px] transition-all hover:bg-slate-50" 
                    style={{ borderColor: color, color: color }}
                  >
                    Activate This Scenario
                  </button>
                )}
                {s.isActive && (
                  <div className="w-full py-2.5 rounded-lg font-bold text-[13px] text-center bg-slate-100 text-slate-400 border border-slate-200">
                    Currently Active
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showNewScenarioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Create Granular Scenario</h2>
              <button onClick={() => setShowNewScenarioModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Scenario Name</label>
                  <input 
                    type="text" 
                    value={newScenarioData.name} 
                    onChange={e => setNewScenarioData({ ...newScenarioData, name: e.target.value })} 
                    placeholder="e.g. Q4 Supply Chain Crisis" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Global Multiplier</label>
                  <input 
                    type="number" 
                    step="0.05" 
                    value={newScenarioData.multiplier} 
                    onChange={e => setNewScenarioData({ ...newScenarioData, multiplier: parseFloat(e.target.value) })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono font-bold" 
                  />
                  <p className="text-xs text-slate-500 mt-1">e.g. 0.75 for -25% cut across the board.</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea 
                    value={newScenarioData.desc} 
                    onChange={e => setNewScenarioData({ ...newScenarioData, desc: e.target.value })} 
                    placeholder="Describe the condition for this scenario..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2"><Settings2 className="w-4 h-4"/> Department Overrides</h3>
                <p className="text-xs text-slate-500 mb-4">Protect core departments or heavily tax others regardless of the Global Multiplier.</p>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">{dept}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.05"
                          placeholder="Global"
                          value={overrides[dept] !== undefined ? overrides[dept] : ''}
                          onChange={(e) => handleOverrideChange(dept, e.target.value)}
                          className="w-20 px-2 py-1.5 text-right font-mono text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button 
                          onClick={() => {
                            const newOverrides = {...overrides};
                            delete newOverrides[dept];
                            setOverrides(newOverrides);
                          }}
                          className="text-xs text-slate-400 hover:text-red-500 font-bold"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 shrink-0">
              <button onClick={() => setShowNewScenarioModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-white border border-transparent hover:border-slate-300 transition-all">Cancel</button>
              <button 
                onClick={handleCreateScenario} 
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4"/> Save Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {scenarioToActivate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${scenarioToActivate.multiplier < 1.0 ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
              <AlertTriangle className="w-8 h-8"/>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Confirm Activation</h2>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              Activating the <strong>{scenarioToActivate.name}</strong> Scenario will instantly adjust budgets.
              Global multiplier: <strong>{scenarioToActivate.multiplier * 100}%</strong>.
              {Object.keys(parseDesc(scenarioToActivate).overrides).length > 0 && " Department overrides will be applied."}
              {scenarioToActivate.multiplier < 1.0 && " Low-Priority projects will be frozen."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setScenarioToActivate(null)} className="flex-1 px-5 py-3 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
              <button 
                onClick={handleActivateScenario} 
                className={`flex-1 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${scenarioToActivate.multiplier < 1.0 ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation */}
      {scenarioToActivate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-blue-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Activate Scenario</h3>
            <p className="text-slate-500 text-sm mb-6">Activate {scenarioToActivate.name} for this tenant?</p>
            <div className="flex gap-3">
              <button onClick={handleActivateScenario} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold">Confirm</button>
              <button onClick={() => setScenarioToActivate(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      {confirmArchive && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4"><Archive className="w-6 h-6 text-slate-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">Archive Scenario</h3>
            <p className="text-slate-500 text-sm mb-6">Move {confirmArchive.name} to history?</p>
            <div className="flex gap-3">
              <button onClick={confirmArchiveScenario} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold">Confirm</button>
              <button onClick={() => setConfirmArchive(null)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Message Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className={`mb-4 w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              modalMessage.type === 'error' ? 'bg-red-100 text-red-500' :
              modalMessage.type === 'success' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'
            }`}>
              {modalMessage.type === 'error' ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
            </div>
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">{modalMessage.title}</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage.message}</p>
            <button onClick={() => setModalMessage(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}