import { ArrowLeft, Heart, Share2, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { DislikeReasonSheet } from '../components/FeedbackReasonSheet';
import { CommentSection } from '../components/CommentSection';
import { shareActivity } from '../lib/activityShare';

const DISLIKE_COUNT_KEY = 'qiahao-dislike-count';
/** 前 3 次「不考虑」只记数；第 4 次起弹出原因选择 */
const DISLIKE_REASON_THRESHOLD = 4;

function readDislikeCount(): number {
  try {
    const raw = window.localStorage.getItem(DISLIKE_COUNT_KEY);
    const value = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeDislikeCount(count: number) {
  try {
    window.localStorage.setItem(DISLIKE_COUNT_KEY, String(count));
  } catch {
    /* ignore quota / private mode */
  }
}

export function ClubActivityDetailPage({
  activity,
  onBack,
  onNotice,
}: {
  activity: ClubActivity;
  onBack: () => void;
  onNotice?: (message: string) => void;
}) {
  const { isClubActivitySaved, isClubActivityJoined, toggleClubActivitySaved, joinClubActivity } = useClub();
  const saved = isClubActivitySaved(activity.id);
  const joined = isClubActivityJoined(activity.id);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [feedback, setFeedback] = useState<'consider' | 'dislike' | null>(null);
  const [showDislikeReasons, setShowDislikeReasons] = useState(false);
  const [sharing, setSharing] = useState(false);

  const feeLabel = activity.fee === '免费' ? '免费参加' : activity.fee;
  const needsText = activity.needs.join('、');
  const peopleText = `${activity.people}${activity.people.includes('男女') ? '' : '，男女比例尽量均衡'}`;

  function handleConsider() {
    setFeedback('consider');
    onNotice?.('已记下你的考虑，稍后可在消息里提醒你');
  }

  function handleDislike() {
    const nextCount = readDislikeCount() + 1;
    writeDislikeCount(nextCount);

    if (nextCount >= DISLIKE_REASON_THRESHOLD) {
      setShowDislikeReasons(true);
      return;
    }

    setFeedback('dislike');
    onNotice?.(`已记下不考虑（${nextCount}/3），会少推相似活动`);
  }

  function handleDislikeReasonSelect(reason: string) {
    setShowDislikeReasons(false);
    setFeedback('dislike');
    onNotice?.(`已记下不考虑：${reason}`);
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareActivity(activity);
      onNotice?.(result === 'shared' ? '已打开系统分享' : '分享链接已复制');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onNotice?.('暂时无法分享，请稍后重试');
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="page detail-page">
      <div className="detail-media">
        <img src={activity.image} alt={`${activity.title}活动场景`} />
        <div className="detail-media__bar">
          <button type="button" className="icon-button floating-button" aria-label="返回" onClick={onBack}>
            <ArrowLeft size={21} />
          </button>
          <div className="detail-media__actions">
            <button
              type="button"
              className="icon-button floating-button"
              aria-label={`分享${activity.title}`}
              disabled={sharing}
              onClick={() => void handleShare()}
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              className={`icon-button floating-button${saved ? ' is-active' : ''}`}
              aria-label={`${saved ? '取消收藏' : '收藏'}${activity.title}`}
              onClick={() => {
                toggleClubActivitySaved(activity.id);
                onNotice?.(saved ? '已取消收藏' : '已收藏活动');
              }}
            >
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-label-row">
          {activity.matchLabel && <span className="category-label">{activity.matchLabel}</span>}
          <span className="category-label category-label--muted">{activity.status}</span>
        </div>
        <h1>{activity.title}</h1>
        <p className="detail-pitch">{activity.pitch || activity.description}</p>

        <section className="detail-info-rows" aria-label="活动关键信息">
          <div className="info-row">
            <b>解决需求</b>
            <span>{needsText}</span>
          </div>
          <div className="info-row">
            <b>时间</b>
            <span>{activity.timeRange || activity.date}</span>
          </div>
          <div className="info-row">
            <b>地点</b>
            <span>{activity.location}</span>
          </div>
          <div className="info-row">
            <b>人数结构</b>
            <span>{peopleText}</span>
          </div>
          <div className="info-row">
            <b>费用</b>
            <span>{activity.fee === '免费' ? '免费参加' : `共创支持 ${activity.fee}，含轻餐/茶饮`}</span>
          </div>
          <div className="info-row">
            <b>来的人</b>
            <span>{activity.audience}</span>
          </div>
        </section>

        <section className="detail-section">
          <h2>活动怎么进行</h2>
          <ol className="detail-flow">
            {activity.flow.map((step) => (
              <li className="detail-flow-step" key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="safety-panel">
          <ShieldCheck size={21} />
          <div>
            <strong>参与边界</strong>
            <p>{activity.boundary}</p>
          </div>
        </section>

        <CommentSection contentType="activity" contentId={activity.id} title="活动评论" />

        <div className="detail-secondary-actions">
          <button
            type="button"
            className={`secondary-button${feedback === 'consider' ? ' is-active' : ''}`}
            aria-pressed={feedback === 'consider'}
            onClick={handleConsider}
          >
            考虑
          </button>
          <button
            type="button"
            className={`secondary-button${feedback === 'dislike' ? ' is-active' : ''}`}
            aria-pressed={feedback === 'dislike'}
            onClick={handleDislike}
          >
            不考虑
          </button>
        </div>
      </div>

      <div className="detail-action">
        <div>
          <span>{feeLabel}</span>
          {activity.fee !== '免费' && <small>/ 人</small>}
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={joined}
          onClick={() => setShowJoinSheet(true)}
        >
          {joined ? '已报名' : activity.status === '预活动' ? '预约兴趣' : '报名'}
        </button>
      </div>

      {showJoinSheet && (
        <div className="sheet-backdrop" onMouseDown={() => setShowJoinSheet(false)}>
          <section
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="确认报名"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <button
              type="button"
              className="icon-button sheet-close"
              aria-label="关闭"
              onClick={() => setShowJoinSheet(false)}
            >
              <X size={20} />
            </button>
            <span className="sheet-icon">
              <ShieldCheck size={25} />
            </span>
            <h2>{activity.status === '预活动' ? '确认预约这个预活动？' : '确认报名这个活动？'}</h2>
            <p>
              {activity.timeRange || activity.date}，在{activity.location}见。
            </p>
            <div className="sheet-note">
              费用 {activity.fee}
              {activity.fee !== '免费' ? ' · ' : '。'}
              {activity.boundary}
            </div>
            <button
              type="button"
              className="primary-button primary-button--wide"
              onClick={() => {
                joinClubActivity(activity.id);
                setShowJoinSheet(false);
                onNotice?.(activity.status === '预活动' ? '已记下你的兴趣' : '报名成功，可在「我的」查看');
              }}
            >
              {activity.status === '预活动' ? '确认预约' : '确认报名'}
            </button>
          </section>
        </div>
      )}

      {showDislikeReasons && (
        <DislikeReasonSheet
          onSelect={handleDislikeReasonSelect}
          onClose={() => setShowDislikeReasons(false)}
        />
      )}
    </main>
  );
}
