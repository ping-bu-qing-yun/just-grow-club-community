import { ArrowLeft, Archive, Bookmark, Heart, Pencil, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ClubActivity, Need } from '../club/types';
import { useQiahao } from '../state/QiahaoContext';
import { CommentSection } from '../components/CommentSection';
import { domainActivityToClub } from '../club/activity-adapter';

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
  const { activities, user, updateNeed, archiveNeed, toggleContentSaved, toggleContentResonance } = useQiahao();
  const saved = Boolean(need.saved);
  const resonated = Boolean(need.resonated);

  const resonanceCount = need.resonance;
  const [commentCount, setCommentCount] = useState(need.comments);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(need.copy);
  const [tags, setTags] = useState(need.tags.join('，'));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'operator' || Boolean(user && need.authorId === user.id);
  const hasResponse = Boolean(need.responseActivityId);
  const responseCount = hasResponse ? 1 : 0;
  const responseActivity = hasResponse
    ? activities.find((item) => item.id === need.responseActivityId)
    : undefined;
  const statsEmpty = resonanceCount === 0 && commentCount === 0 && responseCount === 0;

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`need-${need.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [focusComments, need.id]);

  function handleViewActivity() {
    if (!responseActivity || !onOpenActivity) return;
    onOpenActivity(domainActivityToClub(responseActivity));
  }

  async function saveChanges() {
    setPending(true);
    setError('');
    try {
      await updateNeed(need.id, body, tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean));
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '需求保存失败');
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    setError('');
    try {
      await archiveNeed(need.id);
      onBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '需求归档失败');
      setPending(false);
    }
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
        {canManage ? <div className="content-owner-actions"><button type="button" onClick={() => setEditing((value) => !value)}><Pencil size={15} />{editing ? '取消编辑' : '编辑'}</button><button type="button" disabled={pending} onClick={() => void archive()}><Archive size={15} />归档</button></div> : null}
        {editing ? <section className="content-inline-editor"><label>需求内容<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} /></label><label>标签（逗号分隔）<input value={tags} onChange={(event) => setTags(event.target.value)} /></label><button type="button" className="primary-button" disabled={pending || !body.trim()} onClick={() => void saveChanges()}><Save size={15} />{pending ? '保存中…' : '保存修改'}</button></section> : <><h1>{need.title}</h1><p>{need.copy}</p></>}
        {error ? <p className="field-error" role="alert">{error}</p> : null}
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
