import type { CreateActivityInput } from '../domain/types';
import type { ApiActivity, ApiThread, ApiUser, QiahaoApi } from './types';

export const AUTH_TOKEN_KEY = 'qiahao-auth-token';
export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); this.name = 'ApiError'; } }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const headers: Record<string, string> = { 'content-type': 'application/json', ...(init.headers as Record<string, string> | undefined) }; if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const body = await response.json() as { data?: T; error?: { code: string; message: string } };
  if (!response.ok) { if (response.status === 401) window.localStorage.removeItem(AUTH_TOKEN_KEY); throw new ApiError(response.status, body.error?.code ?? 'REQUEST_FAILED', body.error?.message ?? '请求失败'); }
  return body.data as T;
}
export const api: QiahaoApi = {
  async login(phone, password) { const data = await request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }); window.localStorage.setItem(AUTH_TOKEN_KEY, data.token); return data; },
  async logout() { await request<void>('/auth/logout', { method: 'POST' }); window.localStorage.removeItem(AUTH_TOKEN_KEY); },
  me: () => request<{ user: ApiUser }>('/me'),
  activities: () => request<{ activities: ApiActivity[] }>('/activities'),
  createActivity: (input: CreateActivityInput) => request<{ activity: ApiActivity }>('/activities', { method: 'POST', body: JSON.stringify(input) }),
  favorite: (id, saved) => request<{ saved: boolean }>(`/activities/${id}/favorite`, { method: saved ? 'PUT' : 'DELETE' }),
  join: (id) => request<{ thread: ApiThread }>(`/activities/${id}/join`, { method: 'POST' }),
  threads: () => request<{ threads: ApiThread[] }>('/threads'),
};
