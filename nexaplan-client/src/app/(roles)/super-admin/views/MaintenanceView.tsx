import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudDownload, RefreshCw, Power, CheckCircle2, AlertTriangle,
  Server, Calendar, Clock, Globe, Database, HardDrive, Wifi, WifiOff,
  XCircle, Info,
} from 'lucide-react';
import * as api from '../../../../api/superAdminApi';
import type { MaintenanceStatus, MaintenanceLogEntry } from '../../../../api/superAdminApi';

interface MaintenanceViewProps {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MaintenanceView({ addToast }: MaintenanceViewProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [logs, setLogs] = useState<MaintenanceLogEntry[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getMaintenanceStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load maintenance status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getMaintenanceLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load maintenance logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    // 30-second polling
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.triggerBackup();
      addToast(res.message, 'success');
      await Promise.all([fetchStatus(), fetchLogs()]);
    } catch (err: any) {
      addToast(err.message || 'Backup failed.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleClearCache = async () => {
    setCacheLoading(true);
    try {
      const res = await api.clearCache();
      addToast(res.message, 'success');
      await fetchLogs();
    } catch (err: any) {
      addToast(err.message || 'Cache clear failed.', 'error');
    } finally {
      setCacheLoading(false);
    }
  };

  const handleRestartConfirm = async () => {
    setConfirmRestart(false);
    setRestartLoading(true);
    try {
      const res = await api.restartMicroservices();
      addToast(res.message, 'success');
      await fetchLogs();
    } catch (err: any) {
      addToast(err.message || 'Restart failed.', 'error');
    } finally {
      setRestartLoading(false);
    }
  };

  const fmtGb = (mb: number) => (mb / 1024).toFixed(2) + ' GB';

  const logMeta = (type: string) => {
    switch (type) {
      case 'Success': return { Icon: CheckCircle2, color: '#10B981', bg: '#10B98110', border: '#10B98130' };
      case 'Warning': return { Icon: AlertTriangle, color: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B30' };
      case 'Error':   return { Icon: XCircle, color: '#EF4444', bg: '#EF444410', border: '#EF444430' };
      default:        return { Icon: Info, color: '#3B82F6', bg: '#3B82F610', border: '#3B82F630' };
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {/* DB Status */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Database</span>
          </div>
          {loadingStatus ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>
              <div className={`text-2xl font-black ${status?.databaseStatus === 'Online' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {status?.databaseStatus ?? '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">Latency: {status?.latencyMs ?? 0}ms</div>
            </>
          )}
        </div>

        {/* ML Service */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            {status?.mlServiceStatus === 'Online'
              ? <Wifi className="w-4 h-4 text-slate-400" />
              : <WifiOff className="w-4 h-4 text-slate-400" />}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ML Service</span>
          </div>
          {loadingStatus ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>
              <div className={`text-2xl font-black ${status?.mlServiceStatus === 'Online' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {status?.mlServiceStatus ?? '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1 truncate">{status?.mlServiceUrl ?? 'Render'}</div>
            </>
          )}
        </div>

        {/* DB Size */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">DB Size</span>
          </div>
          {loadingStatus ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-black text-slate-900">{fmtGb(status?.totalDbSizeMb ?? 0)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Capacity: 10 GB ({status?.storageUsedPct ?? 0}%)
              </div>
            </>
          )}
        </div>

        {/* Last Backup */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Backup</span>
          </div>
          {loadingStatus ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-lg font-black text-slate-900 leading-tight">{status?.lastBackupTime ?? 'Never'}</div>
              <div className="text-xs text-slate-500 mt-1">{status?.lastBackupLocation ?? '—'}</div>
            </>
          )}
        </div>

        {/* Uptime */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uptime</span>
          </div>
          {loadingStatus ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-black text-[#4F46E5]">{status?.uptimePct ?? 99.99}%</div>
              <div className="text-xs text-slate-500 mt-1">Last {status?.uptimeDays ?? 30} days</div>
            </>
          )}
        </div>
      </div>

      {/* ── Manual Operations ── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#4F46E5] rounded-full inline-block" />
          Manual Operations
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Backup */}
          <button
            onClick={handleBackup}
            disabled={backupLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[#4F46E5] rounded-lg hover:bg-[#4F46E5]/5 transition-all group disabled:opacity-60"
          >
            {backupLoading
              ? <RefreshCw className="w-10 h-10 text-[#4F46E5] animate-spin" />
              : <CloudDownload className="w-10 h-10 text-[#4F46E5] group-hover:scale-110 transition-transform" />}
            <span className="text-sm font-bold text-slate-900">Record Backup Checkpoint</span>
            <span className="text-xs text-slate-500 text-center leading-relaxed">Actual backups managed by MonsterASP. Click to record a manual checkpoint.</span>
          </button>

          {/* Clear Cache */}
          <button
            onClick={handleClearCache}
            disabled={cacheLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all group disabled:opacity-60"
          >
            {cacheLoading
              ? <RefreshCw className="w-10 h-10 text-slate-600 animate-spin" />
              : <RefreshCw className="w-10 h-10 text-slate-600 group-hover:scale-110 transition-transform" />}
            <span className="text-sm font-bold text-slate-900">Clear Application Cache</span>
            <span className="text-xs text-slate-500">Flush Redis cache clusters</span>
          </button>

          {/* Restart Microservices */}
          <button
            onClick={() => setConfirmRestart(true)}
            disabled={restartLoading}
            className="flex flex-col items-center gap-3 p-6 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-all group disabled:opacity-60"
          >
            {restartLoading
              ? <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
              : <Power className="w-10 h-10 text-red-500 group-hover:scale-110 transition-transform" />}
            <span className="text-sm font-bold text-slate-900">Restart Microservices</span>
            <span className="text-xs text-red-500 font-semibold">Requires double confirmation</span>
          </button>
        </div>
      </div>

      {/* ── Metrics + Schedule ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* SQL Server Metrics */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#F97316] rounded-full inline-block" />
            SQL Server Metrics
          </h2>
          <div className="space-y-5">
            {loadingStatus ? (
              [1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)
            ) : (
              [
                {
                  label: 'Storage Usage',
                  val: `${fmtGb(status?.storageUsedMb ?? 0)} / 10 GB`,
                  pct: status?.storageUsedPct ?? 0,
                  color: '#F97316',
                },
                {
                  label: 'RAM Usage',
                  val: `${status?.ramUsagePct ?? 0}%`,
                  pct: status?.ramUsagePct ?? 0,
                  color: '#3B82F6',
                },
                {
                  label: 'CPU Usage',
                  val: `${status?.cpuUsagePct ?? 0}%`,
                  pct: status?.cpuUsagePct ?? 0,
                  color: '#10B981',
                },
              ].map(({ label, val, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-600">{label}</span>
                    <span className="text-slate-900 font-mono">{val}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Backup Schedule */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-[18px] font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#10B981] rounded-full inline-block" />
            Backup Schedule
          </h2>
          <div className="space-y-3">
            {(status?.backupSchedule ?? [
              { name: 'Daily Full Backup', frequency: 'Every day at 04:00 AM UTC', status: 'Active' },
              { name: 'Incremental Backup', frequency: 'Every 6 hours', status: 'Active' },
              { name: 'Geo-Replication', frequency: 'PH → Asia-Pacific', status: 'Synced' },
            ]).map(({ name, frequency, status: bs }, i) => {
              const icons = [Calendar, Clock, Globe];
              const Icon = icons[i] ?? Calendar;
              const badgeColor = bs === 'Synced'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-emerald-100 text-emerald-700';
              return (
                <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4F46E5]/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[#4F46E5]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{name}</div>
                      <div className="text-xs text-slate-500">{frequency}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${badgeColor}`}>{bs}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── System Maintenance Logs ── */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-slate-900">System Maintenance Logs</h2>
          <button
            onClick={fetchLogs}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-all"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {loadingLogs ? (
            [1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />)
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Server className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No maintenance logs yet.</p>
              <p className="text-xs mt-1">Actions like backup, cache clear, and restart will appear here.</p>
            </div>
          ) : (
            logs.map((log) => {
              const { Icon, color, bg, border } = logMeta(log.type);
              return (
                <div
                  key={log.logId}
                  className="flex items-start gap-4 p-4 rounded-lg"
                  style={{ backgroundColor: bg, border: `1px solid ${border}` }}
                >
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      [{log.type}] {log.message}
                    </div>
                    {log.detail && (
                      <div className="text-xs text-slate-500 mt-0.5">{log.detail}</div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {log.timeAgo || timeAgo(log.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Restart Confirmation Modal ── */}
      {confirmRestart && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Power className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-lg mb-2">Restart All Microservices?</h3>
            <p className="text-slate-500 text-sm mb-6">
              This will restart all running microservices. Active connections may be interrupted for
              <strong> 30–60 seconds</strong>. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRestartConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold transition-all"
              >
                Yes, Restart
              </button>
              <button
                onClick={() => setConfirmRestart(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}