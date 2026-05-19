/**
 * Central auth helper — token storage + Authorization header injection.
 * All API files import getAuthHeaders() from here instead of duplicating logic.
 */

const TOKEN_KEY = 'token';
const USER_KEY  = 'user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(data: {
  token: string;
  userId: number;
  tenantId: number;
  roleId: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  sessionTimeoutMinutes: number;
  [key: string]: unknown;
}): void {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Returns headers including Bearer JWT token.
 * Pass the tenantId explicitly when the API requires it.
 */
export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token  = getStoredToken();
  const user   = getStoredUser();

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.tenantId != null ? { 'X-Tenant-Id': String(user.tenantId) } : {}),
    ...(user?.userId   != null ? { 'X-User-Id':   String(user.userId)   } : {}),
    ...extraHeaders,
  };
}
