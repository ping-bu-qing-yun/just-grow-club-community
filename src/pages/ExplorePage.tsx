import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { clubActivities } from '../club/seed';
import type { ClubActivity } from '../club/types';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { NotificationBell } from '../notifications/NotificationBell';

const filters = [
  ['all', '全部'],
  ['low', '低压力'],
  ['deep', '深聊'],
  ['walk', '散步'],
  ['workshop', '工作坊'],
  ['pre', '预活动'],
] as const;

const distanceFilters = [
  ['all', '全部距离'],
  ['near', '3km内'],
  ['middle', '5km内'],
  ['sameCity', '同城可达'],
] as const;

const activityDistanceKm: Record<string, number> = {
  'club-dinner': 1.8,
  'club-night': 2.6,
  'club-walk': 4.2,
  'club-workshop': 2.9,
  'club-lunch': 3.4,
  'club-exhibit': 5.8,
  'club-poem': 4.7,
  'club-ride': 6.2,
};

export function ExplorePage({
  activities = clubActivities,
  onOpenActivity,
  onOpenNotifications,
}: {
  activities?: ClubActivity[];
  onOpenActivity: (activity: ClubActivity) => void;
  onOpenNotifications: () => void;
}) {
  const [filter, setFilter] = useState('all');
  const [distance, setDistance] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () =>
      activities.filter((item) => {
        const km = activityDistanceKm[item.id] ?? 8;
        const matchesDistance =
          distance === 'all' ||
          (distance === 'near' && km <= 3) ||
          (distance === 'middle' && km <= 5) ||
          distance === 'sameCity';
        return (
          (filter === 'all' || item.theme === filter || (filter === 'pre' && item.status === '预活动')) &&
          matchesDistance &&
          `${item.title}${item.tags.join('')}${item.location}`.includes(query)
        );
      }),
    [activities, distance, filter, query],
  );

  return (
    <main className="explore-page page">
      <header className="page-hero page-hero--with-action">
        <div><h1>发现其他活动</h1><p>按出门阻力和见面方式，挑一场刚刚好的局。</p></div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>
      <label className="club-search">
        <Search size={18} />
        <input
          aria-label="搜索活动"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索活动、地点或场景"
        />
      </label>
      <div className="club-filter-strip">
        {filters.map(([id, label]) => (
          <button className={filter === id ? 'is-active' : ''} key={id} onClick={() => setFilter(id)} type="button">
            {label}
          </button>
        ))}
      </div>
      <div className="club-filter-strip club-filter-strip--distance" aria-label="距离筛选">
        {distanceFilters.map(([id, label]) => (
          <button className={distance === id ? 'is-active' : ''} key={id} onClick={() => setDistance(id)} type="button">
            {label}
          </button>
        ))}
      </div>
      <div className="club-card-list">
        {visible.map((activity) => (
          <ClubActivityCard key={activity.id} activity={activity} onOpen={onOpenActivity} />
        ))}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <h3>没有找到合适活动</h3>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setFilter('all');
              setDistance('all');
              setQuery('');
            }}
          >
            清除筛选
          </button>
        </div>
      )}
    </main>
  );
}
