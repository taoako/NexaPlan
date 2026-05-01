import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  UserCog,
  Settings,
  Database,
  Search,
  Bell,
  TrendingUp,
  Users,
  Server,
  Activity,
  CloudDownload,
  RefreshCw,
  Power,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Plus,
  Download,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Shield,
  Clock,
  Globe
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onBack: () => void;
}

type DashboardView = 'overview' | 'tenants' | 'billing' | 'admins' | 'config' | 'maintenance';

export function SuperAdminDashboard({ onBack }: SuperAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sslEnabled, setSslEnabled] = useState(true);
  const [mlEnabled, setMlEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const getPageTitle = () => {
    switch(currentView) {
      case 'overview': return 'Global Dashboard';
      case 'tenants': return 'Tenant Management';
      case 'billing': return 'Subscription & Billing Engine';
      case 'admins': return 'Main Admin Accounts';
      case 'config': return 'System Configuration';
      case 'maintenance': return 'Maintenance & Backups';
      default: return 'Global Dashboard';
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F1F5F9] font-['Inter']">
      {/* Top Navbar */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 shrink-0 border-b border-white/10">
        {/* Left: Brand + SUPER ADMIN Badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xl">N</span>
            </div>
            <div>
              <div className="font-black text-xl leading-none text-white">
                NexaPlan
              </div>
            </div>
          </div>
          <div className="inline-flex items-center bg-[#4F46E5] px-3 py-1.5 rounded-full">
            <span className="text-white text-[10px] font-bold uppercase tracking-wider">SUPER ADMIN</span>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'overview'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 inline mr-2" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentView('tenants')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'tenants'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Tenants
          </button>

          <button
            onClick={() => setCurrentView('billing')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'billing'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Billing
          </button>

          <button
            onClick={() => setCurrentView('admins')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'admins'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <UserCog className="w-4 h-4 inline mr-2" />
            Admins
          </button>

          <button
            onClick={() => setCurrentView('config')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'config'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Config
          </button>

          <button
            onClick={() => setCurrentView('maintenance')}
            className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'maintenance'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Maintenance
          </button>
        </div>

        {/* Right: Status + Profile */}
        <div className="flex items-center gap-6">
          {/* Platform Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <span className="text-slate-300 font-medium">All Systems Operational</span>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">SO</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Sticky Header - 72px */}
        <header className="h-[72px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 shrink-0">
          {/* Left: Page Title */}
          <h1 className="text-[30px] font-bold text-[#0A192F] tracking-tight">{getPageTitle()}</h1>

          {/* Right: Search, Alerts */}
          <div className="flex items-center gap-6">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenants, invoices, or system logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[320px] pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                ⌘K
              </div>
            </div>

            {/* Critical Alerts Bell */}
            <button className="relative p-2 hover:bg-slate-50 rounded-md transition-all">
              <Bell className="w-5 h-5 text-slate-600" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white"></div>
            </button>
          </div>
        </header>

        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* GLOBAL DASHBOARD VIEW */}
          {currentView === 'overview' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Top Row: KPI Cards */}
              <div className="grid grid-cols-4 gap-6">
                {/* Card 1: Total MRR */}
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Total Monthly Recurring Revenue (MRR)
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">$124,500</div>
                  <div className="inline-flex items-center bg-[#10B981]/10 text-[#10B981] px-2 py-1 rounded text-xs font-bold">
                    +12.5% MoM
                  </div>
                  {/* Subtle trend line sparkline */}
                  <div className="mt-4 h-8 flex items-end gap-1">
                    {[60, 65, 58, 70, 75, 72, 80, 85, 82, 90, 95, 100].map((h, i) => (
                      <div key={i} className="flex-1 bg-gradient-to-t from-[#10B981]/20 to-[#10B981]/40 rounded-t" style={{height: `${h}%`}}></div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Active Tenant Organizations */}
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Active Tenant Organizations
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">142</div>
                  <div className="text-xs text-slate-600 font-medium">3 new this week</div>
                </div>

                {/* Card 3: Global Server Uptime */}
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Global Server Uptime
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">99.99%</div>
                  <div className="text-xs text-slate-600 font-medium">Last backup: 12 mins ago</div>
                </div>

                {/* Card 4: Total API Requests (24h) */}
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                    Total API Requests (24h)
                  </div>
                  <div className="text-4xl font-black text-slate-900 mb-2">2.4M</div>
                  <div className="text-xs text-slate-600 font-medium">Normal capacity</div>
                </div>
              </div>

              {/* Middle Row: 70/30 Split */}
              <div className="grid grid-cols-[70%_30%] gap-6">
                {/* Left: Active Subscriptions & Tenants Table */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                  {/* Panel Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h2 className="text-[20px] font-semibold text-slate-900">Recent Tenant Activity</h2>
                    <div className="flex gap-3">
                      <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-md">
                        Provision New Tenant
                      </button>
                      <button className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold transition-all">
                        Export Billing CSV
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Organization Name</th>
                          <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Main Admin Name</th>
                          <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Subscription Tier</th>
                          <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Billing Status</th>
                          <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Row 1 */}
                        <tr className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Acme Corp</td>
                          <td className="px-6 py-4 text-sm text-slate-700">John Doe</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-bold">
                              Enterprise
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Row 2 */}
                        <tr className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Stark Industries</td>
                          <td className="px-6 py-4 text-sm text-slate-700">Tony S.</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-md text-xs font-bold">
                              Professional
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-[#EF4444]/10 text-[#EF4444] px-3 py-1 rounded-md text-xs font-bold">
                              Overdue
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Row 3 */}
                        <tr className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Wayne Enterprises</td>
                          <td className="px-6 py-4 text-sm text-slate-700">Bruce W.</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-slate-100 text-slate-700 px-3 py-1 rounded-md text-xs font-bold">
                              Starter
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-[#F59E0B]/10 text-[#F59E0B] px-3 py-1 rounded-md text-xs font-bold">
                              Pending
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {/* Row 4 */}
                        <tr className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">Umbrella Corporation</td>
                          <td className="px-6 py-4 text-sm text-slate-700">Spencer O.</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-xs font-bold">
                              Enterprise
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">
                              Paid
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Global System Configurations */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Global Configuration</h2>

                  <div className="space-y-5">
                    {/* Toggle 1: MFA */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 mb-1">Enable Multi-Factor Auth</div>
                        <div className="text-xs text-slate-600">(Platform-wide)</div>
                      </div>
                      <button
                        onClick={() => setMfaEnabled(!mfaEnabled)}
                        className={`w-12 h-6 rounded-full relative transition-all ${mfaEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${mfaEnabled ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>

                    {/* Toggle 2: SSL */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 mb-1">Force SSL/TLS Encryptions</div>
                      </div>
                      <button
                        onClick={() => setSslEnabled(!sslEnabled)}
                        className={`w-12 h-6 rounded-full relative transition-all ${sslEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sslEnabled ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>

                    {/* Toggle 3: ML Forecasting */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 mb-1">Machine Learning Forecasting Engine</div>
                      </div>
                      <button
                        onClick={() => setMlEnabled(!mlEnabled)}
                        className={`w-12 h-6 rounded-full relative transition-all ${mlEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${mlEnabled ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>

                    {/* Toggle 4: Global Maintenance Mode */}
                    <div className="flex items-start justify-between gap-4 pt-4 border-t border-slate-200">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 mb-1">Global Maintenance Mode</div>
                        <div className="text-xs text-[#EF4444] font-semibold">Locks out all Main Admins and end users</div>
                      </div>
                      <button
                        onClick={() => {
                          if (!maintenanceMode) {
                            const confirmed = window.confirm('You are about to suspend access for all active tenants. Type "CONFIRM" to proceed.');
                            if (confirmed) setMaintenanceMode(true);
                          } else {
                            setMaintenanceMode(false);
                          }
                        }}
                        className={`w-12 h-6 rounded-full relative transition-all ${maintenanceMode ? 'bg-[#EF4444]' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: System Maintenance & Backup Logs */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-[20px] font-semibold text-slate-900">System Maintenance & Backup Logs</h2>
                </div>

                {/* Upper Section: Control Blocks */}
                <div className="p-6 border-b border-slate-200">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Block 1: Trigger Manual Backup */}
                    <button className="flex flex-col items-center gap-3 p-6 border border-slate-200 rounded-md hover:border-[#4F46E5] hover:bg-[#4F46E5]/5 transition-all group">
                      <CloudDownload className="w-8 h-8 text-[#4F46E5] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-slate-900">Trigger Manual Backup</span>
                    </button>

                    {/* Block 2: Clear Application Cache */}
                    <button className="flex flex-col items-center gap-3 p-6 border border-slate-200 rounded-md hover:border-slate-400 hover:bg-slate-50 transition-all group">
                      <RefreshCw className="w-8 h-8 text-slate-600 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-slate-900">Clear Application Cache</span>
                    </button>

                    {/* Block 3: Restart Microservices */}
                    <button className="flex flex-col items-center gap-3 p-6 border border-[#EF4444] rounded-md hover:bg-[#EF4444]/5 transition-all group">
                      <Power className="w-8 h-8 text-[#EF4444] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-slate-900">Restart Microservices</span>
                      <span className="text-xs text-[#EF4444] font-medium">(Requires confirmation)</span>
                    </button>
                  </div>
                </div>

                {/* Lower Section: Audit Trail */}
                <div className="p-6">
                  <div className="space-y-3">
                    {/* Log Item 1 */}
                    <div className="flex items-start gap-4 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-md">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">[Success] Auto-Backup completed</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Size: 4.2GB • Location: AWS S3 US-East • Time: 03:00 AM
                        </div>
                      </div>
                    </div>

                    {/* Log Item 2 */}
                    <div className="flex items-start gap-4 p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-md">
                      <Activity className="w-5 h-5 text-[#3B82F6] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">[Update] Scikit-Learn Model Retrained</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Initiated by System • Time: 01:15 AM
                        </div>
                      </div>
                    </div>

                    {/* Log Item 3 */}
                    <div className="flex items-start gap-4 p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-md">
                      <AlertTriangle className="w-5 h-5 text-[#F59E0B] mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900">[Warning] High memory usage detected on C# API Node 2</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Resolved automatically • Time: Yesterday, 11:42 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TENANT MANAGEMENT VIEW */}
          {currentView === 'tenants' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Tenants</div>
                  <div className="text-3xl font-black text-slate-900">142</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Enterprise Tier</div>
                  <div className="text-3xl font-black text-blue-600">28</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Trial Accounts</div>
                  <div className="text-3xl font-black text-[#F59E0B]">15</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue</div>
                  <div className="text-3xl font-black text-[#EF4444]">3</div>
                </div>
              </div>

              {/* Tenant Table */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold text-slate-900">All Tenant Organizations</h2>
                  <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Provision New Tenant
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
                    {[
                      { name: 'Acme Corp', admin: 'John Doe', tier: 'Enterprise', users: 45, mrr: '₱9,999', status: 'Active', statusColor: 'green' },
                      { name: 'Stark Industries', admin: 'Tony S.', tier: 'Professional', users: 28, mrr: '₱5,499', status: 'Overdue', statusColor: 'red' },
                      { name: 'Wayne Enterprises', admin: 'Bruce W.', tier: 'Starter', users: 12, mrr: '₱2,499', status: 'Trial', statusColor: 'yellow' },
                      { name: 'Umbrella Corporation', admin: 'Spencer O.', tier: 'Enterprise', users: 67, mrr: '₱9,999', status: 'Active', statusColor: 'green' },
                      { name: 'Oscorp Industries', admin: 'Norman O.', tier: 'Professional', users: 34, mrr: '₱5,499', status: 'Active', statusColor: 'green' },
                      { name: 'Cyberdyne Systems', admin: 'Miles D.', tier: 'Starter', users: 8, mrr: '₱2,499', status: 'Active', statusColor: 'green' },
                    ].map((tenant, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{tenant.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{tenant.admin}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                            tenant.tier === 'Enterprise' ? 'bg-blue-100 text-blue-800' :
                            tenant.tier === 'Professional' ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tenant.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{tenant.users}</td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{tenant.mrr}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                            tenant.statusColor === 'green' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            tenant.statusColor === 'red' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                            'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION & BILLING ENGINE VIEW */}
          {currentView === 'billing' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Revenue Metrics */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total MRR</div>
                  <div className="text-3xl font-black text-[#4F46E5]">$124,500</div>
                  <div className="text-xs text-[#10B981] font-bold mt-2">+12.5% MoM</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">ARR</div>
                  <div className="text-3xl font-black text-slate-900">$1,494,000</div>
                  <div className="text-xs text-[#10B981] font-bold mt-2">+18.2% YoY</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pending Invoices</div>
                  <div className="text-3xl font-black text-[#F59E0B]">8</div>
                  <div className="text-xs text-slate-600 mt-2">$42,492 total</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue Amount</div>
                  <div className="text-3xl font-black text-[#EF4444]">$5,499</div>
                  <div className="text-xs text-slate-600 mt-2">3 accounts</div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Monthly Recurring Revenue (Last 12 Months)</h2>
                <div className="h-64 border-l border-b border-slate-200 flex items-end gap-2 px-4 pb-4">
                  {[85, 88, 92, 95, 98, 102, 108, 112, 118, 120, 122, 125].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gradient-to-t from-[#4F46E5] to-[#6366F1] rounded-t" style={{ height: `${(value/125)*100}%` }}></div>
                      <span className="text-xs text-slate-500 font-semibold">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Invoices */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold text-slate-900">Recent Invoices</h2>
                  <button className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Invoice ID</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { id: 'INV-2026-001', tenant: 'Acme Corp', amount: '₱9,999.00', due: 'Apr 15, 2026', status: 'Paid', color: 'green' },
                      { id: 'INV-2026-002', tenant: 'Stark Industries', amount: '₱5,499.00', due: 'Apr 12, 2026', status: 'Overdue', color: 'red' },
                      { id: 'INV-2026-003', tenant: 'Wayne Enterprises', amount: '₱2,499.00', due: 'Apr 18, 2026', status: 'Pending', color: 'yellow' },
                      { id: 'INV-2026-004', tenant: 'Umbrella Corp', amount: '₱9,999.00', due: 'Apr 10, 2026', status: 'Paid', color: 'green' },
                      { id: 'INV-2026-005', tenant: 'Oscorp Industries', amount: '₱5,499.00', due: 'Apr 20, 2026', status: 'Pending', color: 'yellow' },
                    ].map((invoice, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{invoice.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{invoice.tenant}</td>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-900">{invoice.amount}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{invoice.due}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                            invoice.color === 'green' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            invoice.color === 'red' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                            'bg-[#F59E0B]/10 text-[#F59E0B]'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MAIN ADMIN ACCOUNTS VIEW */}
          {currentView === 'admins' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Admin Stats */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Main Admins</div>
                  <div className="text-3xl font-black text-slate-900">142</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">MFA Enabled</div>
                  <div className="text-3xl font-black text-[#10B981]">128</div>
                  <div className="text-xs text-slate-600 mt-2">90% coverage</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Active (7 days)</div>
                  <div className="text-3xl font-black text-[#4F46E5]">118</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Locked Accounts</div>
                  <div className="text-3xl font-black text-[#EF4444]">2</div>
                </div>
              </div>

              {/* Admin Accounts Table */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold text-slate-900">Main Admin Accounts</h2>
                  <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Admin Account
                  </button>
                </div>

                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Admin Name</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">MFA Status</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: 'John Doe', email: 'john.doe@acme.com', org: 'Acme Corp', mfa: true, lastLogin: '2 hours ago', status: 'active' },
                      { name: 'Tony Stark', email: 'tony@stark.com', org: 'Stark Industries', mfa: true, lastLogin: '1 day ago', status: 'active' },
                      { name: 'Bruce Wayne', email: 'bruce@wayne.com', org: 'Wayne Enterprises', mfa: false, lastLogin: '3 days ago', status: 'active' },
                      { name: 'Spencer Osborn', email: 'spencer@umbrella.com', org: 'Umbrella Corp', mfa: true, lastLogin: '5 hours ago', status: 'active' },
                      { name: 'Norman Osborn', email: 'norman@oscorp.com', org: 'Oscorp Industries', mfa: true, lastLogin: '12 hours ago', status: 'active' },
                      { name: 'Miles Dyson', email: 'miles@cyberdyne.com', org: 'Cyberdyne Systems', mfa: false, lastLogin: '30 days ago', status: 'locked' },
                    ].map((admin, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{admin.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-mono">{admin.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{admin.org}</td>
                        <td className="px-6 py-4">
                          {admin.mfa ? (
                            <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">
                              <Shield className="w-3 h-3" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-bold">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {admin.lastLogin}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {admin.status === 'locked' ? (
                              <button className="text-[#10B981] hover:text-[#059669] text-sm font-bold">
                                Unlock
                              </button>
                            ) : (
                              <>
                                <button className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold">
                                  Edit
                                </button>
                                <button className="text-[#EF4444] hover:text-[#DC2626] text-sm font-bold">
                                  Disable
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SYSTEM CONFIGURATION VIEW */}
          {currentView === 'config' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Global Toggles */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Global System Toggles</h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* MFA */}
                  <div className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 mb-1">Multi-Factor Authentication</div>
                      <div className="text-xs text-slate-600">Enforce MFA for all tenant admin accounts platform-wide</div>
                    </div>
                    <button
                      onClick={() => setMfaEnabled(!mfaEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${mfaEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${mfaEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {/* SSL */}
                  <div className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 mb-1">Force SSL/TLS Encryption</div>
                      <div className="text-xs text-slate-600">Require secure connections for all API endpoints</div>
                    </div>
                    <button
                      onClick={() => setSslEnabled(!sslEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${sslEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sslEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {/* ML Engine */}
                  <div className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 mb-1">Machine Learning Forecasting Engine</div>
                      <div className="text-xs text-slate-600">Enable Scikit-Learn powered budget predictions</div>
                    </div>
                    <button
                      onClick={() => setMlEnabled(!mlEnabled)}
                      className={`w-12 h-6 rounded-full relative transition-all ${mlEnabled ? 'bg-[#10B981]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${mlEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {/* Maintenance Mode */}
                  <div className="flex items-start justify-between gap-4 p-4 border border-[#EF4444]/30 bg-[#EF4444]/5 rounded-md">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 mb-1">Global Maintenance Mode</div>
                      <div className="text-xs text-[#EF4444] font-semibold">CAUTION: Locks out all tenants and end users</div>
                    </div>
                    <button
                      onClick={() => {
                        if (!maintenanceMode) {
                          const userInput = window.prompt('Type "CONFIRM" to enable maintenance mode:');
                          if (userInput === 'CONFIRM') setMaintenanceMode(true);
                        } else {
                          setMaintenanceMode(false);
                        }
                      }}
                      className={`w-12 h-6 rounded-full relative transition-all ${maintenanceMode ? 'bg-[#EF4444]' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* API Configuration */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[20px] font-semibold text-slate-900 mb-6">API & Compute Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Global Request Timeout (ms)</label>
                      <input type="text" defaultValue="4000" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Max Export Row Limit</label>
                      <input type="text" defaultValue="50000" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">API Rate Limit (req/min)</label>
                      <input type="text" defaultValue="1000" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[20px] font-semibold text-slate-900 mb-6">ML Engine Parameters</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Confidence Threshold (%)</label>
                      <input type="text" defaultValue="85" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Training Cycle</label>
                      <select className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none">
                        <option>Weekly</option>
                        <option>Daily</option>
                        <option>Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Model Version</label>
                      <input type="text" defaultValue="v2.4.1" disabled className="w-full px-4 py-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Authentication */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Security & Authentication</h2>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">JWT Expiration (hours)</label>
                    <input type="text" defaultValue="24" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Max Failed Login Attempts</label>
                    <input type="text" defaultValue="5" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Session Timeout (minutes)</label>
                    <input type="text" defaultValue="60" className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-[#4F46E5] outline-none" />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-3 rounded-md font-bold shadow-lg transition-all">
                  Save All Changes
                </button>
              </div>
            </div>
          )}

          {/* MAINTENANCE & BACKUPS VIEW */}
          {currentView === 'maintenance' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* System Health Status */}
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
                  <button className="flex flex-col items-center gap-3 p-6 border-2 border-[#4F46E5] rounded-md hover:bg-[#4F46E5]/5 transition-all group">
                    <CloudDownload className="w-10 h-10 text-[#4F46E5] group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-900">Trigger Manual Backup</span>
                    <span className="text-xs text-slate-600">Create immediate database snapshot</span>
                  </button>

                  <button className="flex flex-col items-center gap-3 p-6 border-2 border-slate-300 rounded-md hover:bg-slate-50 transition-all group">
                    <RefreshCw className="w-10 h-10 text-slate-600 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-900">Clear Application Cache</span>
                    <span className="text-xs text-slate-600">Flush Redis cache clusters</span>
                  </button>

                  <button className="flex flex-col items-center gap-3 p-6 border-2 border-[#EF4444] rounded-md hover:bg-[#EF4444]/5 transition-all group">
                    <Power className="w-10 h-10 text-[#EF4444] group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-900">Restart Microservices</span>
                    <span className="text-xs text-[#EF4444] font-semibold">Requires double confirmation</span>
                  </button>
                </div>
              </div>

              {/* Database Health Metrics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[20px] font-semibold text-slate-900 mb-6">SQL Server Metrics</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-600">Storage Usage</span>
                        <span className="text-slate-900">1.2 GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-[#10B981] h-3 rounded-full" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-600">RAM Usage</span>
                        <span className="text-slate-900">45%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-[#3B82F6] h-3 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-600">CPU Usage</span>
                        <span className="text-slate-900">28%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-[#10B981] h-3 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
                  <h2 className="text-[20px] font-semibold text-slate-900 mb-6">Backup Schedule</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#4F46E5]" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">Daily Full Backup</div>
                          <div className="text-xs text-slate-600">Every day at 04:00 AM UTC</div>
                        </div>
                      </div>
                      <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#4F46E5]" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">Incremental Backup</div>
                          <div className="text-xs text-slate-600">Every 6 hours</div>
                        </div>
                      </div>
                      <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-[#4F46E5]" />
                        <div>
                          <div className="text-sm font-bold text-slate-900">Geo-Replication</div>
                          <div className="text-xs text-slate-600">US-East → Asia-Pacific</div>
                        </div>
                      </div>
                      <span className="bg-[#10B981]/10 text-[#10B981] px-3 py-1 rounded-md text-xs font-bold">Synced</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Logs */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-[20px] font-semibold text-slate-900">System Maintenance Logs</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-start gap-4 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-md">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">[Success] Auto-Backup completed</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Size: 4.2GB • Location: AWS S3 US-East • Time: 03:00 AM • Duration: 4m 32s
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">2 hours ago</span>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-md">
                    <Activity className="w-5 h-5 text-[#3B82F6] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">[Update] Scikit-Learn Model Retrained</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Initiated by System • Accuracy: 94.2% • Time: 01:15 AM
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">5 hours ago</span>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-md">
                    <AlertTriangle className="w-5 h-5 text-[#F59E0B] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">[Warning] High memory usage detected on C# API Node 2</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Resolved automatically • Peak: 92% • Auto-scaled to 3 nodes
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">Yesterday, 11:42 PM</span>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-md">
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">[Success] Redis Cache Flushed</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Initiated by: Justin Bais • Cluster: Production • Time: Yesterday, 2:30 PM
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">Yesterday</span>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-md">
                    <Server className="w-5 h-5 text-[#3B82F6] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">[Info] Database Index Optimization Completed</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Performance improvement: +18% • Tables: 47 • Time: 2 days ago
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">2 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
