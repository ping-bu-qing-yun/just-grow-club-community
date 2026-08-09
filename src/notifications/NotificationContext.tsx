import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQiahao } from '../state/QiahaoContext';
import { listenForNotifications, notificationApi } from './client';
import { notificationQueryOptions } from './queries';
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

function messageFrom(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status: appStatus, user } = useQiahao();
  const queryClient = useQueryClient();
  const localMode = typeof navigator !== 'undefined'
    && (navigator.userAgent.includes('jsdom') || import.meta.env.MODE === 'preview');
  const userId = user?.id ?? 'local-user';
  const notificationQueryKey = useMemo(() => notificationQueryOptions(userId).queryKey, [userId]);
  const [localState, setLocalState] = useState<NotificationState>(() => readNotificationState(userId) ?? { notifications: seedNotifications });
  const [streamError, setStreamError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const notificationQuery = useQuery({
    ...notificationQueryOptions(userId),
    enabled: !localMode && appStatus === 'authenticated',
    placeholderData: () => readNotificationState(userId) ?? undefined,
    select: (value) => ({ notifications: newestFirst(value.notifications) }),
  });
  const {
    data: remoteQueryState,
    error: remoteQueryError,
    isError: remoteQueryFailed,
    isFetching: remoteQueryFetching,
    refetch: refetchNotifications,
  } = notificationQuery;

  useEffect(() => {
    if (!localMode) return;
    setLocalState(readNotificationState(userId) ?? { notifications: seedNotifications });
    setMutationError(null);
  }, [localMode, userId]);

  const remoteState = remoteQueryState ?? { notifications: [] };
  const state = localMode ? localState : appStatus === 'authenticated' ? remoteState : { notifications: [] };

  const updateState = useCallback((updater: (current: NotificationState) => NotificationState) => {
    if (localMode) {
      setLocalState(updater);
      return;
    }
    queryClient.setQueryData<NotificationState>(notificationQueryKey, (current) => updater(current ?? { notifications: [] }));
  }, [localMode, notificationQueryKey, queryClient]);

  useEffect(() => {
    if (appStatus === 'authenticated' || localMode) writeNotificationState(state, userId);
  }, [appStatus, localMode, state, userId]);

  const refresh = useCallback(async () => {
    setMutationError(null);
    setStreamError(null);
    if (localMode || appStatus !== 'authenticated') return;
    await refetchNotifications();
  }, [appStatus, localMode, refetchNotifications]);

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
            updateState((current) => ({ notifications: mergeIncoming(current.notifications, notification) }));
            setStreamError(null);
            retryDelay = 1_000;
          },
          onArchive: (ids) => updateState((current) => ({ notifications: current.notifications.filter((item) => !ids.includes(item.id)) })),
        });
        if (!controller.signal.aborted) await refetchNotifications();
      } catch (reason) {
        if (!controller.signal.aborted) setStreamError(messageFrom(reason, '通知实时连接已断开'));
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
  }, [appStatus, localMode, refetchNotifications, updateState]);

  const notifications = state.notifications;
  const queryError = remoteQueryFailed ? messageFrom(remoteQueryError, '暂时无法加载通知') : null;
  const error = mutationError ?? queryError ?? streamError;
  const status: NotificationLoadState = localMode || appStatus !== 'authenticated'
    ? 'ready'
    : remoteQueryFetching && notifications.length === 0
      ? 'loading'
      : error
        ? 'error'
        : 'ready';

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read && !notification.archivedAt).length,
    status,
    error,
    markRead(id) {
      const target = notifications.find((notification) => notification.id === id);
      if (!target || target.read || target.archivedAt) return;
      const previous = notifications;
      const readAt = new Date().toISOString();
      updateState((current) => ({
        notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, read: true, readAt } : notification),
      }));
      setMutationError(null);
      if (!localMode) void notificationApi.markRead(id)
        .then(({ notification }) => updateState((current) => ({ notifications: mergeIncoming(current.notifications, notification) })))
        .catch((reason) => {
          updateState(() => ({ notifications: previous }));
          setMutationError(messageFrom(reason, '标记已读失败'));
        });
    },
    clearRead() {
      const readIds = notifications.filter((notification) => notification.read && !notification.archivedAt).map((notification) => notification.id);
      if (!readIds.length) return;
      const previous = notifications;
      updateState((current) => ({ notifications: current.notifications.filter((notification) => !readIds.includes(notification.id)) }));
      setMutationError(null);
      if (!localMode) void notificationApi.clearRead().catch((reason) => {
        updateState(() => ({ notifications: previous }));
        setMutationError(messageFrom(reason, '归档已读失败'));
      });
    },
    refresh,
  }), [error, localMode, notifications, refresh, status, updateState]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationsProvider');
  return value;
}
