import { infiniteQueryOptions } from '@tanstack/react-query';
import { api } from '../api/client';
import type { ActivityListParams } from '../api/types';
import { queryKeys } from './queryClient';

export type DiscoverActivityFilter = 'all' | 'pre' | `category:${string}`;

function listParams(filter: DiscoverActivityFilter, query: string, cursor: string | null): ActivityListParams {
  return {
    cursor,
    limit: 12,
    q: query.trim() || undefined,
    lifecycle: filter === 'pre' ? 'pre' : undefined,
    category: filter.startsWith('category:') ? filter.slice('category:'.length) : undefined,
  };
}

export function discoverActivityQueryOptions(filter: DiscoverActivityFilter, query: string) {
  const normalizedQuery = query.trim();
  return infiniteQueryOptions({
    queryKey: [...queryKeys.activities, 'discover', filter, normalizedQuery] as const,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.activities(listParams(filter, normalizedQuery, pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
