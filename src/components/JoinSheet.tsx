import { ShieldCheck } from 'lucide-react';
import type { Activity } from '../domain/types';
import { Sheet } from './Sheet';

export function JoinSheet({ activity, onCancel, onConfirm }: {
  activity: Activity;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet label="确认加入活动" onClose={onCancel}>
        <span className="sheet-icon"><ShieldCheck size={25} /></span>
        <h2>确认加入这个活动？</h2>
        <p>{activity.dateLabel} {activity.time}，在{activity.location}见。</p>
        <div className="sheet-note">首次见面请在公共场所集合，行程有变化及时在消息里沟通。</div>
        <button type="button" className="primary-button primary-button--wide" onClick={onConfirm}>确认申请</button>
    </Sheet>
  );
}

