import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle2, AlertTriangle, ChevronRight, Download, X
} from 'lucide-react';
import { auditorApi } from '../../../../api/auditorApi';
import { TablePagination } from '../../../../components/TablePagination';
import { useAuditorModal } from '../ComplianceAuditSystem';
import { useAuditorFilters } from '../ComplianceAuditSystem';

// Section 8a: Action type badge color map
const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  'SETTINGS_UPDATED':          { bg: '#EEF2FF', color: '#4338CA' },
  'ALLOCATION_ADJUSTED':       { bg: '#FEF3C7', color: '#92400E' },
  'STATEMENT_DOWNLOADED':      { bg: '#ECFDF5', color: '#065F46' },
  'STATEMENT_VIEWED':          { bg: '#F0FDF4', color: '#166534' },
  'ScenarioPitchAcknowledged': { bg: '#F0FDF4', color: '#166534' },
  'ScenarioPitchSubmitted':    { bg: '#FFF7ED', color: '#9A3412' },
  'USER_UPDATED':              { bg: '#F0F9FF', color: '#075985' },
  'USER_CREATED':              { bg: '#F0F9FF', color: '#075985' },
  'USER_SUSPENDED':            { bg: '#FEF2F2', color: '#991B1B' },
  'USER_ACTIVATED':            { bg: '#ECFDF5', color: '#065F46' },
  'USER_LOCKED':               { bg: '#FEF2F2', color: '#991B1B' },
  'USER_UNLOCKED':             { bg: '#ECFDF5', color: '#065F46' },
  'USER_DELETED':              { bg: '#FEF2F2', color: '#991B1B' },
  'PROPOSAL_APPROVED':         { bg: '#ECFDF5', color: '#065F46' },
  'PROPOSAL_REJECTED':         { bg: '#FEF2F2', color: '#991B1B' },
  'PROPOSAL_CREATED':          { bg: '#EEF2FF', color: '#4338CA' },
  'EXPENSE_RECONCILED':        { bg: '#ECFDF5', color: '#065F46' },
  'EXPENSE_REJECTED':          { bg: '#FEF2F2', color: '#991B1B' },
  'BUDGET_APPROVED':           { bg: '#ECFDF5', color: '#065F46' },
  'FUNDS_TRANSFERRED':         { bg: '#FEF3C7', color: '#92400E' },
  'COMPLIANCE_RULE_CREATED':   { bg: '#EEF2FF', color: '#4338CA' },
  'SCENARIO_ACTIVATED':        { bg: '#FFF7ED', color: '#9A3412' },
  'DEPARTMENT_CREATED':        { bg: '#EEF2FF', color: '#4338CA' },
  'DEPARTMENT_UPDATED':        { bg: '#FEF3C7', color: '#92400E' },
  'DEPARTMENT_DELETED':        { bg: '#FEF2F2', color: '#991B1B' },
};

function getActionColors(action: string) {
  return ACTION_COLORS[action] ?? { bg: '#F8FAFC', color: '#64748B' };
}

interface AuditTrailsViewProps {
  preFilter?: {
    flaggedOnly?: boolean;
    actionType?: string;
    from?: string;
    to?: string;
    departmentId?: string;
  } | null;
}

export function AuditTrailsView({ preFilter }: AuditTrailsViewProps) {
  const { showAlert } = useAuditorModal();
  const { getDateRange } = useAuditorFilters();

  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState(preFilter?.actionType || 'All');
  const [flaggedOnly, setFlaggedOnly] = useState(preFilter?.flaggedOnly ?? false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null); // Section 2: Side panel
  const [flagReason, setFlagReason] = useState('');
  const [flaggingId, setFlaggingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Apply pre-filters when they change (e.g. from overview card click or compliance deep-link)
  useEffect(() => {
    if (preFilter) {
      setFlaggedOnly(preFilter.flaggedOnly ?? false);
      setActionType(preFilter.actionType || 'All');
      setPage(1);
    }
  }, [preFilter]);

  // Bug Fix #4: Re-fetch when filters change (including global date range)
  useEffect(() => {
    fetchLogs();
    setPage(1);
  }, [actionType, flaggedOnly]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      let data: { total: number; page: number; pageSize: number; logs: any[] };

      if (flaggedOnly) {
        // Section 3: Dedicated flagged endpoint
        data = await auditorApi.getFlaggedLogs({ from, to, page });
      } else {
        data = await auditorApi.getLogs({ search, actionType, from, to, page, pageSize });
      }

      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingId || !flagReason.trim()) return;
    try {
      await auditorApi.flagLog(flaggingId, flagReason);
      setFlaggingId(null);
      setFlagReason('');
      // Update the selected log in the side panel if it matches
      if (selectedLog && selectedLog.id === flaggingId) {
        setSelectedLog({ ...selectedLog, isFlagged: true, flagReason });
      }
      fetchLogs();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to flag log', 'error');
    }
  };

  const handleUnflag = async (id: number) => {
    try {
      await auditorApi.unflagLog(id);
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog({ ...selectedLog, isFlagged: false, flagReason: null, flaggedAt: null });
      }
      fetchLogs();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to unflag log', 'error');
    }
  };

  // Section 6: Export CSV for current filtered view
  const handleExportCurrentView = async () => {
    try {
      const { from, to } = getDateRange();
      await auditorApi.downloadReport(
        'audit-trail',
        { from, to, search, actionType: actionType !== 'All' ? actionType : undefined },
        `nexaplan-audit-trail-filtered-${from}.csv`
      );
      showAlert('Downloaded', 'Filtered audit trail exported as CSV.', 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'Export failed', 'error');
    }
  };

  const pagedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 relative">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>

        {/* Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <form onSubmit={handleSearch} className="relative w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search actor, action, target..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
            </form>

            <select
              value={actionType}
              onChange={e => { setActionType(e.target.value); setPage(1); }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              <option value="All">All Actions</option>
              <option>EXPENSE_RECONCILED</option>
              <option>EXPENSE_REJECTED</option>
              <option>PROPOSAL_APPROVED</option>
              <option>PROPOSAL_REJECTED</option>
              <option>PROPOSAL_CREATED</option>
              <option>ALLOCATION_ADJUSTED</option>
              <option>STATEMENT_DOWNLOADED</option>
              <option>USER_CREATED</option>
              <option>USER_UPDATED</option>
              <option>USER_SUSPENDED</option>
              <option>COMPLIANCE_RULE_CREATED</option>
              <option>SCENARIO_ACTIVATED</option>
            </select>

            {/* Section 3: Flagged Only checkbox */}
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={e => { setFlaggedOnly(e.target.checked); setPage(1); }}
                className="rounded text-red-500 focus:ring-red-500"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Flagged Only
              </span>
            </label>
          </div>

          {/* Section 6: Export CSV */}
          <button
            onClick={handleExportCurrentView}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            Export CSV
          </button>
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
              ) : pagedLogs.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-8 text-slate-500">No logs found matching criteria.</td></tr>
              ) : pagedLogs.map(log => {
                const colors = getActionColors(log.action);
                // Section 8b: Amber left border for flagged rows
                const rowStyle = log.isFlagged
                  ? { borderLeft: '3px solid #F59E0B', background: 'rgba(251,191,36,0.04)' }
                  : {};
                return (
                  <tr
                    key={log.id}
                    style={rowStyle}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-bold text-slate-900">{log.actor || log.actorName}</div>
                      <div className="text-xs text-slate-500">{log.role || log.actorRole}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Section 8a: Color-coded action badge */}
                      <span style={{ background: colors.bg, color: colors.color, fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 600, display: 'inline-block' }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700 truncate max-w-[200px]">{log.target}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{log.ip || log.ipAddress}</td>
                    <td className="px-5 py-3.5">
                      {log.isFlagged ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Logged
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 8c: Pagination with accurate total */}
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={total || logs.length}
          onPageChange={(p) => { setPage(p); fetchLogs(); }}
        />
      </div>

      {/* Section 2: Log Detail Side Panel */}
      {selectedLog && (
        <div
          className="fixed top-0 right-0 h-full bg-white border-l border-slate-200 z-[60] overflow-y-auto shadow-2xl"
          style={{ width: 440 }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-black text-slate-900">Log Detail</h2>
                <p className="text-xs text-slate-500 mt-0.5">Full audit entry metadata</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status indicator */}
            {selectedLog.isFlagged && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">Flagged for Investigation</span>
                </div>
                <p className="text-xs text-amber-700">{selectedLog.flagReason}</p>
                {selectedLog.flaggedAt && (
                  <p className="text-[10px] text-amber-600 mt-1">Flagged: {selectedLog.flaggedAt}</p>
                )}
              </div>
            )}

            {/* Fields */}
            <div className="space-y-4">
              {[
                { label: 'Log ID',         value: `#${selectedLog.id}` },
                { label: 'Timestamp',      value: selectedLog.timestamp },
                { label: 'Actor',          value: `${selectedLog.actor || selectedLog.actorName}` },
                { label: 'Role',           value: selectedLog.role || selectedLog.actorRole },
                { label: 'Action',         value: selectedLog.action },
                { label: 'Target Resource',value: selectedLog.target || selectedLog.targetResource },
                { label: 'IP Address',     value: selectedLog.ip || selectedLog.ipAddress || 'Unknown' },
                { label: 'Status',         value: selectedLog.isFlagged ? `Flagged` : 'Logged' },
                { label: 'Flagged By',     value: selectedLog.flaggedBy || '—' },
                { label: 'Flagged At',     value: selectedLog.flaggedAt || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
                  <div className="text-sm text-slate-900 break-all font-medium">{value ?? '—'}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
              {selectedLog.isFlagged ? (
                <button
                  onClick={() => handleUnflag(selectedLog.id)}
                  className="w-full py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all"
                >
                  Resolve &amp; Remove Flag
                </button>
              ) : (
                <button
                  onClick={() => setFlaggingId(selectedLog.id)}
                  className="w-full py-2.5 bg-white border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Flag for Investigation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for side panel */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/20 z-[55]"
          onClick={() => setSelectedLog(null)}
        />
      )}

      {/* Flagging Modal — no window.prompt(), uses React modal */}
      {flaggingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <form onSubmit={handleFlag} className="bg-white rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Flag Audit Log
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Provide a reason for flagging this entry for deeper investigation.
            </p>
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
              <button
                type="button"
                onClick={() => { setFlaggingId(null); setFlagReason(''); }}
                className="flex-1 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Confirm Flag
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
