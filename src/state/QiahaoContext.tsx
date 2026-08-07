import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { categoryImages, currentUser, seedActivities, seedMessages } from '../domain/seed';
import type { Activity, CreateActivityInput, MessageThread, PersistedState } from '../domain/types';
import { readPersistedState, writePersistedState } from './storage';

export interface QiahaoContextValue {
  activities: Activity[];
  savedIds: Set<string>;
  joinedIds: Set<string>;
  messages: MessageThread[];
  toggleSaved: (activityId: string) => void;
  joinActivity: (activityId: string) => void;
  createActivity: (input: CreateActivityInput) => Activity;
}

const QiahaoContext = createContext<QiahaoContextValue | null>(null);

export function QiahaoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => readPersistedState());

  useEffect(() => {
    writePersistedState(state);
  }, [state]);

  const activities = useMemo(
    () => [...state.customActivities, ...seedActivities],
    [state.customActivities],
  );

  const value = useMemo<QiahaoContextValue>(() => ({
    activities,
    savedIds: new Set(state.savedIds),
    joinedIds: new Set(state.joinedIds),
    messages: [...state.messages, ...seedMessages],
    toggleSaved(activityId) {
      setState((current) => ({
        ...current,
        savedIds: current.savedIds.includes(activityId)
          ? current.savedIds.filter((id) => id !== activityId)
          : [...current.savedIds, activityId],
      }));
    },
    joinActivity(activityId) {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;

      setState((current) => {
        if (current.joinedIds.includes(activityId)) return current;
        const title = activityId === 'walk-001' ? '滨江轻徒步群聊' : `${activity.title}群聊`;
        return {
          ...current,
          joinedIds: [...current.joinedIds, activityId],
          messages: [{
            id: `thread-${activityId}`,
            activityId,
            title,
            lastMessage: `${activity.host.name}：欢迎加入，出发前会在这里同步集合信息。`,
            time: '刚刚',
            unread: 1,
            image: activity.image,
          }, ...current.messages],
        };
      });
    },
    createActivity(input) {
      const activity: Activity = {
        ...input,
        id: `created-${Date.now()}`,
        image: categoryImages[input.category],
        distance: '由你发起',
        host: currentUser,
        participants: [],
        note: '请在活动开始前与参与者确认集合信息。',
      };
      setState((current) => ({
        ...current,
        customActivities: [activity, ...current.customActivities],
      }));
      return activity;
    },
  }), [activities, state.joinedIds, state.messages, state.savedIds]);

  return <QiahaoContext.Provider value={value}>{children}</QiahaoContext.Provider>;
}

export function useQiahao(): QiahaoContextValue {
  const value = useContext(QiahaoContext);
  if (!value) throw new Error('useQiahao must be used inside QiahaoProvider');
  return value;
}
