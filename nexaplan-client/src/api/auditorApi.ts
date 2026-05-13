const API_BASE = 'http://nexaplan.runasp.net/api/auditor';

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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { headers: getHeaders(), ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

export const auditorApi = {
  // Audit Trail
  getLogs: (params?: { search?: string; actionType?: string; flaggedOnly?: boolean; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.actionType && params.actionType !== 'All') q.set('actionType', params.actionType);
    if (params?.flaggedOnly) q.set('flaggedOnly', 'true');
    if (params?.page) q.set('page', params.page.toString());
    return apiFetch<{ total: number; page: number; pageSize: number; logs: any[] }>(`/logs?${q}`);
  },
  getLogSummary: () => apiFetch<any>('/logs/summary'),
  flagLog: (id: number, reason: string) => apiFetch<any>(`/logs/${id}/flag`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unflagLog: (id: number) => apiFetch<any>(`/logs/${id}/unflag`, { method: 'POST', body: '{}' }),

  // Compliance
  getComplianceRules: () => apiFetch<any[]>('/compliance/rules'),
  runComplianceScan: () => apiFetch<any[]>('/compliance/scan'),
  createRule: (data: { name: string; ruleType: string; threshold: number; description?: string }) =>
    apiFetch<any>('/compliance/rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRule: (id: number, data: { name?: string; threshold?: number; isActive?: boolean }) =>
    apiFetch<any>(`/compliance/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRule: (id: number) => apiFetch<any>(`/compliance/rules/${id}`, { method: 'DELETE' }),

  // Financial Statements
  getStatements: () => apiFetch<any[]>('/statements'),
  logAccess: (id: number, type: 'View' | 'Download') =>
    apiFetch<any>(`/statements/${id}/access`, { method: 'POST', body: JSON.stringify({ accessType: type }) }),
  getAccessLog: (id: number) => apiFetch<any[]>(`/statements/${id}/access-log`),
};
