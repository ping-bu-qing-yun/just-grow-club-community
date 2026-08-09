import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, AUTH_TOKEN_KEY } from '../api/client';
import type { ApiUser, QiahaoApi, ApiNeed, ApiLifePost } from '../api/types';
import { categoryImages, currentUser, seedActivities, seedMessages } from '../domain/seed';
import type { Activity, CreateActivityInput, MessageThread, PersistedState } from '../domain/types';
import type { LifePost, Need } from '../club/types';
import { lifePosts as seededLifePosts, seedNeeds } from '../club/seed';
import { readPersistedState, writePersistedState } from './storage';
import { QiahaoContext, type QiahaoContextValue, type QiahaoStatus } from './qiahao-context';

export type { QiahaoContextValue, QiahaoStatus };
export { QiahaoContext };

const CONTENT_CACHE_KEY = 'qiahao-content-cache-v1';
const lifeTagLabels: Record<string, string> = {
  weekend: '周末的一百种过法',
  relationship: '关系里的松弛感',
};

function toNeed(item: ApiNeed): Need {
  const firstLine = item.body.split(/\r?\n/, 1)[0].trim();
  return {
    id: item.id,
    author: `${item.author.name} · 刚刚`,
    subtitle: item.tags[0]?.label ?? '刚刚发布的需求',
    tags: item.tags.map((tag) => tag.label),
    title: firstLine.slice(0, 80) || '新的需求',
    copy: item.body,
    image: '/assets/coffee.jpg',
    resonance: 0,
    comments: item.commentCount ?? item.comments ?? 0,
    response: '等待同频的人回应',
    similar: false,
  };
}

function toLifePost(item: ApiLifePost): LifePost {
  return {
    id: item.id,
    author: item.author.name,
    meta: '刚刚 · 恰好社区',
    kind: '生活分享',
    text: item.body,
    images: item.image ? [item.image] : [],
    tag: item.tags[0] ? `#${item.tags[0].label}` : '#生活记录',
    comments: item.commentCount ?? item.comments ?? 0,
    resonance: 0,
  };
}

function readContentCache(): { needs: Need[]; lifePosts: LifePost[] } | null {
  try {
    const raw = window.localStorage.getItem(CONTENT_CACHE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { needs?: Need[]; lifePosts?: LifePost[] };
    if (!Array.isArray(value.needs) || !Array.isArray(value.lifePosts)) return null;
    return { needs: value.needs, lifePosts: value.lifePosts };
  } catch {
    return null;
  }
}

function writeContentCache(needs: Need[], lifePosts: LifePost[]): void {
  try {
    window.localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify({ needs, lifePosts }));
  } catch {
    // The server remains the source of truth when browser storage is unavailable.
  }
}

export function QiahaoProvider({ children, apiClient = api }: { children: ReactNode; apiClient?: QiahaoApi }) {
  const localMode = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom') && apiClient === api;
  const [demoMode, setDemoMode] = useState(localMode);
  const effectiveLocalMode = localMode || demoMode;
  const [state, setState] = useState<PersistedState>(() => localMode ? readPersistedState() : { customActivities: [], savedIds: [], joinedIds: [], messages: [] });
  const [serverActivities, setServerActivities] = useState<Activity[]>([]);
  const [serverNeeds, setServerNeeds] = useState<Need[]>([]);
  const [serverLifePosts, setServerLifePosts] = useState<LifePost[]>([]);
  const [localNeeds, setLocalNeeds] = useState<Need[]>(seedNeeds);
  const [localLifePosts, setLocalLifePosts] = useState<LifePost[]>(seededLifePosts);
  const [user, setUser] = useState<ApiUser | null>(localMode ? { ...currentUser, phone: '13800000000', role: 'operator' } : null);
  const [status, setStatus] = useState<QiahaoStatus>(localMode ? 'authenticated' : (window.localStorage.getItem(AUTH_TOKEN_KEY) ? 'loading' : 'anonymous'));
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function enterDemoMode(message = '已进入本地演示模式') {
    setDemoMode(true);
    setUser({ ...currentUser, phone: '13800000000', role: 'operator' });
    setStatus('authenticated');
    setError(message);
  }

  useEffect(() => {
    if (effectiveLocalMode || status !== 'loading') return;
    let alive = true;
    apiClient.me().then(({ user: nextUser }) => {
      if (!alive) return;
      setUser(nextUser);
      setStatus('authenticated');
    }).catch((reason) => {
      if (!alive) return;
      if (!(reason instanceof ApiError)) {
        enterDemoMode('API 未启动，已切换到本地演示模式');
        return;
      }
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      setError(reason instanceof Error ? reason.message : '登录状态已失效');
      setStatus('anonymous');
    });
    return () => { alive = false; };
  }, [apiClient, effectiveLocalMode, status]);

  useEffect(() => {
    if (effectiveLocalMode || status !== 'authenticated') return;
    let alive = true;
    Promise.all([apiClient.activities(), apiClient.threads()]).then(([activities, threads]) => {
      if (!alive) return;
      setServerActivities(activities.activities as Activity[]);
      setState({ customActivities: [], savedIds: activities.activities.filter((item) => item.saved).map((item) => item.id), joinedIds: activities.activities.filter((item) => item.joined).map((item) => item.id), messages: threads.threads as MessageThread[] });
      setError(null);
    }).catch((reason) => {
      if (!alive) return;
      if (!(reason instanceof ApiError)) {
        enterDemoMode('API 暂不可用，已切换到本地演示模式');
        return;
      }
      setError(reason instanceof Error ? reason.message : '活动加载失败');
      setStatus('error');
    });
    apiClient.needs().then(({ needs }) => apiClient.lifePosts().then(({ lifePosts: posts }) => {
      if (!alive) return;
      const mappedNeeds = needs.map(toNeed);
      const mappedLifePosts = posts.map(toLifePost);
      setServerNeeds(mappedNeeds);
      setServerLifePosts(mappedLifePosts);
      writeContentCache(mappedNeeds, mappedLifePosts);
    })).catch(() => {
      if (!alive) return;
      const cached = readContentCache();
      if (cached) {
        setServerNeeds(cached.needs);
        setServerLifePosts(cached.lifePosts);
        setError('内容服务暂不可用，当前显示最近缓存');
      }
    });
    return () => { alive = false; };
  }, [apiClient, effectiveLocalMode, refreshKey, status]);

  useEffect(() => { if (effectiveLocalMode) writePersistedState(state); }, [effectiveLocalMode, state]);

  const activities = useMemo(() => effectiveLocalMode ? [...state.customActivities, ...seedActivities] : serverActivities, [effectiveLocalMode, serverActivities, state.customActivities]);
  const needs = effectiveLocalMode ? localNeeds : serverNeeds;
  const lifeFeed = effectiveLocalMode ? localLifePosts : serverLifePosts;

  const value = useMemo<QiahaoContextValue>(() => ({
    activities,
    needs,
    lifePosts: lifeFeed,
    savedIds: new Set(state.savedIds),
    joinedIds: new Set(state.joinedIds),
    messages: effectiveLocalMode ? [...state.messages, ...seedMessages] : state.messages,
    user,
    status,
    error,
    loading: status === 'loading',
    localMode: effectiveLocalMode,
    async login(phone, password) {
      try {
        const result = await apiClient.login(phone, password);
        setDemoMode(false);
        setUser(result.user);
        setStatus('authenticated');
        setRefreshKey((key) => key + 1);
      } catch (reason) {
        if (reason instanceof ApiError) throw reason;
        enterDemoMode('API 未启动，已进入本地演示模式');
      }
    },
    async logout() {
      try { if (!effectiveLocalMode) await apiClient.logout(); } finally {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        setUser(null);
        setDemoMode(false);
        setStatus('anonymous');
        setServerActivities([]);
        setServerNeeds([]);
        setServerLifePosts([]);
        setState({ customActivities: [], savedIds: [], joinedIds: [], messages: [] });
      }
    },
    retry() {
      setError(null);
      setStatus(window.localStorage.getItem(AUTH_TOKEN_KEY) ? 'authenticated' : 'anonymous');
      setRefreshKey((key) => key + 1);
    },
    toggleSaved(activityId) {
      const saved = state.savedIds.includes(activityId);
      setState((current) => ({ ...current, savedIds: saved ? current.savedIds.filter((id) => id !== activityId) : [...current.savedIds, activityId] }));
      if (!effectiveLocalMode && status === 'authenticated') void apiClient.favorite(activityId, !saved).catch((reason) => setError(reason instanceof Error ? reason.message : '收藏失败'));
    },
    joinActivity(activityId) {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;
      setState((current) => current.joinedIds.includes(activityId) ? current : { ...current, joinedIds: [...current.joinedIds, activityId], messages: [{ id: `thread-${activityId}`, activityId, title: `${activity.title}群聊`, lastMessage: `${activity.host.name}：欢迎加入，出发前会在这里同步集合信息。`, time: '刚刚', unread: 1, image: activity.image }, ...current.messages] });
      if (!effectiveLocalMode && status === 'authenticated') void apiClient.join(activityId).catch((reason) => setError(reason instanceof Error ? reason.message : '报名失败'));
    },
    async createActivity(input) {
      if (effectiveLocalMode) {
        const activity: Activity = { ...input, id: `created-${Date.now()}`, image: input.image || categoryImages[input.category], distance: '由你发起', host: user ?? currentUser, participants: [], note: '请在活动开始前与参与者确认集合信息。' };
        setState((current) => ({ ...current, customActivities: [activity, ...current.customActivities] }));
        return activity;
      }
      const { activity } = await apiClient.createActivity(input);
      setServerActivities((current) => [activity, ...current]);
      return activity;
    },
    async createNeed(body, tags = [], image = '/assets/coffee.jpg') {
      if (effectiveLocalMode) {
        const need: Need = { id: `mine-${Date.now()}`, author: `${user?.name ?? currentUser.name} · 刚刚`, subtitle: '我发布的需求', tags: tags.length ? tags : ['自然认识'], title: body.slice(0, 80), copy: body, image, resonance: 0, comments: 0, response: '等待同频的人回应', similar: true };
        setLocalNeeds((current) => [need, ...current]);
        return need;
      }
      const { need } = await apiClient.createNeed(body, tags);
      const mapped = { ...toNeed(need), image };
      setServerNeeds((current) => [mapped, ...current]);
      return mapped;
    },
    async createLifePost(body, image, tags = []) {
      if (effectiveLocalMode) {
        const post: LifePost = { id: `life-${Date.now()}`, author: user?.name ?? currentUser.name, meta: '刚刚 · 恰好社区', kind: '生活分享', text: body, images: image ? [image] : [], tag: tags[0] ? `#${lifeTagLabels[tags[0]] ?? tags[0]}` : '#生活记录', comments: 0, resonance: 0 };
        setLocalLifePosts((current) => [post, ...current]);
        return post;
      }
      const { lifePost } = await apiClient.createLifePost(body, image, tags);
      const mapped = toLifePost(lifePost);
      setServerLifePosts((current) => [mapped, ...current]);
      return mapped;
    },
  }), [activities, apiClient, effectiveLocalMode, error, lifeFeed, needs, state, status, user]);

  return <QiahaoContext.Provider value={value}>{children}</QiahaoContext.Provider>;
}

export function useQiahao(): QiahaoContextValue {
  const value = useContext(QiahaoContext);
  if (!value) throw new Error('useQiahao must be used inside QiahaoProvider');
  return value;
}

export function useQiahaoOptional(): QiahaoContextValue | null {
  return useContext(QiahaoContext);
}
