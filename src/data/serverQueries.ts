import type { QiahaoApi } from '../api/types';
import { api } from '../api/client';
import { queryKeys } from './queryClient';

export function sessionQueryOptions(apiClient: QiahaoApi = api) {
  return {
    queryKey: queryKeys.session,
    queryFn: () => apiClient.me(),
  } as const;
}

export function activityFeedQueryOptions(userId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.activities, userId, 'feed'] as const,
    queryFn: async () => {
      const [activities, threads] = await Promise.all([
        apiClient.activities({ limit: 50 }),
        apiClient.threads(),
      ]);
      return { activities: activities.activities, threads: threads.threads };
    },
  } as const;
}

export function profileQueryOptions(userId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.profile, userId] as const,
    queryFn: () => apiClient.profile(),
  } as const;
}

export function contentFeedQueryOptions(userId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.content, userId, 'feed'] as const,
    queryFn: async () => {
      const [needs, lifePosts] = await Promise.all([
        apiClient.needs({ limit: 50 }),
        apiClient.lifePosts({ limit: 50 }),
      ]);
      return {
        needs: needs.needs,
        lifePosts: lifePosts.lifePosts,
        needNextCursor: needs.nextCursor,
        lifeNextCursor: lifePosts.nextCursor,
      };
    },
  } as const;
}

export function configBootstrapQueryOptions(apiClient: QiahaoApi = api) {
  return {
    queryKey: queryKeys.config,
    queryFn: () => apiClient.configBootstrap(),
    staleTime: 5 * 60_000,
  } as const;
}

export function recommendationsQueryOptions(userId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.recommendations, userId] as const,
    queryFn: () => apiClient.recommendations(10),
  } as const;
}

export function activityDetailQueryOptions(userId: string, id: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.activityDetail, userId, id] as const,
    queryFn: () => apiClient.activity(id),
  } as const;
}

export function needDetailQueryOptions(userId: string, id: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.contentDetail, userId, 'need', id] as const,
    queryFn: () => apiClient.need(id),
  } as const;
}

export function lifeDetailQueryOptions(userId: string, id: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.contentDetail, userId, 'life', id] as const,
    queryFn: () => apiClient.lifePost(id),
  } as const;
}

export function messagesQueryOptions(userId: string, threadId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.messages, userId, threadId] as const,
    queryFn: () => apiClient.messages(threadId),
  } as const;
}

export function feedbackQueryOptions(userId: string, activityId: string, apiClient: QiahaoApi = api) {
  return {
    queryKey: [...queryKeys.feedback, userId, activityId] as const,
    queryFn: () => apiClient.activityFeedback(activityId),
  } as const;
}
