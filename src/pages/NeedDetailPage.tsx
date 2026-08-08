import { ArrowLeft, Bookmark, Heart, MessageCircle } from 'lucide-react';
import type { ClubActivity, Need } from '../club/types';
import { clubActivities } from '../club/seed';
import { useClub } from '../club/ClubContext';

export function NeedDetailPage({
  need,
  onBack,
  onOpenActivity,
}: {
  need: Need;
  onBack: () => void;
  onOpenActivity?: (activity: ClubActivity) => void;
}) {
  const { state, toggleNeedSaved, toggleNeedResonance } = useClub();
  const saved = state.savedNeedIds.includes(need.id);
  const resonated = state.resonatedNeedIds.includes(need.id);

  const resonanceCount = need.resonance + (resonated ? 1 : 0);
  const commentCount = need.comments;
  const hasResponse = Boolean(need.responseActivityId);
  const responseCount = hasResponse ? 1 : 0;
  const responseActivity = hasResponse
    ? clubActivities.find((item) => item.id === need.responseActivityId)
    : undefined;
  const statsEmpty = resonanceCount === 0 && commentCount === 0 && responseCount === 0;
  const commentsEmpty = commentCount === 0;

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

        <section className={`need-comments${commentsEmpty ? ' is-empty' : ''}`}>
          <h2>大家怎么说</h2>
          {commentsEmpty ? (
            <div className="need-empty-panel" aria-disabled="true">
              <strong>还没有评论</strong>
              <span>第一个说点什么吧</span>
            </div>
          ) : (
            <>
              <article>
                <span>林</span>
                <p>我也是，不想被安排认识谁，但愿意在合适的场景里自然认识。</p>
              </article>
              <article>
                <span>M</span>
                <p>如果人数少一点、地点近一点，我会想参加。</p>
              </article>
              <button type="button">
                <MessageCircle size={16} />
                展开更多评论
              </button>
            </>
          )}
        </section>

        <div className="need-detail-actions">
          <button
            type="button"
            className={resonated ? 'is-active' : ''}
            onClick={() => toggleNeedResonance(need.id)}
          >
            <Heart size={18} />
            {resonated ? '已共鸣' : '我也有'}
          </button>
          <button
            type="button"
            className={saved ? 'is-active' : ''}
            onClick={() => toggleNeedSaved(need.id)}
          >
            <Bookmark size={18} />
            {saved ? '已收藏' : '收藏'}
          </button>
        </div>
      </div>
    </main>
  );
}
