import type { NotificationState } from './types';

export const NOTIFICATION_STORAGE_KEY = 'qiahao-notifications-v2';

function keyForUser(userId: string): string {
  return `${NOTIFICATION_STORAGE_KEY}:${encodeURIComponent(userId)}`;
}

export function readNotificationState(userId = 'local-user'): NotificationState | null {
  try {
    const raw = window.localStorage.getItem(keyForUser(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NotificationState>;
    return { notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [] };
  } catch {
    return null;
  }
}

export function writeNotificationState(state: NotificationState, userId = 'local-user'): void {
  try {
    window.localStorage.setItem(keyForUser(userId), JSON.stringify(state));
  } catch {
    // Keep the in-memory notification state when browser storage is unavailable.
  }
}

export function clearNotificationState(userId: string): void {
  try { window.localStorage.removeItem(keyForUser(userId)); } catch { /* Storage is optional. */ }
}
