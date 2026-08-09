import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { ClubActivity } from '../club/types';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useQiahao } from '../state/QiahaoContext';
import styles from './ActivityFeedbackPage.module.css';

const previewMoods = [
  ['comfortable', '舒服自然'], ['nervous', '有点紧张'], ['rewarding', '收获很大'], ['neutral', '一般般'], ['not_suitable', '不太合适'],
].map(([key, label], sortOrder) => ({ groupKey: 'activity_mood', key, label, description: '', enabled: true, sortOrder, updatedAt: '' }));

export function ActivityFeedbackPage({
  activity,
  onBack,
  onSubmitted,
}: {
  activity: ClubActivity;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const { businessConfig, localMode, submitActivityFeedback } = useQiahao();
  const moods = (businessConfig?.feedbackOptions ?? (localMode ? previewMoods : [])).filter((item) => item.groupKey === 'activity_mood');
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!mood) {
      setError('先选一个整体感受');
      return;
    }
    setPending(true);
    setError('');
    try {
      await submitActivityFeedback(activity.id, mood, note);
      onSubmitted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '反馈提交失败');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={`${styles.page} page`}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <small>活动反馈</small>
          <h1>这场见面怎么样？</h1>
        </div>
      </header>

      <section className={styles.summary}>
        <img src={activity.image} alt="" />
        <div>
          <strong>{activity.title}</strong>
          <p>
            {activity.date} · {activity.location}
          </p>
        </div>
      </section>

      <p className={styles.lead}>你的反馈只会用于改进推荐和活动设计，不会公开给其他参与者。</p>

      <div className={styles.moods} role="group" aria-label="整体感受">
        {moods.map((item) => (
          <button
            key={item.key}
            type="button"
            className={mood === item.key ? styles.active : ''}
            onClick={() => {
              setMood(item.key);
              setError('');
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Textarea
        aria-label="补充感受"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="可选：哪里舒服、哪里有压力、还想遇见怎样的人……"
      />
      {error ? <p className={styles.error}>{error}</p> : null}

      <Button wide disabled={pending} onClick={() => void submit()} className={styles.submit}>
        {pending ? '提交中…' : '提交反馈'}
      </Button>
    </main>
  );
}
