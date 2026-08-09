import { ArrowLeft, Heart, Pencil, Share2, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ClubActivity } from '../club/types';
import { useClub } from '../club/ClubContext';
import { getClubActivityStats } from '../club/activityStats';
import { CancelReasonSheet, CONSIDER_REASONS, DISLIKE_REASONS } from '../components/FeedbackReasonSheet';
import { CommentSection } from '../components/CommentSection';
import { shareActivity } from '../lib/activityShare';

export function ClubActivityDetailPage({
  activity,
  onBack,
  onNotice,
  focusComments = false,
  canEdit = false,
  onUpdate,
}: {
  activity: ClubActivity;
  onBack: () => void;
  onNotice?: (message: string) => void;
  focusComments?: boolean;
  canEdit?: boolean;
  onUpdate?: (activity: ClubActivity) => void;
}) {
  const { state, isClubActivitySaved, isClubActivityJoined, isClubActivityWaitlisted, toggleClubActivitySaved, joinClubActivity, waitlistClubActivity, cancelClubActivity, dislikeClubActivity, saveClubActivityConsideration, markReservationCommented } = useClub();
  const saved = isClubActivitySaved(activity.id);
  const joined = isClubActivityJoined(activity.id);
  const waitlisted = isClubActivityWaitlisted(activity.id);
  const isPreActivity = activity.status === '预活动';
  const consideredReasons = state.consideredClubActivityReasons[activity.id] ?? [];
  const disliked = state.dislikedClubActivityIds.includes(activity.id);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [showCancelReasons, setShowCancelReasons] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: activity.title,
    description: activity.description,
    timeRange: activity.timeRange,
    location: activity.location,
    people: activity.people,
    fee: activity.fee,
  });
  const [feedback, setFeedback] = useState<'consider' | 'dislike' | null>(disliked ? 'dislike' : consideredReasons.length ? 'consider' : null);
  const [sharing, setSharing] = useState(false);
  const [autoReservationCommentKey, setAutoReservationCommentKey] = useState('');

  const feeLabel = activity.fee === '免费' ? '免费参加' : activity.fee;
  const needsText = activity.needs.join('、');
  const peopleText = `${activity.people}${activity.people.includes('男女') ? '' : '，男女比例尽量均衡'}`;
  const stats = getClubActivityStats(activity, joined);
  const isFullForViewer = !joined && !isPreActivity && stats.isFull;
  const actionLabel = isPreActivity ? '预约' : '报名';
  const joinedLabel = isPreActivity ? '已预约' : '已报名';
  const statsActionLabel = isPreActivity ? '人已预约' : '人已报名';

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`activity-${activity.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [activity.id, focusComments]);

  useEffect(() => {
    setEditDraft({
      title: activity.title,
      description: activity.description,
      timeRange: activity.timeRange,
      location: activity.location,
      people: activity.people,
      fee: activity.fee,
    });
  }, [activity.description, activity.fee, activity.location, activity.people, activity.timeRange, activity.title]);

  function handleConsider() {
    setFeedback('consider');
    if (!consideredReasons.length) {
      saveClubActivityConsideration(activity.id, []);
    }
    onNotice?.('可以点选你正在考虑的因素');
  }

  function handleDislike() {
    setFeedback('dislike');
    onNotice?.('请选择一个不喜欢原因');
  }

  function handleDislikeReasonSelect(reason: string) {
    dislikeClubActivity(activity.id);
    setFeedback('dislike');
    onNotice?.(`已记下不喜欢：${reason}`);
    requestAnimationFrame(onBack);
  }

  function handleCancelReasonSelect(reason: string) {
    cancelClubActivity(activity.id, reason);
    setShowCancelReasons(false);
    onNotice?.(`已取消${actionLabel}：${reason}`);
  }

  function toggleConsiderReason(reason: string) {
    const next = consideredReasons.includes(reason)
      ? consideredReasons.filter((item) => item !== reason)
      : [...consideredReasons, reason];
    saveClubActivityConsideration(activity.id, next);
    setFeedback('consider');
    onNotice?.(next.length ? '已更新考虑要素' : '已清空考虑要素');
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

  function saveActivityEdit() {
    const nextTitle = editDraft.title.trim();
    const nextDescription = editDraft.description.trim();
    if (!nextTitle || !nextDescription) {
      onNotice?.('标题和活动介绍不能为空');
      return;
    }
    onUpdate?.({
      ...activity,
      title: nextTitle,
      description: nextDescription,
      pitch: nextDescription,
      timeRange: editDraft.timeRange.trim() || activity.timeRange,
      date: editDraft.timeRange.trim() || activity.date,
      location: editDraft.location.trim() || activity.location,
      people: editDraft.people.trim() || activity.people,
      fee: editDraft.fee.trim() || activity.fee,
    });
    setShowEditSheet(false);
    onNotice?.('活动信息已更新');
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
            {canEdit ? (
              <button
                type="button"
                className="icon-button floating-button"
                aria-label="编辑活动"
                onClick={() => setShowEditSheet(true)}
              >
                <Pencil size={19} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-label-row">
          {activity.matchLabel && <span className="category-label">{activity.matchLabel}</span>}
          <span className="category-label category-label--muted">{activity.status}</span>
        </div>
        <h1>{activity.title}</h1>
        <div className="activity-stat-line activity-stat-line--detail">{stats.views}看过｜{stats.joined}{statsActionLabel}</div>
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

        <CommentSection
          contentType="activity"
          contentId={activity.id}
          title="活动评论"
          autoComment={autoReservationCommentKey ? '希望活动快速落地。' : undefined}
          autoCommentKey={autoReservationCommentKey}
          onAutoCommented={() => markReservationCommented(activity.id)}
        />

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
            不喜欢
          </button>
        </div>
        {feedback === 'consider' ? (
          <section className="consider-panel" aria-label="考虑要素">
            <header>
              <b>你在考虑什么？</b>
              <span>{consideredReasons.length ? `已选 ${consideredReasons.length}` : '可多选'}</span>
            </header>
            <div>
              {CONSIDER_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  className={consideredReasons.includes(reason) ? 'is-active' : ''}
                  onClick={() => toggleConsiderReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {feedback === 'dislike' ? (
          <section className="consider-panel dislike-panel" aria-label="不喜欢原因">
            <header>
              <b>为什么不喜欢？</b>
              <span>选完返回</span>
            </header>
            <div>
              {DISLIKE_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => handleDislikeReasonSelect(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="detail-action">
        <div>
          <span>{feeLabel}</span>
          {activity.fee !== '免费' && <small>/ 人</small>}
        </div>
        <div className="detail-action__buttons">
          {joined ? (
            <button type="button" className="secondary-button secondary-button--compact" onClick={() => setShowCancelReasons(true)}>
              取消{actionLabel}
            </button>
          ) : null}
          {isFullForViewer ? (
            <button
              type="button"
              className="secondary-button secondary-button--compact waitlist-button"
              disabled={waitlisted}
              onClick={() => {
                waitlistClubActivity(activity.id);
                onNotice?.('已加入捡漏，若有人取消会第一时间通知你');
              }}
            >
              {waitlisted ? '已捡漏' : '捡漏'}
            </button>
          ) : null}
          <button
            type="button"
            className={`primary-button${isFullForViewer ? ' is-full' : ''}`}
            disabled={joined || isFullForViewer}
            onClick={() => {
              if (isFullForViewer) {
                onNotice?.('这场活动已满员，会优先推荐还可报名的活动');
                return;
              }
              setShowJoinSheet(true);
            }}
          >
            {isFullForViewer ? '已满员' : joined ? joinedLabel : actionLabel}
          </button>
        </div>
      </div>

      {showJoinSheet && (
        <div className="sheet-backdrop" onMouseDown={() => setShowJoinSheet(false)}>
          <section
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`确认${actionLabel}`}
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
            <h2>{isPreActivity ? '确认预约这个预活动？' : '确认报名这个活动？'}</h2>
            <p>
              {isPreActivity ? '这场还在设计中，预约会让小CC更快判断是否落地。' : `${activity.timeRange || activity.date}，在${activity.location}见。`}
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
                if (isPreActivity && !state.reservationCommentedActivityIds.includes(activity.id)) {
                  setAutoReservationCommentKey(`${activity.id}-${Date.now()}`);
                }
                setShowJoinSheet(false);
                onNotice?.(isPreActivity ? '已预约，并在评论区表达希望活动快速落地' : '报名成功，可在「我的」查看');
              }}
            >
              确认{actionLabel}
            </button>
          </section>
        </div>
      )}

      {showCancelReasons && (
        <CancelReasonSheet
          actionLabel={`取消${actionLabel}`}
          onSelect={handleCancelReasonSelect}
          onClose={() => setShowCancelReasons(false)}
        />
      )}
      {showEditSheet ? (
        <div className="sheet-backdrop" onMouseDown={() => setShowEditSheet(false)}>
          <section
            className="bottom-sheet activity-edit-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="编辑活动信息"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />
            <button type="button" className="icon-button sheet-close" aria-label="关闭" onClick={() => setShowEditSheet(false)}>
              <X size={20} />
            </button>
            <h2>编辑活动信息</h2>
            <label><span>标题</span><input value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label><span>介绍</span><textarea value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <label><span>时间</span><input value={editDraft.timeRange} onChange={(event) => setEditDraft((current) => ({ ...current, timeRange: event.target.value }))} /></label>
            <label><span>地点</span><input value={editDraft.location} onChange={(event) => setEditDraft((current) => ({ ...current, location: event.target.value }))} /></label>
            <div className="activity-edit-grid">
              <label><span>人数</span><input value={editDraft.people} onChange={(event) => setEditDraft((current) => ({ ...current, people: event.target.value }))} /></label>
              <label><span>费用</span><input value={editDraft.fee} onChange={(event) => setEditDraft((current) => ({ ...current, fee: event.target.value }))} /></label>
            </div>
            <button type="button" className="primary-button primary-button--wide" onClick={saveActivityEdit}>保存修改</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
