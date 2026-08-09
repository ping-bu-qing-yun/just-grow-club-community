import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ApiUser, QiahaoApi, ApiNeed, ApiLifePost } from '../api/types';
import { categoryImages, currentUser, seedActivities, seedMessages } from '../domain/seed';
import type { Activity, CreateActivityInput, MessageThread, PersistedState } from '../domain/types';
import type { LifePost, Need } from '../club/types';
import { lifePosts as seededLifePosts, seedNeeds } from '../club/seed';
import { clubActivities } from '../club/seed';
import { clubActivityToDomain } from '../club/activity-adapter';
import { readPersistedState, writePersistedState } from './storage';
import { QiahaoContext, type QiahaoContextValue, type QiahaoStatus } from './qiahao-context';
import { queryKeys } from '../data/queryClient';

export type { QiahaoContextValue, QiahaoStatus };
export { QiahaoContext };

const CONTENT_CACHE_KEY = 'qiahao-content-cache-v1';

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
    resonance: item.resonanceCount,
    saved: item.saved,
    resonated: item.resonated,
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
    resonance: item.resonanceCount,
    saved: item.saved,
    resonated: item.resonated,
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
  const localMode = typeof navigator !== 'undefined'
    && (navigator.userAgent.includes('jsdom') || import.meta.env.MODE === 'preview')
    && apiClient === api;
  const [state, setState] = useState<PersistedState>(() => localMode ? readPersistedState() : { customActivities: [], savedIds: [], joinedIds: [], messages: [] });
  const [serverActivities, setServerActivities] = useState<Activity[]>([]);
  const [serverNeeds, setServerNeeds] = useState<Need[]>([]);
  const [serverLifePosts, setServerLifePosts] = useState<LifePost[]>([]);
  const [localNeeds, setLocalNeeds] = useState<Need[]>(seedNeeds);
  const [localLifePosts, setLocalLifePosts] = useState<LifePost[]>(seededLifePosts);
  const [user, setUser] = useState<ApiUser | null>(localMode ? { ...currentUser, phone: '13800000000', role: 'operator' } : null);
  const [status, setStatus] = useState<QiahaoStatus>(localMode ? 'authenticated' : 'loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: [...queryKeys.session, refreshKey],
    queryFn: () => apiClient.me(),
    enabled: !localMode && status === 'loading',
    retry: false,
  });

  const activityQuery = useQuery({
    queryKey: [...queryKeys.activities, user?.id ?? 'anonymous', refreshKey],
    queryFn: async () => {
      const [activities, threads] = await Promise.all([apiClient.activities(), apiClient.threads()]);
      return { activities: activities.activities, threads: threads.threads };
    },
    enabled: !localMode && status === 'authenticated',
  });

  const contentQuery = useQuery({
    queryKey: [...queryKeys.content, user?.id ?? 'anonymous', refreshKey],
    queryFn: async () => {
      const [{ needs }, { lifePosts }] = await Promise.all([apiClient.needs(), apiClient.lifePosts()]);
      return { needs: needs.map(toNeed), lifePosts: lifePosts.map(toLifePost) };
    },
    enabled: !localMode && status === 'authenticated',
  });

  useEffect(() => {
    if (localMode || status !== 'loading' || !sessionQuery.data) return;
      setUser(sessionQuery.data.user);
      setStatus('authenticated');
      setError(null);
  }, [localMode, sessionQuery.data, status]);

  useEffect(() => {
    if (localMode || status !== 'loading' || !sessionQuery.isError) return;
    setUser(null);
    setError(null);
    setStatus('anonymous');
  }, [localMode, sessionQuery.isError, status]);

  useEffect(() => {
    if (!activityQuery.data) return;
    setServerActivities(activityQuery.data.activities as Activity[]);
    setState({
      customActivities: [],
      savedIds: activityQuery.data.activities.filter((item) => item.saved).map((item) => item.id),
      joinedIds: activityQuery.data.activities.filter((item) => item.joined).map((item) => item.id),
      messages: activityQuery.data.threads as MessageThread[],
    });
    setError(null);
  }, [activityQuery.data]);

  useEffect(() => {
    if (!activityQuery.isError || status !== 'authenticated') return;
    setError(activityQuery.error instanceof Error ? activityQuery.error.message : '活动加载失败');
    setStatus('error');
  }, [activityQuery.error, activityQuery.isError, status]);

  useEffect(() => {
    if (!contentQuery.data) return;
    setServerNeeds(contentQuery.data.needs);
    setServerLifePosts(contentQuery.data.lifePosts);
    writeContentCache(contentQuery.data.needs, contentQuery.data.lifePosts);
  }, [contentQuery.data]);

  useEffect(() => {
    if (!contentQuery.isError) return;
    const cached = readContentCache();
    if (!cached) return;
    setServerNeeds(cached.needs);
    setServerLifePosts(cached.lifePosts);
    setError('内容服务暂不可用，当前显示最近缓存');
  }, [contentQuery.isError]);

  useEffect(() => { if (localMode) writePersistedState(state); }, [localMode, state]);

  const activities = useMemo(
    () => localMode
      ? [...state.customActivities, ...clubActivities.map((activity) => clubActivityToDomain(activity, currentUser)), ...seedActivities]
      : serverActivities,
    [localMode, serverActivities, state.customActivities],
  );
  const needs = localMode ? localNeeds : serverNeeds;
  const lifeFeed = localMode ? localLifePosts : serverLifePosts;

  const value = useMemo<QiahaoContextValue>(() => ({
    activities,
    needs,
    lifePosts: lifeFeed,
    savedIds: new Set(state.savedIds),
    joinedIds: new Set(state.joinedIds),
    messages: localMode ? [...state.messages, ...seedMessages] : state.messages,
    user,
    status,
    error,
    loading: status === 'loading',
    localMode,
    async login(phone, password) {
      const result = await apiClient.login(phone, password);
      queryClient.setQueryData(queryKeys.session, result);
      setUser(result.user);
      setStatus('authenticated');
      setRefreshKey((key) => key + 1);
    },
    async logout() {
      try { if (!localMode) await apiClient.logout(); } finally {
        queryClient.removeQueries();
        setUser(null);
        setStatus('anonymous');
        setServerActivities([]);
        setServerNeeds([]);
        setServerLifePosts([]);
        setState({ customActivities: [], savedIds: [], joinedIds: [], messages: [] });
      }
    },
    retry() {
      setError(null);
      setStatus(localMode ? 'authenticated' : 'loading');
      setRefreshKey((key) => key + 1);
    },
    toggleSaved(activityId) {
      const saved = state.savedIds.includes(activityId);
      setState((current) => ({ ...current, savedIds: saved ? current.savedIds.filter((id) => id !== activityId) : [...current.savedIds, activityId] }));
      if (!localMode && status === 'authenticated') void apiClient.favorite(activityId, !saved)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.activities }))
        .catch((reason) => setError(reason instanceof Error ? reason.message : '收藏失败'));
    },
    joinActivity(activityId) {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;
      setState((current) => current.joinedIds.includes(activityId) ? current : {
        ...current,
        joinedIds: [...current.joinedIds, activityId],
        messages: activity.lifecycle === 'formal'
          ? [{ id: `thread-${activityId}`, activityId, title: `${activity.title}群聊`, lastMessage: `${activity.host.name}：欢迎加入，出发前会在这里同步集合信息。`, time: '刚刚', unread: 1, image: activity.image }, ...current.messages]
          : current.messages,
      });
      if (!localMode && status === 'authenticated') void apiClient.join(activityId)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.activities }))
        .catch((reason) => setError(reason instanceof Error ? reason.message : '报名失败'));
    },
    toggleContentSaved(contentType, contentId) {
      const source = contentType === 'need' ? needs : lifeFeed;
      const item = source.find((candidate) => candidate.id === contentId);
      if (!item || contentType === 'activity') return;
      const nextSaved = !item.saved;
      if (contentType === 'need') setLocalNeeds((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
      if (contentType === 'life') setLocalLifePosts((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
      if (!localMode) {
        if (contentType === 'need') setServerNeeds((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
        if (contentType === 'life') setServerLifePosts((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
        void apiClient.bookmark(contentType, contentId, nextSaved)
          .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.content }))
          .catch((reason) => {
            if (contentType === 'need') setServerNeeds((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: !nextSaved } : candidate));
            if (contentType === 'life') setServerLifePosts((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: !nextSaved } : candidate));
            setError(reason instanceof Error ? reason.message : '收藏失败');
          });
      }
    },
    toggleContentResonance(contentType, contentId) {
      const source = contentType === 'need' ? needs : lifeFeed;
      const item = source.find((candidate) => candidate.id === contentId);
      if (!item || contentType === 'activity') return;
      const nextResonated = !item.resonated;
      const adjust = (candidate: Need | LifePost) => candidate.id === contentId
        ? { ...candidate, resonated: nextResonated, resonance: Math.max(0, candidate.resonance + (nextResonated ? 1 : -1)) }
        : candidate;
      if (contentType === 'need') setLocalNeeds((current) => current.map(adjust) as Need[]);
      if (contentType === 'life') setLocalLifePosts((current) => current.map(adjust) as LifePost[]);
      if (!localMode) {
        if (contentType === 'need') setServerNeeds((current) => current.map(adjust) as Need[]);
        if (contentType === 'life') setServerLifePosts((current) => current.map(adjust) as LifePost[]);
        void apiClient.resonate(contentType, contentId, nextResonated)
          .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.content }))
          .catch((reason) => {
            const rollback = (candidate: Need | LifePost) => candidate.id === contentId
              ? { ...candidate, resonated: !nextResonated, resonance: Math.max(0, candidate.resonance + (nextResonated ? -1 : 1)) }
              : candidate;
            if (contentType === 'need') setServerNeeds((current) => current.map(rollback) as Need[]);
            if (contentType === 'life') setServerLifePosts((current) => current.map(rollback) as LifePost[]);
            setError(reason instanceof Error ? reason.message : '共鸣失败');
          });
      }
    },
    async createActivity(input) {
      if (localMode) {
        const activity: Activity = { ...input, id: `created-${Date.now()}`, image: categoryImages[input.category], distance: '由你发起', host: user ?? currentUser, participants: [], note: '请在活动开始前与参与者确认集合信息。', lifecycle: 'pre', participationStatus: null };
        setState((current) => ({ ...current, customActivities: [activity, ...current.customActivities] }));
        return activity;
      }
      const { activity } = await apiClient.createActivity(input);
      setServerActivities((current) => [activity, ...current]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities });
      return activity;
    },
    async createNeed(body, tags = []) {
      if (localMode) {
        const need: Need = { id: `mine-${Date.now()}`, author: `${user?.name ?? currentUser.name} · 刚刚`, subtitle: '我发布的需求', tags: tags.length ? tags : ['自然认识'], title: body.slice(0, 80), copy: body, image: '/assets/coffee.jpg', resonance: 0, comments: 0, response: '等待同频的人回应', similar: true };
        setLocalNeeds((current) => [need, ...current]);
        return need;
      }
      const { need } = await apiClient.createNeed(body, tags);
      const mapped = toNeed(need);
      setServerNeeds((current) => [mapped, ...current]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.content });
      return mapped;
    },
    async createLifePost(body, image, tags = []) {
      if (localMode) {
        const post: LifePost = { id: `life-${Date.now()}`, author: user?.name ?? currentUser.name, meta: '刚刚 · 恰好社区', kind: '生活分享', text: body, images: image ? [image] : [], tag: tags[0] ? `#${tags[0]}` : '#生活记录', comments: 0, resonance: 0 };
        setLocalLifePosts((current) => [post, ...current]);
        return post;
      }
      const { lifePost } = await apiClient.createLifePost(body, image, tags);
      const mapped = toLifePost(lifePost);
      setServerLifePosts((current) => [mapped, ...current]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.content });
      return mapped;
    },
  }), [activities, apiClient, error, lifeFeed, localMode, needs, queryClient, state, status, user]);

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
