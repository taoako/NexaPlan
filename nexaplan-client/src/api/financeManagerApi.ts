import { apiRoleBase } from '../config/api';

const API_BASE = apiRoleBase('finance-manager');

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
  getScenarioPitches: (id: number) => apiFetch<any[]>(`/scenarios/${id}/pitches`),
  acknowledgePitch: (pitchId: number) => apiFetch<any>(`/scenarios/pitches/${pitchId}/acknowledge`, { method: 'POST', body: '{}' }),
  getAllocations: () => apiFetch<any>('/allocations'),
  transferFunds: (from: string, to: string, amount: number) => apiFetch<any>('/allocations/transfer', { method: 'POST', body: JSON.stringify({ from, to, amount }) }),
  setAllocation: (departmentId: number, amount: number) => apiFetch<any>('/allocations/set', { method: 'POST', body: JSON.stringify({ departmentId, amount }) }),
  adjustAllocation: (departmentId: number, amount: number, mode: 'add' | 'subtract' | 'set') => apiFetch<any>('/allocations/adjust', { method: 'POST', body: JSON.stringify({ departmentId, amount, mode }) }),
  // Expense Reconciliation
  getExpenses: (status?: string) => apiFetch<any[]>(`/expenses${status ? `?status=${status}` : ''}`),
  reconcileExpense: (id: number, spentDate?: string) => apiFetch<any>(`/expenses/${id}/reconcile`, { method: 'POST', body: JSON.stringify({ spentDate: spentDate || null }) }),
  rejectExpense: (id: number, reason: string) => apiFetch<any>(`/expenses/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getTrendForecast: (fiscalYear: number) => apiFetch<any>(`/forecast?fiscalYear=${fiscalYear}`),
  getStatements: () => apiFetch<any[]>('/statements'),
  generateStatement: (title: string, statementType: string, fiscalYear: number) => apiFetch<any>('/statements/generate', { method: 'POST', body: JSON.stringify({ title, statementType, fiscalYear }) }),
};

// ── Forecast types ───────────────────────────────────────────────────────────

export interface MonthForecast {
  month: string;
  budgetedAmount: number;
  actualSpent: number;
  predictedSpending: number;
  variancePct: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  mlPredictedSpending: number;
  mlRiskLevel: 'Low' | 'Medium' | 'High';
  mlUpperBound: number;
  mlLowerBound: number;
  mlConfidenceNote: string;
}

export interface DeptForecast {
  departmentId: number;
  departmentName: string;
  annualBudget: number;
  actualSpent: number;
  monthlyForecasts: MonthForecast[];
}

export interface ForecastInsight {
  type: string;
  title: string;
  description: string;
  confidence: string;
}

export interface ForecastSummary {
  projectedEOY: number;
  totalAnnualBudget: number;
  variancePct: number;
  depletionRisk: 'Low' | 'Medium' | 'High';
  modelAccuracy: number;
  departments: DeptForecast[];
  insights: ForecastInsight[];
}

// ── API call ─────────────────────────────────────────────────────────────────

let forecastCache: Record<string, { data: ForecastSummary, timestamp: number }> = {};
const CACHE_TTL = 300000; // 5 mins

export const getForecastSummary = async (
  fiscalYear: number = 2026,
  force: boolean = false
): Promise<ForecastSummary> => {
  const key = `${fiscalYear}`;
  if (!force && forecastCache[key] && Date.now() - forecastCache[key].timestamp < CACHE_TTL) {
    return forecastCache[key].data;
  }
  const data = await apiFetch<ForecastSummary>(`/forecast?fiscalYear=${fiscalYear}`);
  forecastCache[key] = { data, timestamp: Date.now() };
  return data;
};

// ── Variance types ──────────────────────────────────────────────────────────

export interface MonthlyVariance {
  month: string;
  budgetedAmount: number;
  actualSpent: number;
  varianceAmount: number;
  variancePct: number;
}

export interface DeptVariance {
  departmentId: number;
  departmentName: string;
  budgetedAmount: number;
  actualSpent: number;
  varianceAmount: number;
  variancePct: number;
  status: 'Over' | 'Under';
  monthlyBreakdown: MonthlyVariance[];
  mlExpectedSpending: number;   // RF model prediction
  isAnomaly: boolean;  // actual >> ML expected
  mlConfidenceNote: string;
}

export interface VarianceSummary {
  fiscalYear: number;
  selectedMonth: string;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  departments: DeptVariance[];
}

let varianceCache: Record<string, { data: VarianceSummary, timestamp: number }> = {};

export const getVarianceData = async (
  fiscalYear: number = 2026,
  month?: string,
  force: boolean = false
): Promise<VarianceSummary> => {
  const params = new URLSearchParams({ fiscalYear: String(fiscalYear) });
  if (month && month !== 'ALL') params.append('month', month);
  const key = params.toString();

  if (!force && varianceCache[key] && Date.now() - varianceCache[key].timestamp < CACHE_TTL) {
    return varianceCache[key].data;
  }
  const data = await apiFetch<VarianceSummary>(`/variance?${key}`);
  varianceCache[key] = { data, timestamp: Date.now() };
  return data;
};

