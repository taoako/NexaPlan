import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle2, AlertTriangle, Eye, ChevronRight, XCircle } from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';

import { useAuditorModal } from '../ComplianceAuditSystem';

export function AuditTrailsView() {
  const { showAlert } = useAuditorModal();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('All');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingId, setFlaggingId] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [actionType, flaggedOnly]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await auditorApi.getLogs({ search, actionType, flaggedOnly });
      setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingId || !flagReason.trim()) return;
    try {
      await auditorApi.flagLog(flaggingId, flagReason);
      setFlaggingId(null);
      setFlagReason('');
      fetchLogs();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to flag log', 'error');
    }
  };

  const handleUnflag = async (id: number) => {
    try {
      await auditorApi.unflagLog(id);
      fetchLogs();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to unflag log', 'error');
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-160px)]">
        
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <form onSubmit={handleSearch} className="relative w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actor, target, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </form>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value)}
                className="border border-slate-200 rounded-md text-sm px-3 py-2 outline-none"
              >
                <option value="All">All Actions</option>
                <option value="BUDGET_APPROVED">BUDGET_APPROVED</option>
                <option value="FUNDS_TRANSFERRED">FUNDS_TRANSFERRED</option>
                <option value="USER_INVITED">USER_INVITED</option>
                <option value="STATEMENT_VIEWED">STATEMENT_VIEWED</option>
                <option value="STATEMENT_DOWNLOADED">STATEMENT_DOWNLOADED</option>
              </select>
            </div>
            
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-md cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={flaggedOnly} onChange={e => setFlaggedOnly(e.target.checked)} className="rounded text-[#4F46E5] focus:ring-[#4F46E5]" />
              Flagged Only
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Actor</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Target Resource</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">IP / Location</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center p-8 text-slate-500">Loading audit trails...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-slate-500">No logs found matching criteria.</td></tr>
              ) : logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr className={`hover:bg-slate-50/50 transition-colors ${log.isFlagged ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-bold text-slate-900">{log.actor}</div>
                      <div className="text-xs text-slate-500">{log.role}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700 truncate max-w-[200px]">{log.target}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{log.ip}</td>
                    <td className="px-5 py-3.5">
                      {log.isFlagged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3"/> Flagged</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3"/> Logged</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)} className="text-[#4F46E5] hover:bg-indigo-50 p-1.5 rounded-md transition-colors">
                        <ChevronRight className={`w-5 h-5 transition-transform ${expandedRow === log.id ? 'rotate-90' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  
                  {expandedRow === log.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={7} className="p-0">
                        <div className="p-6 border-l-4 border-[#4F46E5] flex gap-8">
                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Raw Metadata Dump</div>
                              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-auto max-h-32 shadow-inner">
                                {JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                          </div>
                          
                          <div className="w-[300px] border-l border-slate-200 pl-6 space-y-4">
                            <div className="text-xs font-bold text-slate-500 uppercase">Auditor Actions</div>
                            {!log.isFlagged ? (
                              <button
                                onClick={() => setFlaggingId(log.id)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg transition-all"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Flag for Investigation
                              </button>
                            ) : (
                              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                <div className="text-xs font-bold text-red-800 mb-1">Investigation Flag Active</div>
                                <div className="text-xs text-red-600 mb-3">{log.flagReason}</div>
                                <div className="text-[10px] text-red-400 mb-3">Flagged: {log.flaggedAt}</div>
                                <button
                                  onClick={() => handleUnflag(log.id)}
                                  className="w-full py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition-colors"
                                >
                                  Resolve & Remove Flag
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagging Modal */}
      {flaggingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleFlag} className="bg-white rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Flag Audit Log
            </h3>
            <p className="text-sm text-slate-500 mb-4">Provide a reason for flagging this transaction for deeper investigation.</p>
            <textarea
              autoFocus
              required
              rows={3}
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
              placeholder="e.g. Suspicious IP address during out-of-office hours..."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => { setFlaggingId(null); setFlagReason(''); }} className="flex-1 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">Confirm Flag</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
