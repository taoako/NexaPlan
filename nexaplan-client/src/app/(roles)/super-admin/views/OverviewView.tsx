import React from 'react';
import { CloudDownload, RefreshCw, Power, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';
import type { DashboardView } from '../SuperAdminSystem';
import type { TenantDto, SummaryDto } from '../../../../api/superAdminApi';

interface OverviewViewProps {
  setCurrentView: React.Dispatch<React.SetStateAction<DashboardView>>;
  tenants: TenantDto[];
  summary: SummaryDto | null;
  onRefresh: () => void;
}

export function OverviewView({ setCurrentView, tenants, summary, onRefresh }: OverviewViewProps) {
  const s = summary;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Monthly Recurring Revenue</div>
          <div className="text-4xl font-black text-slate-900 mb-2">₱{(s?.totalMrr ?? 0).toLocaleString()}</div>
          <div className="inline-flex items-center bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded text-xs font-bold">Live from DB</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Active Tenant Organizations</div>
          <div className="text-4xl font-black text-slate-900 mb-2">{s?.activeTenants ?? 0}</div>
          <div className="text-xs text-slate-600 font-medium">{s?.totalTenants ?? 0} total tenants</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Trial Accounts</div>
          <div className="text-4xl font-black text-[#F59E0B] mb-2">{s?.trialAccounts ?? 0}</div>
          <div className="text-xs text-slate-600 font-medium">{s?.pendingTrials ?? 0} pending review</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue Accounts</div>
          <div className="text-4xl font-black text-[#EF4444] mb-2">{s?.overdueAccounts ?? 0}</div>
          <div className="text-xs text-slate-600 font-medium">₱{(s?.overdueAmount ?? 0).toLocaleString()} outstanding</div>
        </div>
      </div>

      {/* Tenant Activity Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">Recent Tenant Activity</h2>
          <div className="flex gap-3">
            <button onClick={onRefresh} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setCurrentView('tenants')} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-md">
              Manage Tenants
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">MRR</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No tenants found. Provision your first tenant to get started.</td></tr>
              ) : tenants.slice(0, 5).map((t) => (
                <tr key={t.tenantID} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900">{t.companyName}</div>
                    <div className="text-xs text-slate-500">{t.orgType}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{t.contactPerson || t.contactEmail}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${t.subscriptionTier.toLowerCase().includes('enterprise') ? 'bg-blue-100 text-blue-800' : t.subscriptionTier.toLowerCase().includes('professional') ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}`}>{t.subscriptionTier}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{t.userCount}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">₱{t.mrr.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${t.statusColor === 'green' ? 'bg-[#10B981]/10 text-[#10B981]' : t.statusColor === 'red' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>{t.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setCurrentView('tenants')} className="text-[#4F46E5] text-sm font-bold hover:underline">Manage →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-6">
          <button onClick={() => setCurrentView('tenants')} className="flex flex-col items-center gap-3 p-6 border border-slate-200 rounded-md hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all group">
            <CloudDownload className="w-8 h-8 text-[#4F46E5] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">Provision New Tenant</span>
          </button>
          <button onClick={() => setCurrentView('trial-requests')} className="flex flex-col items-center gap-3 p-6 border border-slate-200 rounded-md hover:border-slate-400 hover:bg-slate-50 transition-all group">
            <Activity className="w-8 h-8 text-slate-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">Review Trial Requests</span>
            {(s?.pendingTrials ?? 0) > 0 && <span className="text-xs text-[#EF4444] font-bold">{s?.pendingTrials} pending</span>}
          </button>
          <button onClick={() => setCurrentView('billing')} className="flex flex-col items-center gap-3 p-6 border border-slate-200 rounded-md hover:border-slate-400 hover:bg-slate-50 transition-all group">
            <AlertTriangle className="w-8 h-8 text-[#F59E0B] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-900">View Billing</span>
          </button>
        </div>
      </div>
    </div>
  );
}