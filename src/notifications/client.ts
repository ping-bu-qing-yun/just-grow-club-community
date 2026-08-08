import { AUTH_TOKEN_KEY, ApiError } from '../api/client';
import type { AppNotification } from './types';

type NotificationListResponse = { notifications: AppNotification[] };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body) headers['content-type'] = 'application/json';
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (response.status === 204) return undefined as T;
  const body = await response.json() as { data?: T; error?: { code?: string; message?: string } };
  if (!response.ok) throw new ApiError(response.status, body.error?.code ?? 'REQUEST_FAILED', body.error?.message ?? '通知请求失败');
  return body.data as T;
}

export const notificationApi = {
  async list(): Promise<AppNotification[]> {
    const data = await request<NotificationListResponse>('/notifications');
    return data.notifications;
  },
  markRead(id: string): Promise<void> {
    return request<void>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },
  clearRead(): Promise<void> {
    return request<void>('/notifications/read', { method: 'DELETE' });
  },
};

export async function listenForNotifications({
  signal,
  onNotification,
}: {
  signal: AbortSignal;
  onNotification: (notification: AppNotification) => void;
}): Promise<void> {
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  const response = await fetch('/api/notifications/stream', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal,
  });
  if (!response.ok || !response.body) throw new ApiError(response.status, 'NOTIFICATION_STREAM_FAILED', '通知实时连接失败');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const data = block.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('');
        if (!data) continue;
        try { onNotification(JSON.parse(data) as AppNotification); } catch { /* Ignore malformed push payloads. */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
