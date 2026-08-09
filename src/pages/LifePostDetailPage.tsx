import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LifePost } from '../club/types';
import { CommentSection } from '../components/CommentSection';
import { useClub } from '../club/ClubContext';

async function shareLifePost(post: LifePost) {
  const text = `${post.author} 在恰好分享：${post.text}`;
  if (navigator.share) {
    await navigator.share({ title: '恰好生活动态', text });
    return 'shared';
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  const input = document.createElement('input');
  input.value = text;
  input.setAttribute('readonly', 'true');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  return 'copied';
}

export function LifePostDetailPage({
  post,
  onBack,
  onNotice,
  focusComments = false,
}: {
  post: LifePost;
  onBack: () => void;
  onNotice?: (message: string) => void;
  focusComments?: boolean;
}) {
  const { toggleLifePostResonance, isLifePostResonated } = useClub();
  const [commentCount, setCommentCount] = useState(post.comments);
  const [sharing, setSharing] = useState(false);
  const resonated = isLifePostResonated(post.id);
  const resonance = post.resonance + (resonated ? 1 : 0);

  useEffect(() => {
    if (!focusComments) return;
    const comments = document.getElementById(`life-${post.id}-comments`);
    comments?.scrollIntoView?.({ block: 'start' });
  }, [focusComments, post.id]);

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await shareLifePost(post);
      onNotice?.(result === 'shared' ? '已打开系统分享' : '生活动态已复制');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onNotice?.('暂时无法分享，请稍后重试');
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="life-detail page">
      <header className="subpage-header life-detail__header">
        <button type="button" aria-label="返回" onClick={onBack}><ArrowLeft /></button>
        <div><small>生活动态</small><h1>看见彼此的日常</h1></div>
      </header>
      {post.images[0] ? <img className="life-detail__hero" src={post.images[0]} alt="" /> : null}
      <div className="life-detail__content">
        <div className="life-detail__author">
          <span aria-hidden>{post.author.slice(0, 1)}</span>
          <div><strong>{post.author}</strong><small>{post.meta}</small></div>
          <em>{post.kind}</em>
        </div>
        <p className="life-detail__body">{post.text}</p>
        {post.images.length > 1 && (
          <div className="life-detail__images">
            {post.images.slice(1).map((image) => <img src={image} alt="" key={image} />)}
          </div>
        )}
        <strong className="life-detail__tag">{post.tag}</strong>
        <div className="life-detail__actions">
          <button type="button" aria-label="分享生活动态" disabled={sharing} onClick={() => void handleShare()}><Share2 size={17} />分享</button>
          <button
            type="button"
            className={resonated ? 'is-active' : undefined}
            aria-pressed={resonated}
            aria-label="共鸣生活动态"
            onClick={() => {
              toggleLifePostResonance(post.id);
              onNotice?.(resonated ? '已取消共鸣' : '已共鸣');
            }}
          >
            <Heart size={17} fill={resonated ? 'currentColor' : 'none'} />共鸣 {resonance}
          </button>
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
