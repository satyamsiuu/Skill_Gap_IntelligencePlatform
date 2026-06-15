/**
 * SGIP — Frontend Auth API Client
 * Ticket: SGIP-2.1.1.3 / SGIP-2.1.2.4
 *
 * Typed auth-specific API calls using the shared apiClient.
 * These functions are called from TanStack Query mutations in auth hooks.
 */

// ── Types (inline for Phase 2 — will be auto-generated in future) ─────────────

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface MessageResponse {
  message: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

export interface SessionItem {
  id: string;
  createdAt: string;
  expiresAt: string;
  deviceInfo?: string;
  ipAddress?: string;
}

// ── Auth API Functions ─────────────────────────────────────────────────────────

export async function registerUser(data: {
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const res = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok)
    throw new Error(
      (json as { error?: { message?: string } })?.error?.message ?? 'Registration failed',
    );
  return json as RegisterResponse;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthTokenResponse> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include httpOnly cookie on response
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok)
    throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Login failed');
  return json as AuthTokenResponse;
}

export async function verifyEmail(token: string): Promise<MessageResponse> {
  const res = await fetch('/api/v1/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok)
    throw new Error(
      (json as { error?: { message?: string } })?.error?.message ?? 'Verification failed',
    );
  return json as MessageResponse;
}

export async function forgotPassword(email: string): Promise<MessageResponse> {
  const res = await fetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = (await res.json()) as unknown;
  return json as MessageResponse; // Always returns generic message
}

export async function resetPassword(data: {
  token: string;
  newPassword: string;
}): Promise<MessageResponse> {
  const res = await fetch('/api/v1/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = (await res.json()) as unknown;
  if (!res.ok)
    throw new Error((json as { error?: { message?: string } })?.error?.message ?? 'Reset failed');
  return json as MessageResponse;
}

export async function logoutUser(): Promise<MessageResponse> {
  const res = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  const json = (await res.json()) as unknown;
  return json as MessageResponse;
}

export async function listSessions(): Promise<SessionItem[]> {
  const res = await fetch('/api/v1/auth/sessions', {
    credentials: 'include',
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return json as SessionItem[];
}

export async function revokeSession(sessionId: string): Promise<MessageResponse> {
  const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) throw new Error('Failed to revoke session');
  return json as MessageResponse;
}
