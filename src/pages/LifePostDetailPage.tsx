import { Archive, ArrowLeft, Bookmark, Heart, Pencil, Save, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LifePost } from '../club/types';
import { CommentSection } from '../components/CommentSection';
import { useQiahao } from '../state/QiahaoContext';

export function LifePostDetailPage({
  post,
  onBack,
  focusComments = false,
}: {
  post: LifePost;
  onBack: () => void;
  focusComments?: boolean;
}) {
  const { user, updateLifePost, archiveLifePost, toggleContentSaved, toggleContentResonance } = useQiahao();
  const [commentCount, setCommentCount] = useState(post.comments);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(post.text);
  const [image, setImage] = useState(post.images[0] ?? '');
  const [tag, setTag] = useState(post.tag.replace(/^#/, ''));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const canManage = user?.role === 'operator' || Boolean(user && post.authorId === user.id);

  async function saveChanges() {
    setPending(true);
    setError('');
    try {
      await updateLifePost(post.id, body, image || undefined, tag.trim() ? [tag.trim()] : []);
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '生活动态保存失败');
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    setError('');
    try {
      await archiveLifePost(post.id);
      onBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '生活动态归档失败');
      setPending(false);
    }
  }

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`life-${post.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [focusComments, post.id]);

  return (
    <main className="life-detail page">
      <header className="subpage-header life-detail__header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>生活动态</small><h1>看见彼此的日常</h1></div>
      </header>
      {post.images[0] ? <img className="life-detail__hero" src={post.images[0]} alt="" /> : null}
      <div className="life-detail__content">
        {canManage ? <div className="content-owner-actions"><button type="button" onClick={() => setEditing((value) => !value)}><Pencil size={15} />{editing ? '取消编辑' : '编辑'}</button><button type="button" disabled={pending} onClick={() => void archive()}><Archive size={15} />归档</button></div> : null}
        <div className="life-detail__author">
          <span aria-hidden>{post.author.slice(0, 1)}</span>
          <div><strong>{post.author}</strong><small>{post.meta}</small></div>
          <em>{post.kind}</em>
        </div>
        {editing ? <section className="content-inline-editor"><label>动态内容<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} /></label><label>图片地址<input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://… 或 /assets/…" /></label><label>标签<input value={tag} onChange={(event) => setTag(event.target.value)} /></label><button type="button" className="primary-button" disabled={pending || !body.trim()} onClick={() => void saveChanges()}><Save size={15} />{pending ? '保存中…' : '保存修改'}</button></section> : <p className="life-detail__body">{post.text}</p>}
        {error ? <p className="field-error" role="alert">{error}</p> : null}
        {post.images.length > 1 && (
          <div className="life-detail__images">
            {post.images.slice(1).map((image) => <img src={image} alt="" key={image} />)}
          </div>
        )}
        <strong className="life-detail__tag">{post.tag}</strong>
        <div className="life-detail__actions">
          <button type="button" aria-label="分享生活动态"><Share2 size={17} />分享</button>
          <button type="button" className={post.resonated ? 'is-active' : ''} aria-label={post.resonated ? '取消共鸣生活动态' : '共鸣生活动态'} onClick={() => toggleContentResonance('life', post.id)}><Heart size={17} fill={post.resonated ? 'currentColor' : 'none'} />共鸣 {post.resonance}</button>
          <button type="button" className={post.saved ? 'is-active' : ''} aria-label={post.saved ? '取消收藏生活动态' : '收藏生活动态'} onClick={() => toggleContentSaved('life', post.id)}><Bookmark size={17} fill={post.saved ? 'currentColor' : 'none'} />{post.saved ? '已收藏' : '收藏'}</button>
          <span aria-label={`共${commentCount}条评论`}>评论 {commentCount}</span>
        </div>
        <CommentSection
          contentType="life"
          contentId={post.id}
          title="大家怎么说"
          onCountChange={setCommentCount}
        />
      </div>
    </main>
  );
}
