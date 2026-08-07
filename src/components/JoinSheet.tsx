import { ShieldCheck, X } from 'lucide-react';
import type { Activity } from '../domain/types';

export function JoinSheet({ activity, onCancel, onConfirm }: {
  activity: Activity;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="sheet-backdrop" onMouseDown={onCancel}>
      <section
        className="bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="确认加入活动"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={onCancel}><X size={20} /></button>
        <span className="sheet-icon"><ShieldCheck size={25} /></span>
        <h2>确认加入这个活动？</h2>
        <p>{activity.dateLabel} {activity.time}，在{activity.location}见。</p>
        <div className="sheet-note">首次见面请在公共场所集合，行程有变化及时在消息里沟通。</div>
        <button type="button" className="primary-button primary-button--wide" onClick={onConfirm}>确认申请</button>
      </section>
    </div>
  );
}

