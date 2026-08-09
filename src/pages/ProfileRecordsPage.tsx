import { ArrowLeft } from 'lucide-react';
import { clubActivities, seedNeeds } from '../club/seed';
import type { ClubActivity, Need } from '../club/types';
import { useClub } from '../club/ClubContext';
import { useQiahao } from '../state/QiahaoContext';
import { NeedCard } from '../components/NeedCard';
import { ClubActivityCard } from '../components/ClubActivityCard';

export function ProfileRecordsPage({
  kind,
  onBack,
  onOpenNeed,
  onOpenClubActivity,
  clubActivityOptions = clubActivities,
}: {
  kind: string;
  onBack: () => void;
  onOpenNeed?: (need: Need) => void;
  onOpenClubActivity?: (activity: ClubActivity) => void;
  clubActivityOptions?: ClubActivity[];
}) {
  const { state } = useClub();
  const { activities, savedIds, joinedIds } = useQiahao();

  let title = '我的记录';
  let content: React.ReactNode;

  if (kind === 'saved-needs') {
    title = '需求收藏';
    const items = seedNeeds.filter((item) => state.savedNeedIds.includes(item.id));
    content = items.length ? (
      items.map((item) => (
        <NeedCard
          key={item.id}
          need={item}
          onOpen={(need) => onOpenNeed?.(need)}
        />
      ))
    ) : (
      <div className="empty-state">
        <h3>还没有收藏需求</h3>
        <p>在需求广场共鸣或收藏后，会出现在这里。</p>
      </div>
    );
  } else if (kind === 'attended') {
    title = '参加过活动';
    const domainItems = activities.filter((item) => joinedIds.has(item.id));
    const clubItems = clubActivityOptions.filter((item) => state.joinedClubActivityIds.includes(item.id));
    content =
      domainItems.length || clubItems.length ? (
        <div className="record-list club-card-list">
          {clubItems.map((item) => (
            <ClubActivityCard key={item.id} activity={item} onOpen={onOpenClubActivity} />
          ))}
          {domainItems.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt="" />
              <div>
                <small>{item.dateLabel}</small>
                <h3>{item.title}</h3>
                <p>{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>这里还没有记录</h3>
          <p>报名或收藏活动后，会自动出现在这里。</p>
        </div>
      );
  } else {
    title = '活动收藏';
    const domainItems = activities.filter((item) => savedIds.has(item.id));
    const clubItems = clubActivityOptions.filter((item) => state.savedClubActivityIds.includes(item.id));
    content =
      domainItems.length || clubItems.length ? (
        <div className="record-list club-card-list">
          {clubItems.map((item) => (
            <ClubActivityCard key={item.id} activity={item} onOpen={onOpenClubActivity} />
          ))}
          {domainItems.map((item) => (
            <article key={item.id}>
              <img src={item.image} alt="" />
              <div>
                <small>{item.dateLabel}</small>
                <h3>{item.title}</h3>
                <p>{item.location}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>这里还没有记录</h3>
          <p>报名或收藏活动后，会自动出现在这里。</p>
        </div>
      );
  }

  return (
    <main className="records-page page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <small>我的记录</small>
          <h1>{title}</h1>
        </div>
      </header>
      {content}
    </main>
  );
}
