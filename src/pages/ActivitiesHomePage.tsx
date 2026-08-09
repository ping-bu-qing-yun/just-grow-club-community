import { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { computePortraitCompleteness } from '../club/portrait';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { NotificationBell } from '../notifications/NotificationBell';
import { useQiahao } from '../state/QiahaoContext';
import { domainActivityToClub } from '../club/activity-adapter';

export function ActivitiesHomePage({
  onNeeds,
  onOpenActivity,
  onOpenNotifications,
}: {
  onNeeds: () => void;
  onOpenActivity: (activity: ClubActivity) => void;
  onOpenNotifications: () => void;
}) {
  const { state } = useClub();
  const { activities, localMode, recommendations, needs } = useQiahao();
  const ranked = useMemo(() => recommendations.length
    ? recommendations.map((item) => ({ ...item, activity: domainActivityToClub(item.activity) }))
    : localMode
      ? activities.map((activity) => ({ activity: domainActivityToClub(activity), score: 50, matchedTags: [activity.category], reasons: ['预览模式推荐'], matchLabel: activity.matchLabel ?? '可以了解' }))
      : [], [activities, localMode, recommendations]);
  const featuredRanked = ranked[0];
  const featured = featuredRanked?.activity;
  const forYou = ranked.slice(1, 4);
  const highlightTags = featuredRanked?.matchedTags.slice(0, 3) ?? [];
  const summaryLabel = featuredRanked?.reasons[0] ?? '先从一场低压力的见面开始';
  const completeness = computePortraitCompleteness(state);
  const highlightedNeed = needs[0];

  if (!featured) {
    return <main className="club-home page"><div className="empty-state"><h3>正在准备适合你的活动</h3><p>活动目录加载完成后会自动出现。</p></div></main>;
  }

  return (
    <main className="club-home page">
      <header className="club-home-header">
        <div>
          <small>周末好，{state.profile.nickname}</small>
          <h1>恰好</h1>
        </div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>

      <section className="portrait-strip">
        <div className="portrait-strip-head">
          <span>
            <Sparkles size={15} />
            刚刚懂你一点
          </span>
          <b>{completeness}%</b>
        </div>
        <h2>{summaryLabel}</h2>
        <p>先看清自己的社交需求，再挑一场舒服的见面。</p>
        <div>
          {highlightTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <button
        type="button"
        className="club-feature"
        onClick={() => onOpenActivity(featured)}
        aria-label={`查看${featured.title}详情`}
      >
        <img src={featured.image} alt={featured.title} />
        <div>
          <small>
            本周精选 · {featured.status}
            {featuredRanked ? ` · ${featuredRanked.matchLabel}` : ''}
          </small>
          <h2>{featured.title}</h2>
          <p>
            {featured.people} · {featured.location.split('/')[0].trim()} · {featured.date.replace(' · ', '')}
          </p>
        </div>
      </button>

      <section className="club-section">
        <header>
          <div>
            <span>FOR YOU</span>
            <h2>给你的见面</h2>
          </div>
        </header>
        <div className="club-card-list">
          {forYou.map((item) => (
            <ClubActivityCard
              key={item.activity.id}
              activity={item.activity}
              matchLabel={item.matchLabel}
              onOpen={onOpenActivity}
            />
          ))}
        </div>
      </section>

      <section className="need-recommend" onClick={onNeeds}>
        <img src={highlightedNeed?.image ?? '/assets/coffee.jpg'} alt="" />
        <div>
          <small>需求广场{highlightedNeed ? ` · ${highlightedNeed.resonance}人共鸣` : ''}</small>
          <h2>{highlightedNeed?.title ?? '说出你想遇见什么'}</h2>
          <p>如果暂时没有合适活动，可以先看见同频的人。</p>
          <button type="button">
            去看看
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </main>
  );
}
