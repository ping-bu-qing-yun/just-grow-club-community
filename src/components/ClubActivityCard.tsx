import { ArrowUpRight, MapPin, UsersRound } from 'lucide-react';
import type { ClubActivity } from '../club/types';

export function ClubActivityCard({
  activity,
  matchLabel,
  onOpen,
}: {
  activity: ClubActivity;
  /** 推荐引擎动态匹配标签；缺省用活动自身 matchLabel */
  matchLabel?: string;
  onOpen?: (activity: ClubActivity) => void;
}) {
  function open() {
    onOpen?.(activity);
  }

  const badge = matchLabel ?? activity.matchLabel;

  return (
    <article className="club-activity-card">
      <button type="button" className="club-activity-media" onClick={open} aria-label={`打开${activity.title}`}>
        <img src={activity.image} alt="" />
        <span>{activity.status}</span>
      </button>
      <div className="club-activity-copy">
        <div className="club-tags">
          {badge ? <span className="club-tag-match">{badge}</span> : null}
          {activity.tags.slice(0, badge ? 2 : 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <button
          type="button"
          className="club-activity-title"
          onClick={open}
          aria-label={`查看${activity.title}详情`}
        >
          <h3>{activity.title}</h3>
          <ArrowUpRight size={18} aria-hidden />
        </button>
        <p>{activity.description}</p>
        <div className="club-activity-meta">
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
      </div>
    </article>
  );
}
