import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ScrollText, CheckCircle2 } from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';
import { useAuditorFilters } from '../ComplianceAuditSystem';

interface OverviewViewProps {
  onNavigate?: (tab: string, filter?: any) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { getDateRange } = useAuditorFilters();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await auditorApi.getLogSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return <div className="p-8 text-slate-500">Loading overview...</div>;
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 space-y-6">
      <div className="mb-2">
        <h2 className="text-[28px] font-black text-slate-900">Audit Overview</h2>
        <p className="text-slate-500 mt-1 font-medium">Platform-wide security events and financial transactions.</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {/* Total Logs */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Logs</div>
            <div className="text-[28px] font-black text-slate-900 leading-none">{summary.total.toLocaleString()}</div>
          </div>
        </div>

        {/* Flagged for Review — Section 3: Clickable card */}
        <div
          className="bg-white rounded-xl p-5 border border-red-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-300 hover:shadow-md transition-all group"
          onClick={() => onNavigate?.('audit-trails', { flaggedOnly: true })}
          title="Click to view all flagged entries"
        >
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Flagged for Review</div>
            <div className="text-[28px] font-black text-red-600 leading-none">{summary.flagged.toLocaleString()}</div>
            {summary.flagged > 0 && (
              <div className="text-[10px] text-red-400 font-medium mt-0.5">Click to investigate →</div>
            )}
          </div>
        </div>

        {/* Funds Transferred */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Funds Transferred</div>
            <div className="text-[28px] font-black text-slate-900 leading-none">{summary.transfers.toLocaleString()}</div>
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Approvals (24h)</div>
            <div className="text-[28px] font-black text-slate-900 leading-none">{summary.approvals.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-black text-slate-900">Recent Activity</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Actor</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Target</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {summary.recentLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-3.5">
                  <span className={`inline-flex px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                    log.isFlagged ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm font-bold text-slate-900">{log.actor}</td>
                <td className="px-6 py-3.5 text-sm text-slate-600 truncate max-w-[300px]">{log.target}</td>
                <td className="px-6 py-3.5 text-xs text-slate-500">{log.timestamp}</td>
              </tr>
            ))}
            {summary.recentLogs.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No recent activity.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
