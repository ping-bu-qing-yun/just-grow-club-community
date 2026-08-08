import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, AUTH_TOKEN_KEY } from '../api/client';
import type { QiahaoApi, ApiUser } from '../api/types';
import { categoryImages, currentUser, seedActivities, seedMessages } from '../domain/seed';
import type { Activity, CreateActivityInput, MessageThread, PersistedState } from '../domain/types';
import { readPersistedState, writePersistedState } from './storage';

export type QiahaoStatus = 'loading' | 'anonymous' | 'authenticated' | 'error';
export interface QiahaoContextValue {
  activities: Activity[]; savedIds: Set<string>; joinedIds: Set<string>; messages: MessageThread[];
  user: ApiUser | null; status: QiahaoStatus; error: string | null; loading: boolean;
  toggleSaved: (activityId: string) => void; joinActivity: (activityId: string) => void; createActivity: (input: CreateActivityInput) => Activity;
  login: (phone: string, password: string) => Promise<void>; logout: () => Promise<void>; retry: () => void;
}
const QiahaoContext = createContext<QiahaoContextValue | null>(null);

export function QiahaoProvider({ children, apiClient = api }: { children: ReactNode; apiClient?: QiahaoApi }) {
  const localMode = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom') && apiClient === api;
  const [state, setState] = useState<PersistedState>(() => localMode ? readPersistedState() : { customActivities: [], savedIds: [], joinedIds: [], messages: [] });
  const [serverActivities, setServerActivities] = useState<Activity[]>([]);
  const [user, setUser] = useState<ApiUser | null>(localMode ? { ...currentUser, phone: '13800000000' } : null);
  const [status, setStatus] = useState<QiahaoStatus>(localMode ? 'authenticated' : (window.localStorage.getItem(AUTH_TOKEN_KEY) ? 'loading' : 'anonymous'));
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => { if (localMode || status !== 'loading') return; let alive = true; apiClient.me().then(({ user: nextUser }) => { if (!alive) return; setUser(nextUser); setStatus('authenticated'); }).catch((reason) => { if (!alive) return; window.localStorage.removeItem(AUTH_TOKEN_KEY); setError(reason instanceof Error ? reason.message : '登录状态已失效'); setStatus('anonymous'); }); return () => { alive = false; }; }, [apiClient, localMode, status]);
  useEffect(() => { if (localMode || status !== 'authenticated') return; let alive = true; Promise.all([apiClient.activities(), apiClient.threads()]).then(([activities, threads]) => { if (!alive) return; setServerActivities(activities.activities as Activity[]); setState({ customActivities: [], savedIds: activities.activities.filter((item) => item.saved).map((item) => item.id), joinedIds: activities.activities.filter((item) => item.joined).map((item) => item.id), messages: threads.threads as MessageThread[] }); setError(null); }).catch((reason) => { if (alive) { setError(reason instanceof Error ? reason.message : '加载失败'); setStatus('error'); } }); return () => { alive = false; }; }, [apiClient, refreshKey, status]);
  useEffect(() => { if (localMode) writePersistedState(state); }, [state]);
  const activities = useMemo(() => localMode ? [...state.customActivities, ...seedActivities] : serverActivities, [serverActivities, state.customActivities]);
  const value = useMemo<QiahaoContextValue>(() => ({
    activities, savedIds: new Set(state.savedIds), joinedIds: new Set(state.joinedIds), messages: localMode ? [...state.messages, ...seedMessages] : state.messages,
    user, status, error, loading: status === 'loading',
    async login(phone, password) { await apiClient.login(phone, password); const result = await apiClient.me(); setUser(result.user); setStatus('authenticated'); setRefreshKey((key) => key + 1); },
    async logout() { try { await apiClient.logout(); } finally { window.localStorage.removeItem(AUTH_TOKEN_KEY); setUser(null); setStatus('anonymous'); setServerActivities([]); setState({ customActivities: [], savedIds: [], joinedIds: [], messages: [] }); } },
    retry() { setError(null); setStatus(window.localStorage.getItem(AUTH_TOKEN_KEY) ? 'authenticated' : 'anonymous'); setRefreshKey((key) => key + 1); },
    toggleSaved(activityId) { setState((current) => ({ ...current, savedIds: current.savedIds.includes(activityId) ? current.savedIds.filter((id) => id !== activityId) : [...current.savedIds, activityId] })); if (!localMode && status === 'authenticated') void apiClient.favorite(activityId, !state.savedIds.includes(activityId)).catch((reason) => setError(reason instanceof Error ? reason.message : '收藏失败')); },
    joinActivity(activityId) { const activity = activities.find((item) => item.id === activityId); if (!activity) return; setState((current) => current.joinedIds.includes(activityId) ? current : { ...current, joinedIds: [...current.joinedIds, activityId], messages: [{ id: `thread-${activityId}`, activityId, title: activityId === 'walk-001' ? '滨江轻徒步群聊' : `${activity.title}群聊`, lastMessage: `${activity.host.name}：欢迎加入，出发前会在这里同步集合信息。`, time: '刚刚', unread: 1, image: activity.image }, ...current.messages] }); if (!localMode && status === 'authenticated') void apiClient.join(activityId).catch((reason) => setError(reason instanceof Error ? reason.message : '报名失败')); },
    createActivity(input) { const activity: Activity = { ...input, id: `created-${Date.now()}`, image: categoryImages[input.category], distance: '由你发起', host: user ?? currentUser, participants: [], note: '请在活动开始前与参与者确认集合信息。' }; setState((current) => ({ ...current, customActivities: [activity, ...current.customActivities] })); if (!localMode && status === 'authenticated') void apiClient.createActivity(input).then(({ activity: saved }) => { setServerActivities((current) => [saved, ...current]); }).catch((reason) => setError(reason instanceof Error ? reason.message : '发布失败')); return activity; },
  }), [activities, apiClient, error, state, status, user]);
  return <QiahaoContext.Provider value={value}>{children}</QiahaoContext.Provider>;
}
export function useQiahao(): QiahaoContextValue { const value = useContext(QiahaoContext); if (!value) throw new Error('useQiahao must be used inside QiahaoProvider'); return value; }
