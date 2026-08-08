import { AUTH_TOKEN_KEY, ApiError, request } from '../api/client';
import type { AppNotification } from './types';

type NotificationListResponse = { notifications: AppNotification[]; unreadCount: number };

export const notificationApi = {
  async list(): Promise<NotificationListResponse> {
    const data = await request<NotificationListResponse>('/notifications');
    return data;
  },
  markRead(id: string): Promise<{ notification: AppNotification }> {
    return request<{ notification: AppNotification }>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
  },
  clearRead(): Promise<{ archivedCount: number }> {
    return request<{ archivedCount: number }>('/notifications/read/archive', { method: 'POST' });
  },
};

export async function listenForNotifications({
  signal,
  onNotification,
  onArchive,
}: {
  signal: AbortSignal;
  onNotification: (notification: AppNotification) => void;
  onArchive?: (ids: string[]) => void;
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
        try {
          const event = JSON.parse(data) as { type?: string; notification?: AppNotification; ids?: string[] };
          if (event.type === 'archive') onArchive?.(event.ids ?? []);
          else if (event.notification) onNotification(event.notification);
          else onNotification(event as AppNotification);
        } catch { /* Ignore malformed push payloads. */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
