import { apiRoleBase } from '../config/api';

const API_BASE = apiRoleBase('main-admin');

// ─── Generic fetch wrapper with tenant header ───
async function apiFetch<T>(url: string, tenantId: number, options?: RequestInit): Promise<T> {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': String(tenantId),
      'X-User-Id': user?.userId?.toString() || '',
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `API Error ${res.status}`);
  }
  return res.json();
}

// ─── Types ───
export interface MainAdminUser {
  userId: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  department: string;
  departmentId: number | null;
  status: 'Active' | 'Pending' | 'Suspended';
  isLocked: boolean;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLogin: string;
  lastTempPassword: string | null;
}

export interface MainAdminDepartment {
  departmentId: number;
  name: string;
  headUserId: number | null;
  headName: string;
  memberCount: number;
  budgetCap: number;
  budgetAccess: boolean;
}

export interface MainAdminSummary {
  tenantName: string;
  orgType: string;
  subscriptionTier: string;
  activeUsers: number;
  totalSeats: number;
  totalDepartments: number;
  roleDistribution: { roleId: number; roleName: string; count: number }[];
  mfaEnabled: boolean;
  nextBillingDate: string | null;
  recentActivity: { logId: number; action: string; target: string; time: string }[];
  departments: { departmentId: number; name: string; headName: string; memberCount: number; budgetCap: number; budgetAccess: boolean }[];
}

export interface MainAdminSettings {
  settingsId: number;
  fiscalYearStartMonth: number;
  defaultCurrency: string;
  requireMfa: boolean;
  totalCompanyBudget: number;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
}

export interface MainAdminLog {
  logId: number;
  action: string;
  target: string;
  userName: string;
  ip: string;
  time: string;
  type: 'info' | 'warning' | 'success';
}

export interface MainAdminBilling {
  plan: string;
  status: string;
  nextBillingDate: string | null;
  daysUntilDue: number | null;
  invoices: {
    invoiceId: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string;
    paymentMethod: string;
  }[];
}

export interface RoleOption {
  roleId: number;
  roleName: string;
  requiresDepartment: boolean;
}

// ─── Summary ───
export const getSummary = (tenantId: number) => apiFetch<MainAdminSummary>('/summary', tenantId);

// ─── Users ───
export const getUsers = (tenantId: number) => apiFetch<MainAdminUser[]>('/users', tenantId);

export const createUser = (tenantId: number, data: {
  name: string; email: string; roleId: number; departmentId: number; requestedByUserId: number;
}) => apiFetch<{ message: string; userId: number; tempPassword: string }>('/users', tenantId, {
  method: 'POST', body: JSON.stringify(data),
});

export const updateUser = (tenantId: number, id: number, data: {
  name: string; email: string; roleId: number; departmentId: number; requestedByUserId: number; tempPassword?: string;
}) => apiFetch<{ message: string }>(`/users/${id}`, tenantId, {
  method: 'PUT', body: JSON.stringify(data),
});

export const suspendUser = (tenantId: number, id: number) =>
  apiFetch<{ message: string }>(`/users/${id}/suspend`, tenantId, { method: 'PUT' });

export const activateUser = (tenantId: number, id: number) =>
  apiFetch<{ message: string }>(`/users/${id}/activate`, tenantId, { method: 'PUT' });

export const deleteUser = (tenantId: number, id: number) =>
  apiFetch<{ message: string }>(`/users/${id}`, tenantId, { method: 'DELETE' });

export const bulkAction = (tenantId: number, userIds: number[], action: string, roleId?: number) =>
  apiFetch<{ message: string }>('/users/bulk-action', tenantId, {
    method: 'POST', body: JSON.stringify({ userIds, action, roleId }),
  });

// ─── Departments ───
export const getDepartments = (tenantId: number) =>
  apiFetch<{ departments: MainAdminDepartment[]; label: string }>('/departments', tenantId);

export const createDepartment = (tenantId: number, data: { name: string; headUserId: number; budgetCap: number }) =>
  apiFetch<{ message: string; departmentId: number }>('/departments', tenantId, {
    method: 'POST', body: JSON.stringify(data),
  });

export const updateDepartment = (tenantId: number, id: number, data: { name: string; headUserId: number; budgetCap: number }) =>
  apiFetch<{ message: string }>(`/departments/${id}`, tenantId, {
    method: 'PUT', body: JSON.stringify(data),
  });

export const deleteDepartment = (tenantId: number, id: number) =>
  apiFetch<{ message: string }>(`/departments/${id}`, tenantId, { method: 'DELETE' });

// ─── Roles ───
export const getRoles = (tenantId: number) => apiFetch<RoleOption[]>('/roles', tenantId);

// ─── Settings ───
export const getSettings = (tenantId: number) => apiFetch<MainAdminSettings>('/settings', tenantId);

export const updateSettings = (tenantId: number, data: Partial<MainAdminSettings>) =>
  apiFetch<{ message: string }>('/settings', tenantId, {
    method: 'PUT', body: JSON.stringify(data),
  });

export const getBudget = (tenantId: number) => apiFetch<{ totalCompanyBudget: number }>('/budget', tenantId);

export const updateBudget = (tenantId: number, totalCompanyBudget: number) =>
  apiFetch<{ message: string }>('/budget', tenantId, {
    method: 'PUT', body: JSON.stringify({ totalCompanyBudget }),
  });

// ─── Logs ───
export const getLogs = (tenantId: number, params?: { search?: string; type?: string; from?: string; to?: string }) => {
  const q = new URLSearchParams();
  if (params?.search) q.set('search', params.search);
  if (params?.type) q.set('type', params.type);
  if (params?.from) q.set('from', params.from);
  if (params?.to) q.set('to', params.to);
  return apiFetch<MainAdminLog[]>(`/logs?${q.toString()}`, tenantId);
};

// ─── Billing ───
export const getBilling = (tenantId: number) => apiFetch<MainAdminBilling>('/billing', tenantId);

export const upgradePlan = (tenantId: number, action: string, newTier?: string) =>
  apiFetch<{ checkoutUrl: string; message: string }>('/billing/upgrade', tenantId, {
    method: 'POST', body: JSON.stringify({ action, newTier }),
  });

export const cancelPlan = (tenantId: number) =>
  apiFetch<{ message: string }>('/billing/cancel', tenantId, { method: 'POST', body: '{}' });
