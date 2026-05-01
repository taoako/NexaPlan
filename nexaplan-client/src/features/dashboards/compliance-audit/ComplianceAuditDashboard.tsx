import React, { useState, useRef, useEffect } from 'react';
import {
  Lock,
  Shield,
  Download,
  Bell,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Calendar,
  Users,
  User,
  ChevronRight,
  MapPin,
  ExternalLink,
  LayoutDashboard,
  ScrollText,
  FolderOpen,
  ListChecks,
  LogOut
} from 'lucide-react';
import logoImg from "../../../assets/brand/nexaplan-logo.png";

interface ComplianceAuditDashboardProps {
  onBack?: () => void;
}

interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  status: 'success' | 'violation' | 'warning';
  location?: string;
  metadata?: any;
}

const auditLogs: AuditLog[] = [
  {
    id: 1,
    timestamp: '2026-04-23 14:32:11 UTC',
    actor: 'Sarah Jenkins',
    role: 'Finance Manager',
    action: 'BUDGET_APPROVED',
    target: 'IT Dept Q3 Proposal',
    ip: '192.168.1.45',
    status: 'success',
    location: 'Davao City, PH - Corporate Network',
    metadata: { amount: '₱145,000', approver_level: 2, department_id: 'IT-001' }
  },
  {
    id: 2,
    timestamp: '2026-04-22 09:15:00 UTC',
    actor: 'Admin_Main',
    role: 'Main Admin',
    action: 'RBAC_ROLE_CHANGED',
    target: 'User: M. Reed to \'Dept Head\'',
    ip: '10.0.0.21',
    status: 'success',
    location: 'Manila, PH - VPN Connection',
    metadata: { user_id: 'UR-5521', old_role: 'Finance Manager', new_role: 'Department Head' }
  },
  {
    id: 3,
    timestamp: '2026-04-20 23:45:10 UTC',
    actor: 'System_Auto',
    role: 'System',
    action: 'FUNDS_TRANSFER',
    target: 'Reserve to Marketing',
    ip: 'System',
    status: 'violation',
    location: 'System Process',
    metadata: { amount: '₱50,000', reason: 'Outside business hours (11:45 PM)', policy_id: 'POL-003' }
  },
  {
    id: 4,
    timestamp: '2026-04-19 16:20:33 UTC',
    actor: 'Carlos Reyes',
    role: 'Department Head',
    action: 'BUDGET_SUBMITTED',
    target: 'IT Department Q4 Request',
    ip: '192.168.1.89',
    status: 'success',
    location: 'Davao City, PH - Corporate Network',
    metadata: { amount: '₱200,000', fiscal_year: 'FY2026', quarter: 'Q4' }
  },
  {
    id: 5,
    timestamp: '2026-04-18 11:05:22 UTC',
    actor: 'Maria Santos',
    role: 'Finance Manager',
    action: 'VARIANCE_REPORT_GENERATED',
    target: 'Monthly Variance Report - March 2026',
    ip: '192.168.1.62',
    status: 'success',
    location: 'Davao City, PH - Corporate Network',
    metadata: { report_type: 'Variance Analysis', period: 'March 2026' }
  },
  {
    id: 6,
    timestamp: '2026-04-17 08:30:15 UTC',
    actor: 'System_Auto',
    role: 'System',
    action: 'POLICY_SCAN_COMPLETED',
    target: 'Automated Compliance Check',
    ip: 'System',
    status: 'warning',
    location: 'System Process',
    metadata: { violations_found: 1, policies_checked: 15, scan_id: 'SC-7821' }
  },
  {
    id: 7,
    timestamp: '2026-04-16 13:42:07 UTC',
    actor: 'Angela Cruz',
    role: 'Auditor',
    action: 'AUDIT_REPORT_ACCESSED',
    target: 'Q1 2026 Financial Statements',
    ip: '203.177.45.12',
    status: 'success',
    location: 'Cebu City, PH - Remote Access',
    metadata: { document_id: 'FIN-Q1-2026', access_type: 'Read-Only' }
  },
  {
    id: 8,
    timestamp: '2026-04-15 10:18:44 UTC',
    actor: 'Jose Mendoza',
    role: 'Department Head',
    action: 'USER_INVITED',
    target: 'rico.tan@acmecorp.ph',
    ip: '192.168.1.103',
    status: 'success',
    location: 'Davao City, PH - Corporate Network',
    metadata: { invited_role: 'Viewer', department: 'HR' }
  }
];

const policyChecks = [
  { id: 1, name: 'No department exceeds 15% YOY budget increase', status: 'compliant', details: 'All departments within threshold' },
  { id: 2, name: 'All budget approvals require two-tier sign-off', status: 'violation', details: '1 Violation Detected - Workflow bypassed on IT Q3 approval', violationCount: 1 },
  { id: 3, name: 'Forecast variance remains within +/- 5% threshold', status: 'compliant', details: 'Current variance: 1.5% under budget' },
  { id: 4, name: 'No financial transactions outside business hours', status: 'violation', details: '1 Violation - Automated transfer at 11:45 PM', violationCount: 1 },
  { id: 5, name: 'All user access changes logged and verified', status: 'compliant', details: '100% compliance - All changes audited' },
];

const financialDocuments = [
  { id: 1, name: 'Q1 2026 Consolidated Budget Statement.pdf', type: 'Budget Statement', date: '2026-03-31', size: '2.4 MB' },
  { id: 2, name: 'FY 2025 Variance Analysis Summary.pdf', type: 'Variance Report', date: '2025-12-31', size: '1.8 MB' },
  { id: 3, name: 'Q4 2025 Department Budget Breakdown.xlsx', type: 'Budget Breakdown', date: '2025-12-15', size: '856 KB' },
  { id: 4, name: 'March 2026 Expense Forecast Report.pdf', type: 'Forecast Report', date: '2026-03-25', size: '1.2 MB' },
];

export function ComplianceAuditDashboard({ onBack }: ComplianceAuditDashboardProps) {
  const [activeModule, setActiveModule] = useState<'overview' | 'audit-trails' | 'financial-statements' | 'compliance-scans'>('overview');
  const [dateRange, setDateRange] = useState('Q1 2026 - Q4 2026');
  const [targetDept, setTargetDept] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [expandedAuditRow, setExpandedAuditRow] = useState<string | null>('AUD-1043');
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

  const handleGenerateReport = () => {
    alert('Generating comprehensive audit report...\nThis will include:\n- Full audit trail logs\n- Policy compliance summary\n- Financial statements\n- Violation details\n\nExport format: PDF');
  };

  const handleDownloadDocument = (docName: string) => {
    alert(`Downloading: ${docName}\n\nThis is a read-only audit copy.`);
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchQuery ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'All' || log.action.includes(actionFilter.toUpperCase());
    const matchesRole = roleFilter === 'All' || log.role === roleFilter;
    const matchesSeverity = severityFilter === 'All' ||
      (severityFilter === 'High' && log.status === 'violation') ||
      (severityFilter === 'Medium' && log.status === 'warning') ||
      (severityFilter === 'Low' && log.status === 'success');

    return matchesSearch && matchesAction && matchesRole && matchesSeverity;
  });

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-['Inter']">
      {/* Top Navigation */}
      <nav className="h-20 bg-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 border-b border-white/10 shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="NexaPlan Logo" className="h-10 w-auto" />
          <div>
            <div className="font-black text-xl leading-none text-white">NexaPlan</div>
            <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-700/40 px-2.5 py-1 rounded-full border border-slate-600 ml-2">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Read Only</span>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="flex gap-1">
          {([
            { id: 'overview',              label: 'Overview',             icon: LayoutDashboard },
            { id: 'audit-trails',          label: 'Audit Trails',         icon: ScrollText },
            { id: 'financial-statements',  label: 'Financial Statements', icon: FolderOpen },
            { id: 'compliance-scans',      label: 'Compliance Scans',     icon: ListChecks },
          ] as { id: typeof activeModule; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                activeModule === id
                  ? 'bg-[#4F46E5] text-white'
                  : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-[#4F46E5] text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Generate Report
          </button>
          <button className="text-slate-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
          {/* Profile Dropdown */}
          <div className="relative pl-4 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2.5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center font-bold text-white text-sm">
                AC
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white leading-none">Angela Cruz</div>
                <div className="text-xs text-slate-400 mt-0.5">Auditor</div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="text-sm font-bold text-slate-900">Angela Cruz</div>
                  <div className="text-xs text-slate-500">auditor@nexaplan.ph</div>
                </div>
                <div className="py-1">
                  <button onClick={() => { setShowProfileDropdown(false); alert('Profile Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> Profile Settings
                  </button>
                  <button onClick={() => { setShowProfileDropdown(false); alert('Security Settings — Coming Soon'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Lock className="w-4 h-4 text-slate-400" /> Security
                  </button>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button onClick={() => { setShowProfileDropdown(false); onBack?.(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-semibold">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Sub-Header Context Bar */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-20 z-40 shadow-sm">
        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-semibold">Showing:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option>Q1 2026 - Q4 2026</option>
              <option>Q1 2026 - Q2 2026</option>
              <option>FY 2025</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option>All Departments</option>
              <option>IT Department</option>
              <option>Marketing</option>
              <option>Finance</option>
              <option>HR</option>
              <option>Operations</option>
            </select>
          </div>
        </div>

        {/* Right: System Integrity Badge */}
        <div className="flex items-center gap-3 bg-[#10B981]/10 px-4 py-2 rounded-lg border border-[#10B981]/20">
          <Lock className="w-4 h-4 text-[#10B981]" />
          <span className="text-sm font-bold text-slate-900">All data points cryptographically verified</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-6">
        {/* Overview Module */}
        {activeModule === 'overview' && (
          <>
            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-4 gap-6">
          {/* Card 1: System Events */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">System Events Logged</div>
            <div className="text-4xl font-black text-slate-900 mb-2 font-mono">1.2M</div>
            <div className="text-sm text-slate-600">Trailing 30 days</div>
          </div>

          {/* Card 2: Policy Violations */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Policy Violations</div>
            <div className="text-4xl font-black text-[#DC2626] mb-2 font-mono">3</div>
            <div className="text-sm text-slate-600">Requires manual review</div>
          </div>

          {/* Card 3: Finalized Budgets */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Finalized Budgets</div>
            <div className="text-4xl font-black text-[#10B981] mb-2 font-mono">12 / 12</div>
            <div className="text-sm text-slate-600">All departments approved</div>
          </div>

          {/* Card 4: Data Integrity */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Data Integrity</div>
            <div className="text-4xl font-black text-[#10B981] mb-2 font-mono">100%</div>
            <div className="text-sm text-slate-600">No database anomalies detected</div>
          </div>
        </div>

        {/* Middle Section: Audit Trail */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">Global Audit Trail & System Logs</h2>
            <p className="text-sm text-slate-600 mt-1">Immutable transaction log with cryptographic verification</p>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by User, Transaction ID, or Action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-500" />

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option>All</option>
                <option>BUDGET</option>
                <option>RBAC</option>
                <option>FUNDS</option>
                <option>USER</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option>All</option>
                <option>Finance Manager</option>
                <option>Department Head</option>
                <option>Main Admin</option>
                <option>Auditor</option>
                <option>System</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <div className="ml-auto text-sm text-slate-600">
                Showing <span className="font-bold">{filteredLogs.length}</span> of <span className="font-bold">{auditLogs.length}</span> events
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Action Performed</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Target Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                      <td className="px-6 py-4 text-sm font-mono text-slate-700">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{log.actor}</div>
                        <div className="text-xs text-slate-500">{log.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-slate-900">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{log.target}</td>
                      <td className="px-6 py-4 relative group">
                        <span className="text-sm font-mono text-slate-700">{log.ip}</span>
                        {log.location && (
                          <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {log.location}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {log.status === 'success' && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                            <span className="text-sm font-bold text-[#10B981]">Success</span>
                          </div>
                        )}
                        {log.status === 'violation' && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                            <span className="text-sm font-bold text-[#DC2626]">Policy Violation</span>
                          </div>
                        )}
                        {log.status === 'warning' && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#64748B] rounded-full"></div>
                            <span className="text-sm font-bold text-[#64748B]">Warning</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`} />
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedLog === log.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400">
                            <div className="text-white font-bold mb-2">Transaction Metadata (Raw JSON):</div>
                            <pre className="whitespace-pre-wrap">
{JSON.stringify({
  transaction_id: `TXN-${log.id}-${Date.now()}`,
  timestamp: log.timestamp,
  actor: {
    name: log.actor,
    role: log.role,
    session_id: `SES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  action: log.action,
  target: log.target,
  network: {
    ip_address: log.ip,
    location: log.location,
    verified: true
  },
  metadata: log.metadata,
  cryptographic_hash: `SHA256:${Math.random().toString(36).substr(2, 32).toUpperCase()}`,
  verified_at: new Date().toISOString()
}, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Row: 50/50 Split */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Policy Adherence Scanner */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Automated Policy Checks</h2>
              <p className="text-sm text-slate-600 mt-1">Real-time compliance monitoring</p>
            </div>

            <div className="divide-y divide-slate-100">
              {policyChecks.map((check) => (
                <div key={check.id} className="p-5">
                  <button
                    onClick={() => setExpandedPolicy(expandedPolicy === check.id ? null : check.id)}
                    className="w-full flex items-start gap-4 text-left"
                  >
                    {check.status === 'compliant' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 mb-1">{check.name}</div>
                      <div className={`text-sm ${check.status === 'compliant' ? 'text-[#10B981]' : 'text-[#DC2626]'} font-semibold`}>
                        Status: {check.status === 'compliant' ? 'Compliant' : `${check.violationCount} Violation${check.violationCount! > 1 ? 's' : ''} Detected`}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${expandedPolicy === check.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedPolicy === check.id && (
                    <div className="mt-3 ml-10 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-700">{check.details}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Financial Documents */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Finalized Financial Reports</h2>
              <p className="text-sm text-slate-600 mt-1">Read-only audit copies</p>
            </div>

            <div className="divide-y divide-slate-100">
              {financialDocuments.map((doc) => (
                <div key={doc.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                      <FileText className="w-6 h-6 text-slate-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[8px] font-bold text-slate-400 rotate-[-20deg] opacity-50">
                          READ<br/>ONLY
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 mb-1 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-600">{doc.type} • {doc.date}</div>
                      <div className="text-xs text-slate-500 mt-1">{doc.size}</div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadDocument(doc.name)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => alert(`Opening ${doc.name} in read-only mode...`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}

        {/* Audit Trails Module */}
        {activeModule === 'audit-trails' && (
          <div className="space-y-6">
            {/* Enhanced Audit Table */}
            <div className="bg-white rounded-xl border border-[#d1d5db] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="px-6 py-4 border-b border-[#d1d5db] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScrollText className="w-5 h-5 text-[#0052FF]" />
                  <h2 className="text-[20px] font-bold text-slate-900">Compliance &amp; Audit Trail</h2>
                  <span className="px-2.5 py-0.5 bg-[#0052FF]/10 text-[#0052FF] rounded-full text-[11px] font-bold border border-[#0052FF]/30">IMMUTABLE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-[#d1d5db] rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 w-48 bg-white" />
                  </div>
                  <button className="flex items-center gap-1.5 border border-[#d1d5db] px-3.5 py-2 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"><Filter className="w-3.5 h-3.5" /> Filter</button>
                  <button onClick={handleGenerateReport} className="flex items-center gap-1.5 border border-[#d1d5db] px-3.5 py-2 rounded-lg text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"><Download className="w-3.5 h-3.5" /> Export</button>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-[#d1d5db]">
                  <tr>{['Timestamp','User','Action Type','Department Affected','Status',''].map((h,i)=><th key={i} className="px-5 py-3 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {[
                    {id:'AUD-1043',ts:'2026-04-29 09:14:22',user:'m.santos',  role:'Finance Manager', action:'Budget Modification',dept:'IT',        status:'verified' as const},
                    {id:'AUD-1044',ts:'2026-04-28 14:30:05',user:'j.doe',     role:'Department Head', action:'Scenario Approval',  dept:'Marketing',status:'pending'  as const},
                    {id:'AUD-1045',ts:'2026-04-27 11:22:44',user:'c.reyes',   role:'Department Head', action:'Budget Submission',  dept:'IT',        status:'verified' as const},
                    {id:'AUD-1046',ts:'2026-04-26 16:05:18',user:'l.aguilar', role:'Finance Manager', action:'Forecast Override',  dept:'Sales',     status:'flagged'  as const},
                    {id:'AUD-1047',ts:'2026-04-25 08:45:33',user:'admin_sys', role:'Main Admin',      action:'Policy Update',      dept:'All Depts', status:'verified' as const},
                    {id:'AUD-1048',ts:'2026-04-24 13:18:57',user:'m.santos',  role:'Finance Manager', action:'Approval Decision',  dept:'HR',        status:'verified' as const},
                    {id:'AUD-1049',ts:'2026-04-23 14:32:11',user:'a.cruz',    role:'Auditor',         action:'Report Accessed',    dept:'Finance',   status:'verified' as const},
                    {id:'AUD-1050',ts:'2026-04-22 09:15:00',user:'admin_main',role:'Main Admin',      action:'RBAC Role Changed',  dept:'HR',        status:'pending'  as const},
                  ].map(entry=>(
                    <React.Fragment key={entry.id}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors" onClick={()=>setExpandedAuditRow(expandedAuditRow===entry.id?null:entry.id)}>
                        <td className="px-5 py-3 font-mono text-[12px] text-slate-500 whitespace-nowrap">{entry.ts}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0A192F] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {entry.user.split(/[._]/).map(p=>p[0]?.toUpperCase()??'').join('').slice(0,2)}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-slate-900 leading-tight">{entry.user}</div>
                              <div className="text-[11px] text-slate-400">{entry.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[13px] font-semibold text-slate-700">{entry.action}</td>
                        <td className="px-5 py-3 text-[13px] text-slate-600">{entry.dept}</td>
                        <td className="px-5 py-3">
                          {entry.status==='verified'&&<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#10B981]/10 text-[#10B981] rounded-full text-[11px] font-bold border border-[#10B981]/30"><CheckCircle2 className="w-3 h-3"/>Verified</span>}
                          {entry.status==='pending' &&<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F59E0B]/10 text-[#D97706] rounded-full text-[11px] font-bold border border-[#F59E0B]/40"><AlertTriangle className="w-3 h-3"/>Pending</span>}
                          {entry.status==='flagged' &&<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EF4444]/10 text-[#DC2626] rounded-full text-[11px] font-bold border border-[#EF4444]/30"><XCircle className="w-3 h-3"/>Flagged</span>}
                        </td>
                        <td className="px-5 py-3"><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedAuditRow===entry.id?'rotate-180':''}`}/></td>
                      </tr>
                      {expandedAuditRow===entry.id && entry.id==='AUD-1043' && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="px-6 py-6">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#0052FF]"/>Audit Detail: Adjustment ID #AUD-1043</div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3">User Activity Log</div>
                                <div className="bg-white rounded-xl border border-[#d1d5db] p-4 space-y-2">
                                  {[{t:'09:14:22',u:'m.santos',a:'Opened proposal BUD-IT-Q3-2026'},{t:'09:15:01',u:'m.santos',a:'Modified: IT Infrastructure ₱120,000 to ₱145,000'},{t:'09:17:33',u:'m.santos',a:'Modified: Software Licenses ₱18,000 to ₱12,500'},{t:'09:22:15',u:'m.santos',a:'Submitted modification for dual-approval review'},{t:'09:22:16',u:'System',a:'Auto-flagged: dual-approval policy check triggered'},{t:'14:32:11',u:'j.reyes',a:'Approved — Budget modification signed off'}].map((log,i)=>(
                                    <div key={i} className="flex gap-3 text-[12px] leading-relaxed">
                                      <span className="font-mono text-slate-400 w-40 shrink-0">2026-04-29 {log.t}</span>
                                      <span className="font-bold text-[#0052FF] w-20 shrink-0">{log.u}</span>
                                      <span className="text-slate-600">{log.a}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider mb-3">Before vs. After Comparison</div>
                                <div className="bg-white rounded-xl border border-[#d1d5db] overflow-hidden">
                                  <table className="w-full text-[12px]">
                                    <thead className="bg-slate-50 border-b border-[#d1d5db]"><tr>{['Line Item','Original','Modified','Delta'].map(h=><th key={h} className="px-4 py-2.5 text-left text-[11px] font-black text-slate-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {[{item:'IT Infrastructure',o:120000,m:145000},{item:'Software Licenses',o:18000,m:12500},{item:'Hardware Procurement',o:42000,m:45000},{item:'Network Upgrade',o:35000,m:35000}].map((r,i)=>{
                                        const d=r.m-r.o;
                                        const p=((d/r.o)*100).toFixed(1);
                                        return <tr key={i} className="hover:bg-slate-50/50"><td className="px-4 py-2.5 text-slate-700 font-medium">{r.item}</td><td className="px-4 py-2.5 font-mono text-slate-400">₱{r.o.toLocaleString()}</td><td className="px-4 py-2.5 font-mono font-bold text-slate-900">₱{r.m.toLocaleString()}</td><td className={`px-4 py-2.5 font-bold ${d>0?'text-[#10B981]':d<0?'text-red-500':'text-slate-400'}`}>{d!==0?`${d>0?'+':''}₱${Math.abs(d).toLocaleString()} (${d>0?'+':''}${p}%)`:'No change'}</td></tr>;
                                      })}
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-200 bg-slate-50"><tr><td className="px-4 py-2.5 font-black text-slate-900">TOTAL</td><td className="px-4 py-2.5 font-mono font-bold text-slate-400">₱215,000</td><td className="px-4 py-2.5 font-mono font-black text-slate-900">₱237,500</td><td className="px-4 py-2.5 font-bold text-[#10B981]">+₱22,500 (+10.5%)</td></tr></tfoot>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedAuditRow===entry.id && entry.id!=='AUD-1043' && (
                        <tr className="bg-slate-50/40"><td colSpan={6} className="px-6 py-3.5"><p className="text-[13px] text-slate-600"><span className="font-bold text-slate-900">{entry.id}</span> — Action cryptographically verified. Hash integrity confirmed. No anomalies detected.</p></td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* System Event Log (legacy) */}
            <div className="bg-white rounded-xl border border-[#d1d5db] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="px-6 py-4 border-b border-[#d1d5db]">
                <h2 className="text-[20px] font-bold text-slate-900">System Event Log</h2>
                <p className="text-[13px] text-slate-500 mt-0.5">Full transaction log with raw metadata</p>
              </div>

            {/* Controls */}
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by User, Transaction ID, or Action..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-slate-500" />

                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  <option>All</option>
                  <option>BUDGET</option>
                  <option>RBAC</option>
                  <option>FUNDS</option>
                  <option>USER</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  <option>All</option>
                  <option>Finance Manager</option>
                  <option>Department Head</option>
                  <option>Main Admin</option>
                  <option>Auditor</option>
                  <option>System</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>

                <div className="ml-auto text-sm text-slate-600">
                  Showing <span className="font-bold">{filteredLogs.length}</span> of <span className="font-bold">{auditLogs.length}</span> events
                </div>
              </div>
            </div>

            {/* Audit Trail Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Actor</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Action Performed</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Target Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-black text-slate-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                        <td className="px-6 py-4 text-sm font-mono text-slate-700">{log.timestamp}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900">{log.actor}</div>
                          <div className="text-xs text-slate-500">{log.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-slate-900">{log.action}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{log.target}</td>
                        <td className="px-6 py-4 relative group">
                          <span className="text-sm font-mono text-slate-700">{log.ip}</span>
                          {log.location && (
                            <div className="absolute hidden group-hover:block bottom-full left-0 mb-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {log.location}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.status === 'success' && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                              <span className="text-sm font-bold text-[#10B981]">Success</span>
                            </div>
                          )}
                          {log.status === 'violation' && (
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                              <span className="text-sm font-bold text-[#DC2626]">Policy Violation</span>
                            </div>
                          )}
                          {log.status === 'warning' && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#64748B] rounded-full"></div>
                              <span className="text-sm font-bold text-[#64748B]">Warning</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedLog === log.id ? 'rotate-90' : ''}`} />
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedLog === log.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400">
                              <div className="text-white font-bold mb-2">Transaction Metadata (Raw JSON):</div>
                              <pre className="whitespace-pre-wrap">
{JSON.stringify({
  transaction_id: `TXN-${log.id}-${Date.now()}`,
  timestamp: log.timestamp,
  actor: {
    name: log.actor,
    role: log.role,
    session_id: `SES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  },
  action: log.action,
  target: log.target,
  network: {
    ip_address: log.ip,
    location: log.location,
    verified: true
  },
  metadata: log.metadata,
  cryptographic_hash: `SHA256:${Math.random().toString(36).substr(2, 32).toUpperCase()}`,
  verified_at: new Date().toISOString()
}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        )}

        {/* Financial Statements Module */}
        {activeModule === 'financial-statements' && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Finalized Financial Reports</h2>
              <p className="text-sm text-slate-600 mt-1">Read-only audit copies</p>
            </div>

            <div className="divide-y divide-slate-100">
              {financialDocuments.map((doc) => (
                <div key={doc.id} className="p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 relative">
                      <FileText className="w-6 h-6 text-slate-600" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-[8px] font-bold text-slate-400 rotate-[-20deg] opacity-50">
                          READ<br/>ONLY
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900 mb-1 truncate">{doc.name}</div>
                      <div className="text-xs text-slate-600">{doc.type} • {doc.date}</div>
                      <div className="text-xs text-slate-500 mt-1">{doc.size}</div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadDocument(doc.name)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5 text-slate-600" />
                      </button>
                      <button
                        onClick={() => alert(`Opening ${doc.name} in read-only mode...`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Scans Module */}
        {activeModule === 'compliance-scans' && (
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Automated Policy Checks</h2>
              <p className="text-sm text-slate-600 mt-1">Real-time compliance monitoring</p>
            </div>

            <div className="divide-y divide-slate-100">
              {policyChecks.map((check) => (
                <div key={check.id} className="p-5">
                  <button
                    onClick={() => setExpandedPolicy(expandedPolicy === check.id ? null : check.id)}
                    className="w-full flex items-start gap-4 text-left"
                  >
                    {check.status === 'compliant' ? (
                      <CheckCircle2 className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900 mb-1">{check.name}</div>
                      <div className={`text-sm ${check.status === 'compliant' ? 'text-[#10B981]' : 'text-[#DC2626]'} font-semibold`}>
                        Status: {check.status === 'compliant' ? 'Compliant' : `${check.violationCount} Violation${check.violationCount! > 1 ? 's' : ''} Detected`}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${expandedPolicy === check.id ? 'rotate-90' : ''}`} />
                  </button>

                  {expandedPolicy === check.id && (
                    <div className="mt-3 ml-10 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-700">{check.details}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}