import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Brain, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import type { MainAdminDepartment } from '../../../../api/mainAdminApi';

interface Props {
  departments: MainAdminDepartment[];
}

// Mock burn-rate data — will be replaced when AI Forecasting engine is connected
const BURN_RATE_DATA = [
  { month: 'Jan', ideal: 100, actual: 95 },
  { month: 'Feb', ideal: 200, actual: 210 },
  { month: 'Mar', ideal: 300, actual: 285 },
  { month: 'Apr', ideal: 400, actual: 430 },
  { month: 'May', ideal: 500, actual: 498 },
  { month: 'Jun', ideal: 600, actual: 620 },
];

const WARNING_REASON: Record<string, string> = {
  'Sales':      'Software licensing costs exceeded departmental cap by 18%. Two unplanned SaaS subscriptions were added in Q2.',
  'Marketing':  'Event-related expenses are tracking 22% above the annual estimate due to last-minute venue changes.',
};

export function ForecastingTab({ departments }: Props) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const totalBudget = departments.reduce((s, d) => s + d.budgetCap, 0);
  // Mock spent = 60% of cap for demo
  const totalSpent = totalBudget * 0.6;

  // Flag departments that might be over budget (mock: budget cap < 50k = warning)
  const deptRows = departments.map(d => ({
    ...d,
    spent: d.budgetCap * (Math.random() * 0.4 + 0.5),
    status: d.budgetCap > 0 && d.budgetCap < 100000 ? 'Warning' : 'On Track',
  }));

  return (
    <div className="space-y-6">
      {/* AI Notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
        <Brain className="w-5 h-5 text-indigo-500 shrink-0" />
        <div>
          <p className="text-sm font-bold text-indigo-900">AI Forecasting Engine — Coming Soon</p>
          <p className="text-xs text-indigo-600 mt-0.5">Predictive spending analysis and anomaly detection will be available after the AI module is integrated. Charts below reflect current budget allocations.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Total Allocated Budget</p>
          <p className="text-3xl font-black text-slate-900">₱{totalBudget.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Across {departments.length} departments</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Estimated Spent to Date</p>
          <p className="text-3xl font-black text-emerald-600">₱{totalSpent.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
          <p className="text-xs text-slate-400 mt-1">{((totalSpent/totalBudget)*100 || 0).toFixed(1)}% of total budget</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-indigo-400" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">AI Accuracy</p>
          </div>
          <p className="text-3xl font-black text-indigo-600">—</p>
          <p className="text-xs text-slate-400 mt-1">Available after AI module is live</p>
        </div>
      </div>

      {/* Burn Rate Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h2 className="font-black text-slate-900">Spend Velocity — Ideal vs. Actual (Mock Data)</h2>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={BURN_RATE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Ideal Burn Rate" dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#4F46E5" strokeWidth={2.5} name="Actual Spend" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Department Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">Department Budget Status</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click a row to see the AI flag reason</p>
        </div>
        {departments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No departments yet. Add departments to see budget tracking here.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Department','Head','Budget Cap','Est. Spent','Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptRows.map(d => (
                <tr key={d.departmentId} onClick={() => d.status === 'Warning' ? setSelectedDept(d.name) : null}
                  className={`transition-colors ${d.status === 'Warning' ? 'cursor-pointer hover:bg-red-50/40' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">{d.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{d.headName}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">{d.budgetCap > 0 ? `₱${d.budgetCap.toLocaleString()}` : '—'}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-700">{d.budgetCap > 0 ? `₱${d.spent.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</td>
                  <td className="px-6 py-4">
                    {d.status === 'Warning'
                      ? <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full w-fit">
                          <AlertTriangle className="w-3 h-3" /> Warning — click to view
                        </span>
                      : <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Warning Modal */}
      {selectedDept && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-amber-500" /></div>
            <h3 className="font-black text-slate-900 text-lg mb-1">AI Flag: {selectedDept}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{WARNING_REASON[selectedDept] ?? 'This department is approaching its budget cap. Review recent transactions for unusual spending patterns.'}</p>
            <button onClick={() => setSelectedDept(null)} className="mt-6 w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
