import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, ChevronDown, UserPlus, Plus, Users, ShieldCheck, Building2,
  ScrollText, Eye, ToggleLeft, ToggleRight, ArrowRight, AlertTriangle,
  CheckCircle2, Clock, BarChart3, Activity, Settings, FileText, DollarSign,
  X, Edit, Trash2, Download, Filter, MoreVertical, Key, Mail, LogOut, User, Lock, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import logoImg from "../../../assets/brand/nexaplan-logo.png";

type AdminTab = 'overview' | 'users' | 'departments' | 'settings' | 'logs' | 'budget';

interface User {
  id: number;
  name: string;
  email: string;
  dept: string;
  role: string;
  status: 'Active' | 'Pending' | 'Suspended';
}

interface Department {
  id: number;
  name: string;
  head: string;
  initials: string;
  budgetAccess: boolean;
  userCount?: number;
}

const initialUsers: User[] = [
  { id: 1, name: 'Maria Santos', email: 'maria.santos@acmecorp.ph', dept: 'Finance', role: 'Finance Manager', status: 'Active' },
  { id: 2, name: 'Carlos Reyes', email: 'carlos.reyes@acmecorp.ph', dept: 'IT', role: 'Department Head', status: 'Active' },
  { id: 3, name: 'Angela Cruz', email: 'angela.cruz@acmecorp.ph', dept: 'Marketing', role: 'Auditor', status: 'Pending' },
  { id: 4, name: 'Jose Mendoza', email: 'jose.mendoza@acmecorp.ph', dept: 'HR', role: 'Department Head', status: 'Active' },
  { id: 5, name: 'Patricia Lim', email: 'patricia.lim@acmecorp.ph', dept: 'Operations', role: 'Finance Manager', status: 'Active' },
  { id: 6, name: 'Rico Tan', email: 'rico.tan@acmecorp.ph', dept: 'Finance', role: 'Viewer', status: 'Pending' },
  { id: 7, name: 'Lena Aguilar', email: 'lena.aguilar@acmecorp.ph', dept: 'Marketing', role: 'Department Head', status: 'Active' },
  { id: 8, name: 'Miguel Torres', email: 'miguel.torres@acmecorp.ph', dept: 'Sales', role: 'Department Head', status: 'Active' },
];

const initialDepartments: Department[] = [
  { id: 1, name: 'Finance', head: 'Maria Santos', initials: 'MS', budgetAccess: true, userCount: 6 },
  { id: 2, name: 'IT', head: 'Carlos Reyes', initials: 'CR', budgetAccess: true, userCount: 4 },
  { id: 3, name: 'Marketing', head: 'Lena Aguilar', initials: 'LA', budgetAccess: true, userCount: 3 },
  { id: 4, name: 'HR', head: 'Jose Mendoza', initials: 'JM', budgetAccess: false, userCount: 2 },
  { id: 5, name: 'Operations', head: 'Patricia Lim', initials: 'PL', budgetAccess: true, userCount: 5 },
  { id: 6, name: 'Sales', head: 'Miguel Torres', initials: 'MT', budgetAccess: true, userCount: 4 },
  { id: 7, name: 'Legal', head: 'Diana Ramos', initials: 'DR', budgetAccess: false, userCount: 2 },
  { id: 8, name: 'Procurement', head: 'Ben Villanueva', initials: 'BV', budgetAccess: true, userCount: 3 },
];

const systemLogs = [
  { id: 1, time: '2026-04-24 14:32', action: 'Finance Manager finalized Q2 budget approvals.', type: 'info', user: 'Maria Santos' },
  { id: 2, time: '2026-04-24 13:15', action: 'Auditor accessed audit trails and logs.', type: 'info', user: 'Angela Cruz' },
  { id: 3, time: '2026-04-24 11:47', action: 'Main Admin updated company system settings.', type: 'warning', user: 'System Admin' },
  { id: 4, time: '2026-04-24 10:22', action: 'New user invitation sent to rico.tan@acmecorp.ph.', type: 'info', user: 'Main Admin' },
  { id: 5, time: '2026-04-24 09:05', action: 'Department Head submitted Marketing budget request ₱245,000.', type: 'info', user: 'Lena Aguilar' },
  { id: 6, time: '2026-04-23 17:30', action: 'System backup completed successfully.', type: 'success', user: 'System' },
  { id: 7, time: '2026-04-23 15:12', action: 'Password policy updated — minimum 12 characters enforced.', type: 'warning', user: 'Main Admin' },
  { id: 8, time: '2026-04-23 14:05', action: 'User account suspended: rico.tan@acmecorp.ph', type: 'warning', user: 'Main Admin' },
  { id: 9, time: '2026-04-23 11:22', action: 'New department created: Procurement', type: 'info', user: 'Main Admin' },
  { id: 10, time: '2026-04-23 09:15', action: 'Budget cap increased for IT Department: ₱500,000', type: 'info', user: 'Main Admin' },
];

const rbacData = [
  { name: 'Finance Mgr', count: 6, color: '#0052FF' },
  { name: 'Dept Head', count: 8, color: '#2D6A4F' },
  { name: 'Auditor', count: 4, color: '#F59E0B' },
  { name: 'Viewer', count: 6, color: '#94A3B8' },
];

const roleBadgeColor: Record<string, string> = {
  'Main Admin': 'bg-purple-100 text-purple-700',
  'Finance Manager': 'bg-blue-100 text-blue-700',
  'Department Head': 'bg-emerald-100 text-emerald-700',
  'Auditor': 'bg-amber-100 text-amber-700',
  'Viewer': 'bg-slate-100 text-slate-600',
};

export function MainAdminDashboard({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Settings states
  const [passwordMinLength, setPasswordMinLength] = useState(12);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Filters
  const [userFilter, setUserFilter] = useState('All');
  const [logFilter, setLogFilter] = useState('All');

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'budget', label: 'Forecasting & Analytics', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'users', label: 'User Accounts & Roles', icon: <Users className="w-4 h-4" /> },
    { id: 'departments', label: 'Departments & Permissions', icon: <Building2 className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'logs', label: 'System Logs & Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  const toggleDeptAccess = (id: number) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, budgetAccess: !d.budgetAccess } : d));
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
      setShowEditUserModal(false);
      setSelectedUser(null);
    }
  };

  const handleExportLogs = () => {
    alert('Exporting logs as CSV...');
  };

  const filteredUsers = userFilter === 'All' ? users : users.filter(u => u.status === userFilter);
  const filteredLogs = logFilter === 'All' ? systemLogs : systemLogs.filter(l => l.type === logFilter);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Inter']">
      {/* Top Navigation Bar */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Main Admin</div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">2</span>
          </button>
          {/* Profile Dropdown */}
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center text-white text-sm font-bold">
                MA
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">Main Admin</div>
                <div className="text-xs text-slate-400 mt-0.5">admin@acmecorp.ph</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Main Admin</div>
                  <div className="text-xs text-slate-500">admin@acmecorp.ph</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <User className="w-4 h-4 text-slate-400" />Profile Settings
                  </button>
                  <button onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400" />Security
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button onClick={() => { setShowProfileDropdown(false); onBack?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-[#1A2B3C]" style={{ fontWeight: 800 }}>
            {activeTab === 'overview' && 'Organization Overview'}
            {activeTab === 'budget' && 'Forecasting & Analytics'}
            {activeTab === 'users' && 'User Accounts & Roles Management'}
            {activeTab === 'departments' && 'Departments & Permissions'}
            {activeTab === 'settings' && 'System Settings & Configuration'}
            {activeTab === 'logs' && 'System Logs & Reports'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {activeTab === 'overview' && 'Welcome back, Main Admin. Here\'s your workspace at a glance.'}
            {activeTab === 'budget' && 'AI-powered budget forecasting and departmental spending analytics'}
            {activeTab === 'users' && 'Manage user accounts, roles, and access permissions'}
            {activeTab === 'departments' && 'Configure department settings and budget access controls'}
            {activeTab === 'settings' && 'Configure global system settings and security policies'}
            {activeTab === 'logs' && 'View and export system activity logs and audit trails'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'users' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{ fontWeight: 700 }}
            >
              <UserPlus className="w-4 h-4" />
              Invite New User
            </button>
          )}
          {activeTab === 'departments' && (
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm hover:border-slate-400 transition-all duration-200"
              style={{ fontWeight: 700 }}
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          )}
          {activeTab === 'logs' && (
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 bg-[#0052FF] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{ fontWeight: 700 }}
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pb-12 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0052FF]" />
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Licensed</span>
                </div>
                <div className="text-4xl text-[#1A2B3C]" style={{ fontWeight: 900 }}>{users.length}</div>
                <div className="text-sm text-slate-500 mt-1">Total Active Users</div>
                <div className="text-xs text-slate-400 mt-2">Out of 50 licensed seats</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="bg-[#0052FF] h-1.5 rounded-full" style={{ width: `${(users.length / 50) * 100}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#2D6A4F]" />
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">RBAC</span>
                </div>
                <div className="text-sm text-slate-500 mb-2" style={{ fontWeight: 600 }}>Role Distribution</div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rbacData} barSize={20}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {rbacData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-xs text-[#2D6A4F] bg-emerald-50 px-2 py-1 rounded" style={{ fontWeight: 600 }}>All Active</span>
                </div>
                <div className="text-4xl text-[#1A2B3C]" style={{ fontWeight: 900 }}>{departments.length}</div>
                <div className="text-sm text-slate-500 mt-1">Configured Departments</div>
                <div className="text-xs text-slate-400 mt-2">All departments have active budget caps.</div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <ScrollText className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Monitoring</span>
                </div>
                <div className="text-sm text-slate-500 mb-1" style={{ fontWeight: 600 }}>Recent Activity</div>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />
                  <span className="text-sm text-[#2D6A4F]" style={{ fontWeight: 700 }}>0 Security Warnings</span>
                </div>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="flex items-center gap-1 text-[#0052FF] text-xs mt-3 hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  View audit trails <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-3 bg-white rounded-lg shadow-sm border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-[#1A2B3C] text-base" style={{ fontWeight: 700 }}>Recent User Activity & Access</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Recently added or modified user accounts</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-[#0052FF] text-xs hover:underline"
                    style={{ fontWeight: 600 }}
                  >
                    View All Users
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <th className="text-left px-6 py-3" style={{ fontWeight: 600 }}>Name</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Email</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Department</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Role</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice(0, 6).map(user => (
                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600" style={{ fontWeight: 700 }}>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-slate-800" style={{ fontWeight: 600 }}>{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{user.email}</td>
                          <td className="px-4 py-3.5 text-slate-600">{user.dept}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-md text-xs ${roleBadgeColor[user.role] || 'bg-slate-100 text-slate-600'}`} style={{ fontWeight: 600 }}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {user.status === 'Active' ? (
                              <span className="flex items-center gap-1.5 text-[#2D6A4F] text-xs" style={{ fontWeight: 600 }}>
                                <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[#F59E0B] text-xs" style={{ fontWeight: 600 }}>
                                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                {user.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-slate-100">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-[#1A2B3C] text-base" style={{ fontWeight: 700 }}>Departmental Permissions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick-view budget access toggles</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {departments.slice(0, 6).map(dept => (
                    <div key={dept.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs text-slate-600" style={{ fontWeight: 700 }}>
                          {dept.initials}
                        </div>
                        <div>
                          <div className="text-sm text-slate-800" style={{ fontWeight: 600 }}>{dept.name}</div>
                          <div className="text-xs text-slate-400">{dept.head}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase" style={{ fontWeight: 600 }}>Budget</span>
                        <button
                          onClick={() => toggleDeptAccess(dept.id)}
                          className="transition-colors"
                        >
                          {dept.budgetAccess ? (
                            <ToggleRight className="w-7 h-7 text-[#2D6A4F]" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row: System Logs */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#0052FF]" />
                  <div>
                    <h3 className="text-[#1A2B3C] text-base" style={{ fontWeight: 700 }}>Live System Logs</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Real-time feed of administrative actions</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="text-[#0052FF] text-xs hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  View All Logs
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {systemLogs.slice(0, 7).map(log => (
                  <div key={log.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      log.type === 'warning' ? 'bg-[#F59E0B]' : log.type === 'success' ? 'bg-[#2D6A4F]' : 'bg-[#0052FF]'
                    }`} />
                    <span className="text-xs text-slate-400 w-36 flex-shrink-0" style={{ fontFamily: 'monospace' }}>{log.time}</span>
                    <span className="text-sm text-slate-700">{log.action}</span>
                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#F59E0B] ml-auto flex-shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
              >
                <option>All</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Suspended</option>
              </select>
              <div className="ml-auto text-sm text-slate-600">
                Showing <span className="font-bold">{filteredUsers.length}</span> users
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052FF] to-[#2D6A4F] flex items-center justify-center text-white text-sm font-bold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-bold text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{user.dept}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${roleBadgeColor[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          user.status === 'Active' ? 'bg-[#10B981]/10 text-[#10B981]' :
                          user.status === 'Pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                          'bg-[#EF4444]/10 text-[#EF4444]'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-[#0052FF] hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-[#EF4444] hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map(dept => (
                <div key={dept.id} className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                        {dept.initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{dept.name}</h3>
                        <p className="text-sm text-slate-500">{dept.userCount} members</p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Department Head</span>
                      <span className="text-sm font-bold text-slate-900">{dept.head}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-700">Budget Access</span>
                      <button
                        onClick={() => toggleDeptAccess(dept.id)}
                        className="transition-colors"
                      >
                        {dept.budgetAccess ? (
                          <ToggleRight className="w-8 h-8 text-[#2D6A4F]" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Security Settings */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0052FF]" />
                Security & Authentication
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    value={passwordMinLength}
                    onChange={(e) => setPasswordMinLength(parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                    className="w-full max-w-xs px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Enable Multi-Factor Authentication</div>
                    <div className="text-sm text-slate-600 mt-1">Require MFA for all admin accounts</div>
                  </div>
                  <button
                    onClick={() => setMfaEnabled(!mfaEnabled)}
                    className="transition-colors"
                  >
                    {mfaEnabled ? (
                      <ToggleRight className="w-10 h-10 text-[#2D6A4F]" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between py-4 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Email Notifications</div>
                    <div className="text-sm text-slate-600 mt-1">Send email alerts for security events</div>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className="transition-colors"
                  >
                    {emailNotifications ? (
                      <ToggleRight className="w-10 h-10 text-[#2D6A4F]" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <button className="bg-[#0052FF] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all">
                  Save Settings
                </button>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">System Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-1">Version</div>
                  <div className="font-bold text-slate-900">NexaPlan v2.4.1</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">License Type</div>
                  <div className="font-bold text-slate-900">Enterprise (50 seats)</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Database</div>
                  <div className="font-bold text-slate-900">PostgreSQL 14.2</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Last Backup</div>
                  <div className="font-bold text-slate-900">2026-04-24 04:00 AM</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 flex items-center gap-4">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
              >
                <option>All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
              <div className="ml-auto text-sm text-slate-600">
                Showing <span className="font-bold">{filteredLogs.length}</span> logs
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className={`w-3 h-3 rounded-full ${
                          log.type === 'warning' ? 'bg-[#F59E0B]' :
                          log.type === 'success' ? 'bg-[#2D6A4F]' :
                          'bg-[#0052FF]'
                        }`} />
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">{log.time}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{log.user}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BUDGET TAB - Forecasting & Analytics */}
        {activeTab === 'budget' && (
          <>
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#0052FF]" />
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Total Budget</span>
                </div>
                <div className="text-3xl text-[#1A2B3C]" style={{ fontWeight: 900 }}>₱4.2M</div>
                <div className="text-sm text-slate-500 mt-1">Allocated for Q2 2026</div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#2D6A4F]" />
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded" style={{ fontWeight: 600 }}>On Track</span>
                </div>
                <div className="text-3xl text-[#1A2B3C]" style={{ fontWeight: 900 }}>₱3.8M</div>
                <div className="text-sm text-slate-500 mt-1">Spent to Date</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="bg-[#2D6A4F] h-1.5 rounded-full" style={{ width: '90.5%' }} />
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">AI Accuracy</span>
                </div>
                <div className="text-3xl text-[#1A2B3C]" style={{ fontWeight: 900 }}>94.2%</div>
                <div className="text-sm text-slate-500 mt-1">Forecast Confidence</div>
              </div>
            </div>

            {/* Budget by Department */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-100 mb-6">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-[#1A2B3C] text-base" style={{ fontWeight: 700 }}>Department Budget Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">Q2 2026 budget allocation and spending</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <th className="text-left px-6 py-3" style={{ fontWeight: 600 }}>Department</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Budget</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Spent</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Remaining</th>
                        <th className="text-left px-4 py-3" style={{ fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { dept: 'IT', budget: 850000, spent: 765000, status: 'on-track' },
                        { dept: 'Marketing', budget: 620000, spent: 580000, status: 'on-track' },
                        { dept: 'Sales', budget: 730000, spent: 695000, status: 'warning' },
                        { dept: 'HR', budget: 380000, spent: 320000, status: 'on-track' },
                        { dept: 'Operations', budget: 950000, spent: 840000, status: 'on-track' },
                        { dept: 'Finance', budget: 420000, spent: 380000, status: 'on-track' },
                      ].map((d, i) => {
                        const remaining = d.budget - d.spent;
                        const percentSpent = (d.spent / d.budget) * 100;
                        return (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5">
                              <span className="text-slate-800" style={{ fontWeight: 600 }}>{d.dept}</span>
                            </td>
                            <td className="px-4 py-3.5 text-slate-700">₱{d.budget.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-slate-700">₱{d.spent.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-slate-700">₱{remaining.toLocaleString()}</td>
                            <td className="px-4 py-3.5">
                              {d.status === 'on-track' ? (
                                <span className="flex items-center gap-1.5 text-[#2D6A4F] text-xs" style={{ fontWeight: 600 }}>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  On Track
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-[#F59E0B] text-xs" style={{ fontWeight: 600 }}>
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Warning
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Invite New User</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="user@acmecorp.ph"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none">
                  <option>Finance Manager</option>
                  <option>Department Head</option>
                  <option>Auditor</option>
                  <option>Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none">
                  {departments.map(d => (
                    <option key={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  alert('Invitation sent!');
                  setShowInviteModal(false);
                }}
                className="flex-1 bg-[#2D6A4F] hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                Send Invitation
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:border-slate-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add New Department</h2>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g., Finance, IT, Marketing"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department Head</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-700">Enable Budget Access</span>
                <ToggleRight className="w-8 h-8 text-[#2D6A4F]" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  alert('Department created!');
                  setShowAddDeptModal(false);
                }}
                className="flex-1 bg-[#0052FF] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                Create Department
              </button>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="flex-1 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:border-slate-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit User</h2>
              <button onClick={() => {
                setShowEditUserModal(false);
                setSelectedUser(null);
              }} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                >
                  <option>Finance Manager</option>
                  <option>Department Head</option>
                  <option>Auditor</option>
                  <option>Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                <select
                  value={selectedUser.status}
                  onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as 'Active' | 'Pending' | 'Suspended' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0052FF] outline-none"
                >
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveUser}
                className="flex-1 bg-[#0052FF] hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:border-slate-400 transition-all"
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
