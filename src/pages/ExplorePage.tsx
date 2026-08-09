import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { clubActivities } from '../club/seed';
import type { ClubActivity } from '../club/types';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { Button } from '../components/ui/Button';
import { NotificationBell } from '../notifications/NotificationBell';
import styles from './ExplorePage.module.css';

const filters = [
  ['all', '全部'],
  ['low', '低压力'],
  ['deep', '深聊'],
  ['walk', '散步'],
  ['workshop', '工作坊'],
  ['pre', '预活动'],
] as const;

export function ExplorePage({
  activities = clubActivities,
  onOpenActivity,
  onOpenNotifications,
}: {
  activities?: ClubActivity[];
  onOpenActivity: (activity: ClubActivity) => void;
  onOpenNotifications: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFilter = searchParams.get('filter');
  const filter = filters.some(([id]) => id === requestedFilter) ? requestedFilter : 'all';
  const query = searchParams.get('q') ?? '';

  function updateFilter(nextFilter: string) {
    const params = new URLSearchParams(searchParams);
    if (nextFilter === 'all') params.delete('filter');
    else params.set('filter', nextFilter);
    setSearchParams(params, { replace: true });
  }

  function updateQuery(nextQuery: string) {
    const params = new URLSearchParams(searchParams);
    if (nextQuery) params.set('q', nextQuery);
    else params.delete('q');
    setSearchParams(params, { replace: true });
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams);
    params.delete('filter');
    params.delete('q');
    setSearchParams(params, { replace: true });
  }

  const visible = useMemo(
    () =>
      activities.filter(
        (item) =>
          (filter === 'all' || item.theme === filter || (filter === 'pre' && item.status === '预活动')) &&
          `${item.title}${item.tags.join('')}${item.location}`.includes(query),
      ),
    [activities, filter, query],
  );

  return (
    <main className={`${styles.page} page`}>
      <header className={styles.hero}>
        <div>
          <span>EXPLORE</span>
          <h1>发现其他活动</h1>
          <p>按出门阻力和见面方式，挑一场刚刚好的局。</p>
        </div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>
      <label className={styles.search}>
        <Search size={18} />
        <input
          aria-label="搜索活动"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="搜索活动、地点或场景"
        />
      </label>
      <div className={styles.filterStrip}>
        {filters.map(([id, label]) => (
          <button
            className={filter === id ? styles.active : ''}
            key={id}
            onClick={() => updateFilter(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.cardList}>
        {visible.map((activity) => (
          <ClubActivityCard key={activity.id} activity={activity} onOpen={onOpenActivity} />
        ))}
      </div>
      {!visible.length && (
        <div className={styles.empty}>
          <h3>没有找到合适活动</h3>
          <Button variant="secondary" onClick={clearFilters}>
            清除筛选
          </Button>
        </div>
      )}
    </main>
  );
}
