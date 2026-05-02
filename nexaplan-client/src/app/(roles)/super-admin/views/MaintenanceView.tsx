import React from 'react';
import { CloudDownload, RefreshCw, Power, CheckCircle2, Activity, AlertTriangle, Server, Calendar, Clock, Globe } from 'lucide-react';

export function MaintenanceView() {
  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Database Status</div>
          <div className="text-3xl font-black text-[#10B981]">Online</div>
          <div className="text-xs text-slate-600 mt-2">Latency: 12ms</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total DB Size</div>
          <div className="text-3xl font-black text-slate-900">1.24 GB</div>
          <div className="text-xs text-slate-600 mt-2">Capacity: 10 GB (12%)</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Last Backup</div>
          <div className="text-xl font-black text-slate-900">Today, 04:00 AM</div>
          <div className="text-xs text-slate-600 mt-2">AWS S3 US-East</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Uptime</div>
          <div className="text-3xl font-black text-[#4F46E5]">99.99%</div>
          <div className="text-xs text-slate-600 mt-2">Last 30 days</div>
        </div>
      </div>

      {/* Manual Operations */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Manual Operations</h2>
        <div className="grid grid-cols-3 gap-6">
          <button
            onClick={() => alert('💾 Manual backup initiated!\n\nEstimated completion: 4 minutes.\nDestination: AWS S3 US-East')}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[#4F46E5] rounded-md hover:bg-[#4F46E5]/5 transition-all group"
          >
            <CloudDownload className="w-10 h-10 text-[#4F46E5] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">Trigger Manual Backup</span>
            <span className="text-xs text-slate-600">Create immediate database snapshot</span>
          </button>
          <button
            onClick={() => alert('🔄 Cache cleared!\n\nRedis clusters flushed. All caches will rebuild on next request.')}
            className="flex flex-col items-center gap-3 p-6 border-2 border-slate-300 rounded-md hover:bg-slate-50 transition-all group"
          >
            <RefreshCw className="w-10 h-10 text-slate-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">Clear Application Cache</span>
            <span className="text-xs text-slate-600">Flush Redis cache clusters</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('⚠️ This will restart all microservices. ~30 seconds of downtime. Confirm?'))
                alert('🔁 Microservices restarting. ETA: 30s.');
            }}
            className="flex flex-col items-center gap-3 p-6 border-2 border-[#EF4444] rounded-md hover:bg-[#EF4444]/5 transition-all group"
          >
            <Power className="w-10 h-10 text-[#EF4444] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">Restart Microservices</span>
            <span className="text-xs text-[#EF4444] font-semibold">Requires double confirmation</span>
          </button>
        </div>
      </div>

      {/* SQL Metrics + Backup Schedule */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-[20px] font-semibold text-slate-900 mb-6">SQL Server Metrics</h2>
          <div className="space-y-4">
            {[
              { label: 'Storage Usage', val: '1.2 GB / 10 GB', pct: 12, color: '#10B981' },
              { label: 'RAM Usage', val: '45%', pct: 45, color: '#3B82F6' },
              { label: 'CPU Usage', val: '28%', pct: 28, color: '#10B981' },
            ].map(({ label, val, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-600">{label}</span>
                  <span className="text-slate-900">{val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Backup Schedule</h2>
          <div className="space-y-3">
            {[
              { icon: Calendar, label: 'Daily Full Backup', sub: 'Every day at 04:00 AM UTC', status: 'Active' },
              { icon: Clock, label: 'Incremental Backup', sub: 'Every 6 hours', status: 'Active' },
              { icon: Globe, label: 'Geo-Replication', sub: 'US-East → Asia-Pacific', status: 'Synced' },
            ].map(({ icon: Icon, label, sub, status }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#4F46E5]" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{label}</div>
                    <div className="text-xs text-slate-600">{sub}</div>
                  </div>
                </div>
                <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Maintenance Logs */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-[20px] font-semibold text-slate-900">System Maintenance Logs</h2>
        </div>
        <div className="p-6 space-y-3">
          {[
            { icon: CheckCircle2, color: '#10B981', title: '[Success] Auto-Backup completed', sub: 'Size: 4.2GB • Location: AWS S3 US-East • Duration: 4m 32s', time: '2 hours ago' },
            { icon: Activity, color: '#3B82F6', title: '[Update] Scikit-Learn Model Retrained', sub: 'Accuracy: 94.2% • Time: 01:15 AM', time: '5 hours ago' },
            { icon: AlertTriangle, color: '#F59E0B', title: '[Warning] High memory usage on C# API Node 2', sub: 'Resolved automatically • Peak: 92% • Auto-scaled to 3 nodes', time: 'Yesterday, 11:42 PM' },
            { icon: CheckCircle2, color: '#10B981', title: '[Success] Redis Cache Flushed', sub: 'Initiated by: Justin Bais • Cluster: Production', time: 'Yesterday' },
            { icon: Server, color: '#3B82F6', title: '[Info] Database Index Optimization Completed', sub: 'Performance improvement: +18% • Tables: 47', time: '2 days ago' },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-md" style={{ backgroundColor: `${log.color}08`, border: `1px solid ${log.color}30` }}>
              <log.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: log.color }} />
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900">{log.title}</div>
                <div className="text-xs text-slate-600 mt-1">{log.sub}</div>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}