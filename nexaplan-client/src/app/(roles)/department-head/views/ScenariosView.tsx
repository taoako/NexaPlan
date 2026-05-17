import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertCircle, TrendingUp, Target, ChevronDown, ChevronUp,
  Send, RefreshCw, CheckCircle, Clock, SlidersHorizontal
} from 'lucide-react';
import {
  deptHeadApi, ScenarioSummary, ScenarioImpactResult,
  PitchDecision, SubmittedPitch
} from '../../../../api/deptHeadApi';

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info'; }

// Normalize either old API shape (multiplier/scenarioName) or new (adjustmentMultiplier/title)
function normalizeScenario(raw: any): ScenarioSummary {
  const mult = typeof raw.adjustmentMultiplier === 'number'
    ? raw.adjustmentMultiplier
    : typeof raw.multiplier === 'number'
      ? raw.multiplier
      : 1.0;
  return {
    scenarioId:           raw.scenarioId ?? raw.id ?? 0,
    title:                raw.title ?? raw.scenarioName ?? raw.name ?? 'Unnamed Scenario',
    adjustmentMultiplier: mult,
    isActive:             raw.isActive ?? false,
    isArchived:           raw.isArchived ?? false,
  };
}

export function ScenariosView() {
  const fiscalYear = new Date().getFullYear();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [scenarios, setScenarios]         = useState<ScenarioSummary[]>([]);
  const [impact, setImpact]               = useState<ScenarioImpactResult | null>(null);
  const [pitches, setPitches]             = useState<SubmittedPitch[]>([]);
  const [loading, setLoading]             = useState(true);
  const [impactLoading, setImpactLoading] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedMultiplier, setSelectedMultiplier] = useState(1.0);
  const [sliderPct, setSliderPct]                   = useState(0);           // -50 to +50
  const [decisions, setDecisions]                   = useState<Record<number, 'Keep' | 'Defer' | 'Cut'>>({});
  const [pitchesOpen, setPitchesOpen]               = useState(false);
  const [toasts, setToasts]                         = useState<Toast[]>([]);
  const [pitchSubmitted, setPitchSubmitted]         = useState(false);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]         = useState(false);
  const [pitchTitle, setPitchTitle]       = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const addToast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const fmt = (n: number) => '₱' + Math.round(n).toLocaleString();

  const fetchImpact = useCallback(async (mult: number) => {
    setImpactLoading(true);
    try {
      const data = await deptHeadApi.getScenarioImpact(mult, fiscalYear);
      setImpact(data);
      setDecisions({});
    } catch (err: any) {
      console.error('[ScenarioImpact] fetch failed:', err?.message ?? err);
      addToast(`Could not load impact: ${err?.message ?? 'server error'}`, 'error');
    } finally {
      setImpactLoading(false);
    }
  }, [fiscalYear]);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rawSc, pt] = await Promise.all([
          deptHeadApi.getScenarios(),
          deptHeadApi.getMyPitches().catch(() => [] as SubmittedPitch[])
        ]);
        const sc = (rawSc as any[]).map(normalizeScenario);
        setScenarios(sc);
        setPitches(pt);
        const active = sc.find(s => s.isActive);
        const mult = active?.adjustmentMultiplier ?? 1.0;
        setSelectedMultiplier(mult);
        setSliderPct(Math.round((mult - 1) * 100));
        if (active) setSelectedScenarioId(active.scenarioId);
        await fetchImpact(mult);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchImpact]);

  // ── Slider debounce ──────────────────────────────────────────────────────────
  const handleSlider = (val: number) => {
    setSliderPct(val);
    const mult = parseFloat(((100 + val) / 100).toFixed(2));
    setSelectedMultiplier(mult);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchImpact(mult), 400);
  };

  const handleScenarioClick = (s: ScenarioSummary) => {
    const mult = Number(s.adjustmentMultiplier) || 1.0;
    setSelectedMultiplier(mult);
    setSliderPct(Math.round((mult - 1) * 100));
    setSelectedScenarioId(s.scenarioId);
    fetchImpact(mult);
  };

  // ── Pitch submit ─────────────────────────────────────────────────────────────
  const handleSubmitPitch = async () => {
    if (!pitchTitle.trim()) { addToast('Pitch title is required.', 'error'); return; }
    if (justification.trim().length < 50) { addToast('Justification must be at least 50 characters.', 'error'); return; }
    setSubmitting(true);
    try {
      const proposalDecisions = Object.entries(decisions).map(([id, decision]) => ({
        proposalId: parseInt(id), decision
      }));
      await deptHeadApi.submitScenarioPitch({
        scenarioId: selectedScenarioId,
        customMultiplier: selectedMultiplier,
        pitchTitle: pitchTitle.trim(),
        justification: justification.trim(),
        proposalDecisions
      });
      setModalOpen(false);
      setPitchSubmitted(true);
      addToast('✅ Scenario Pitch submitted. Finance Manager has been notified.', 'success');
      const pt = await deptHeadApi.getMyPitches().catch(() => []);
      setPitches(pt);
    } catch (e: any) {
      addToast(e.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const atRiskWithDecision = impact?.proposals
    .filter(p => p.scenarioStatus === 'AtRisk' && decisions[p.proposalId])
    ?? [];
  const canSubmit = atRiskWithDecision.length > 0 && !pitchSubmitted;

  const scenarioCardColor = (s: ScenarioSummary, selected: boolean) => {
    if (selected) return s.adjustmentMultiplier < 1.0
      ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-300'
      : s.adjustmentMultiplier > 1.0
        ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300'
        : 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300';
    return 'border-slate-200 bg-white hover:border-slate-300';
  };

  if (loading) return (
    <div className="p-12 flex items-center justify-center gap-3 text-slate-500">
      <RefreshCw className="animate-spin w-5 h-5 text-indigo-500" /> Loading scenarios...
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0A192F]">Budget Scenario Planning</h1>
          <p className="text-slate-600 mt-1">Model budget cuts and formally respond to Finance Manager scenarios</p>
        </div>
        <button
          disabled={!canSubmit}
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            pitchSubmitted
              ? 'bg-slate-100 text-slate-500 cursor-default border border-slate-200'
              : canSubmit
                ? 'bg-[#10B981] hover:bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-5 h-5" />
          {pitchSubmitted ? '📋 Pitch Submitted — View Response' : 'Submit Scenario Pitch'}
        </button>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* LEFT PANEL */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Finance Manager Scenarios</h2>
            <div className="space-y-2">
              {scenarios.length === 0 && (
                <p className="text-sm text-slate-400 italic">No active scenarios from Finance Manager.</p>
              )}
              {scenarios.map(s => (
                <button
                  key={s.scenarioId}
                  onClick={() => handleScenarioClick(s)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${scenarioCardColor(s, selectedScenarioId === s.scenarioId)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {s.adjustmentMultiplier < 1.0
                        ? <AlertCircle className="w-4 h-4 text-orange-500" />
                        : s.adjustmentMultiplier > 1.0
                          ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                          : <Target className="w-4 h-4 text-indigo-500" />}
                      <span className="font-bold text-slate-900 text-sm">{s.title}</span>
                    </div>
                    {s.isActive && (
                      <span className="text-xs font-black bg-orange-500 text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                    )}
                  </div>
                  <div className="text-xl font-black text-slate-800">
                    {s.adjustmentMultiplier === 1.0 ? 'Base' : `${s.adjustmentMultiplier >= 1 ? '+' : ''}${Math.round((s.adjustmentMultiplier - 1) * 100)}%`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Slider */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Custom Scenario Slider
            </h2>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Conservative (−50%)</span>
              <span className={`font-black text-sm ${sliderPct < 0 ? 'text-orange-500' : sliderPct > 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                {sliderPct > 0 ? '+' : ''}{sliderPct}%
              </span>
              <span>Growth (+50%)</span>
            </div>
            <input
              type="range" min="-50" max="50" step="1"
              value={sliderPct}
              onChange={e => handleSlider(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
            />
            <div className="mt-4 bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projected Budget</div>
              <div className="text-2xl font-black text-slate-900">
                {impact ? fmt(impact.scenarioBudget) : '—'}
              </div>
              {impact && (
                <div className={`text-xs font-semibold mt-1 ${impact.gap < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {impact.gap < 0 ? `▼ ${fmt(Math.abs(impact.gap))} shortfall` : `▲ ${fmt(impact.gap)} surplus`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Panel Header */}
            {impact && (
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-slate-700 font-medium">
                  Under this scenario, your <span className="font-black">{fmt(impact.currentBudget)}</span> budget becomes{' '}
                  <span className="font-black text-indigo-600">{fmt(impact.scenarioBudget)}</span>{' '}
                  ({impact.adjustmentMultiplier >= 1 ? '+' : ''}{Math.round((impact.adjustmentMultiplier - 1) * 100)}%)
                </p>
                {impact.gap < 0 && (
                  <span className="bg-red-100 text-red-700 font-black text-sm px-3 py-1 rounded-full">
                    {fmt(Math.abs(impact.gap))} Shortfall
                  </span>
                )}
              </div>
            )}

            {impactLoading ? (
              <div className="p-12 flex items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="animate-spin w-5 h-5" /> Calculating impact…
              </div>
            ) : !impact ? (
              <div className="p-12 text-center text-slate-400 text-sm">Move the slider or select a scenario to see impact.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Priority', 'Proposal', 'Requested', 'Status', 'Scenario Status', 'Your Decision'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {impact.proposals.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No active proposals found.</td></tr>
                      )}
                      {impact.proposals.map(p => (
                        <tr key={p.proposalId} className={p.scenarioStatus === 'AtRisk' ? 'bg-orange-50/40' : ''}>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-black text-xs">
                              P{p.priorityRank}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 max-w-[180px] truncate" title={p.title}>{p.title}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">{fmt(p.requestedAmount)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              p.status === 'Approved' ? 'bg-emerald-100 text-emerald-700'
                              : p.status === 'Pending' ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                            }`}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            {p.scenarioStatus === 'Survives'
                              ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Survives</span>
                              : <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> At Risk</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            {p.scenarioStatus === 'AtRisk' ? (
                              <select
                                value={decisions[p.proposalId] || ''}
                                onChange={e => setDecisions(d => ({ ...d, [p.proposalId]: e.target.value as any }))}
                                className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                              >
                                <option value="">— Choose —</option>
                                <option value="Keep">Keep (flag for reallocation)</option>
                                <option value="Defer">Defer to next fiscal year</option>
                                <option value="Cut">Cut entirely</option>
                              </select>
                            ) : (
                              <span className="text-slate-300 text-xs font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {impact.proposals.length > 0 && (
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-xs font-black text-slate-500 uppercase">Summary</td>
                          <td colSpan={4} className="px-4 py-3">
                            <div className="flex items-center gap-6 text-xs font-bold">
                              <span className="text-emerald-700">Surviving: {fmt(impact.totalSurviving)}</span>
                              <span className="text-orange-600">At Risk: {fmt(impact.totalAtRisk)}</span>
                              <span className={impact.gap < 0 ? 'text-red-600' : 'text-slate-600'}>
                                Gap: {impact.gap < 0 ? '−' : '+'}{fmt(Math.abs(impact.gap))}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Past Pitches Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setPitchesOpen(o => !o)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="font-bold text-slate-800">My Submitted Pitches</span>
            {pitches.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-black px-2 py-0.5 rounded-full">{pitches.length}</span>
            )}
          </div>
          {pitchesOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {pitchesOpen && (
          <div className="border-t border-slate-200 divide-y divide-slate-100">
            {pitches.length === 0 && (
              <p className="px-6 py-6 text-sm text-slate-400 italic">No pitches submitted yet.</p>
            )}
            {pitches.map(p => (
              <div key={p.pitchId} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{p.pitchTitle}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.scenarioTitle} · {new Date(p.submittedAt).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.justification}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
                    p.status === 'Acknowledged' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pitch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">Submit Scenario Pitch</h2>
              <p className="text-sm text-slate-500 mt-1">Your formal response will be sent to the Finance Manager.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">Pitch Title *</label>
                <input
                  value={pitchTitle}
                  onChange={e => setPitchTitle(e.target.value)}
                  placeholder="e.g. Our response to Conservative Cut Q3"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1">
                  Justification * <span className="text-slate-400 normal-case font-normal">(min. 50 chars — {justification.length} typed)</span>
                </label>
                <textarea
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  rows={4}
                  placeholder="Explain your proposal decisions and budget strategy..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                />
              </div>
              {/* Decision summary */}
              <div>
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-2">Decision Summary</label>
                <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 border border-slate-200">
                  {Object.entries(decisions).map(([id, dec]) => {
                    const p = impact?.proposals.find(x => x.proposalId === parseInt(id));
                    return (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 truncate max-w-xs">{p?.title || `Proposal #${id}`}</span>
                        <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                          dec === 'Cut' ? 'bg-red-100 text-red-700'
                          : dec === 'Defer' ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}>{dec}</span>
                      </div>
                    );
                  })}
                  {Object.keys(decisions).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No decisions made yet.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPitch}
                disabled={submitting}
                className="flex-1 bg-[#10B981] hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Pitch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white animate-in slide-in-from-bottom-4 duration-300 ${
            t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
          }`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}