import { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { clubActivities, seedNeeds } from '../club/seed';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';
import { rankClubActivities } from '../club/recommend';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { NotificationBell } from '../notifications/NotificationBell';

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
  const portrait = useMemo(() => buildUserPortrait(state), [state]);
  const ranked = useMemo(
    () =>
      rankClubActivities(portrait, clubActivities, {
        penalizeIds: state.joinedClubActivityIds,
      }),
    [portrait, state.joinedClubActivityIds],
  );
  const featuredRanked = ranked[0];
  const featured = featuredRanked?.activity ?? clubActivities[0];
  const forYou = ranked.slice(1, 4);
  const highlightTags = portrait.highlightTags.slice(0, 3);

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
        <img src={seedNeeds[0].image} alt="" />
        <div>
          <small>需求广场 · 72人共鸣</small>
          <h2>不想尴尬交换微信，但想认真认识人</h2>
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
