import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Heart, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { AvatarStack } from '../components/AvatarStack';
import { JoinSheet } from '../components/JoinSheet';
import type { Activity } from '../domain/types';
import { useQiahao } from '../state/QiahaoContext';
import { CommentSection } from '../components/CommentSection';

export function ActivityDetail({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const { joinedIds, savedIds, joinActivity, toggleSaved } = useQiahao();
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const joined = joinedIds.has(activity.id);
  const saved = savedIds.has(activity.id);

  return (
    <main className="page detail-page">
      <div className="detail-media">
        <img src={activity.image} alt={`${activity.title}活动场景`} />
        <div className="detail-media__bar">
          <button type="button" className="icon-button floating-button" aria-label="返回" onClick={onBack}><ArrowLeft size={21} /></button>
          <button type="button" className={`icon-button floating-button${saved ? ' is-active' : ''}`} aria-label={`${saved ? '取消收藏' : '收藏'}${activity.title}`} onClick={() => toggleSaved(activity.id)}>
            <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="detail-content">
        <span className="category-label">{activity.category}</span>
        <h1>{activity.title}</h1>
        <div className="detail-facts">
          <div><CalendarDays size={20} /><span><small>日期</small><strong>{activity.dateLabel}</strong></span></div>
          <div><Clock3 size={20} /><span><small>时间</small><strong>{activity.time}</strong></span></div>
          <div><MapPin size={20} /><span><small>集合</small><strong>{activity.location} · {activity.distance}</strong></span></div>
        </div>

        <section className="detail-section">
          <h2>关于这次活动</h2>
          <p>{activity.description}</p>
        </section>

        <section className="detail-section">
          <div className="section-title-row"><h2>发起人</h2><span>已通过实名认证</span></div>
          <div className="host-row">
            <img src={activity.host.avatar} alt={activity.host.name} />
            <div><strong>{activity.host.name} {activity.host.verified && <CheckCircle2 size={15} />}</strong><p>{activity.host.bio ?? '认真生活，也认真对待每一次见面。'}</p></div>
            <button type="button" className="secondary-button secondary-button--compact">打招呼</button>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-title-row"><h2>已经加入</h2><span>{activity.participants.length}/{activity.capacity} 人</span></div>
          <div className="participant-row"><AvatarStack users={activity.participants} max={5} /><span><UsersRound size={16} />还差 {Math.max(activity.capacity - activity.participants.length, 0)} 人成行</span></div>
        </section>

        <section className="safety-panel">
          <ShieldCheck size={21} />
          <div><strong>见面小提示</strong><p>{activity.note ?? '请选择公共场所集合，并提前确认彼此的行程。'}</p></div>
        </section>

        <CommentSection contentType="activity" contentId={activity.id} title="活动评论" />
      </div>

      <div className="detail-action">
        <div><span>{activity.price === 0 ? '免费参加' : `¥${activity.price}`}</span>{activity.price > 0 && <small>/ 人</small>}</div>
        <button type="button" className="primary-button" disabled={joined} onClick={() => setShowJoinSheet(true)}>
          {joined ? '已申请' : '申请加入'}
        </button>
      </div>

      {showJoinSheet && (
        <JoinSheet
          activity={activity}
          onCancel={() => setShowJoinSheet(false)}
          onConfirm={() => { joinActivity(activity.id); setShowJoinSheet(false); }}
        />
      )}
    </main>
  );
}

