import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ApiUser, QiahaoApi, ApiNeed, ApiLifePost, ApiActivity, ApiThread, ApiMessage } from '../api/types';
import { categoryImages, currentUser, seedActivities, seedMessages } from '../domain/seed';
import type { Activity, CreateActivityInput, PersistedState } from '../domain/types';
import type { ClubState, LifePost, Need } from '../club/types';
import type { OnboardingQuestionConfig } from '../config/types';
import { lifePosts as seededLifePosts, seedNeeds } from '../club/seed';
import { clubActivities } from '../club/seed';
import { clubActivityToDomain } from '../club/activity-adapter';
import { readPersistedState, writePersistedState } from './storage';
import { QiahaoContext, type QiahaoContextValue, type QiahaoStatus } from './qiahao-context';
import { queryKeys } from '../data/queryClient';
import {
  activityFeedQueryOptions,
  configBootstrapQueryOptions,
  contentFeedQueryOptions,
  messagesQueryOptions,
  profileQueryOptions,
  recommendationsQueryOptions,
  sessionQueryOptions,
} from '../data/serverQueries';

export type { QiahaoContextValue, QiahaoStatus };
export { QiahaoContext };

const CONTENT_CACHE_KEY = 'qiahao-content-cache-v1';

type ContentFeedData = {
  needs: ApiNeed[];
  lifePosts: ApiLifePost[];
  needNextCursor: string | null;
  lifeNextCursor: string | null;
};
type ActivityFeedData = { activities: ApiActivity[]; threads: ApiThread[] };

function mergeById<T extends { id: string }>(current: readonly T[], incoming: readonly T[]): T[] {
  return [...new Map([...current, ...incoming].map((item) => [item.id, item])).values()];
}

export function serializeOnboardingAnswers(
  record: Pick<ClubState, 'lightAnswers' | 'qaAnswers'>,
  onboardingQuestions: readonly Pick<OnboardingQuestionConfig, 'key' | 'sectionKey'>[],
): Record<string, string[]> {
  const answers: Record<string, string[]> = {};
  const lightQuestions = onboardingQuestions.filter((question) => question.sectionKey === 'light');
  const configuredQuestionKeys = new Set(onboardingQuestions.map((question) => question.key));

  record.lightAnswers.forEach((values, index) => {
    const key = lightQuestions[index]?.key ?? ['light:intent', 'light:scene', 'light:barrier'][index];
    if (key && values.length) answers[key] = values;
  });
  for (const [key, value] of Object.entries(record.qaAnswers)) {
    const prefixedQuestionKey = `qa:${key}`;
    const questionKey = configuredQuestionKeys.has(key) || !configuredQuestionKeys.has(prefixedQuestionKey)
      ? key
      : prefixedQuestionKey;
    if (value.trim()) answers[questionKey] = [value.trim()];
  }
  return answers;
}

export function toNeed(item: ApiNeed): Need {
  const firstLine = item.body.split(/\r?\n/, 1)[0].trim();
  return {
    id: item.id,
    authorId: item.author.id,
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

export function toLifePost(item: ApiLifePost): LifePost {
  return {
    id: item.id,
    authorId: item.author.id,
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
  const [contentFallback, setContentFallback] = useState<{ needs: Need[]; lifePosts: LifePost[] } | null>(null);
  const [loadingMoreContent, setLoadingMoreContent] = useState(false);
  const [profileRecord, setProfileRecord] = useState<ClubState | null>(null);
  const [localNeeds, setLocalNeeds] = useState<Need[]>(() => localMode ? seedNeeds : []);
  const [localLifePosts, setLocalLifePosts] = useState<LifePost[]>(() => localMode ? seededLifePosts : []);
  const [user, setUser] = useState<ApiUser | null>(localMode ? { ...currentUser, phone: '13800000000', role: 'operator' } : null);
  const [status, setStatus] = useState<QiahaoStatus>(localMode ? 'authenticated' : 'loading');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    ...sessionQueryOptions(apiClient),
    enabled: !localMode && status === 'loading',
    retry: false,
  });

  const activityQuery = useQuery({
    ...activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient),
    enabled: !localMode && status === 'authenticated',
  });

  const profileQuery = useQuery({
    ...profileQueryOptions(user?.id ?? 'anonymous', apiClient),
    enabled: !localMode && status === 'authenticated',
  });

  const contentQuery = useQuery({
    ...contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient),
    enabled: !localMode && status === 'authenticated',
  });

  const configQuery = useQuery({
    ...configBootstrapQueryOptions(apiClient),
    enabled: !localMode,
  });

  const recommendationsQuery = useQuery({
    ...recommendationsQueryOptions(user?.id ?? 'anonymous', apiClient),
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
    setError(null);
  }, [activityQuery.data]);

  useEffect(() => {
    if (!activityQuery.isError || status !== 'authenticated') return;
    setError(activityQuery.error instanceof Error ? activityQuery.error.message : '活动加载失败');
    setStatus('error');
  }, [activityQuery.error, activityQuery.isError, status]);

  useEffect(() => {
    if (!contentQuery.data) return;
    const nextNeeds = contentQuery.data.needs.map(toNeed);
    const nextLifePosts = contentQuery.data.lifePosts.map(toLifePost);
    setContentFallback(null);
    writeContentCache(nextNeeds, nextLifePosts);
  }, [contentQuery.data]);

  useEffect(() => {
    if (!contentQuery.isError) return;
    const cached = readContentCache();
    if (!cached) return;
    setContentFallback(cached);
    setError('内容服务暂不可用，当前显示最近缓存');
  }, [contentQuery.isError]);

  useEffect(() => {
    if (profileQuery.data) setProfileRecord(profileQuery.data.profile);
  }, [profileQuery.data]);

  useEffect(() => { if (localMode) writePersistedState(state); }, [localMode, state]);

  const activities = useMemo(
    () => localMode
      ? [...state.customActivities, ...clubActivities.map((activity) => clubActivityToDomain(activity, currentUser)), ...seedActivities]
      : (activityQuery.data?.activities as Activity[] ?? []),
    [activityQuery.data?.activities, localMode, state.customActivities],
  );
  const needs = localMode ? localNeeds : contentQuery.data?.needs.map(toNeed) ?? contentFallback?.needs ?? [];
  const lifeFeed = localMode ? localLifePosts : contentQuery.data?.lifePosts.map(toLifePost) ?? contentFallback?.lifePosts ?? [];
  const needNextCursor = contentQuery.data?.needNextCursor ?? null;
  const lifeNextCursor = contentQuery.data?.lifeNextCursor ?? null;
  const savedIds = localMode ? state.savedIds : (activityQuery.data?.activities ?? []).filter((item) => item.saved).map((item) => item.id);
  const joinedIds = localMode ? state.joinedIds : (activityQuery.data?.activities ?? []).filter((item) => item.joined).map((item) => item.id);
  const messageThreads = localMode ? [...state.messages, ...seedMessages] : activityQuery.data?.threads ?? [];

  const value = useMemo<QiahaoContextValue>(() => ({
    activities,
    needs,
    lifePosts: lifeFeed,
    savedIds: new Set(savedIds),
    joinedIds: new Set(joinedIds),
    messages: messageThreads,
    user,
    status,
    error,
    loading: status === 'loading',
    localMode,
    profileRecord,
    businessConfig: configQuery.data ?? null,
    recommendations: recommendationsQuery.data?.items ?? [],
    hasMoreNeeds: localMode ? false : Boolean(needNextCursor),
    hasMoreLifePosts: localMode ? false : Boolean(lifeNextCursor),
    loadingMoreContent,
    async login(phone, password) {
      const result = await apiClient.login(phone, password);
      queryClient.setQueryData(queryKeys.session, result);
      setUser(result.user);
      setStatus('authenticated');
    },
    async logout() {
      try { if (!localMode) await apiClient.logout(); } finally {
        queryClient.removeQueries();
        setUser(null);
        setStatus('anonymous');
        setContentFallback(null);
        setProfileRecord(null);
        setState({ customActivities: [], savedIds: [], joinedIds: [], messages: [] });
      }
    },
    retry() {
      setError(null);
      setStatus(localMode ? 'authenticated' : 'loading');
      if (!localMode) void queryClient.resetQueries({ queryKey: queryKeys.session, exact: true });
    },
    toggleSaved(activityId) {
      const activity = activities.find((item) => item.id === activityId) as ApiActivity | undefined;
      const saved = localMode ? state.savedIds.includes(activityId) : Boolean(activity?.saved);
      if (localMode) {
        setState((current) => ({ ...current, savedIds: saved ? current.savedIds.filter((id) => id !== activityId) : [...current.savedIds, activityId] }));
        return;
      }
      const key = activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ActivityFeedData>(key, (current) => current ? { ...current, activities: current.activities.map((item) => item.id === activityId ? { ...item, saved: !saved } : item) } : current);
      const detailKey = [...queryKeys.activityDetail, user?.id ?? 'anonymous', activityId] as const;
      queryClient.setQueryData<{ activity: ApiActivity }>(detailKey, (current) => current ? { activity: { ...current.activity, saved: !saved } } : current);
      if (status === 'authenticated') void apiClient.favorite(activityId, !saved)
        .catch((reason) => {
          queryClient.setQueryData<ActivityFeedData>(key, (current) => current ? { ...current, activities: current.activities.map((item) => item.id === activityId ? { ...item, saved } : item) } : current);
          queryClient.setQueryData<{ activity: ApiActivity }>(detailKey, (current) => current ? { activity: { ...current.activity, saved } } : current);
          setError(reason instanceof Error ? reason.message : '收藏失败');
        });
    },
    joinActivity(activityId) {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;
      if (localMode) {
        setState((current) => current.joinedIds.includes(activityId) ? current : {
          ...current,
          joinedIds: [...current.joinedIds, activityId],
          messages: activity.lifecycle === 'formal'
            ? [{ id: `thread-${activityId}`, activityId, title: `${activity.title}群聊`, lastMessage: `${activity.host.name}：欢迎加入，出发前会在这里同步集合信息。`, time: '刚刚', unread: 1, image: activity.image }, ...current.messages]
            : current.messages,
        });
        return;
      }
      if (status === 'authenticated') void apiClient.join(activityId)
        .then(({ thread, participationStatus }) => {
          const key = activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
          queryClient.setQueryData<ActivityFeedData>(key, (current) => current ? {
            activities: current.activities.map((item) => item.id === activityId ? { ...item, joined: participationStatus === 'joined', participationStatus } : item),
            threads: thread ? mergeById(current.threads, [thread]) : current.threads,
          } : current);
          queryClient.setQueryData<{ activity: ApiActivity }>([...queryKeys.activityDetail, user?.id ?? 'anonymous', activityId], (current) => current ? { activity: { ...current.activity, joined: participationStatus === 'joined', participationStatus } } : current);
        })
        .catch((reason) => setError(reason instanceof Error ? reason.message : '报名失败'));
    },
    async cancelActivity(activityId) {
      if (localMode) {
        setState((current) => ({ ...current, joinedIds: current.joinedIds.filter((id) => id !== activityId) }));
        return;
      }
      await apiClient.cancelJoin(activityId);
      queryClient.setQueryData<ActivityFeedData>(activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey, (current) => current ? {
        ...current,
        activities: current.activities.map((activity) => activity.id === activityId ? { ...activity, joined: false, participationStatus: null } : activity),
      } : current);
      queryClient.setQueryData<{ activity: ApiActivity }>([...queryKeys.activityDetail, user?.id ?? 'anonymous', activityId], (current) => current ? { activity: { ...current.activity, joined: false, participationStatus: null } } : current);
      await queryClient.invalidateQueries({ queryKey: queryKeys.threads });
    },
    toggleContentSaved(contentType, contentId) {
      const source = contentType === 'need' ? needs : lifeFeed;
      const item = source.find((candidate) => candidate.id === contentId);
      if (!item || contentType === 'activity') return;
      const nextSaved = !item.saved;
      if (localMode) {
        if (contentType === 'need') setLocalNeeds((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
        if (contentType === 'life') setLocalLifePosts((current) => current.map((candidate) => candidate.id === contentId ? { ...candidate, saved: nextSaved } : candidate));
        return;
      }
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      const update = (saved: boolean) => queryClient.setQueryData<ContentFeedData>(key, (current) => current ? {
        ...current,
        needs: contentType === 'need' ? current.needs.map((candidate) => candidate.id === contentId ? { ...candidate, saved } : candidate) : current.needs,
        lifePosts: contentType === 'life' ? current.lifePosts.map((candidate) => candidate.id === contentId ? { ...candidate, saved } : candidate) : current.lifePosts,
      } : current);
      const updateDetail = (saved: boolean) => {
        const detailKey = [...queryKeys.contentDetail, user?.id ?? 'anonymous', contentType, contentId] as const;
        if (contentType === 'need') queryClient.setQueryData<{ need: ApiNeed }>(detailKey, (current) => current ? { need: { ...current.need, saved } } : current);
        if (contentType === 'life') queryClient.setQueryData<{ lifePost: ApiLifePost }>(detailKey, (current) => current ? { lifePost: { ...current.lifePost, saved } } : current);
      };
      update(nextSaved);
      updateDetail(nextSaved);
      void apiClient.bookmark(contentType, contentId, nextSaved).catch((reason) => { update(!nextSaved); updateDetail(!nextSaved); setError(reason instanceof Error ? reason.message : '收藏失败'); });
    },
    toggleContentResonance(contentType, contentId) {
      const source = contentType === 'need' ? needs : lifeFeed;
      const item = source.find((candidate) => candidate.id === contentId);
      if (!item || contentType === 'activity') return;
      const nextResonated = !item.resonated;
      const adjustPreview = (candidate: Need | LifePost) => candidate.id === contentId
        ? { ...candidate, resonated: nextResonated, resonance: Math.max(0, candidate.resonance + (nextResonated ? 1 : -1)) }
        : candidate;
      if (localMode) {
        if (contentType === 'need') setLocalNeeds((current) => current.map(adjustPreview) as Need[]);
        if (contentType === 'life') setLocalLifePosts((current) => current.map(adjustPreview) as LifePost[]);
        return;
      }
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      const update = (resonated: boolean, delta: number) => queryClient.setQueryData<ContentFeedData>(key, (current) => current ? {
        ...current,
        needs: contentType === 'need' ? current.needs.map((candidate) => candidate.id === contentId ? { ...candidate, resonated, resonanceCount: Math.max(0, candidate.resonanceCount + delta) } : candidate) : current.needs,
        lifePosts: contentType === 'life' ? current.lifePosts.map((candidate) => candidate.id === contentId ? { ...candidate, resonated, resonanceCount: Math.max(0, candidate.resonanceCount + delta) } : candidate) : current.lifePosts,
      } : current);
      const updateDetail = (resonated: boolean, delta: number) => {
        const detailKey = [...queryKeys.contentDetail, user?.id ?? 'anonymous', contentType, contentId] as const;
        if (contentType === 'need') queryClient.setQueryData<{ need: ApiNeed }>(detailKey, (current) => current ? { need: { ...current.need, resonated, resonanceCount: Math.max(0, current.need.resonanceCount + delta) } } : current);
        if (contentType === 'life') queryClient.setQueryData<{ lifePost: ApiLifePost }>(detailKey, (current) => current ? { lifePost: { ...current.lifePost, resonated, resonanceCount: Math.max(0, current.lifePost.resonanceCount + delta) } } : current);
      };
      update(nextResonated, nextResonated ? 1 : -1);
      updateDetail(nextResonated, nextResonated ? 1 : -1);
      void apiClient.resonate(contentType, contentId, nextResonated).catch((reason) => { update(!nextResonated, nextResonated ? -1 : 1); updateDetail(!nextResonated, nextResonated ? -1 : 1); setError(reason instanceof Error ? reason.message : '共鸣失败'); });
    },
    async createActivity(input) {
      if (localMode) {
        const activity: Activity = { ...input, id: `created-${Date.now()}`, image: categoryImages[input.category] ?? '/assets/coffee.jpg', distance: '由你发起', host: user ?? currentUser, participants: [], note: '请在活动开始前与参与者确认集合信息。', lifecycle: 'pre', participationStatus: null };
        setState((current) => ({ ...current, customActivities: [activity, ...current.customActivities] }));
        return activity;
      }
      const { activity } = await apiClient.createActivity(input);
      const key = activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ActivityFeedData>(key, (current) => current ? { ...current, activities: [activity, ...current.activities] } : current);
      void queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      return activity;
    },
    async updateActivity(id, input) {
      if (localMode) {
        let updated: Activity | null = null;
        setState((current) => ({
          ...current,
          customActivities: current.customActivities.map((activity) => {
            if (activity.id !== id) return activity;
            updated = { ...activity, ...input };
            return updated;
          }),
        }));
        if (!updated) throw new Error('活动不存在');
        return updated;
      }
      const { activity } = await apiClient.updateActivity(id, input);
      queryClient.setQueryData<ActivityFeedData>(activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey, (current) => current ? {
        ...current,
        activities: current.activities.map((item) => item.id === id ? activity : item),
      } : current);
      queryClient.setQueryData([...queryKeys.activityDetail, user?.id ?? 'anonymous', id], { activity });
      return activity;
    },
    async archiveActivity(id, reason) {
      if (localMode) {
        setState((current) => ({ ...current, customActivities: current.customActivities.filter((activity) => activity.id !== id) }));
        return;
      }
      await apiClient.archiveActivity(id, reason);
      queryClient.setQueryData<ActivityFeedData>(activityFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey, (current) => current ? {
        ...current,
        activities: current.activities.filter((activity) => activity.id !== id),
      } : current);
      queryClient.removeQueries({ queryKey: [...queryKeys.activityDetail, user?.id ?? 'anonymous', id], exact: true });
    },
    async changeActivityLifecycle(id, lifecycle) {
      if (localMode) {
        setState((current) => ({ ...current, customActivities: current.customActivities.map((activity) => activity.id === id ? { ...activity, lifecycle } : activity) }));
        return;
      }
      await apiClient.changeActivityLifecycle(id, lifecycle);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.activities }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activityDetail }),
        queryClient.invalidateQueries({ queryKey: queryKeys.recommendations }),
      ]);
    },
    async createNeed(body, tags = []) {
      if (localMode) {
        const need: Need = { id: `mine-${Date.now()}`, author: `${user?.name ?? currentUser.name} · 刚刚`, subtitle: '我发布的需求', tags: tags.length ? tags : ['自然认识'], title: body.slice(0, 80), copy: body, image: '/assets/coffee.jpg', resonance: 0, comments: 0, response: '等待同频的人回应', similar: true };
        setLocalNeeds((current) => [need, ...current]);
        return need;
      }
      const { need } = await apiClient.createNeed(body, tags);
      const mapped = toNeed(need);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, needs: [need, ...current.needs] } : current);
      return mapped;
    },
    async updateNeed(id, body, tags = []) {
      if (localMode) {
        const current = localNeeds.find((item) => item.id === id);
        if (!current) throw new Error('需求不存在');
        const next = { ...current, copy: body, title: body.slice(0, 80), tags };
        setLocalNeeds((items) => items.map((item) => item.id === id ? next : item));
        return next;
      }
      const { need } = await apiClient.updateNeed(id, body, tags);
      const mapped = toNeed(need);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, needs: current.needs.map((item) => item.id === id ? need : item) } : current);
      queryClient.setQueryData([...queryKeys.contentDetail, user?.id ?? 'anonymous', 'need', id], { need });
      return mapped;
    },
    async archiveNeed(id) {
      if (localMode) { setLocalNeeds((items) => items.filter((item) => item.id !== id)); return; }
      await apiClient.archiveNeed(id);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, needs: current.needs.filter((item) => item.id !== id) } : current);
      queryClient.removeQueries({ queryKey: [...queryKeys.contentDetail, user?.id ?? 'anonymous', 'need', id], exact: true });
    },
    async createLifePost(body, image, tags = []) {
      if (localMode) {
        const post: LifePost = { id: `life-${Date.now()}`, author: user?.name ?? currentUser.name, meta: '刚刚 · 恰好社区', kind: '生活分享', text: body, images: image ? [image] : [], tag: tags[0] ? `#${tags[0]}` : '#生活记录', comments: 0, resonance: 0 };
        setLocalLifePosts((current) => [post, ...current]);
        return post;
      }
      const { lifePost } = await apiClient.createLifePost(body, image, tags);
      const mapped = toLifePost(lifePost);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, lifePosts: [lifePost, ...current.lifePosts] } : current);
      return mapped;
    },
    async updateLifePost(id, body, image, tags = []) {
      if (localMode) {
        const current = localLifePosts.find((item) => item.id === id);
        if (!current) throw new Error('生活动态不存在');
        const next = { ...current, text: body, images: image ? [image] : [], tag: tags[0] ? `#${tags[0]}` : current.tag };
        setLocalLifePosts((items) => items.map((item) => item.id === id ? next : item));
        return next;
      }
      const { lifePost } = await apiClient.updateLifePost(id, body, image, tags);
      const mapped = toLifePost(lifePost);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, lifePosts: current.lifePosts.map((item) => item.id === id ? lifePost : item) } : current);
      queryClient.setQueryData([...queryKeys.contentDetail, user?.id ?? 'anonymous', 'life', id], { lifePost });
      return mapped;
    },
    async archiveLifePost(id) {
      if (localMode) { setLocalLifePosts((items) => items.filter((item) => item.id !== id)); return; }
      await apiClient.archiveLifePost(id);
      const key = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
      queryClient.setQueryData<ContentFeedData>(key, (current) => current ? { ...current, lifePosts: current.lifePosts.filter((item) => item.id !== id) } : current);
      queryClient.removeQueries({ queryKey: [...queryKeys.contentDetail, user?.id ?? 'anonymous', 'life', id], exact: true });
    },
    async loadMoreContent(contentType) {
      if (localMode || loadingMoreContent) return;
      const cursor = contentType === 'need' ? needNextCursor : lifeNextCursor;
      if (!cursor) return;
      setLoadingMoreContent(true);
      try {
        const queryKey = contentFeedQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey;
        if (contentType === 'need') {
          const page = await apiClient.needs({ cursor, limit: 20 });
          queryClient.setQueryData<ContentFeedData>(queryKey, (current) => current ? {
            ...current,
            needs: mergeById(current.needs, page.needs),
            needNextCursor: page.nextCursor,
          } : current);
        } else {
          const page = await apiClient.lifePosts({ cursor, limit: 20 });
          queryClient.setQueryData<ContentFeedData>(queryKey, (current) => current ? {
            ...current,
            lifePosts: mergeById(current.lifePosts, page.lifePosts),
            lifeNextCursor: page.nextCursor,
          } : current);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '加载更多内容失败');
      } finally {
        setLoadingMoreContent(false);
      }
    },
    async saveProfileRecord(nextProfile) {
      if (localMode) {
        setProfileRecord(nextProfile);
        return nextProfile;
      }
      const result = await apiClient.saveProfile(nextProfile);
      setProfileRecord(result.profile);
      queryClient.setQueryData(profileQueryOptions(user?.id ?? 'anonymous', apiClient).queryKey, result);
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
      return result.profile;
    },
    async saveOnboardingProgress(record) {
      if (localMode) return;
      const answers = serializeOnboardingAnswers(record, configQuery.data?.onboarding ?? []);
      await apiClient.saveOnboardingAnswers({ answers, currentStep: record.onboardingStep, completed: record.onboardingComplete });
      await queryClient.invalidateQueries({ queryKey: queryKeys.onboarding });
    },
    async deleteOnboardingProgress() {
      if (localMode) return;
      await apiClient.deleteOnboardingAnswers();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.onboarding }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      ]);
    },
    async setActivityInterest(activityId, signal, reason) {
      if (localMode) return;
      await apiClient.setActivityInterest(activityId, signal, reason);
    },
    async submitActivityFeedback(activityId, mood, note) {
      if (localMode) return;
      await apiClient.submitActivityFeedback(activityId, mood, note);
      await queryClient.invalidateQueries({ queryKey: [...queryKeys.feedback, user?.id ?? 'anonymous', activityId] });
    },
    async sendThreadMessage(threadId, body) {
      if (localMode) {
        const now = new Date().toISOString();
        return { id: `preview-message-${Date.now()}`, threadId, senderId: user?.id ?? 'me', body: body.trim(), createdAt: now, updatedAt: now, withdrawn: false };
      }
      const { message } = await apiClient.sendMessage(threadId, body);
      queryClient.setQueryData<{ messages: ApiMessage[] }>(messagesQueryOptions(user?.id ?? 'anonymous', threadId, apiClient).queryKey, (current) => ({ messages: [...(current?.messages ?? []), message] }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.threads });
      return message;
    },
    async withdrawThreadMessage(threadId, messageId) {
      if (localMode) return;
      await apiClient.withdrawMessage(messageId);
      queryClient.setQueryData<{ messages: ApiMessage[] }>(messagesQueryOptions(user?.id ?? 'anonymous', threadId, apiClient).queryKey, (current) => ({
        messages: (current?.messages ?? []).map((message) => message.id === messageId ? { ...message, body: '', withdrawn: true } : message),
      }));
      await queryClient.invalidateQueries({ queryKey: queryKeys.threads });
    },
  }), [activities, activityQuery.data, apiClient, configQuery.data, error, lifeFeed, lifeNextCursor, loadingMoreContent, localLifePosts, localMode, localNeeds, needNextCursor, needs, profileRecord, queryClient, recommendationsQuery.data?.items, state, status, user]);

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
