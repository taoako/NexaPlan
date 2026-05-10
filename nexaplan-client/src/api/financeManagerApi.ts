const API_BASE = 'http://localhost:5189/api/finance-manager';

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

export const financeManagerApi = {
  getProposals: () => apiFetch<any[]>('/proposals'),
  approveProposal: (id: number, rejectedLineItemIds?: number[]) => apiFetch<any>(`/proposals/${id}/approve`, { method: 'POST', body: JSON.stringify({ rejectedLineItemIds: rejectedLineItemIds || [] }) }),
  rejectProposal: (id: number, notes: string) => apiFetch<any>(`/proposals/${id}/reject`, { method: 'POST', body: JSON.stringify({ notes }) }),
  requestChanges: (id: number, notes: string) => apiFetch<any>(`/proposals/${id}/request-changes`, { method: 'POST', body: JSON.stringify({ notes }) }),
  getScenarios: () => apiFetch<any[]>('/scenarios'),
  createScenario: (name: string, multiplier: number, desc?: string) => apiFetch<any>('/scenarios', { method: 'POST', body: JSON.stringify({ name, multiplier, desc }) }),
  activateScenario: (id: number) => apiFetch<any>(`/scenarios/${id}/activate`, { method: 'POST', body: '{}' }),
  getAllocations: () => apiFetch<any>('/allocations'),
  transferFunds: (from: string, to: string, amount: number) => apiFetch<any>('/allocations/transfer', { method: 'POST', body: JSON.stringify({ from, to, amount }) }),
  setAllocation: (departmentId: number, amount: number) => apiFetch<any>('/allocations/set', { method: 'POST', body: JSON.stringify({ departmentId, amount }) }),
  // Expense Reconciliation
  getExpenses: (status?: string) => apiFetch<any[]>(`/expenses${status ? `?status=${status}` : ''}`),
  reconcileExpense: (id: number) => apiFetch<any>(`/expenses/${id}/reconcile`, { method: 'POST', body: '{}' }),
  rejectExpense: (id: number, reason: string) => apiFetch<any>(`/expenses/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
};

// ── Forecast types ───────────────────────────────────────────────────────────

export interface MonthForecast {
  month:             string;
  budgetedAmount:    number;
  predictedSpending: number;
  variancePct:       number;
  riskLevel:         'Low' | 'Medium' | 'High';
}

export interface DeptForecast {
  departmentId:     number;
  departmentName:   string;
  annualBudget:     number;
  actualSpent:      number;
  monthlyForecasts: MonthForecast[];
}

export interface ForecastInsight {
  type:        string;
  title:       string;
  description: string;
  confidence:  string;
}

export interface ForecastSummary {
  projectedEOY:      number;
  totalAnnualBudget: number;
  variancePct:       number;
  depletionRisk:     'Low' | 'Medium' | 'High';
  modelAccuracy:     number;
  departments:       DeptForecast[];
  insights:          ForecastInsight[];
}

// ── API call ─────────────────────────────────────────────────────────────────

export const getForecastSummary = (
  fiscalYear: number = 2026
): Promise<ForecastSummary> =>
  apiFetch<ForecastSummary>(`/forecast?fiscalYear=${fiscalYear}`);

