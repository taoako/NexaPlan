import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, Brain, BarChart3, RefreshCw, Cpu, Activity, Download, Zap, TrendingDown, Info, X } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, Area, AreaChart, ReferenceLine, Cell, BarChart, Bar
} from 'recharts';
import type { MainAdminDepartment } from '../../../../api/mainAdminApi';
import * as api from '../../../../api/mainAdminApi';
import { useFeatures } from '../../../../context/FeaturesContext';
import { useCurrency } from '../../../../context/CurrencyContext';
import UpgradeBanner from '../../../../components/UpgradeBanner';

interface Props {
  departments: MainAdminDepartment[];
}

export function ForecastingTab({ departments }: Props) {
  const { fmt } = useCurrency();
  const features = useFeatures();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const tenantId = storedUser.tenantId || 0;

  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeptDetail, setSelectedDeptDetail] = useState<any>(null);
  const [varianceMode, setVarianceMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await api.getForecast(tenantId, 2026);
      setForecastData(data);
    } catch (err) {
      console.error('Forecasting load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const safeLocale = (val: any) => (val || 0).toLocaleString();

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <RefreshCw className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
      <p className="font-bold text-slate-600 tracking-tight text-lg">Synchronizing Organization Analytics...</p>
    </div>
  );

  if (features && !features.canUseMLPrediction) {
    return <UpgradeBanner feature="AI Financial Forecasting" requiredTier="Professional" />;
  }

  if (!forecastData) return <div className="p-12 text-center text-slate-500">Unable to load forecasting data.</div>;

  // ── Derived Data ────────────────────────────────────────────────────────────
  const chartData = forecastData.chartData || [];
  const aiInsights = (forecastData.insights || []).map((i: any, idx: number) => ({ ...i, id: idx }));
  const trendMethod = forecastData.trendMethod || 'none';
  const monthsOfData = forecastData.monthsOfData || 0;
  const hasEnoughData = forecastData.hasEnoughData || false;
  const currentMonth = new Date().toLocaleString('en', { month: 'short' }).toUpperCase().slice(0, 3);

  // Variance by dept (committed vs budget) for the vertical chart/table
  const varianceData = (forecastData.departments || []).map((d: any) => {
    const mForecasts = d.monthlyForecasts || [];
    const committed = Math.round(mForecasts.reduce((s: number, m: any) => s + (m.predictedSpending || 0), 0));
    const budget = Math.round(mForecasts.reduce((s: number, m: any) => s + (m.budgetedAmount || 0), 0));
    return {
      dept: d.departmentName,
      committed,
      budget,
      variance: committed - budget,
      mlRisk: mForecasts.some((m: any) => m.mlRiskLevel === 'High'),
      mlExpected: Math.round(mForecasts.reduce((s: number, m: any) => s + (m.mlPredictedSpending || 0), 0)),
      raw: d
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      
      {/* ── Sub-Header (Stats Toggle) ── */}
      <div className="bg-white border border-slate-200 flex items-center justify-between px-6 py-3.5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-emerald-800 uppercase tracking-tight">Live Forecast</span>
          </div>
          {trendMethod !== 'none' && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-sm font-bold text-purple-800 tracking-tight">Trend: {trendMethod}</span>
            </div>
          )}
          <span className="text-xs font-semibold text-slate-400 ml-2">{monthsOfData} months of reconciled spend analyzed</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Brain className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">RF Model Accuracy: <span className="text-indigo-600">81.7%</span></span>
          </div>
          <button onClick={fetchData} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Top Row KPIs ── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Projected EOY Spend</p>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-[#0A192F] font-mono">{fmt(forecastData.projectedEOY)}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">Sum of all approved commitments</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Budgeted</p>
            <Cpu className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-black text-slate-700 font-mono">{fmt(forecastData.totalBudget)}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">Organization ceiling for 2026</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Depletion Risk</p>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className={`text-3xl font-black ${
            forecastData.depletionRisk === 'High' ? 'text-red-500' : 
            forecastData.depletionRisk === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
          }`}>{forecastData.depletionRisk}</p>
          <p className="text-xs text-slate-400 mt-2 font-bold">{(forecastData.variancePct ?? 0).toFixed(1)}% variance vs budget</p>
        </div>
      </div>

      {/* ── Main Trajectory Chart ── */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Organization Trajectory</h2>
            <p className="text-sm text-slate-500 mt-1">
              Actual spend vs commitments · {hasEnoughData ? 'AI trend forecast active' : 'AI trend needs 3+ months data'}
            </p>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-2"><span className="w-3 border-t-2 border-indigo-600"/> Committed</span>
            <span className="flex items-center gap-2"><span className="w-3 border-t-2 border-emerald-500"/> Actual</span>
            <span className="flex items-center gap-2"><span className="w-3 border-t-2 border-dashed border-slate-300"/> Budget</span>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
              <YAxis 
                axisLine={false} tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} 
                tickFormatter={(v) => fmt(v)} 
                width={80}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.15)' }}
                formatter={(v: any) => [fmt(v), '']}
              />
              
              {features?.canUseConfidenceBands && (
                <>
                  <Area type="monotone" dataKey="upperBound" stroke="none" fill="url(#bandGrad)" name="AI Upper" />
                  <Area type="monotone" dataKey="lowerBound" stroke="none" fill="white" name="AI Lower" />
                </>
              )}

              <ReferenceLine x={currentMonth} stroke="#64748B" strokeDasharray="4 3" />

              <Line type="monotone" dataKey="budget" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="6 4" dot={false} name="Budget Cap" />
              <Line type="monotone" dataKey="committed" stroke="#4F46E5" strokeWidth={4} dot={{ r: 4, fill: '#4F46E5' }} activeDot={{ r: 6 }} name="Committed" />
              <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={4} strokeDasharray="10 5" dot={{ r: 4, fill: '#10B981' }} name="Actual Spend" />
              
              {hasEnoughData && (
                <Line type="monotone" dataKey="trendLine" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Trend Forecast" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Insights & Variance Row ── */}
      <div className="grid grid-cols-[38%_62%] gap-6 pb-12">
        
        {/* Left: AI Insights */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">AI Risk Insights</h2>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[440px] pr-1">
            {aiInsights.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Processing live data for signals...</p>
              </div>
            ) : aiInsights.map((insight: any) => {
              const color = insight.type === 'Warning' ? 'red' : insight.type === 'Caution' ? 'amber' : 'indigo';
              return (
                <div key={insight.id} className={`p-4 rounded-xl border border-${color}-100 bg-${color}-50/30`}>
                  <div className="flex items-start gap-3">
                    <Info className={`w-4 h-4 text-${color}-500 mt-0.5`} />
                    <div>
                      <h3 className={`font-black text-sm text-${color}-900 mb-1`}>{insight.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{insight.description}</p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Source: {insight.confidence}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Variance by Department */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight text-center">YTD Variance by Department</h2>
            <div className="bg-slate-100 rounded-lg p-1 flex items-center gap-1">
              <button onClick={() => setVarianceMode('chart')} className={`px-4 py-1.5 text-xs font-black rounded-md transition-all ${varianceMode === 'chart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>CHART</button>
              <button onClick={() => setVarianceMode('table')} className={`px-4 py-1.5 text-xs font-black rounded-md transition-all ${varianceMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>TABLE</button>
            </div>
          </div>

          {varianceMode === 'chart' ? (
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={varianceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="dept" width={120} tick={{ fontSize: 11, fontWeight: 'black', fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v: any) => [`₱${Number(v).toLocaleString()}`, 'Variance']} />
                  <Bar dataKey="variance" radius={[0, 4, 4, 0]}>
                    {varianceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.variance > 0 ? '#F43F5E' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Department', 'Committed', 'Budget', 'Variance', 'ML Forecast'].map(h => (
                      <th key={h} className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {varianceData.map((d: any, i: number) => (
                    <tr key={i} className="group cursor-pointer hover:bg-slate-50/50" onClick={() => setSelectedDeptDetail(d.raw)}>
                      <td className="py-4 font-bold text-slate-900 text-sm">{d.dept}</td>
                      <td className="py-4 font-mono text-xs text-slate-600 tracking-tight">{fmt(d.committed)}</td>
                      <td className="py-4 font-mono text-xs text-slate-400 tracking-tight">{fmt(d.budget)}</td>
                      <td className={`py-4 font-mono text-xs font-black ${d.variance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {d.variance > 0 ? '+' : ''}{fmt(d.variance)}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          d.mlRisk ? 'bg-red-50 text-red-600 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {d.mlRisk && <AlertTriangle className="w-2.5 h-2.5" />}
                          {fmt(d.mlExpected)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dept Detail Modal */}
      {selectedDeptDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-black text-2xl text-slate-900">{selectedDeptDetail.departmentName}</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-tight">Granular AI Spending Forecast · 2026</p>
              </div>
              <button onClick={() => setSelectedDeptDetail(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Annual Cap</p>
                <p className="text-xl font-black text-slate-900 font-mono">{fmt(selectedDeptDetail.annualBudget)}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spent (YTD)</p>
                <p className="text-xl font-black text-emerald-600 font-mono">{fmt(selectedDeptDetail.actualSpent)}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Committed</p>
                <p className="text-xl font-black text-indigo-600 font-mono">{fmt(selectedDeptDetail.monthlyForecasts.reduce((s:number,m:any)=>s+m.predictedSpending,0))}</p>
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  {['Month', 'Monthly Cap', 'Committed', 'ML Forecast', 'Risk'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedDeptDetail.monthlyForecasts.map((m: any) => (
                  <tr key={m.month}>
                    <td className="px-5 py-4 font-black text-slate-900">{m.month}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{fmt(m.budgetedAmount)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-indigo-600 font-bold">{fmt(m.predictedSpending)}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-900 font-bold">{fmt(m.mlPredictedSpending)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                        m.mlRiskLevel === 'High' ? 'bg-red-100 text-red-600' : 
                        m.mlRiskLevel === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {m.mlRiskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button onClick={() => setSelectedDeptDetail(null)} className="mt-10 w-full py-4.5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all text-lg tracking-tight">Close Department Analysis</button>
          </div>
        </div>
      )}
    </div>
  );
}
