const defaultProdBase = import.meta.env.PROD ? 'https://nexaplan-api.onrender.com' : '';
const rawBase = (import.meta.env.VITE_API_BASE_URL ?? defaultProdBase).toString();

export const API_BASE_URL = rawBase.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // If VITE_API_BASE_URL is not set, fall back to same-origin.
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

export function apiRoleBase(rolePath: string): string {
  return apiUrl(`/api/${rolePath.replace(/^\/+/, '')}`);
}
