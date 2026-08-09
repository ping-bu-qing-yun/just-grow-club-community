import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { ClubActivity } from '../club/types';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { NotificationBell } from '../notifications/NotificationBell';
import { useQiahao } from '../state/QiahaoContext';
import { domainActivityToClub } from '../club/activity-adapter';
import { discoverActivityQueryOptions, type DiscoverActivityFilter } from '../data/activityQueries';

export function ExplorePage({ onOpenActivity, onOpenNotifications }: { onOpenActivity: (activity: ClubActivity) => void; onOpenNotifications: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activities, businessConfig, localMode } = useQiahao();
  const filters: Array<readonly [DiscoverActivityFilter, string]> = useMemo(() => [
    ['all', '全部'],
    ...(businessConfig?.activityCategories ?? []).map((item) => [`category:${item.key}` as const, item.label] as const),
    ['pre', '预活动'],
  ], [businessConfig?.activityCategories]);
  const requestedFilter = searchParams.get('filter');
  const filter = filters.some(([id]) => id === requestedFilter) ? requestedFilter as DiscoverActivityFilter : 'all';
  const query = searchParams.get('q') ?? '';
  const remoteCatalog = useInfiniteQuery({
    ...discoverActivityQueryOptions(filter, query),
    enabled: !localMode,
  });
  const remoteActivities = remoteCatalog.data?.pages.flatMap((page) => page.activities) ?? [];
  const catalog = useMemo(
    () => (localMode || (remoteCatalog.isError && !remoteActivities.length) ? activities : remoteActivities).map(domainActivityToClub),
    [activities, localMode, remoteActivities, remoteCatalog.isError],
  );

  function updateSearch(next: { filter?: string; query?: string }) {
    const params = new URLSearchParams(searchParams);
    const nextFilter = next.filter ?? filter;
    const nextQuery = next.query ?? query;
    if (nextFilter === 'all') params.delete('filter');
    else params.set('filter', nextFilter);
    if (nextQuery.trim()) params.set('q', nextQuery);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  }

  const visible = useMemo(
    () =>
      catalog.filter(
        (item) =>
          (filter === 'all'
            || (filter.startsWith('category:') && (!localMode || activities.find((activity) => activity.id === item.id)?.categoryKey === filter.slice('category:'.length)))
            || (filter === 'pre' && item.status === '预活动')) &&
          `${item.title}${item.tags.join('')}${item.location}`.includes(query),
      ),
    [activities, catalog, filter, localMode, query],
  );

  return (
    <main className="explore-page page">
      <header className="page-hero page-hero--with-action">
        <div><span>EXPLORE</span><h1>发现其他活动</h1><p>按出门阻力和见面方式，挑一场刚刚好的局。</p></div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>
      <label className="club-search">
        <Search size={18} />
        <input
          aria-label="搜索活动"
          value={query}
          onChange={(event) => updateSearch({ query: event.target.value })}
          placeholder="搜索活动、地点或场景"
        />
      </label>
      <div className="club-filter-strip">
        {filters.map(([id, label]) => (
          <button className={filter === id ? 'is-active' : ''} key={id} onClick={() => updateSearch({ filter: id })} type="button">
            {label}
          </button>
        ))}
      </div>
      <div className="club-card-list">
        {visible.map((activity) => (
          <ClubActivityCard key={activity.id} activity={activity} onOpen={onOpenActivity} />
        ))}
      </div>
      {!localMode && remoteCatalog.hasNextPage ? (
        <button
          className="secondary-button discover-load-more"
          type="button"
          disabled={remoteCatalog.isFetchingNextPage}
          onClick={() => void remoteCatalog.fetchNextPage()}
        >
          {remoteCatalog.isFetchingNextPage ? '正在加载…' : '加载更多活动'}
        </button>
      ) : null}
      {!localMode && remoteCatalog.isError ? <p className="form-error" role="alert">活动目录暂时无法继续加载，已保留当前结果。</p> : null}
      {!visible.length && (
        <div className="empty-state">
          <h3>没有找到合适活动</h3>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setSearchParams({}, { replace: true });
            }}
          >
            清除筛选
          </button>
        </div>
      )}
    </main>
  );
}
