import { Heart, MapPin } from 'lucide-react';
import type { Activity } from '../domain/types';
import { AvatarStack } from './AvatarStack';

interface ActivityCardProps {
  activity: Activity;
  saved: boolean;
  onOpen: (activityId: string) => void;
  onToggleSaved: (activityId: string) => void;
}

export function ActivityCard({ activity, saved, onOpen, onToggleSaved }: ActivityCardProps) {
  const remaining = Math.max(activity.capacity - activity.participants.length, 0);

  return (
    <article className="activity-card">
      <button
        type="button"
        className="activity-card__image-button"
        onClick={() => onOpen(activity.id)}
        aria-label={`查看${activity.title}`}
      >
        <span className="activity-card__image-wrap">
          <img
            src={activity.image}
            alt={`${activity.title}活动现场`}
            onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
          />
          <span className="activity-card__category">{activity.category}</span>
        </span>
      </button>
      <button
        type="button"
        className={`icon-button activity-card__save${saved ? ' is-active' : ''}`}
        aria-label={`${saved ? '取消收藏' : '收藏'}${activity.title}`}
        onClick={() => onToggleSaved(activity.id)}
      >
        <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <div className="activity-card__body">
        <p className="activity-card__date">{activity.dateLabel} · {activity.time}</p>
        <button type="button" className="text-button activity-card__title" onClick={() => onOpen(activity.id)}>
          <h3>{activity.title}</h3>
        </button>
        <p className="activity-card__place"><MapPin size={14} />{activity.location} · {activity.distance}</p>
        <div className="activity-card__footer">
          <div className="activity-card__people">
            <AvatarStack users={activity.participants} />
            <span>还差 {remaining} 人</span>
          </div>
          <strong>{activity.price === 0 ? '免费' : `¥${activity.price}/人`}</strong>
        </div>
      </div>
    </article>
  );
}

