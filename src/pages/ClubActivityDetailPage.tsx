import { Archive, ArrowLeft, Heart, Pencil, Save, Share2, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ClubActivity } from '../club/types';
import { useQiahao } from '../state/QiahaoContext';
import { DislikeReasonSheet } from '../components/FeedbackReasonSheet';
import { CommentSection } from '../components/CommentSection';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { shareActivity } from '../lib/activityShare';
import { Sheet } from '../components/Sheet';
import styles from './ClubActivityDetailPage.module.css';

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
  focusComments = false,
}: {
  activity: ClubActivity;
  onBack: () => void;
  onNotice?: (message: string) => void;
  focusComments?: boolean;
}) {
  const { businessConfig, localMode, user, savedIds, joinedIds, toggleSaved, joinActivity, cancelActivity, updateActivity, archiveActivity, changeActivityLifecycle, setActivityInterest } = useQiahao();
  const saved = savedIds.has(activity.id);
  const joined = joinedIds.has(activity.id);
  const [showJoinSheet, setShowJoinSheet] = useState(false);
  const [feedback, setFeedback] = useState<'consider' | 'dislike' | null>(null);
  const [showDislikeReasons, setShowDislikeReasons] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    title: activity.title,
    category: activity.categoryKey ?? '',
    description: activity.description,
    dateLabel: activity.date,
    time: activity.timeRange.match(/\b\d{2}:\d{2}\b/)?.[0] ?? '19:00',
    location: activity.location,
    capacity: Number.parseInt(activity.people, 10) || 4,
    price: Number.parseInt(activity.fee.replace(/[^\d]/g, ''), 10) || 0,
  });
  const canManage = user?.role === 'operator' || Boolean(user && activity.hostId === user.id);
  const categoryOptions = businessConfig?.activityCategories ?? [];
  const historicalCategory = draft.category && !categoryOptions.some((category) => category.key === draft.category)
    ? [{ key: draft.category, label: activity.tags[0] ?? draft.category }]
    : [];

  const feeLabel = activity.fee === '免费' ? '免费参加' : activity.fee;
  const needsText = activity.needs.join('、');
  const peopleText = `${activity.people}${activity.people.includes('男女') ? '' : '，男女比例尽量均衡'}`;

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`activity-${activity.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [activity.id, focusComments]);

  function handleConsider() {
    setFeedback('consider');
    onNotice?.('已记下你的考虑，稍后可在消息里提醒你');
    void setActivityInterest(activity.id, 'consider').catch(() => {
      setFeedback(null);
      onNotice?.('暂时无法保存活动意向，请稍后重试');
    });
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
    void setActivityInterest(activity.id, 'not_interested').catch(() => {
      setFeedback(null);
      onNotice?.('暂时无法保存活动意向，请稍后重试');
    });
  }

  const previewReasons = [
    ['want_attendees', '想看看来的人'], ['too_blind_date', '怕太像相亲'], ['time_conflict', '时间不合适'],
    ['too_far', '地点有点远'], ['group_size', '人数有顾虑'], ['topic_mismatch', '话题没击中'],
  ].map(([key, label]) => ({ key, label }));
  const dislikeReasons = businessConfig?.feedbackOptions
    .filter((item) => item.groupKey === 'activity_dislike_reason')
    .map(({ key, label }) => ({ key, label })) ?? (localMode ? previewReasons : []);

  function handleDislikeReasonSelect(reasonKey: string, reasonLabel: string) {
    setShowDislikeReasons(false);
    setFeedback('dislike');
    onNotice?.(`已记下不考虑：${reasonLabel}`);
    void setActivityInterest(activity.id, 'not_interested', reasonKey).catch(() => {
      setFeedback(null);
      onNotice?.('暂时无法保存活动意向，请稍后重试');
    });
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

  async function saveChanges() {
    setPending(true);
    setError('');
    try {
      const { category, ...unchangedCategoryDraft } = draft;
      await updateActivity(activity.id, category === activity.categoryKey ? unchangedCategoryDraft : draft);
      setEditing(false);
      onNotice?.('活动信息已更新');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '活动保存失败');
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    setError('');
    try {
      await archiveActivity(activity.id, '主理人或运营归档');
      onBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '活动归档失败');
      setPending(false);
    }
  }

  async function promoteToFormal() {
    setPending(true);
    setError('');
    try {
      await changeActivityLifecycle(activity.id, 'formal');
      onNotice?.('活动已转为正式活动');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '活动状态更新失败');
    } finally {
      setPending(false);
    }
  }

  async function toggleParticipation() {
    if (!joined) {
      setShowJoinSheet(true);
      return;
    }
    setPending(true);
    setError('');
    try {
      await cancelActivity(activity.id);
      onNotice?.('已取消报名或预约');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '取消报名失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`page ${styles.detail}`}>
      <div className={styles.media}>
        <img src={activity.image} alt={`${activity.title}活动场景`} />
        <div className={styles.mediaBar}>
          <button type="button" className={styles.floatingButton} aria-label="返回" onClick={onBack}>
            <ArrowLeft size={21} />
          </button>
          <div className={styles.mediaActions}>
            <button
              type="button"
              className={styles.floatingButton}
              aria-label={`分享${activity.title}`}
              disabled={sharing}
              onClick={() => void handleShare()}
            >
              <Share2 size={20} />
            </button>
            <button
              type="button"
              className={`${styles.floatingButton} ${saved ? styles.floatingActive : ''}`}
              aria-label={`${saved ? '取消收藏' : '收藏'}${activity.title}`}
              onClick={() => {
                toggleSaved(activity.id);
                onNotice?.(saved ? '已取消收藏' : '已收藏活动');
              }}
            >
              <Heart size={20} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {canManage ? (
          <div className={styles.ownerActions}>
            <Button variant="secondary" size="sm" icon={<Pencil size={15} />} onClick={() => setEditing((value) => !value)}>
              {editing ? '取消编辑' : '编辑'}
            </Button>
            {user?.role === 'operator' && activity.status === '预活动' ? (
              <Button variant="secondary" size="sm" icon={<Save size={15} />} disabled={pending} onClick={() => void promoteToFormal()}>
                转为正式
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" icon={<Archive size={15} />} disabled={pending} onClick={() => void archive()}>
              归档
            </Button>
          </div>
        ) : null}
        {editing ? (
          <section className={styles.inlineEditor}>
            <Input label="活动标题" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
            <Select label="活动分类" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
              {[...historicalCategory, ...categoryOptions].map((category) => (
                <option value={category.key} key={category.key}>
                  {category.label}{historicalCategory.includes(category) ? '（已停用）' : ''}
                </option>
              ))}
            </Select>
            <Textarea label="活动介绍" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={5} />
            <Input label="日期说明" value={draft.dateLabel} onChange={(event) => setDraft((current) => ({ ...current, dateLabel: event.target.value }))} />
            <Input label="开始时间" type="time" value={draft.time} onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value }))} />
            <Input label="地点" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
            <Input label="人数" type="number" min={2} max={50} value={draft.capacity} onChange={(event) => setDraft((current) => ({ ...current, capacity: Number(event.target.value) }))} />
            <Input label="费用" type="number" min={0} value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))} />
            <Button icon={<Save size={15} />} disabled={pending} onClick={() => void saveChanges()}>
              {pending ? '保存中…' : '保存修改'}
            </Button>
          </section>
        ) : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.labelRow}>
          {activity.matchLabel && <Badge tone="brand">{activity.matchLabel}</Badge>}
          <Badge>{activity.status}</Badge>
        </div>
        <h1 className={styles.title}>{activity.title}</h1>
        <p className={styles.pitch}>{activity.pitch || activity.description}</p>

        <section className={styles.infoRows} aria-label="活动关键信息">
          <div className={styles.infoRow}>
            <b>解决需求</b>
            <span>{needsText}</span>
          </div>
          <div className={styles.infoRow}>
            <b>时间</b>
            <span>{activity.timeRange || activity.date}</span>
          </div>
          <div className={styles.infoRow}>
            <b>地点</b>
            <span>{activity.location}</span>
          </div>
          <div className={styles.infoRow}>
            <b>人数结构</b>
            <span>{peopleText}</span>
          </div>
          <div className={styles.infoRow}>
            <b>费用</b>
            <span>{activity.fee === '免费' ? '免费参加' : `共创支持 ${activity.fee}，含轻餐/茶饮`}</span>
          </div>
          <div className={styles.infoRow}>
            <b>来的人</b>
            <span>{activity.audience}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2>活动怎么进行</h2>
          <ol className={styles.flow}>
            {activity.flow.map((step) => (
              <li className={styles.flowStep} key={step.title}>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.safety}>
          <ShieldCheck size={21} />
          <div>
            <strong>参与边界</strong>
            <p>{activity.boundary}</p>
          </div>
        </section>

        <CommentSection contentType="activity" contentId={activity.id} title="活动评论" />

        <div className={styles.secondaryActions}>
          <Button
            variant="secondary"
            className={feedback === 'consider' ? styles.feedbackActive : ''}
            aria-pressed={feedback === 'consider'}
            onClick={handleConsider}
          >
            考虑
          </Button>
          <Button
            variant="secondary"
            className={feedback === 'dislike' ? styles.feedbackActive : ''}
            aria-pressed={feedback === 'dislike'}
            onClick={handleDislike}
          >
            不考虑
          </Button>
        </div>
      </div>

      <div className={styles.action}>
        <div className={styles.actionPrice}>
          <span>{feeLabel}</span>
          {activity.fee !== '免费' && <small>/ 人</small>}
        </div>
        <Button disabled={pending} onClick={() => void toggleParticipation()}>
          {joined ? (activity.status === '预活动' ? '取消预约' : '取消报名') : activity.status === '预活动' ? '预约兴趣' : '报名'}
        </Button>
      </div>

      {showJoinSheet && (
        <Sheet label="确认报名" onClose={() => setShowJoinSheet(false)} className={styles.joinSheet}>
          <span className={styles.sheetIcon}>
            <ShieldCheck size={25} />
          </span>
          <h2 className={styles.sheetTitle}>{activity.status === '预活动' ? '确认预约这个预活动？' : '确认报名这个活动？'}</h2>
          <p className={styles.sheetMeta}>
            {activity.timeRange || activity.date}，在{activity.location}见。
          </p>
          <div className={styles.sheetNote}>
            费用 {activity.fee}
            {activity.fee !== '免费' ? ' · ' : '。'}
            {activity.boundary}
          </div>
          <Button
            wide
            onClick={() => {
              joinActivity(activity.id);
              setShowJoinSheet(false);
              onNotice?.(activity.status === '预活动' ? '已记下你的兴趣' : '报名成功，可在「我的」查看');
            }}
          >
            {activity.status === '预活动' ? '确认预约' : '确认报名'}
          </Button>
        </Sheet>
      )}

      {showDislikeReasons && (
        <DislikeReasonSheet
          options={dislikeReasons}
          onSelect={handleDislikeReasonSelect}
          onClose={() => setShowDislikeReasons(false)}
        />
      )}
    </main>
  );
}
