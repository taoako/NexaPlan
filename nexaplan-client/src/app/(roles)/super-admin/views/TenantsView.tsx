import React, { useEffect, useState } from 'react';
import { Plus, Edit, Archive, LogIn } from 'lucide-react';
import type { TenantDto } from '../../../../api/superAdminApi';
import { TablePagination } from '../../../../components/TablePagination';

interface TenantsViewProps {
  tenants: TenantDto[];
  onProvision: () => void;
  onEdit: (tenant: TenantDto) => void;
  onArchive: (id: number) => void;
  onImpersonate: (tenant: TenantDto) => void;
}

export function TenantsView({ tenants, onProvision, onEdit, onArchive, onImpersonate }: TenantsViewProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pagedTenants = tenants.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [tenants.length]);

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Tenants</div>
          <div className="text-3xl font-black text-slate-900">{tenants.length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Enterprise Tier</div>
          <div className="text-3xl font-black text-blue-600">{tenants.filter(t => t.subscriptionTier.toLowerCase().includes('enterprise')).length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Trial Accounts</div>
          <div className="text-3xl font-black text-[#F59E0B]">{tenants.filter(t => t.status === 'Trial').length}</div>
        </div>
        <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue</div>
          <div className="text-3xl font-black text-[#EF4444]">{tenants.filter(t => t.status === 'Overdue').length}</div>
        </div>
      </div>

      {/* Tenant Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-slate-900">All Tenant Organizations</h2>
          <button onClick={onProvision} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Provision New Tenant
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Organization</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Main Admin</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">MRR</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No tenants found. Click "Provision New Tenant" to create one.</td></tr>
            ) : pagedTenants.map((tenant) => (
              <tr key={tenant.tenantID} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-slate-900">{tenant.companyName}</div>
                  <div className="text-xs text-slate-500">{tenant.orgType}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700">{tenant.contactPerson}</div>
                  <div className="text-xs text-slate-500 font-mono">{tenant.contactEmail}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                    tenant.subscriptionTier.toLowerCase().includes('enterprise') ? 'bg-blue-100 text-blue-800' :
                    tenant.subscriptionTier.toLowerCase().includes('professional') ? 'bg-purple-100 text-purple-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>{tenant.subscriptionTier}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{tenant.userCount}</td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">₱{tenant.mrr.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                    tenant.statusColor === 'green' ? 'bg-[#10B981]/10 text-[#10B981]' :
                    tenant.statusColor === 'red' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    tenant.statusColor === 'gray' ? 'bg-slate-100 text-slate-500' :
                    'bg-[#F59E0B]/10 text-[#F59E0B]'
                  }`}>{tenant.status}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => onEdit({ ...tenant })} className="text-[#4F46E5] hover:text-[#4338CA] text-xs font-bold flex items-center gap-1 hover:underline">
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => onImpersonate(tenant)} className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 hover:underline">
                      <LogIn className="w-3 h-3" /> Login As
                    </button>
                    <button onClick={() => onArchive(tenant.tenantID)} className="text-[#EF4444] hover:text-red-700 text-xs font-bold flex items-center gap-1 hover:underline">
                      <Archive className="w-3 h-3" /> Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          totalItems={tenants.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
