import { ArrowLeft, Bookmark, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ClubActivity, Need } from '../club/types';
import { clubActivities } from '../club/seed';
import { useQiahao } from '../state/QiahaoContext';
import { CommentSection } from '../components/CommentSection';

export function NeedDetailPage({
  need,
  onBack,
  onOpenActivity,
  focusComments = false,
}: {
  need: Need;
  onBack: () => void;
  onOpenActivity?: (activity: ClubActivity) => void;
  focusComments?: boolean;
}) {
  const { toggleContentSaved, toggleContentResonance } = useQiahao();
  const saved = Boolean(need.saved);
  const resonated = Boolean(need.resonated);

  const resonanceCount = need.resonance + (resonated ? 1 : 0);
  const [commentCount, setCommentCount] = useState(need.comments);
  const hasResponse = Boolean(need.responseActivityId);
  const responseCount = hasResponse ? 1 : 0;
  const responseActivity = hasResponse
    ? clubActivities.find((item) => item.id === need.responseActivityId)
    : undefined;
  const statsEmpty = resonanceCount === 0 && commentCount === 0 && responseCount === 0;

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`need-${need.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [focusComments, need.id]);

  function handleViewActivity() {
    if (!responseActivity || !onOpenActivity) return;
    onOpenActivity(responseActivity);
  }

  return (
    <main className="need-detail page">
      <div className="need-detail-media">
        <img src={need.image} alt="" />
        <button type="button" aria-label="返回" onClick={onBack}>
          <ArrowLeft />
        </button>
      </div>
      <div className="need-detail-content">
        <small>
          {need.author} · {need.subtitle}
        </small>
        <h1>{need.title}</h1>
        <p>{need.copy}</p>
        <div className="club-tags">
          {need.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <section className={`need-response${statsEmpty ? ' is-empty' : ''}`}>
          <header>
            <h2>这张需求正在发生什么</h2>
            <span className={hasResponse ? 'is-active' : 'is-waiting'}>
              {hasResponse ? '有人接住' : '还在等回应'}
            </span>
          </header>
          <div className="need-response-stats" aria-label="需求互动数据">
            <b className={resonanceCount === 0 ? 'is-zero' : undefined}>
              {resonanceCount}
              <small>人共鸣</small>
            </b>
            <b className={commentCount === 0 ? 'is-zero' : undefined}>
              {commentCount}
              <small>条评论</small>
            </b>
            <b className={responseCount === 0 ? 'is-zero' : undefined}>
              {responseCount}
              <small>场回应</small>
            </b>
          </div>
          {hasResponse ? (
            <div className="need-response-link">
              <span>有活动回应了 · {need.response}</span>
              <button type="button" onClick={handleViewActivity} disabled={!responseActivity}>
                查看
              </button>
            </div>
          ) : (
            <div className="need-empty-panel need-empty-panel--inline" aria-disabled="true">
              <strong>还没有活动回应</strong>
              <span>收藏这张需求，之后有合适的活动，我们会通知你</span>
            </div>
          )}
        </section>

        <CommentSection
          contentType="need"
          contentId={need.id}
          title="大家怎么说"
          onCountChange={setCommentCount}
        />

        <div className="need-detail-actions">
          <button
            type="button"
            className={resonated ? 'is-active' : ''}
            onClick={() => toggleContentResonance('need', need.id)}
          >
            <Heart size={18} />
            {resonated ? '已共鸣' : '我也有'}
          </button>
          <button
            type="button"
            className={saved ? 'is-active' : ''}
            onClick={() => toggleContentSaved('need', need.id)}
          >
            <Bookmark size={18} />
            {saved ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </main>
  );
}
