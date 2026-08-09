import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  session: ['session'] as const,
  activities: ['activities'] as const,
  content: ['content'] as const,
  threads: ['threads'] as const,
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
