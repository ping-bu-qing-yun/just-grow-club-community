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

export function ExplorePage({ onOpenActivity, onOpenNotifications }: { onOpenActivity: (activity: ClubActivity) => void; onOpenNotifications: () => void }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () =>
      clubActivities.filter(
        (item) =>
          (filter === 'all' || item.theme === filter || (filter === 'pre' && item.status === '预活动')) &&
          `${item.title}${item.tags.join('')}${item.location}`.includes(query),
      ),
    [filter, query],
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
