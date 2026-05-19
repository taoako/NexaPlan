import { apiRoleBase } from '../config/api';

const API_BASE = apiRoleBase('auditor');

function getHeaders() {
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error('Not logged in');
  const user = JSON.parse(userStr);
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Id': user.tenantId?.toString() || '',
    'X-User-Id': user.userId?.toString() || ''
  };
}

function getUserInfo() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return { tenantId: '', userId: '' };
  const user = JSON.parse(userStr);
  return {
    tenantId: user.tenantId?.toString() || '',
    userId: user.userId?.toString() || ''
  };
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { headers: getHeaders(), ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

// Blob fetch for file downloads (does not parse JSON)
async function apiFetchBlob(url: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${url}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.blob();
}

export const auditorApi = {
  // Audit Trail
  getLogs: (params?: {
    search?: string;
    actionType?: string;
    flaggedOnly?: boolean;
    from?: string;
    to?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search)       q.set('search', params.search);
    if (params?.actionType && params.actionType !== 'All') q.set('actionType', params.actionType);
    if (params?.flaggedOnly)  q.set('flaggedOnly', 'true');
    if (params?.from)         q.set('from', params.from);
    if (params?.to)           q.set('to', params.to);
    if (params?.departmentId && params.departmentId !== 'all') q.set('departmentId', params.departmentId);
    if (params?.page)         q.set('page', params.page.toString());
    if (params?.pageSize)     q.set('pageSize', params.pageSize.toString());
    return apiFetch<{ total: number; page: number; pageSize: number; logs: any[] }>(`/logs?${q}`);
  },

  getFlaggedLogs: (params?: { from?: string; to?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.from)  q.set('from', params.from);
    if (params?.to)    q.set('to', params.to);
    if (params?.page)  q.set('page', params.page.toString());
    return apiFetch<{ total: number; page: number; pageSize: number; logs: any[] }>(`/logs/flagged?${q}`);
  },

  getLogSummary: () => apiFetch<any>('/logs/summary'),
  flagLog:   (id: number, reason: string) => apiFetch<any>(`/logs/${id}/flag`,   { method: 'POST', body: JSON.stringify({ reason }) }),
  unflagLog: (id: number)                 => apiFetch<any>(`/logs/${id}/unflag`, { method: 'POST', body: '{}' }),

  // Compliance
  getComplianceRules: () => apiFetch<any[]>('/compliance/rules'),
  runComplianceScan:  () => apiFetch<any[]>('/compliance/scan'),
  createRule: (data: { name: string; ruleType: string; threshold: number; description?: string }) =>
    apiFetch<any>('/compliance/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id: number, data: { name?: string; threshold?: number; isActive?: boolean }) =>
    apiFetch<any>(`/compliance/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id: number) => apiFetch<any>(`/compliance/rules/${id}`, { method: 'DELETE' }),

  // Financial Statements
  getStatements: () => apiFetch<any[]>('/statements'),
  logAccess:     (id: number, type: 'View' | 'Download') =>
    apiFetch<any>(`/statements/${id}/access`, { method: 'POST', body: JSON.stringify({ accessType: type }) }),
  getAccessLog: (id: number) => apiFetch<any[]>(`/statements/${id}/access-log`),

  // Variance (Section 7)
  getVariance: (fiscalYear?: number) => {
    const q = new URLSearchParams();
    if (fiscalYear) q.set('fiscalYear', fiscalYear.toString());
    return apiFetch<any>(`/variance?${q}`);
  },

  // Reports / CSV Export (Sections 5 & 6)
  downloadReport: async (reportType: 'audit-trail' | 'compliance', params: {
    from?: string; to?: string; search?: string; actionType?: string; format?: string;
  }, filename: string) => {
    const q = new URLSearchParams();
    if (params.from)        q.set('from', params.from);
    if (params.to)          q.set('to', params.to);
    if (params.search)      q.set('search', params.search);
    if (params.actionType)  q.set('actionType', params.actionType);
    q.set('format', params.format ?? 'csv');

    const { tenantId, userId } = getUserInfo();
    const url = `${API_BASE}/reports/${reportType}?${q}`;
    const res = await fetch(url, {
      headers: {
        'X-Tenant-Id': tenantId,
        'X-User-Id': userId
      }
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
};
