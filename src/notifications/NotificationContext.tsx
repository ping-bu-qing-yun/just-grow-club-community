import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQiahao } from '../state/QiahaoContext';
import { listenForNotifications, notificationApi } from './client';
import { seedNotifications } from './seed';
import { readNotificationState, writeNotificationState } from './storage';
import type { AppNotification, NotificationState } from './types';

export type NotificationLoadState = 'loading' | 'ready' | 'error';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  status: NotificationLoadState;
  error: string | null;
  markRead(id: string): void;
  clearRead(): void;
  refresh(): Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function newestFirst(items: AppNotification[]): AppNotification[] {
  return [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function mergeIncoming(items: AppNotification[], incoming: AppNotification): AppNotification[] {
  return newestFirst([incoming, ...items.filter((item) => item.id !== incoming.id)]);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status: appStatus } = useQiahao();
  const localMode = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
  const [state, setState] = useState<NotificationState>(() => readNotificationState() ?? { notifications: seedNotifications });
  const [status, setStatus] = useState<NotificationLoadState>(localMode ? 'ready' : 'loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => writeNotificationState(state), [state]);

  const refresh = useCallback(async () => {
    if (localMode || appStatus !== 'authenticated') {
      if (localMode) setStatus('ready');
      return;
    }
    setStatus('loading');
    try {
      const notifications = await notificationApi.list();
      setState({ notifications: newestFirst(notifications) });
      setError(null);
      setStatus('ready');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '暂时无法加载通知');
      setStatus('error');
    }
  }, [appStatus, localMode]);

  useEffect(() => {
    if (!localMode && appStatus === 'authenticated') void refresh();
  }, [appStatus, localMode, refresh]);

  useEffect(() => {
    if (localMode || appStatus !== 'authenticated') return;
    const controller = new AbortController();
    let retryTimer: number | undefined;
    let stopped = false;

    const connect = async () => {
      try {
        await listenForNotifications({
          signal: controller.signal,
          onNotification: (notification) => {
            setState((current) => ({ notifications: mergeIncoming(current.notifications, notification) }));
            setStatus('ready');
            setError(null);
          },
        });
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : '通知实时连接已断开');
        setStatus('error');
      }
      if (!stopped && !controller.signal.aborted) retryTimer = window.setTimeout(connect, 5_000);
    };

    void connect();
    return () => {
      stopped = true;
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [appStatus, localMode]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications: state.notifications,
    unreadCount: state.notifications.filter((notification) => !notification.read).length,
    status,
    error,
    markRead(id) {
      const target = state.notifications.find((notification) => notification.id === id);
      if (!target || target.read) return;
      setState((current) => ({ notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, read: true } : notification) }));
      if (!localMode) void notificationApi.markRead(id).catch((reason) => { setError(reason instanceof Error ? reason.message : '标记已读失败'); });
    },
    clearRead() {
      if (!state.notifications.some((notification) => notification.read)) return;
      setState((current) => ({ notifications: current.notifications.filter((notification) => !notification.read) }));
      if (!localMode) void notificationApi.clearRead().catch((reason) => { setError(reason instanceof Error ? reason.message : '清空已读失败'); });
    },
    refresh,
  }), [error, localMode, refresh, state.notifications, status]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationsProvider');
  return value;
}
