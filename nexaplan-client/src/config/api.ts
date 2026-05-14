const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').toString();

export const API_BASE_URL = rawBase.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // If VITE_API_BASE_URL is not set, fall back to same-origin.
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

export function apiRoleBase(rolePath: string): string {
  return apiUrl(`/api/${rolePath.replace(/^\/+/, '')}`);
}
