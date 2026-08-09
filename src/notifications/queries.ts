import { queryKeys } from '../data/queryClient';
import { notificationApi } from './client';
import type { NotificationState } from './types';

export function notificationQueryOptions(userId: string) {
  return {
    queryKey: [...queryKeys.notifications, userId] as const,
    queryFn: async (): Promise<NotificationState> => {
      const response = await notificationApi.list({ limit: 50 });
      return { notifications: response.notifications };
    },
  } as const;
}
