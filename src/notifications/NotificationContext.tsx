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
  return [...items].filter((item) => !item.archivedAt).sort((left, right) => {
    const rightTime = Date.parse(right.createdAt);
    const leftTime = Date.parse(left.createdAt);
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

function mergeIncoming(items: AppNotification[], incoming: AppNotification): AppNotification[] {
  return newestFirst([incoming, ...items.filter((item) => item.id !== incoming.id)]);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status: appStatus, user } = useQiahao();
  const localMode = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
  const userId = user?.id ?? 'local-user';
  const [state, setState] = useState<NotificationState>(() => {
    if (localMode) return readNotificationState(userId) ?? { notifications: seedNotifications };
    return { notifications: [] };
  });
  const [status, setStatus] = useState<NotificationLoadState>(localMode || appStatus !== 'authenticated' ? 'ready' : 'loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localMode && appStatus !== 'authenticated') {
      setState({ notifications: [] });
      setStatus('ready');
      setError(null);
      return;
    }
    const cached = readNotificationState(userId);
    setState(cached ?? { notifications: localMode ? seedNotifications : [] });
    setStatus(localMode ? 'ready' : 'loading');
    setError(null);
  }, [appStatus, localMode, userId]);

  useEffect(() => {
    if (appStatus === 'authenticated' || localMode) writeNotificationState(state, userId);
  }, [appStatus, localMode, state, userId]);

  const refresh = useCallback(async () => {
    if (localMode || appStatus !== 'authenticated') {
      setStatus('ready');
      return;
    }
    setStatus('loading');
    try {
      const response = await notificationApi.list();
      setState({ notifications: newestFirst(response.notifications) });
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
    let retryDelay = 1_000;

    const connect = async () => {
      try {
        await listenForNotifications({
          signal: controller.signal,
          onNotification: (notification) => {
            setState((current) => ({ notifications: mergeIncoming(current.notifications, notification) }));
            setStatus('ready');
            setError(null);
            retryDelay = 1_000;
          },
          onArchive: (ids) => setState((current) => ({ notifications: current.notifications.filter((item) => !ids.includes(item.id)) })),
        });
        if (!controller.signal.aborted) void refresh();
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : '通知实时连接已断开');
        setStatus('error');
      }
      if (!stopped && !controller.signal.aborted) {
        retryTimer = window.setTimeout(() => void connect(), retryDelay);
        retryDelay = Math.min(30_000, retryDelay * 2);
      }
    };

    void connect();
    return () => {
      stopped = true;
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [appStatus, localMode, refresh]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications: state.notifications,
    unreadCount: state.notifications.filter((notification) => !notification.read && !notification.archivedAt).length,
    status,
    error,
    markRead(id) {
      const target = state.notifications.find((notification) => notification.id === id);
      if (!target || target.read || target.archivedAt) return;
      const readAt = new Date().toISOString();
      setState((current) => ({ notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, read: true, readAt } : notification) }));
      if (!localMode) void notificationApi.markRead(id).then(({ notification }) => setState((current) => ({ notifications: mergeIncoming(current.notifications, notification) }))).catch((reason) => setError(reason instanceof Error ? reason.message : '标记已读失败'));
    },
    clearRead() {
      const readIds = state.notifications.filter((notification) => notification.read && !notification.archivedAt).map((notification) => notification.id);
      if (!readIds.length) return;
      setState((current) => ({ notifications: current.notifications.filter((notification) => !readIds.includes(notification.id)) }));
      if (!localMode) void notificationApi.clearRead().catch((reason) => { setError(reason instanceof Error ? reason.message : '归档已读失败'); });
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
