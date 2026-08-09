import { Heart } from 'lucide-react';
import { clubActivities } from '../club/seed';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { ActivityCard } from '../components/ActivityCard';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { useQiahao } from '../state/QiahaoContext';

export function SavedPage({
  onExplore,
  onOpenActivity,
  onOpenClubActivity,
  clubActivityOptions = clubActivities,
}: {
  onExplore: () => void;
  onOpenActivity: (id: string) => void;
  onOpenClubActivity?: (activity: ClubActivity) => void;
  clubActivityOptions?: ClubActivity[];
}) {
  const { activities, savedIds, toggleSaved } = useQiahao();
  const { state } = useClub();
  const savedDomain = activities.filter((activity) => savedIds.has(activity.id));
  const savedClub = clubActivityOptions.filter((activity) => state.savedClubActivityIds.includes(activity.id));
  const empty = savedDomain.length === 0 && savedClub.length === 0;

  return (
    <main className="page standard-page">
      <header className="page-header">
        <span className="eyebrow">SAVED</span>
        <h1>我的心愿</h1>
        <p>把想去的地方，留给刚刚好的时间。</p>
      </header>
      {!empty ? (
        <div className="activity-list club-card-list">
          {savedClub.map((activity) => (
            <ClubActivityCard key={activity.id} activity={activity} onOpen={onOpenClubActivity} />
          ))}
          {savedDomain.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              saved
              onOpen={onOpenActivity}
              onToggleSaved={toggleSaved}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state empty-state--tall">
          <div className="empty-state__mark">
            <Heart size={24} />
          </div>
          <h3>还没有收藏活动</h3>
          <p>遇到感兴趣的活动，点一下心形就会出现在这里。</p>
          <button type="button" className="primary-button" onClick={onExplore}>
            去发现
          </button>
        </div>
      )}
    </main>
  );
}
