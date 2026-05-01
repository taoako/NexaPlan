import React, { useState, useRef, useEffect } from 'react';
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
  Globe,
  ClipboardList,
  ChevronDown,
  LogOut,
  User,
  Lock,
  Check,
  X,
  Tag
} from 'lucide-react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5189';

interface SuperAdminDashboardProps {
  onBack: () => void;
}

type DashboardView = 'overview' | 'tenants' | 'billing' | 'admins' | 'config' | 'maintenance' | 'trial-requests';

interface TrialRequest {
  id: string;
  tenantId: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string;
}

interface TenantRow {
  tenantId: number;
  name: string;
  admin: string;
  tier: string;
  users: number;
  mrr: string;
  status: string;
  statusColor: 'green' | 'red' | 'yellow';
}

interface TenantApiItem {
  tenantID: number;
  companyName: string;
  subscriptionTier: string;
  isActive: boolean;
  registrationStatus: string;
  createdAt: string;
  userCount: number;
  primaryAdminEmail: string;
  billingStatus: string;
}

interface AdminRow {
  userId: number;
  name: string;
  email: string;
  org: string;
  mfa: boolean;
  lastLogin: string;
  status: 'active' | 'locked';
  tenantId: number;
  roleName: string;
}

interface AdminApiItem {
  userID: number;
  name: string;
  email: string;
  roleName: string;
  tenantID: number;
  tenantName: string;
  isActive: boolean;
}

interface InvoiceRow {
  invoiceId: number;
  id: string;
  tenant: string;
  amount: string;
  due: string;
  status: string;
  color: 'green' | 'red' | 'yellow';
}

interface InvoiceApiItem {
  invoiceID: number;
  invoiceNumber: string;
  tenantID: number;
  companyName: string;
  subscriptionTier: string;
  amount: number;
  billingDate: string;
  dueDate: string;
  status: string;
}

interface TrialRequestApiItem {
  tenantID: number;
  companyName: string;
  email: string;
  subscriptionTier: string;
  isActive: boolean;
  registrationStatus: string;
  submittedAt: string;
  paymentStatus: string;
  invoiceStatus: string;
}

interface DashboardSummary {
  totalTenants: number;
  activeTenants: number;
  pendingTrials: number;
  totalAdmins: number;
  totalUsers: number;
  pendingInvoices: number;
  paidInvoices: number;
  paymentSessions: number;
  totalRevenue: number;
}

export function SuperAdminDashboard({ onBack }: SuperAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [sslEnabled, setSslEnabled] = useState(true);
  const [mlEnabled, setMlEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tenantRows, setTenantRows] = useState<TenantRow[]>([]);
  const [adminRows, setAdminRows] = useState<AdminRow[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);

  // Trial Requests State
  const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
  const [selectedTrial, setSelectedTrial] = useState<string | null>(null);
  const [trialReviewNote, setTrialReviewNote] = useState('');

  // Pricing Configuration State
  const [pricingConfig, setPricingConfig] = useState({
    starter: { price: '4,950', users: '3', departments: '5', forecasting: '12 months', support: 'Email' },
    professional: { price: '12,900', users: '15', departments: 'Unlimited', forecasting: '24 months', support: 'Priority (4hr SLA)' },
    enterprise: { price: '29,900', users: 'Unlimited', departments: 'Unlimited', forecasting: '36 months', support: '24/7 Phone & Chat' },
  });
  const [pricingSaved, setPricingSaved] = useState(false);

  const pendingTrialCount = trialRequests.filter(r => r.status === 'pending').length;

  const requestJson = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });

    const text = await response.text();
    let data: any = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || text || 'Request failed.';
      throw new Error(message);
    }

    return data as T;
  };

  const formatMoney = (amount: number) =>
    `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getTierMonthlyValue = (subscriptionTier: string) => {
    const tier = subscriptionTier.toLowerCase();
    if (tier.includes('enterprise')) return 29900;
    if (tier.includes('professional')) return 12900;
    return 4950;
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [summaryResponse, tenantsResponse, usersResponse, trialsResponse, invoicesResponse] = await Promise.all([
        requestJson<DashboardSummary>('/api/Admin/summary'),
        requestJson<TenantApiItem[]>('/api/Admin/tenants'),
        requestJson<AdminApiItem[]>('/api/Admin/users'),
        requestJson<TrialRequestApiItem[]>('/api/Admin/trial-requests'),
        requestJson<InvoiceApiItem[]>('/api/Admin/invoices'),
      ]);

      setSummary(summaryResponse);
      setTenantRows(tenantsResponse.map((tenant) => ({
        tenantId: tenant.tenantID,
        name: tenant.companyName,
        admin: tenant.primaryAdminEmail || 'Unassigned',
        tier: tenant.subscriptionTier,
        users: tenant.userCount,
        mrr: formatMoney(getTierMonthlyValue(tenant.subscriptionTier)),
        status: tenant.registrationStatus,
        statusColor: tenant.registrationStatus.toLowerCase().includes('reject')
          ? 'red'
          : tenant.registrationStatus.toLowerCase().includes('pend')
            ? 'yellow'
            : 'green',
      })));
      setAdminRows(usersResponse.map((user) => ({
        userId: user.userID,
        name: user.name,
        email: user.email,
        org: user.tenantName,
        mfa: true,
        lastLogin: 'Recently active',
        status: user.isActive ? 'active' : 'locked',
        tenantId: user.tenantID,
        roleName: user.roleName,
      })));
      setTrialRequests(trialsResponse.map((trial) => ({
        id: `TR-${trial.tenantID.toString().padStart(3, '0')}`,
        tenantId: trial.tenantID,
        companyName: trial.companyName,
        contactName: trial.email,
        email: trial.email,
        phone: 'N/A',
        submittedDate: new Date(trial.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: trial.registrationStatus.toLowerCase().includes('reject')
          ? 'rejected'
          : trial.registrationStatus.toLowerCase().includes('active')
            ? 'approved'
            : 'pending',
        reviewNotes: `${trial.subscriptionTier} • Payment: ${trial.paymentStatus} • Invoice: ${trial.invoiceStatus}`,
      })));
      setInvoiceRows(invoicesResponse.map((invoice) => ({
        invoiceId: invoice.invoiceID,
        id: invoice.invoiceNumber,
        tenant: invoice.companyName,
        amount: formatMoney(invoice.amount),
        due: new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: invoice.status,
        color: invoice.status === 'Paid' ? 'green' : invoice.status === 'Overdue' ? 'red' : 'yellow',
      })));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApproveTrialRequest = async (id: string) => {
    const req = trialRequests.find(r => r.id === id);
    if (!req) return;

    await requestJson(`/api/Admin/trial-requests/${req.tenantId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes: trialReviewNote }),
    });

    setSelectedTrial(null);
    setTrialReviewNote('');
    await loadDashboard();
    alert(`✅ Trial approved for ${req.companyName}.`);
  };

  const handleRejectTrialRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this trial request?')) return;

    const req = trialRequests.find(r => r.id === id);
    if (!req) return;

    await requestJson(`/api/Admin/trial-requests/${req.tenantId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes: trialReviewNote }),
    });

    setSelectedTrial(null);
    setTrialReviewNote('');
    await loadDashboard();
    alert(`❌ Trial rejected for ${req.companyName}.`);
  };

  const handleCreateTenant = async () => {
    const companyName = window.prompt('Company name');
    if (!companyName) return;

    const subscriptionTier = window.prompt('Subscription tier', 'starter') || 'starter';
    const registrationStatus = window.prompt('Registration status', 'PendingPayment') || 'PendingPayment';
    const isActive = window.confirm('Should this tenant be active now?');

    await requestJson('/api/Admin/tenants', {
      method: 'POST',
      body: JSON.stringify({ companyName, subscriptionTier, isActive, registrationStatus }),
    });

    await loadDashboard();
  };

  const handleEditTenant = async (tenant: TenantRow) => {
    const companyName = window.prompt('Company name', tenant.name) || tenant.name;
    const subscriptionTier = window.prompt('Subscription tier', tenant.tier) || tenant.tier;
    const registrationStatus = window.prompt('Registration status', tenant.status) || tenant.status;
    const isActive = window.confirm('Keep this tenant active?');

    await requestJson(`/api/Admin/tenants/${tenant.tenantId}`, {
      method: 'PUT',
      body: JSON.stringify({ companyName, subscriptionTier, isActive, registrationStatus }),
    });

    await loadDashboard();
  };

  const handleDeleteTenant = async (tenant: TenantRow) => {
    if (!window.confirm(`Archive ${tenant.name}?`)) return;
    await requestJson(`/api/Admin/tenants/${tenant.tenantId}`, { method: 'DELETE' });
    await loadDashboard();
  };

  const handleCreateAdmin = async () => {
    const name = window.prompt('Admin name');
    const email = window.prompt('Admin email');
    const password = window.prompt('Initial password');
    const tenantId = Number(window.prompt('Tenant ID', tenantRows[0]?.tenantId?.toString() || '1'));
    const roleId = Number(window.prompt('Role ID (1=Super Admin, 2=Main Admin, 3=Finance Manager, 4=Department Head, 5=Auditor, 6=Viewer)', '2'));
    const isActive = window.confirm('Should this admin be active now?');

    if (!name || !email || !password || Number.isNaN(tenantId) || Number.isNaN(roleId)) return;

    await requestJson('/api/Admin/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, tenantID: tenantId, roleID: roleId, isActive }),
    });

    await loadDashboard();
  };

  const handleEditAdmin = async (admin: AdminRow) => {
    const name = window.prompt('Admin name', admin.name) || admin.name;
    const email = window.prompt('Admin email', admin.email) || admin.email;
    const password = window.prompt('New password (leave blank to keep current)', '');
    const tenantId = Number(window.prompt('Tenant ID', admin.tenantId.toString()) || admin.tenantId.toString());
    const roleId = Number(window.prompt('Role ID', admin.roleName === 'Main Admin' ? '2' : '1') || '2');
    const isActive = window.confirm('Should this admin stay active?');

    await requestJson(`/api/Admin/users/${admin.userId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, password, tenantID: tenantId, roleID: roleId, isActive }),
    });

    await loadDashboard();
  };

  const handleDeleteAdmin = async (admin: AdminRow) => {
    if (!window.confirm(`Archive ${admin.email}?`)) return;
    await requestJson(`/api/Admin/users/${admin.userId}`, { method: 'DELETE' });
    await loadDashboard();
  };

  const handleSavePricing = () => {
    setPricingSaved(true);
    setTimeout(() => setPricingSaved(false), 3000);
    alert('✅ Pricing configuration saved successfully!\n\nChanges will reflect on the public pricing page within 5 minutes.');
  };

  const getPageTitle = () => {
    switch(currentView) {
      case 'overview': return 'Global Dashboard';
      case 'tenants': return 'Tenant Management';
      case 'billing': return 'Subscription & Billing Engine';
      case 'admins': return 'Main Admin Accounts';
      case 'config': return 'System Configuration';
      case 'maintenance': return 'Maintenance & Backups';
      case 'trial-requests': return 'Trial Request Management';
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
            <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
            <div>
              <div className="font-black text-xl leading-none text-white">NexaPlan</div>
              <div className="text-xs text-slate-400 mt-0.5">Super Admin</div>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentView('overview')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'overview'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 inline mr-1.5" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentView('tenants')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'tenants'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1.5" />
            Tenants
          </button>

          <button
            onClick={() => setCurrentView('billing')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'billing'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-1.5" />
            Billing
          </button>

          <button
            onClick={() => setCurrentView('admins')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'admins'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <UserCog className="w-4 h-4 inline mr-1.5" />
            Admins
          </button>

          {/* Trial Requests Tab with Pending Badge */}
          <button
            onClick={() => setCurrentView('trial-requests')}
            className={`relative px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'trial-requests'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4 inline mr-1.5" />
            Trial Requests
            {pendingTrialCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0F172A]">
                {pendingTrialCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('config')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'config'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-1.5" />
            Config
          </button>

          <button
            onClick={() => setCurrentView('maintenance')}
            className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
              currentView === 'maintenance'
                ? 'bg-[#4F46E5] text-white'
                : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 inline mr-1.5" />
            Maintenance
          </button>
        </div>

        {/* Right: Status + Profile Dropdown */}
        <div className="flex items-center gap-4">
          {/* Platform Status */}
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <span className="text-slate-300 font-medium">All Systems Operational</span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">JB</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">Justin Bais</div>
                <div className="text-xs text-slate-400 mt-0.5">Super Admin</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Justin Bais</div>
                  <div className="text-xs text-slate-500">justin@nexaplan.ph</div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    Security
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={() => { setShowProfileDropdown(false); onBack(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Sticky Header - 72px */}
        <header className="h-[72px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 shrink-0">
          {/* Left: Page Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-[30px] font-bold text-[#0A192F] tracking-tight">{getPageTitle()}</h1>
            {currentView === 'trial-requests' && pendingTrialCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EF4444]/10 text-[#EF4444] rounded-full text-sm font-bold">
                <span className="w-2 h-2 bg-[#EF4444] rounded-full animate-pulse"></span>
                {pendingTrialCount} Pending Review
              </span>
            )}
          </div>

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
                  <div className="text-3xl font-black text-slate-900">{summary?.totalTenants ?? tenantRows.length}</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Enterprise Tier</div>
                  <div className="text-3xl font-black text-blue-600">{tenantRows.filter((tenant) => tenant.tier.toLowerCase() === 'enterprise').length}</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Trial Accounts</div>
                  <div className="text-3xl font-black text-[#F59E0B]">{summary?.pendingTrials ?? trialRequests.filter((trial) => trial.status === 'pending').length}</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue</div>
                  <div className="text-3xl font-black text-[#EF4444]">{invoiceRows.filter((invoice) => invoice.status === 'Overdue').length}</div>
                </div>
              </div>

              {/* Tenant Table */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold text-slate-900">All Tenant Organizations</h2>
                  <button onClick={handleCreateTenant} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2">
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
                    {tenantRows.map((tenant) => (
                      <tr key={tenant.tenantId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{tenant.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{tenant.admin}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-md text-xs font-bold ${
                            tenant.tier.toLowerCase() === 'enterprise' ? 'bg-blue-100 text-blue-800' :
                            tenant.tier.toLowerCase() === 'professional' ? 'bg-purple-100 text-purple-800' :
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
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleEditTenant(tenant)} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteTenant(tenant)} className="text-[#EF4444] hover:text-[#DC2626] text-sm font-bold">
                              Archive
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

          {/* SUBSCRIPTION & BILLING ENGINE VIEW */}
          {currentView === 'billing' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Revenue Metrics */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total MRR</div>
                  <div className="text-3xl font-black text-[#4F46E5]">{summary ? formatMoney(summary.totalRevenue) : '—'}</div>
                  <div className="text-xs text-[#10B981] font-bold mt-2">{summary?.paidInvoices ?? 0} paid invoices</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">ARR</div>
                  <div className="text-3xl font-black text-slate-900">{summary ? formatMoney(summary.totalRevenue * 12) : '—'}</div>
                  <div className="text-xs text-[#10B981] font-bold mt-2">Annualized from current revenue</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pending Invoices</div>
                  <div className="text-3xl font-black text-[#F59E0B]">{summary?.pendingInvoices ?? invoiceRows.filter((invoice) => invoice.status === 'Pending').length}</div>
                  <div className="text-xs text-slate-600 mt-2">{invoiceRows.filter((invoice) => invoice.status === 'Pending').length} visible in dashboard</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Overdue Amount</div>
                  <div className="text-3xl font-black text-[#EF4444]">{formatMoney(invoiceRows.filter((invoice) => invoice.status === 'Overdue').reduce((total, invoice) => total + Number(invoice.amount.replace(/[^0-9.]/g, '')), 0))}</div>
                  <div className="text-xs text-slate-600 mt-2">{invoiceRows.filter((invoice) => invoice.status === 'Overdue').length} accounts</div>
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
                  <button onClick={loadDashboard} className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Refresh
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
                    {invoiceRows.map((invoice) => (
                      <tr key={invoice.invoiceId} className="hover:bg-[#F8FAFC] transition-colors">
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
                          <span className="text-[#4F46E5] text-sm font-bold">Synced</span>
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
                  <button onClick={handleCreateAdmin} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2">
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
                    {adminRows.map((admin) => (
                      <tr key={admin.userId} className="hover:bg-[#F8FAFC] transition-colors">
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
                            <button onClick={() => handleEditAdmin(admin)} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteAdmin(admin)} className="text-[#EF4444] hover:text-[#DC2626] text-sm font-bold">
                              Archive
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

          {/* TRIAL REQUESTS VIEW */}
          {currentView === 'trial-requests' && (
            <div className="max-w-[1440px] mx-auto space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Total Requests</div>
                  <div className="text-3xl font-black text-slate-900">{trialRequests.length}</div>
                </div>
                <div className="bg-[#F59E0B]/5 rounded-md p-6 border border-[#F59E0B]/30 shadow-sm">
                  <div className="text-xs font-medium text-[#F59E0B] uppercase tracking-wider mb-2">Pending Review</div>
                  <div className="text-3xl font-black text-[#F59E0B]">{trialRequests.filter(r => r.status === 'pending').length}</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Approved</div>
                  <div className="text-3xl font-black text-[#10B981]">{trialRequests.filter(r => r.status === 'approved').length}</div>
                </div>
                <div className="bg-white rounded-md p-6 border border-slate-200 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Rejected</div>
                  <div className="text-3xl font-black text-[#EF4444]">{trialRequests.filter(r => r.status === 'rejected').length}</div>
                </div>
              </div>

              {/* Requests Table */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[20px] font-semibold text-slate-900">Incoming Trial Applications</h2>
                  <span className="text-sm text-slate-500">Click "Review" on any pending request to approve or reject.</span>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trialRequests.map((req) => (
                      <tr key={req.id} className={`hover:bg-[#F8FAFC] transition-colors ${selectedTrial === req.id ? 'bg-indigo-50/60' : ''}`}>
                        <td className="px-6 py-4 text-sm font-mono font-bold text-[#4F46E5]">{req.id}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{req.companyName}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{req.contactName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{req.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{req.submittedDate}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                            req.status === 'pending' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                            req.status === 'approved' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            'bg-[#EF4444]/10 text-[#EF4444]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              req.status === 'pending' ? 'bg-[#F59E0B] animate-pulse' :
                              req.status === 'approved' ? 'bg-[#10B981]' :
                              'bg-[#EF4444]'
                            }`}></span>
                            {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {req.status === 'pending' ? (
                            <button
                              onClick={() => { setSelectedTrial(req.id); setTrialReviewNote(''); }}
                              className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-bold hover:underline transition-colors"
                            >
                              Review →
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">{req.reviewNotes}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Review Panel */}
              {selectedTrial && (() => {
                const req = trialRequests.find(r => r.id === selectedTrial);
                if (!req) return null;
                return (
                  <div className="bg-white rounded-md border-2 border-[#4F46E5]/40 shadow-xl overflow-hidden">
                    <div className="px-6 py-4 bg-[#4F46E5]/5 border-b border-[#4F46E5]/20 flex items-center justify-between">
                      <div>
                        <h2 className="text-[18px] font-bold text-slate-900">
                          Reviewing: <span className="text-[#4F46E5]">{req.companyName}</span>
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Request ID: {req.id} • Submitted: {req.submittedDate}</p>
                      </div>
                      <button onClick={() => setSelectedTrial(null)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                          { label: 'Company Name', value: req.companyName },
                          { label: 'Contact Person', value: req.contactName },
                          { label: 'Email Address', value: req.email },
                          { label: 'Phone Number', value: req.phone },
                          { label: 'Date Submitted', value: req.submittedDate },
                          { label: 'Request ID', value: req.id },
                        ].map((item, i) => (
                          <div key={i} className="bg-slate-50 rounded-md p-4 border border-slate-200">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{item.label}</div>
                            <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Review Notes <span className="text-slate-400 font-normal">(optional — will be recorded)</span>
                        </label>
                        <textarea
                          value={trialReviewNote}
                          onChange={(e) => setTrialReviewNote(e.target.value)}
                          placeholder="e.g. Verified business registration, enterprise use case confirmed..."
                          rows={3}
                          className="w-full px-4 py-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none resize-none"
                        />
                      </div>

                      <div className="flex gap-4 items-center">
                        <button
                          onClick={() => handleApproveTrialRequest(req.id)}
                          className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-6 py-3 rounded-md font-bold shadow-lg shadow-emerald-500/20 transition-all"
                        >
                          <Check className="w-5 h-5" />
                          Approve Trial Access
                        </button>
                        <button
                          onClick={() => handleRejectTrialRequest(req.id)}
                          className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white px-6 py-3 rounded-md font-bold shadow-lg shadow-red-500/20 transition-all"
                        >
                          <X className="w-5 h-5" />
                          Reject Request
                        </button>
                        <button
                          onClick={() => setSelectedTrial(null)}
                          className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-md font-bold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
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
                  Save System Changes
                </button>
              </div>

              {/* ===================== PRICING CONFIGURATION ===================== */}
              <div className="bg-white rounded-md border-2 border-[#4F46E5]/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-[#4F46E5]/5 to-transparent border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-[20px] font-semibold text-slate-900 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-[#4F46E5]" />
                      Pricing Configuration
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Edit the pricing and limits for all subscription plans. Changes reflect on the public pricing page.</p>
                  </div>
                  <button
                    onClick={handleSavePricing}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-bold shadow-md transition-all ${
                      pricingSaved
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#4F46E5] hover:bg-[#4338CA] text-white'
                    }`}
                  >
                    {pricingSaved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Pricing'}
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6">
                    {/* Starter Plan */}
                    <div className="border-2 border-slate-200 rounded-md p-5 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-slate-900">Starter Plan</h3>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold">STARTER</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monthly Price (₱)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                          <input
                            type="text"
                            value={pricingConfig.starter.price}
                            onChange={(e) => setPricingConfig(prev => ({ ...prev, starter: { ...prev.starter, price: e.target.value } }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-md text-sm font-mono font-bold focus:ring-2 focus:ring-[#4F46E5] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Max Budget Managers</label>
                        <input
                          type="text"
                          value={pricingConfig.starter.users}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, starter: { ...prev.starter, users: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department Allocations</label>
                        <input
                          type="text"
                          value={pricingConfig.starter.departments}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, starter: { ...prev.starter, departments: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Forecasting Window</label>
                        <input
                          type="text"
                          value={pricingConfig.starter.forecasting}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, starter: { ...prev.starter, forecasting: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Support Level</label>
                        <input
                          type="text"
                          value={pricingConfig.starter.support}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, starter: { ...prev.starter, support: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                    </div>

                    {/* Professional Plan */}
                    <div className="border-2 border-[#4F46E5]/40 rounded-md p-5 space-y-4 bg-[#4F46E5]/5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-slate-900">Professional Plan</h3>
                        <span className="text-xs bg-[#4F46E5] text-white px-2 py-1 rounded-md font-bold">MOST POPULAR</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monthly Price (₱)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                          <input
                            type="text"
                            value={pricingConfig.professional.price}
                            onChange={(e) => setPricingConfig(prev => ({ ...prev, professional: { ...prev.professional, price: e.target.value } }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-[#4F46E5]/30 rounded-md text-sm font-mono font-bold focus:ring-2 focus:ring-[#4F46E5] outline-none bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Max Budget Managers</label>
                        <input
                          type="text"
                          value={pricingConfig.professional.users}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, professional: { ...prev.professional, users: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-[#4F46E5]/30 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department Allocations</label>
                        <input
                          type="text"
                          value={pricingConfig.professional.departments}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, professional: { ...prev.professional, departments: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-[#4F46E5]/30 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Forecasting Window</label>
                        <input
                          type="text"
                          value={pricingConfig.professional.forecasting}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, professional: { ...prev.professional, forecasting: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-[#4F46E5]/30 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Support Level</label>
                        <input
                          type="text"
                          value={pricingConfig.professional.support}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, professional: { ...prev.professional, support: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-[#4F46E5]/30 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none bg-white"
                        />
                      </div>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="border-2 border-slate-800/20 rounded-md p-5 space-y-4 bg-slate-800/5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-slate-900">Enterprise Plan</h3>
                        <span className="text-xs bg-slate-800 text-white px-2 py-1 rounded-md font-bold">ENTERPRISE</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Monthly Price (₱)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                          <input
                            type="text"
                            value={pricingConfig.enterprise.price}
                            onChange={(e) => setPricingConfig(prev => ({ ...prev, enterprise: { ...prev.enterprise, price: e.target.value } }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-md text-sm font-mono font-bold focus:ring-2 focus:ring-[#4F46E5] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Max Budget Managers</label>
                        <input
                          type="text"
                          value={pricingConfig.enterprise.users}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, enterprise: { ...prev.enterprise, users: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department Allocations</label>
                        <input
                          type="text"
                          value={pricingConfig.enterprise.departments}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, enterprise: { ...prev.enterprise, departments: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Forecasting Window</label>
                        <input
                          type="text"
                          value={pricingConfig.enterprise.forecasting}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, enterprise: { ...prev.enterprise, forecasting: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Support Level</label>
                        <input
                          type="text"
                          value={pricingConfig.enterprise.support}
                          onChange={(e) => setPricingConfig(prev => ({ ...prev, enterprise: { ...prev.enterprise, support: e.target.value } }))}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800">
                      <span className="font-bold">Important:</span> Pricing changes will NOT automatically update existing subscriptions. Only new signups will see the updated prices. Contact Finance to process mid-cycle plan adjustments.
                    </p>
                  </div>
                </div>
              </div>
              {/* ===================== END PRICING CONFIGURATION ===================== */}
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
