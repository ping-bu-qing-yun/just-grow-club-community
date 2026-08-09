import { ArrowUpRight, MapPin, MessageCircle, UsersRound } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { ClubActivity } from '../club/types';
import { quick } from '../motion/springs';
import { Badge } from './ui/Badge';
import styles from './ClubActivityCard.module.css';

export function ClubActivityCard({
  activity,
  matchLabel,
  onOpen,
}: {
  activity: ClubActivity;
  /** 推荐引擎动态匹配标签；缺省用活动自身 matchLabel */
  matchLabel?: string;
  onOpen?: (activity: ClubActivity, focusComments?: boolean) => void;
}) {
  const reducedMotion = useReducedMotion();

  function open(focusComments = false) {
    onOpen?.(activity, focusComments);
  }

  const badge = matchLabel ?? activity.matchLabel;

  return (
    <article className={styles.card}>
      <motion.button
        type="button"
        className={styles.media}
        onClick={() => open()}
        aria-label={`打开${activity.title}`}
        whileTap={reducedMotion ? { opacity: 0.8 } : { scale: 0.99 }}
        transition={quick}
      >
        <motion.img
          src={activity.image}
          alt=""
          whileTap={reducedMotion ? undefined : { scale: 1.03 }}
          transition={quick}
        />
        <span className={styles.status}>{activity.status}</span>
      </motion.button>
      <div className={styles.copy}>
        <div className={styles.tags}>
          {badge ? <Badge tone="brand">{badge}</Badge> : null}
          {activity.tags.slice(0, badge ? 2 : 3).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <button type="button" className={styles.title} onClick={() => open()} aria-label={`查看${activity.title}详情`}>
          <h3>{activity.title}</h3>
          <ArrowUpRight size={18} aria-hidden />
        </button>
        <p className={styles.description}>{activity.description}</p>
        <div className={styles.meta}>
          <span>
            <MapPin size={13} />
            {activity.location}
          </span>
          <span>
            <UsersRound size={13} />
            {activity.people}
          </span>
          <strong>{activity.fee}</strong>
        </div>
        <button type="button" className={styles.commentLink} onClick={() => open(true)} aria-label={`查看${activity.title}评论`}>
          <MessageCircle size={15} aria-hidden />
          评论
        </button>
      </div>
    </article>
  );
}
