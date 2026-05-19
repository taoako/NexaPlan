import React, { useState } from 'react';
import { Search, Download, RefreshCw, Calendar } from 'lucide-react';
import type { MainAdminLog } from '../../../../api/mainAdminApi';
import { TablePagination } from '../../../../components/TablePagination';
import { apiUrl } from '../../../../config/api';

interface Props {
  logs: MainAdminLog[];
  loading: boolean;
  onFilter: (params: { search?: string; type?: string; from?: string; to?: string }) => void;
}

const LOG_TYPES = ['All','USER','DEPARTMENT','SETTINGS','BULK'];

export function LogsTab({ logs, loading, onFilter }: Props) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const applyFilter = () => {
    setPage(1);
    onFilter({ search: search || undefined, type: type === 'All' ? undefined : type, from: from || undefined, to: to || undefined });
  };

  const handleSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') applyFilter(); };

  const dot = (t: string) => {
    const map: Record<string, string> = { success: 'bg-emerald-400', warning: 'bg-amber-400', info: 'bg-blue-400' };
    return <span className={`w-2 h-2 rounded-full shrink-0 ${map[t] || 'bg-slate-400'}`} />;
  };

  const actionLabel = (a: string) => a.replace(/_/g,' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const pagedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = async () => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (type !== 'All') q.set('type', type);
    if (from) q.set('dateFrom', from);
    if (to) q.set('dateTo', to);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const tenantId = user?.tenantId || 0;

    // Use apiUrl helper to ensure we hit the backend, not the Vite dev server
    const url = apiUrl(`/api/main-admin/export?${q.toString()}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-Tenant-Id': String(tenantId),
          'X-User-Id': user?.userId?.toString() || '',
        }
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `NexaPlan_AuditLog_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed', err);
      alert('Professional export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKey} placeholder="Search logs… (press Enter)" className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={type} onChange={e => setType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
          {LOG_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <button onClick={applyFilter} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">Apply</button>
        <button onClick={exportCsv} className="ml-auto flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900">Audit Trail</h2>
          <span className="text-xs text-slate-400 font-semibold">{logs.length} entries</span>
        </div>
        <div className="overflow-y-auto max-h-[520px]">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                {['','Time','Action','Target','User','IP'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center"><RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No log entries found.</td></tr>
              ) : pagedLogs.map(l => (
                <tr key={l.logId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">{dot(l.type)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(l.time).toLocaleString('en-PH')}</td>
                  <td className="px-5 py-3"><span className="text-xs font-bold text-slate-900">{actionLabel(l.action)}</span></td>
                  <td className="px-5 py-3 text-sm text-slate-700 max-w-[200px] truncate">{l.target}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">{l.userName}</td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-400">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={logs.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
