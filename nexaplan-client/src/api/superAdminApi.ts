import { apiRoleBase, apiUrl } from '../config/api';

const API_BASE = apiRoleBase('super-admin');

// ─── Generic fetch wrapper ───
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

// ─── Types matching backend DTOs ───
export interface TenantDto {
  tenantID: number;
  companyName: string;
  subscriptionTier: string;
  orgType: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  isActive: boolean;
  isArchived: boolean;
  registrationStatus: string;
  userCount: number;
  mrr: number;
  status: string;
  statusColor: string;
  createdAt: string;
}

export interface AdminDto {
  userID: number;
  name: string;
  email: string;
  org: string;
  mfaEnabled: boolean;
  isLocked: boolean;
  lastLogin: string;
  status: string;
}

export interface TrialDto {
  trialRequestID: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  reviewNotes: string;
  riskLevel: string;
  submittedAt: string;
}

export interface InvoiceDto {
  invoiceID: number;
  invoiceNumber: string;
  tenantID: number;
  tenantName: string;
  amount: number;
  paymentMethod: string;
  payMongoPaymentIntentId: string;
  dueDate: string;
  status: string;
  statusColor: string;
}

export interface SummaryDto {
  totalTenants: number;
  activeTenants: number;
  trialAccounts: number;
  overdueAccounts: number;
  totalMrr: number;
  totalAdmins: number;
  mfaEnabledAdmins: number;
  lockedAdmins: number;
  pendingTrials: number;
  totalInvoices: number;
  overdueAmount: number;
}

// ─── Dashboard ───
export const getSummary = () => apiFetch<SummaryDto>('/summary');

// ─── Tenants ───
export const getTenants = (search?: string) =>
  apiFetch<TenantDto[]>(`/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const provisionTenant = (data: {
  orgName: string; orgType: string;
  adminFirstName: string; adminLastName: string;
  adminEmail: string; tier: string;
}) => apiFetch<{ message: string; tenantId: number; tempPassword: string }>('/tenants', {
  method: 'POST', body: JSON.stringify(data),
});

export const updateTenant = (id: number, data: {
  companyName: string; contactPerson: string;
  contactEmail: string; phone: string;
  subscriptionTier: string; registrationStatus: string;
}) => apiFetch<{ message: string }>(`/tenants/${id}`, {
  method: 'PUT', body: JSON.stringify(data),
});

export const archiveTenant = (id: number) =>
  apiFetch<{ message: string }>(`/tenants/${id}`, { method: 'DELETE' });

export const impersonateTenant = (id: number) =>
  apiFetch<{ token: string; email: string; tenantId: number; role: string }>(`/tenants/${id}/impersonate`, { method: 'POST' });

// ─── Admins ───
export const getAdmins = () => apiFetch<AdminDto[]>('/admins');

export const createAdmin = (data: {
  firstName: string; lastName: string; email: string; org: string;
}) => apiFetch<{ message: string; userId: number; tempPassword: string }>('/admins', {
  method: 'POST', body: JSON.stringify(data),
});

export const updateAdmin = (id: number, data: {
  name: string; email: string; org: string;
}) => apiFetch<{ message: string }>(`/admins/${id}`, {
  method: 'PUT', body: JSON.stringify(data),
});

export const lockAdmin = (id: number) =>
  apiFetch<{ message: string }>(`/admins/${id}/lock`, { method: 'PUT' });

export const unlockAdmin = (id: number, resetPassword = false) =>
  apiFetch<{ message: string; newPassword?: string }>(`/admins/${id}/unlock?resetPassword=${resetPassword}`, { method: 'PUT' });

// ─── Trial Requests ───
export const getTrialRequests = () => apiFetch<TrialDto[]>('/trial-requests');

export const approveTrialRequest = (id: number, notes?: string) =>
  apiFetch<{ message: string; tempPassword?: string }>(`/trial-requests/${id}/approve`, {
    method: 'PUT', body: JSON.stringify({ notes }),
  });

export const rejectTrialRequest = (id: number, notes?: string) =>
  apiFetch<{ message: string }>(`/trial-requests/${id}/reject`, {
    method: 'PUT', body: JSON.stringify({ notes }),
  });

// ─── Invoices ───
export const getInvoices = () => apiFetch<InvoiceDto[]>('/invoices');

export const syncInvoices = () => apiFetch<{ message: string }>('/invoices/sync', { method: 'POST' });

export const refundInvoice = (id: number, partialAmount?: number) =>
  apiFetch<{ message: string }>(`/invoices/${id}/refund${partialAmount ? `?partialAmount=${partialAmount}` : ''}`, { method: 'PUT' });

// ─── System Config ───
export const getConfig = () => apiFetch<Record<string, string>>('/config');

export const updateConfig = (updates: Record<string, string>) =>
  apiFetch<{ message: string }>('/config', {
    method: 'PUT', body: JSON.stringify(updates),
  });

// ─── Pricing (public + admin) ───
export interface PricingBenefit {
  benefitID: number;
  benefitText: string;
  isIncluded: boolean;
}

export interface PricingPlan {
  planID: number;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  maxSeats: number;
  isPopular: boolean;
  isActive: boolean;
  benefits: PricingBenefit[];
}

export interface PricingConfig {
  price_starter_monthly: string;
  price_starter_annual: string;
  price_professional_monthly: string;
  price_professional_annual: string;
  price_enterprise_monthly: string;
  price_enterprise_annual: string;
  pricing_vat_inclusive: string;
}

async function pricingFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(`/api${url}`), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

export const getPricing = (): Promise<PricingPlan[]> =>
  pricingFetch<PricingPlan[]>('/pricing');

export const savePricing = (data: PricingConfig) =>
  pricingFetch<{ message: string }>('/pricing', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// ─── Super Admin Pricing CRUD ───
export const getPricingPlans = () => apiFetch<PricingPlan[]>('/pricing-plans');

export const createPricingPlan = (plan: Partial<PricingPlan>) =>
  apiFetch<PricingPlan>('/pricing-plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  });

export const updatePricingPlan = (id: number, plan: Partial<PricingPlan>) =>
  apiFetch<PricingPlan>(`/pricing-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(plan),
  });

export const deletePricingPlan = (id: number) =>
  apiFetch<{ message: string }>(`/pricing-plans/${id}`, {
    method: 'DELETE',
  });
