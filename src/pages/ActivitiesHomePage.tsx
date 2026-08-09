import { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { clubActivities, seedNeeds } from '../club/seed';
import type { ClubActivity, Need } from '../club/types';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';
import { rankClubActivities } from '../club/recommend';
import { getClubActivityStats } from '../club/activityStats';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { NotificationBell } from '../notifications/NotificationBell';

export function ActivitiesHomePage({
  activities = clubActivities,
  onOpenNeed,
  onOpenActivity,
  onOpenNotifications,
}: {
  activities?: ClubActivity[];
  onOpenNeed: (need: Need) => void;
  onOpenActivity: (activity: ClubActivity) => void;
  onOpenNotifications: () => void;
}) {
  const { state } = useClub();
  const portrait = useMemo(() => buildUserPortrait(state), [state]);
  const ranked = useMemo(
    () =>
      rankClubActivities(portrait, activities, {
        penalizeIds: state.joinedClubActivityIds,
      }),
    [activities, portrait, state.joinedClubActivityIds],
  );
  const featuredRanked = ranked[0];
  const pinnedCreated = activities.find((activity) => activity.matchLabel === '新发布' || activity.matchLabel === 'AI提案');
  const featured = pinnedCreated ?? featuredRanked?.activity ?? activities[0] ?? clubActivities[0];
  const forYou = ranked.filter((item) => item.activity.id !== featured.id).slice(0, 3);
  const highlightTags = portrait.highlightTags.slice(0, 3);
  const featuredStats = getClubActivityStats(featured, state.joinedClubActivityIds.includes(featured.id));
  const featuredNeed = seedNeeds[0];

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
          <b>{portrait.completeness}%</b>
        </div>
        <h2>{portrait.summaryLabel}</h2>
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
          <span className="activity-stat-line">{featuredStats.views}看过｜{featuredStats.joined}人已报名</span>
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

      <button
        type="button"
        className="need-recommend"
        onClick={() => onOpenNeed(featuredNeed)}
        aria-label={`查看需求详情：${featuredNeed.title}`}
      >
        <img src={featuredNeed.image} alt="" />
        <div>
          <small>需求卡 · {featuredNeed.resonance}人共鸣</small>
          <h2>{featuredNeed.title}</h2>
          <p>{featuredNeed.copy}</p>
          <span>
            去看看
            <ArrowRight size={15} />
          </span>
        </div>
      </button>
    </main>
  );
}
