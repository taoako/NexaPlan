import React, { useState } from 'react';
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
  ChevronRight,
  MapPin,
  ExternalLink,
  LayoutDashboard,
  ScrollText,
  FolderOpen,
  ListChecks,
  LogOut
} from 'lucide-react';

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
      {/* Top Navigation - Slate Dark */}
      <nav className="h-20 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-between px-8 sticky top-0 z-50 shadow-2xl border-b border-slate-700">
        {/* Left: Brand + Badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="font-black text-xl text-white">NexaPlan</div>
          </div>

          <div className="flex items-center gap-2 bg-slate-700/50 px-5 py-2 rounded-full border border-slate-600">
            <Lock className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              AUDITOR VIEW - READ ONLY
            </span>
          </div>
        </div>

        {/* Center: Module Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveModule('overview')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${
              activeModule === 'overview'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveModule('audit-trails')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${
              activeModule === 'audit-trails'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ScrollText className="w-5 h-5" />
            <span>Audit Trails</span>
          </button>
          <button
            onClick={() => setActiveModule('financial-statements')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${
              activeModule === 'financial-statements'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FolderOpen className="w-5 h-5" />
            <span>Financial Statements</span>
          </button>
          <button
            onClick={() => setActiveModule('compliance-scans')}
            className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${
              activeModule === 'compliance-scans'
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListChecks className="w-5 h-5" />
            <span>Compliance Scans</span>
          </button>
        </div>

        {/* Right: Actions + Logout */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            Generate Report
          </button>

          <button
            onClick={() => onBack?.()}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
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
