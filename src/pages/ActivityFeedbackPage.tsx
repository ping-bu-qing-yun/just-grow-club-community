import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import type { ClubActivity } from '../club/types';

const moods = ['舒服自然', '有点紧张', '收获很大', '一般般', '不太合适'] as const;

export function ActivityFeedbackPage({
  activity,
  onBack,
  onSubmitted,
}: {
  activity: ClubActivity;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const [mood, setMood] = useState<(typeof moods)[number] | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!mood) {
      setError('先选一个整体感受');
      return;
    }
    onSubmitted();
  }

  return (
    <main className="create-need page activity-feedback-page">
      <header className="subpage-header">
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
        <div>
          <small>活动反馈</small>
          <h1>这场见面怎么样？</h1>
        </div>
      </header>

      <section className="activity-feedback-summary">
        <img src={activity.image} alt="" />
        <div>
          <strong>{activity.title}</strong>
          <p>
            {activity.date} · {activity.location}
          </p>
        </div>
      </section>

      <p className="create-need-lead">你的反馈只会用于改进推荐和活动设计，不会公开给其他参与者。</p>

      <div className="tag-picks" role="group" aria-label="整体感受">
        {moods.map((item) => (
          <button
            key={item}
            type="button"
            className={mood === item ? 'is-active' : ''}
            onClick={() => {
              setMood(item);
              setError('');
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        aria-label="补充感受"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="可选：哪里舒服、哪里有压力、还想遇见怎样的人……"
      />
      {error ? <p className="field-error">{error}</p> : null}

      <button type="button" className="primary-button primary-button--wide" onClick={submit}>
        提交反馈
      </button>
    </main>
  );
}
