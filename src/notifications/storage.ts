import type { NotificationState } from './types';

export const NOTIFICATION_STORAGE_KEY = 'qiahao-notifications-v1';

export function readNotificationState(): NotificationState | null {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NotificationState>;
    return { notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [] };
  } catch {
    return null;
  }
}

export function writeNotificationState(state: NotificationState): void {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Keep the in-memory notification state when browser storage is unavailable.
  }
}
