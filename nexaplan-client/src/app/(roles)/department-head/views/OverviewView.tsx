import React, { useEffect, useState } from 'react';
import { deptHeadApi } from '../../../../api/deptHeadApi';
import { Activity, AlertTriangle } from 'lucide-react';

interface OverviewViewProps {
  onNavigateToScenarios?: () => void;
}

export function OverviewView({ onNavigateToScenarios }: OverviewViewProps = {}) {
  const [data, setData] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [scenarioAtRiskCount, setScenarioAtRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, risk, rawScenario] = await Promise.all([
          deptHeadApi.getOverview(),
          deptHeadApi.getSpendingRisk().catch(() => null),
          deptHeadApi.getActiveScenario().catch(() => null)
        ]);
        setData(overview);
        setRiskData(risk);

        if (rawScenario) {
          // Normalize both old (multiplier/scenarioName) and new (adjustmentMultiplier/title) shapes
          const mult: number =
            typeof (rawScenario as any).adjustmentMultiplier === 'number'
              ? (rawScenario as any).adjustmentMultiplier
              : typeof (rawScenario as any).multiplier === 'number'
                ? (rawScenario as any).multiplier
                : 1.0;
          const normalizedScenario = {
            title: (rawScenario as any).title ?? (rawScenario as any).scenarioName ?? (rawScenario as any).name ?? 'Active Scenario',
            adjustmentMultiplier: mult,
          };
          if (mult < 1.0) {
            setActiveScenario(normalizedScenario);
            try {
              const impact = await deptHeadApi.getScenarioImpact(mult, new Date().getFullYear());
              setScenarioAtRiskCount(impact.proposals.filter((p: any) => p.scenarioStatus === 'AtRisk').length);
            } catch { /* non-fatal */ }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-3"><Activity className="animate-spin w-5 h-5"/> Loading overview...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load overview data.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#0A192F]">{data.departmentName} Overview</h1>
        <p className="text-slate-600 mt-2">Budget performance and departmental metrics</p>
      </div>

      {/* Active Restrictive Scenario Banner */}
      {activeScenario && (
        <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-black text-orange-800 text-sm">
                ⚠ Active Budget Scenario: &ldquo;{activeScenario.title}&rdquo; reduces your allocation by {Math.round((1 - activeScenario.adjustmentMultiplier) * 100)}%.
              </div>
              {scenarioAtRiskCount > 0 && (
                <div className="text-sm text-orange-700 mt-0.5">
                  {scenarioAtRiskCount} of your proposals {scenarioAtRiskCount === 1 ? 'is' : 'are'} at risk.
                </div>
              )}
            </div>
          </div>
          {onNavigateToScenarios && (
            <button
              onClick={onNavigateToScenarios}
              className="shrink-0 text-sm font-black text-orange-700 hover:text-orange-900 underline underline-offset-2 whitespace-nowrap transition-colors"
            >
              Review in Scenario Planning →
            </button>
          )}
        </div>
      )}

      {riskData && (
        <div className={`rounded-xl p-5 border shadow-sm flex items-center justify-between ${
          riskData.riskLevel === 'High' ? 'bg-red-50 border-red-200' :
          riskData.riskLevel === 'Medium' ? 'bg-amber-50 border-amber-200' :
          'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              riskData.riskLevel === 'High' ? 'bg-red-100 text-red-600' :
              riskData.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-600' :
              'bg-emerald-100 text-emerald-600'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">AI Spending Signal — {riskData.month}</div>
              <div className="text-lg font-black text-slate-900">{riskData.riskLevel} Risk Level</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-700">Predicted Utilization: {((riskData.predictedSpending / riskData.budgetCap) * 100).toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs ml-auto italic">
              {riskData.riskLevel === 'Low' 
                ? 'Historical patterns suggest this department stays within budget for this month.'
                : `Warning: Historical data shows ${riskData.deptName} often exceeds budget caps in ${riskData.month}.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Allocated Budget</div>
          <div className="text-3xl font-black text-slate-900 mb-1">₱{data.allocatedBudget?.toLocaleString()}</div>
          <div className="text-sm text-[#6366F1]">FY {new Date().getFullYear()}</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Spent to Date</div>
          <div className="text-3xl font-black text-slate-900 mb-1">₱{data.spentToDate?.toLocaleString()}</div>
          <div className="text-sm text-slate-600">{data.utilizationPct}% utilized</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Remaining</div>
          <div className="text-3xl font-black text-[#10B981] mb-1">₱{data.remaining?.toLocaleString()}</div>
          <div className="text-sm text-slate-600">{100 - (data.utilizationPct || 0)}% available</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-600 mb-2">Active Proposals</div>
          <div className="text-3xl font-black text-[#F59E0B] mb-1">{data.activeProposals}</div>
          <div className="text-sm text-slate-600">Under review</div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Monthly Budget Utilization</h2>
        <div className="flex items-end gap-3 h-64 border-b border-slate-200 pb-4">
          {data.monthlyData?.map((m: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <div className="relative group">
                {m.percentage > 0 ? (
                  <>
                    <div
                      className="bg-gradient-to-t from-[#6366F1] to-[#8B5CF6] rounded-t hover:from-[#8B5CF6] hover:to-[#6366F1] transition-all cursor-pointer"
                      style={{ height: `${Math.min((m.percentage / 100) * 200, 200)}px` }}
                    ></div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ₱{m.spentAmount?.toLocaleString()} ({m.percentage}%)
                    </div>
                  </>
                ) : (
                  <div className="bg-slate-100 rounded-t h-4"></div>
                )}
              </div>
              <div className="text-xs text-center text-slate-500 mt-2 font-semibold">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}