import React, { useState, useEffect } from 'react';
import { financeManagerApi } from '../../../../api/financeManagerApi';
import {
  TrendingUp, AlertTriangle, Download, Calendar, Building2,
  Activity, ArrowUp, ArrowDown, Zap, CheckCircle2, Info, RefreshCw, Cpu
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine, Cell, Legend
} from 'recharts';

export function ForecastingView() {
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [varianceMode, setVarianceMode] = useState<'chart' | 'table'>('chart');
  const [modalMessage, setModalMessage] = useState<{ title: string; message: string; type: 'error'|'success'|'info' } | null>(null);

  const fetchForecast = () => {
    setLoading(true);
    const currentYear = new Date().getFullYear();
    financeManagerApi.getTrendForecast(currentYear)
      .then(setForecastData)
      .catch(err => console.error('Forecast load failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchForecast(); }, []);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData: any[] = forecastData?.chartData ?? [];

  const safeLocale = (val: any) => (val || 0).toLocaleString();

  // Variance by dept (committed vs budget)
  const varianceData = (forecastData?.departments ?? []).map((d: any) => {
    const mForecasts = d.monthlyForecasts || d.MonthlyForecasts || [];
    const committed = Math.round(mForecasts.reduce((s: number, m: any) => s + (m.predictedSpending || m.PredictedSpending || 0), 0));
    const budget = Math.round(mForecasts.reduce((s: number, m: any) => s + (m.budgetedAmount || m.BudgetedAmount || 0), 0));
    return {
      dept: d.departmentName || d.DepartmentName,
      committed,
      budget,
      variance: committed - budget, // positive = over budget
      mlRisk: mForecasts.some((m: any) => (m.mlRiskLevel || m.MlRiskLevel) === 'High'),
      mlExpected: Math.round(mForecasts.reduce((s: number, m: any) => s + (m.mlPredictedSpending || m.MlPredictedSpending || 0), 0)),
    };
  });

  const aiInsights = (forecastData?.insights ?? []).map((i: any, idx: number) => ({ ...i, id: idx }));

  const trendMethod   = forecastData?.trendMethod ?? 'none';
  const monthsOfData  = forecastData?.monthsOfData ?? 0;
  const hasEnoughData = forecastData?.hasEnoughData ?? false;

  const currentMonth = new Date().toLocaleString('en', { month: 'short' }).toUpperCase().slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading forecast data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">

      {/* Sub-Header */}
      <div className="bg-white border-b border-slate-200 flex items-center justify-between px-8 py-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-emerald-800">Live Data</span>
          </div>
          {trendMethod !== 'none' && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-sm font-bold text-purple-800">Trend: {trendMethod}</span>
            </div>
          )}
          <span className="text-xs text-slate-500">{monthsOfData} month{monthsOfData !== 1 ? 's' : ''} of reconciled data</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs text-slate-600">RF Model Accuracy: <span className="font-bold text-purple-700">81.7%</span></span>
          </div>
          <button onClick={fetchForecast} disabled={loading} className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-50">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-6 overflow-auto">

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Projected EOY (Committed)</div>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-4xl font-black text-slate-900 mb-2 font-mono">₱{safeLocale(forecastData?.projectedEOY)}</div>
            <div className="text-xs text-slate-500">Sum of all approved proposal budgets this year</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Total Allocated Budget</div>
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-4xl font-black text-slate-900 mb-2 font-mono">₱{safeLocale(forecastData?.totalBudget)}</div>
            <div className="text-xs text-slate-500">From DepartmentAllocations for fiscal year</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wider">Budget Depletion Risk</div>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className={`text-4xl font-black mb-2 ${forecastData?.depletionRisk === 'High' ? 'text-red-600' : forecastData?.depletionRisk === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
              {forecastData?.depletionRisk ?? '—'}
            </div>
            <div className="text-xs text-slate-500">{(forecastData?.variancePct ?? 0).toFixed(1)}% committed vs budget</div>
          </div>
        </div>

        {/* Trajectory Chart */}
        <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Expense Trajectory &amp; Forecast</h2>
              <p className="text-sm text-slate-500 mt-1">
                Actual spend (from receipt dates) · Committed projections · {hasEnoughData ? `${trendMethod} trend forecast` : 'Trend: needs 3+ months of data'} · ML risk signals
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs flex-wrap justify-end">
              <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-blue-600" /> Actual Spend</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-slate-400" /> Budget Cap</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-emerald-500" /> Committed</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-purple-500" /> Trend Forecast</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-3 bg-purple-200 rounded opacity-70" /> Confidence Band</span>
            </div>
          </div>

          {!hasEnoughData && (
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Trend forecasting needs 3+ months of reconciled expenses with receipt dates (SpentDate). Reconcile expenses using the "Date on receipt" field to activate the trend line.
            </div>
          )}

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#8B5CF6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  tickFormatter={v => v >= 1_000_000 ? `₱${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `₱${(v/1000).toFixed(0)}k` : `₱${v}`}
                  width={72}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  formatter={(value: any, name: string) => {
                    if (value == null) return ['—', name];
                    return [`₱${Number(value).toLocaleString()}`, name];
                  }}
                />
                <ReferenceLine x={currentMonth} stroke="#64748B" strokeDasharray="4 3" label={{ value: 'Today', position: 'top', fill: '#64748B', fontSize: 11 }} />

                {/* Confidence band: upper / lower */}
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="url(#bandGrad)" name="Upper Bound" />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="white"         name="Lower Bound" />

                {/* Trend confidence band */}
                <Area type="monotone" dataKey="trendUpper" stroke="none" fill="url(#bandGrad)" fillOpacity={0.5} name="Trend Upper" />
                <Area type="monotone" dataKey="trendLower" stroke="none" fill="white"          name="Trend Lower" />

                {/* Budget cap — dashed grey */}
                <Line type="monotone" dataKey="budget"    stroke="#94A3B8" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Budget Cap" />

                {/* Actual — solid blue */}
                <Line type="monotone" dataKey="actual"    stroke="#2563EB" strokeWidth={3} dot={{ fill: '#2563EB', r: 4 }} connectNulls={false} name="Actual Spend" />

                {/* Committed (Approved proposals) — solid green */}
                <Line type="monotone" dataKey="committed" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 3 }} connectNulls={false} name="Committed" />

                {/* Trend forecast — dashed purple */}
                {hasEnoughData && (
                  <Line type="monotone" dataKey="trendLine" stroke="#8B5CF6" strokeWidth={2.5} strokeDasharray="7 4" dot={{ fill: '#8B5CF6', r: 3 }} connectNulls={false} name="Trend Forecast" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Risk Calendar */}
        <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Seasonal Risk Calendar</h2>
              <p className="text-sm text-slate-500 mt-1">Historical spending patterns by department — ML signals for all 12 months</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Med Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> High Risk</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-white z-10 w-40">Department</th>
                  {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                    <th key={m} className="py-3 px-2 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(forecastData?.departments ?? []).map((d: any, idx: number) => {
                  const mForecasts = d.monthlyForecasts || d.MonthlyForecasts || [];
                  return (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 group transition-colors">
                      <td className="py-4 px-4 text-sm font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10">{d.departmentName || d.DepartmentName}</td>
                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => {
                        const mData = mForecasts.find((f: any) => (f.month || f.Month || "").toUpperCase().startsWith(m));
                        const risk = mData?.mlRiskLevel || mData?.MlRiskLevel || 'Low';
                        const dotColor = risk === 'High' ? 'bg-red-500' : risk === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';
                        const bgColor = risk === 'High' ? 'bg-red-50' : risk === 'Medium' ? 'bg-amber-50' : 'bg-emerald-50';
                        return (
                          <td key={m} className="py-4 px-2 text-center">
                            <div className="flex justify-center">
                              <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center border border-slate-100 shadow-sm transition-transform hover:scale-110 group-hover:shadow-md cursor-help`} title={`${risk} Risk in ${m}`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-inner`} />
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Variance & Insights */}
        <div className="grid grid-cols-[58%_42%] gap-6 pb-12">

          {/* Variance by department with ML expected column */}
          <div className="bg-white rounded-lg p-8 border border-slate-200 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">YTD Variance by Department</h2>
              <div className="bg-slate-100 rounded-lg p-1 flex items-center gap-1">
                <button onClick={() => setVarianceMode('chart')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${varianceMode === 'chart' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Chart</button>
                <button onClick={() => setVarianceMode('table')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${varianceMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Table</button>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1 mb-4">Committed vs Budget · ML Expected column flags anomalies</p>

            {varianceMode === 'chart' ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => v >= 1000 ? `₱${(v/1000).toFixed(0)}k` : `₱${v}`}
                    />
                    <YAxis type="category" dataKey="dept" width={100} tick={{ fontSize: 11, fill: '#334155' }} />
                    <Tooltip formatter={(value: any) => [`₱${Number(value).toLocaleString()}`, 'Variance']} />
                    <ReferenceLine x={0} stroke="#94A3B8" />
                    <Bar dataKey="variance" radius={[4, 4, 4, 4]}>
                      {varianceData.map((entry: any, index: number) => (
                        <Cell key={`variance-${index}`} fill={entry.variance > 0 ? '#EF4444' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-2 text-xs font-bold text-slate-500 uppercase">Department</th>
                    <th className="text-right pb-2 text-xs font-bold text-slate-500 uppercase">Committed</th>
                    <th className="text-right pb-2 text-xs font-bold text-slate-500 uppercase">Variance</th>
                    <th className="text-right pb-2 text-xs font-bold text-blue-600 uppercase">ML Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {varianceData.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 font-semibold text-slate-800">{d.dept}</td>
                      <td className="py-3 text-right font-mono text-slate-700">₱{d.committed.toLocaleString()}</td>
                      <td className={`py-3 text-right font-mono font-bold ${d.variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {d.variance > 0 ? '+' : '−'}₱{Math.abs(d.variance).toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-mono text-xs px-2 py-1 rounded-full font-bold ${d.mlRisk ? 'bg-red-50 text-red-600 border border-red-200' : 'text-blue-600'}`}>
                          ₱{d.mlExpected.toLocaleString()} {d.mlRisk ? '⚠' : '✓'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {varianceData.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No department data yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Insights Feed */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" /> AI Risk Insights
              </h2>
              <p className="text-sm text-slate-500 mt-1">ML model + committed data signals</p>
            </div>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {aiInsights.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">No insights generated yet. Add approved proposals with planned months to activate.</div>
              ) : aiInsights.map((insight: any) => {
                const Icon = insight.type === 'warning' ? AlertTriangle : insight.type === 'optimization' ? TrendingUp : insight.type === 'anomaly' ? Activity : CheckCircle2;
                const cls  = insight.type === 'warning' ? 'border-red-200 bg-red-50' : insight.type === 'optimization' ? 'border-purple-200 bg-purple-50' : 'border-emerald-200 bg-emerald-50';
                const ic   = insight.type === 'warning' ? 'text-red-600' : insight.type === 'optimization' ? 'text-purple-600' : 'text-emerald-600';
                return (
                  <div key={insight.id} className={`p-4 rounded-lg border ${cls}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-4 h-4 ${ic} flex-shrink-0 mt-0.5`} />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 mb-1">{insight.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{insight.description}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
                          <Info className="w-3 h-3" /> Source: {insight.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="font-black text-lg text-slate-900 text-center mb-2">{modalMessage.title}</h3>
            <p className="text-sm text-slate-600 text-center mb-6">{modalMessage.message}</p>
            <button onClick={() => setModalMessage(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition-all">Acknowledge</button>
          </div>
        </div>
      )}
    </div>
  );
}
