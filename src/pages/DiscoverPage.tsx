import { Bell, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActivityCard } from '../components/ActivityCard';
import { categories } from '../domain/seed';
import type { ActivityCategory } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';

type CategoryFilter = '全部' | ActivityCategory;

export function DiscoverPage({ onOpenActivity }: { onOpenActivity: (activityId: string) => void }) {
  const { activities, savedIds, toggleSaved } = useQiahao();
  const [category, setCategory] = useState<CategoryFilter>('全部');
  const [query, setQuery] = useState('');

  const visibleActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesCategory = category === '全部' || activity.category === category;
      const matchesQuery = !normalizedQuery
        || `${activity.title}${activity.location}${activity.category}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activities, category, query]);

  const featured = activities.find((activity) => activity.featured) ?? activities[0];

  return (
    <main className="page discover-page">
      <header className="discover-header">
        <div>
          <button type="button" className="location-button">上海 <ChevronDown size={16} /></button>
          <h1>恰好</h1>
        </div>
        <button type="button" className="icon-button" aria-label="通知"><Bell size={21} /></button>
      </header>

      <label className="search-box">
        <Search size={19} />
        <input
          type="search"
          placeholder="想找什么搭子？"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" className="icon-button icon-button--small" aria-label="更多筛选">
          <SlidersHorizontal size={18} />
        </button>
      </label>

      <div className="category-strip" aria-label="活动类别">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? 'is-active' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {category === '全部' && !query && featured && (
        <button type="button" className="discover-hero" onClick={() => onOpenActivity(featured.id)}>
          <img src={featured.image} alt="朋友们一起城市漫步" />
          <span className="discover-hero__shade" />
          <span className="discover-hero__content">
            <span className="eyebrow">本周精选</span>
            <span className="discover-hero__title">恰好，一起出发</span>
            <span>把普通周末，过成值得记住的一天</span>
          </span>
        </button>
      )}

      <section className="discover-section">
        <div className="section-heading">
          <div><span className="eyebrow">NEAR YOU</span><h2>离你正好</h2></div>
          <button type="button" className="text-link">查看全部</button>
        </div>

        {visibleActivities.length > 0 ? (
          <div className="activity-list">
            {visibleActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                saved={savedIds.has(activity.id)}
                onOpen={onOpenActivity}
                onToggleSaved={toggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__mark"><Search size={24} /></div>
            <h3>这次没有恰好匹配</h3>
            <p>换个关键词或活动类型试试。</p>
            <button type="button" className="secondary-button" onClick={() => { setCategory('全部'); setQuery(''); }}>清除筛选</button>
          </div>
        )}
      </section>
    </main>
  );
}

