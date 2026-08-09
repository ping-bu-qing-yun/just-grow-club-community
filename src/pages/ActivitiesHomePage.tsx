import { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { clubActivities, seedNeeds } from '../club/seed';
import type { ClubActivity, Need } from '../club/types';
import { useClub } from '../club/ClubContext';
import { buildUserPortrait } from '../club/portrait';
import { rankClubActivities } from '../club/recommend';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { InteractiveCatMascot } from '../components/InteractiveCatMascot';
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
  const recommendationActivities = useMemo(
    () => activities.filter((activity) => !state.dislikedClubActivityIds.includes(activity.id)),
    [activities, state.dislikedClubActivityIds],
  );
  const ranked = useMemo(
    () =>
      rankClubActivities(portrait, recommendationActivities, {
        penalizeIds: state.joinedClubActivityIds,
      }),
    [portrait, recommendationActivities, state.joinedClubActivityIds],
  );
  const pinnedCreated = recommendationActivities.find((activity) => activity.matchLabel === '新发布' || activity.matchLabel === 'AI提案');
  const forYou = [
    ...(pinnedCreated ? [{ activity: pinnedCreated, matchLabel: pinnedCreated.matchLabel || '新发布' }] : []),
    ...ranked.filter((item) => item.activity.id !== pinnedCreated?.id),
  ].slice(0, 4);
  const highlightTags = portrait.highlightTags.slice(0, 3);
  const featuredNeed = seedNeeds[0];
  const nickname = state.profile.nickname || '小恰';
  const avatar = state.profile.avatar || '/assets/avatar-me.jpg';

  return (
    <main className="club-home page">
      <header className="club-home-header">
        <div className="club-home-title">
          <h1>恰好是你</h1>
        </div>
        <div className="club-home-user" aria-label={`当前用户：${nickname}`}>
          <img src={avatar} alt="" />
          <span>{nickname}</span>
        </div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>

      <section className="portrait-strip">
        <InteractiveCatMascot />
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
