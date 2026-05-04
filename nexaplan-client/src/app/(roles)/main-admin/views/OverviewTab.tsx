import React from 'react';
import { Users, Building2, Shield, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { MainAdminSummary } from '../../../../api/mainAdminApi';

interface Props {
  summary: MainAdminSummary | null;
  loading: boolean;
  onRoleClick: (roleName: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  'Finance Manager': '#4F46E5',
  'Department Head': '#10B981',
  'Auditor': '#F59E0B',
  'Viewer': '#94A3B8',
};
const DEFAULT_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
const AVATAR_COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#14B8A6'];

function Avatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
      style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
      {initials || '?'}
    </div>
  );
}

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ROLE_BADGE: Record<string, string> = {
  'Finance Manager': 'bg-indigo-100 text-indigo-700',
  'Department Head': 'bg-emerald-100 text-emerald-700',
  'Auditor':        'bg-amber-100 text-amber-700',
  'Viewer':         'bg-slate-100 text-slate-600',
};

export function OverviewTab({ summary, loading, onRoleClick }: Props) {
  if (loading || !summary) return <Spinner />;

  const seatPct = summary.totalSeats > 0 ? (summary.activeUsers / summary.totalSeats) * 100 : 0;
  const seatBarColor = seatPct >= 90 ? 'bg-red-500' : seatPct >= 80 ? 'bg-amber-400' : 'bg-indigo-600';
  const seatTextColor = seatPct >= 90 ? 'text-red-600' : seatPct >= 80 ? 'text-amber-500' : 'text-slate-900';

  const roleChartData = summary.roleDistribution.map((r, i) => ({
    name: r.roleName.replace('Finance Manager', 'Finance Mgr').replace('Department Head', 'Dept Head'),
    count: r.count,
    fill: ROLE_COLORS[r.roleName] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    roleName: r.roleName,
  }));

  const allDeptsHaveBudget = !summary.departments?.length || summary.departments.every(d => d.budgetAccess);
  const formatAction = (action: string) =>
    action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="w-full space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Organization Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back, <span className="text-indigo-600 font-bold">Main Admin</span>. Here's your workspace at a glance.
        </p>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* Card 1 — Active Users */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Licensed</span>
          </div>
          <div className={`text-5xl font-black leading-none ${seatTextColor}`}>{summary.activeUsers}</div>
          <div className="text-sm font-bold text-slate-700 mt-2">Total Active Users</div>
          <div className="text-xs text-slate-400 mt-0.5">Out of {summary.totalSeats} licensed seats</div>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${seatBarColor} rounded-full transition-all duration-500`} style={{ width: `${Math.min(seatPct, 100)}%` }} />
          </div>
          {seatPct >= 80 && (
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-lg px-2 py-1 w-fit">
              <AlertTriangle className="w-3 h-3" />
              {seatPct >= 90 ? 'Upgrade recommended' : 'Seats running low'}
            </div>
          )}
        </div>

        {/* Card 2 — Role Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">RBAC</span>
          </div>
          <div className="text-sm font-bold text-slate-900 mb-2">Role Distribution</div>
          {roleChartData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">No users added yet</div>
          ) : (
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={roleChartData} onClick={(d) => d?.activePayload?.[0] && onRoleClick(d.activePayload[0].payload.roleName)} barCategoryGap="20%">
                  <Tooltip formatter={(v: number) => [v, 'Users']} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} cursor="pointer">
                    {roleChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-slate-400 mt-1">Click a bar to filter users</p>
            </div>
          )}
        </div>

        {/* Card 3 — Departments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest ${allDeptsHaveBudget ? 'text-emerald-600' : 'text-amber-500'}`}>
              {allDeptsHaveBudget ? 'All Active' : 'Partial'}
            </span>
          </div>
          <div className={`text-5xl font-black leading-none text-slate-900`}>{summary.totalDepartments}</div>
          <div className="text-sm font-bold text-slate-700 mt-2">Configured Departments</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {allDeptsHaveBudget ? 'All departments have active budget caps.' : 'Some departments need budget configuration.'}
          </div>
        </div>

        {/* Card 4 — Security */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitoring</span>
          </div>
          <div className="text-sm font-bold text-slate-900">Recent Activity</div>
          <div className="flex items-center gap-2 mt-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-bold">0 Security Warnings</span>
          </div>
          <button onClick={() => onRoleClick('')} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 mt-2 w-fit">
            View audit trails <ArrowRight className="w-3 h-3" />
          </button>
          <div className="text-xs text-slate-400 mt-auto pt-4">
            {summary.mfaEnabled ? '🔐 MFA enforced org-wide' : '⚠ MFA not enforced'}
          </div>
        </div>
      </div>

      {/* ── Bottom Two-Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent User Activity — takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-black text-slate-900">Recent User Activity & Access</h2>
              <p className="text-xs text-slate-400 mt-0.5">Recently added or modified user accounts</p>
            </div>
            <button onClick={() => onRoleClick('')} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 whitespace-nowrap">
              View All Users <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {summary.recentActivity.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">No recent activity yet.</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Name', 'Department', 'Role', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {summary.recentActivity.slice(0, 6).map((a, idx) => (
                    <tr key={a.logId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.target || 'U'} idx={idx} />
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{a.target}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">—</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[a.action] || 'bg-indigo-50 text-indigo-700'}`}>
                          {formatAction(a.action)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm text-slate-600">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Departmental Permissions — takes 1/3 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 shrink-0">
            <h2 className="font-black text-slate-900">Departmental Permissions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Quick-view budget access toggles</p>
          </div>
          {(!summary.departments || summary.departments.length === 0) ? (
            <div className="py-14 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">No departments configured.</div>
          ) : (
            <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
              {summary.departments.slice(0, 8).map((d, idx) => (
                <div key={d.departmentId} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={d.name} idx={idx} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{d.name}</p>
                      <p className="text-xs text-slate-400 truncate">{d.headName || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden xl:block">Budget</span>
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${d.budgetAccess ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${d.budgetAccess ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
