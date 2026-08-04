'use client';

const TOKEN_KEY = 'token';
const EXPIRES_KEY = 'tokenExpiresAt';

export const saveToken = (token: string, expiresAt: number): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
};

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  const exp = Number(localStorage.getItem(EXPIRES_KEY) ?? 0);
  // exp is Unix epoch seconds
  return exp > Math.floor(Date.now() / 1000);
};

/** Reads the `sub` claim from the JWT payload without a library. */
export const getUsername = (): string => {
  const token = getToken();
  if (!token) return 'User';
  try {
    // JWT = header.payload.signature — each part is base64url encoded
    const payloadB64 = token.split('.')[1] ?? '';
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { sub?: string };
    return payload.sub ?? 'User';
  } catch {
    return 'User';
  }
};
