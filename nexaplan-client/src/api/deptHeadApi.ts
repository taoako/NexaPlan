const API_BASE = 'https://nexaplan.runasp.net/api/dept-head';

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
  const res = await fetch(`${API_BASE}${url}`, {
    headers: getHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

export interface LineItemReq {
  description: string;
  quantity: number;
  unitCost: number;
  isVatInclusive?: boolean;
  justification?: string;
}

export interface ProposalReq {
  title: string;
  category: string;
  priority: string;
  priorityRank?: number;
  justification: string;
  plannedMonth?: string | null;
  plannedYear?: number;
  saveAsDraft: boolean;
  isTaxInclusive?: boolean;
  lineItems: LineItemReq[];
}

export const deptHeadApi = {
  getOverview: () => apiFetch<any>('/overview'),
  getAllocationGuard: () => apiFetch<any>('/allocations/guard'),
  getProposals: () => apiFetch<any[]>('/proposals'),
  createProposal: (data: ProposalReq) => apiFetch<any>('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  submitProposal: (id: number) => apiFetch<any>(`/proposals/${id}/submit`, { method: 'POST', body: '{}' }),
  deleteProposal: (id: number) => apiFetch<any>(`/proposals/${id}`, { method: 'DELETE' }),
  getLineItems: (id: number) => apiFetch<any[]>(`/proposals/${id}/line-items`),
  addLineItem: (id: number, data: any) => apiFetch<any>(`/proposals/${id}/line-items`, { method: 'POST', body: JSON.stringify(data) }),
  removeLineItem: (id: number, itemId: number) => apiFetch<any>(`/proposals/${id}/line-items/${itemId}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => apiFetch<any[]>('/expenses'),
  getApprovedProposals: () => apiFetch<any[]>('/proposals/approved'),
  submitExpense: (proposalId: number, amount: number, taxPaid?: number, receiptUrl?: string) => apiFetch<any>('/expenses', { method: 'POST', body: JSON.stringify({ proposalId, amount, taxPaid, receiptUrl }) }),

  cloneProposal: (id: number) => apiFetch<any>(`/proposals/${id}/clone`, { method: 'POST', body: '{}' }),
  getVariance: (period: string) => apiFetch<any>(`/variance?period=${period}`),
  getScenarios: () => apiFetch<any[]>('/scenarios'),
  getPreview: (multiplier: number) => apiFetch<any>(`/scenarios/preview?multiplier=${multiplier}`),
  getSpendingRisk: () => apiFetch<any>('/forecast/risk')
};
