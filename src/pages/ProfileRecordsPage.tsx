import { ArrowLeft } from 'lucide-react';
import type { ClubActivity, Need } from '../club/types';
import { useQiahao } from '../state/QiahaoContext';
import { NeedCard } from '../components/NeedCard';
import { ClubActivityCard } from '../components/ClubActivityCard';
import { domainActivityToClub } from '../club/activity-adapter';
import styles from './ProfileRecordsPage.module.css';

export function ProfileRecordsPage({
  kind,
  onBack,
  onOpenNeed,
  onOpenClubActivity,
}: {
  kind: string;
  onBack: () => void;
  onOpenNeed?: (need: Need) => void;
  onOpenClubActivity?: (activity: ClubActivity) => void;
}) {
  const { activities, needs, savedIds, joinedIds } = useQiahao();

  let title = '我的记录';
  let content: React.ReactNode;

  if (kind === 'saved-needs') {
    title = '需求收藏';
    const items = needs.filter((item) => item.saved);
    content = items.length ? (
      items.map((item) => (
        <NeedCard
          key={item.id}
          need={item}
          onOpen={(need) => onOpenNeed?.(need)}
        />
      ))
    ) : (
      <div className={styles.empty}>
        <h3>还没有收藏需求</h3>
        <p>在需求广场共鸣或收藏后，会出现在这里。</p>
      </div>
    );
  } else if (kind === 'attended') {
    title = '参加过活动';
    const items = activities.filter((item) => joinedIds.has(item.id)).map(domainActivityToClub);
    content =
      items.length ? (
        <div className={styles.cardList}>
          {items.map((item) => (
            <ClubActivityCard key={item.id} activity={item} onOpen={onOpenClubActivity} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>这里还没有记录</h3>
          <p>报名或收藏活动后，会自动出现在这里。</p>
        </div>
      );
  } else {
    title = '活动收藏';
    const items = activities.filter((item) => savedIds.has(item.id)).map(domainActivityToClub);
    content =
      items.length ? (
        <div className={styles.cardList}>
          {items.map((item) => (
            <ClubActivityCard key={item.id} activity={item} onOpen={onOpenClubActivity} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>这里还没有记录</h3>
          <p>报名或收藏活动后，会自动出现在这里。</p>
        </div>
      );
  }

  return (
    <main className={`${styles.page} page`}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="返回" onClick={onBack}>
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
