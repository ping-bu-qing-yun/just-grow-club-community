import { ShieldCheck } from 'lucide-react';
import type { Activity } from '../domain/types';
import { Sheet } from './Sheet';
import { Button } from './ui/Button';
import styles from './JoinSheet.module.css';

export function JoinSheet({ activity, onCancel, onConfirm }: {
  activity: Activity;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPreActivity = activity.lifecycle === 'pre';
  return (
    <Sheet label="确认加入活动" onClose={onCancel} className={styles.sheet}>
      <span className={styles.icon}><ShieldCheck size={25} /></span>
      <h2 className={styles.title}>{isPreActivity ? '确认预约这个预活动？' : '确认报名这个活动？'}</h2>
      <p className={styles.meta}>{activity.dateLabel} {activity.time}，在{activity.location}见。</p>
      <div className={styles.note}>首次见面请在公共场所集合，行程有变化及时在消息里沟通。</div>
      <Button wide onClick={onConfirm}>{isPreActivity ? '确认预约' : '确认报名'}</Button>
    </Sheet>
  );
}
