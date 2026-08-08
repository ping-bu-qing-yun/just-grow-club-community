import { ArrowUpRight, MapPin, UsersRound } from 'lucide-react';
import type { ClubActivity } from '../club/types';

export function ClubActivityCard({
  activity,
  onOpen,
}: {
  activity: ClubActivity;
  onOpen?: (activity: ClubActivity) => void;
}) {
  function open() {
    onOpen?.(activity);
  }

  return (
    <article className="club-activity-card">
      <button type="button" className="club-activity-media" onClick={open} aria-label={`打开${activity.title}`}>
        <img src={activity.image} alt="" />
        <span>{activity.status}</span>
      </button>
      <div className="club-activity-copy">
        <div className="club-tags">
          {activity.tags.slice(0, 3).map((tag) => (
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
