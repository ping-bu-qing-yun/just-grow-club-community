import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  session: ['session'] as const,
  profile: ['profile'] as const,
  onboarding: ['onboarding'] as const,
  interestTags: ['interest-tags'] as const,
  activities: ['activities'] as const,
  activityDetail: ['activity-detail'] as const,
  content: ['content'] as const,
  contentDetail: ['content-detail'] as const,
  social: ['social'] as const,
  threads: ['threads'] as const,
  messages: ['messages'] as const,
  feedback: ['feedback'] as const,
  media: ['media'] as const,
  config: ['business-config'] as const,
  recommendations: ['recommendations'] as const,
  operatorConfig: ['operator-config'] as const,
  activityProposals: ['activity-proposals'] as const,
  notifications: ['notifications'] as const,
};

export function createQiahaoQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

export const queryClient = createQiahaoQueryClient();
