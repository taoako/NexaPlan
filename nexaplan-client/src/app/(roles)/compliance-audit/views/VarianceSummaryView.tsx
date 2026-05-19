import React, { useState, useEffect } from 'react';
import { Lock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';
import { useAuditorModal } from '../ComplianceAuditSystem';

export function VarianceSummaryView() {
  const { showAlert } = useAuditorModal();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState(2026);

  useEffect(() => {
    fetchVariance();
  }, [fiscalYear]);

  const fetchVariance = async () => {
    setLoading(true);
    try {
      const result = await auditorApi.getVariance(fiscalYear);
      setData(result);
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to load variance data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getUtilizationColor = (pct: number): { text: string; bg: string; border: string; label: string } => {
    if (pct > 90) return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', label: 'At Risk' };
    if (pct > 75) return { text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'Watch' };
    return { text: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Healthy' };
  };

  const fmt = (n: number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const atRiskCount = data?.departments?.filter((d: any) => d.utilizationPct > 90).length ?? 0;

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[28px] font-black text-slate-900">Variance Summary</h2>
            {/* Section 7: Read-only badge */}
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 text-xs font-bold">
              <Lock className="w-3 h-3" />
              Read Only — Auditor View
            </div>
          </div>
          <p className="text-slate-500 font-medium">Budget vs. actual spending by department for FY {fiscalYear}.</p>
        </div>
        {/* Fiscal Year Selector */}
        <select
          value={fiscalYear}
          onChange={e => setFiscalYear(parseInt(e.target.value))}
          className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] bg-white"
        >
          <option value={2024}>FY 2024</option>
          <option value={2025}>FY 2025</option>
          <option value={2026}>FY 2026</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200 shadow-sm">
          Loading variance data...
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Allocated</div>
              <div className="text-2xl font-black text-indigo-600">{fmt(data.totalAllocated)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Actual Spent</div>
              <div className="text-2xl font-black text-slate-900">{fmt(data.totalActualSpent)}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Total Variance</div>
              <div className={`text-2xl font-black ${data.totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {data.totalVariance >= 0 ? '+' : ''}{fmt(data.totalVariance)}
              </div>
            </div>
            <div
              className={`rounded-xl p-5 border shadow-sm ${
                atRiskCount > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Departments at Risk</div>
              <div className={`text-2xl font-black ${atRiskCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {atRiskCount}
              </div>
              <div className={`text-xs font-medium mt-1 ${atRiskCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {atRiskCount > 0 ? 'over 90% utilization' : 'all within budget'}
              </div>
            </div>
          </div>

          {/* Department Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-900">Department Breakdown</h3>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> &lt;75% Healthy</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 75–90% Watch</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> &gt;90% At Risk</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Allocated Cap</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Committed</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actual Spent</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Variance</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Utilization</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.departments.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No departments found for this tenant.</td></tr>
                  ) : data.departments.map((dept: any) => {
                    const colors = getUtilizationColor(dept.utilizationPct);
                    const isPositiveVariance = dept.variance >= 0;
                    return (
                      <tr key={dept.departmentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{dept.departmentName}</td>
                        <td className="px-6 py-4 text-right text-sm text-slate-700 font-mono">{fmt(dept.allocatedCap)}</td>
                        <td className="px-6 py-4 text-right text-sm text-slate-600 font-mono">{fmt(dept.committedFunds)}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 font-mono">{fmt(dept.actualSpent)}</td>
                        <td className={`px-6 py-4 text-right text-sm font-bold font-mono ${isPositiveVariance ? 'text-emerald-600' : 'text-red-600'}`}>
                          <span className="flex items-center justify-end gap-1">
                            {isPositiveVariance ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                            {isPositiveVariance ? '+' : ''}{fmt(dept.variance)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[120px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  dept.utilizationPct > 90 ? 'bg-red-500' :
                                  dept.utilizationPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(dept.utilizationPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{dept.utilizationPct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                            {dept.utilizationPct > 90
                              ? <AlertTriangle className="w-3 h-3" />
                              : <CheckCircle2 className="w-3 h-3" />}
                            {colors.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Footer totals */}
                {data.departments.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td className="px-6 py-3 text-xs font-black text-slate-600 uppercase">TOTAL</td>
                      <td className="px-6 py-3 text-right text-sm font-black text-slate-900 font-mono">{fmt(data.totalAllocated)}</td>
                      <td className="px-6 py-3 text-right text-sm font-mono text-slate-500">—</td>
                      <td className="px-6 py-3 text-right text-sm font-black text-slate-900 font-mono">{fmt(data.totalActualSpent)}</td>
                      <td className={`px-6 py-3 text-right text-sm font-black font-mono ${data.totalVariance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {data.totalVariance >= 0 ? '+' : ''}{fmt(data.totalVariance)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
