import { apiRoleBase } from '../config/api';
import { getAuthHeaders } from '../config/auth';

const API_BASE = apiRoleBase('dept-head');

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: getAuthHeaders(),
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

// ── Scenario Planning Types ───────────────────────────────────────────────────

export interface ScenarioSummary {
  scenarioId:           number;
  title:                string;
  adjustmentMultiplier: number;
  isActive:             boolean;
  isArchived:           boolean;
}

export interface ProposalImpact {
  proposalId:      number;
  title:           string;
  requestedAmount: number;
  priorityRank:    number;
  status:          string;
  scenarioStatus:  'Survives' | 'AtRisk';
}

export interface ScenarioImpactResult {
  currentBudget:        number;
  scenarioBudget:       number;
  adjustmentMultiplier: number;
  gap:                  number;
  totalSurviving:       number;
  totalAtRisk:          number;
  proposals:            ProposalImpact[];
}

export interface PitchDecision {
  proposalId: number;
  decision:   'Keep' | 'Defer' | 'Cut';
}

export interface ScenarioPitchRequest {
  scenarioId?:       number | null;
  customMultiplier:  number;
  pitchTitle:        string;
  justification:     string;
  proposalDecisions: PitchDecision[];
}

export interface SubmittedPitch {
  pitchId:       number;
  pitchTitle:    string;
  scenarioTitle: string;
  submittedAt:   string;
  status:        string;
  justification: string;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const deptHeadApi = {
  getOverview:        () => apiFetch<any>('/overview'),
  getAllocationGuard: () => apiFetch<any>('/allocations/guard'),
  getProposals:       () => apiFetch<any[]>('/proposals'),
  createProposal:     (data: ProposalReq) => apiFetch<any>('/proposals', { method: 'POST', body: JSON.stringify(data) }),
  updateProposal:     (id: number, data: ProposalReq) => apiFetch<any>(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitProposal:     (id: number) => apiFetch<any>(`/proposals/${id}/submit`, { method: 'POST', body: '{}' }),
  deleteProposal:     (id: number) => apiFetch<any>(`/proposals/${id}`, { method: 'DELETE' }),
  getLineItems:       (id: number) => apiFetch<any[]>(`/proposals/${id}/line-items`),
  addLineItem:        (id: number, data: any) => apiFetch<any>(`/proposals/${id}/line-items`, { method: 'POST', body: JSON.stringify(data) }),
  removeLineItem:     (id: number, itemId: number) => apiFetch<any>(`/proposals/${id}/line-items/${itemId}`, { method: 'DELETE' }),

  // Expenses
  getExpenses:        () => apiFetch<any[]>('/expenses'),
  getApprovedProposals: () => apiFetch<any[]>('/proposals/approved'),
  submitExpense:      (proposalId: number, amount: number, taxPaid?: number, receiptUrl?: string) =>
    apiFetch<any>('/expenses', { method: 'POST', body: JSON.stringify({ proposalId, amount, taxPaid, receiptUrl }) }),

  cloneProposal: (id: number) => apiFetch<any>(`/proposals/${id}/clone`, { method: 'POST', body: '{}' }),
  getVariance:   (period: string) => apiFetch<any>(`/variance?period=${period}`),
  getSpendingRisk: () => apiFetch<any>('/forecast/risk'),

  // Scenarios
  getScenarios:    () => apiFetch<ScenarioSummary[]>('/scenarios'),
  getPreview:      (multiplier: number) => apiFetch<any>(`/scenarios/preview?multiplier=${multiplier}`),
  getActiveScenario: () => apiFetch<ScenarioSummary>('/scenarios/active'),

  // NEW — Scenario Planning
  getScenarioImpact: (multiplier: number, fiscalYear: number) =>
    apiFetch<ScenarioImpactResult>(`/scenarios/impact?multiplier=${multiplier}&fiscalYear=${fiscalYear}`),

  submitScenarioPitch: (payload: ScenarioPitchRequest) =>
    apiFetch<{ success: boolean; pitchId: number }>('/scenarios/pitch', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  getMyPitches: () => apiFetch<SubmittedPitch[]>('/scenarios/pitches'),
};
