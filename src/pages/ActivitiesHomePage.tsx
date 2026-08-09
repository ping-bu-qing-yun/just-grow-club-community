import { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { computePortraitCompleteness } from '../club/portrait';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { Badge } from '../components/ui/Badge';
import { quick } from '../motion/springs';
import { NotificationBell } from '../notifications/NotificationBell';
import { useQiahao } from '../state/QiahaoContext';
import { domainActivityToClub } from '../club/activity-adapter';
import styles from './ActivitiesHomePage.module.css';

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
  const reducedMotion = useReducedMotion();
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
    return (
      <main className={`${styles.home} page`}>
        <div className={styles.empty}>
          <h3>正在准备适合你的活动</h3>
          <p>活动目录加载完成后会自动出现。</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.home} page`}>
      <header className={styles.header}>
        <div>
          <small>周末好，{state.profile.nickname}</small>
          <h1>恰好</h1>
        </div>
        <NotificationBell onOpen={onOpenNotifications} />
      </header>

      <section className={styles.portraitStrip}>
        <div className={styles.portraitStripHead}>
          <span>
            <Sparkles size={15} />
            刚刚懂你一点
          </span>
          <b>{completeness}%</b>
        </div>
        <h2>{summaryLabel}</h2>
        <p>先看清自己的社交需求，再挑一场舒服的见面。</p>
        <div className={styles.portraitTags}>
          {highlightTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <motion.button
        type="button"
        className={styles.feature}
        onClick={() => onOpenActivity(featured)}
        aria-label={`查看${featured.title}详情`}
        whileTap={reducedMotion ? { opacity: 0.85 } : { scale: 0.99 }}
        transition={quick}
      >
        <img src={featured.image} alt={featured.title} />
        <div className={styles.featureCopy}>
          <small>
            本周精选 · {featured.status}
            {featuredRanked ? ` · ${featuredRanked.matchLabel}` : ''}
          </small>
          <h2>{featured.title}</h2>
          <p>
            {featured.people} · {featured.location.split('/')[0].trim()} · {featured.date.replace(' · ', '')}
          </p>
        </div>
      </motion.button>

      <section className={styles.section}>
        <header>
          <div>
            <span>FOR YOU</span>
            <h2>给你的见面</h2>
          </div>
        </header>
        <div className={styles.cardList}>
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

      <motion.section
        className={styles.needRecommend}
        onClick={onNeeds}
        role="button"
        tabIndex={0}
        whileTap={reducedMotion ? { opacity: 0.85 } : { scale: 0.99 }}
        transition={quick}
      >
        <img src={highlightedNeed?.image ?? '/assets/coffee.jpg'} alt="" />
        <div className={styles.needRecommendCopy}>
          <small>需求广场{highlightedNeed ? ` · ${highlightedNeed.resonance}人共鸣` : ''}</small>
          <h2>{highlightedNeed?.title ?? '说出你想遇见什么'}</h2>
          <p>如果暂时没有合适活动，可以先看见同频的人。</p>
          <button type="button" className={styles.needRecommendCta}>
            去看看
            <ArrowRight size={15} />
          </button>
        </div>
      </motion.section>
    </main>
  );
}
