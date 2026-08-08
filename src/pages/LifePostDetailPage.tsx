import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LifePost } from '../club/types';
import { CommentSection } from '../components/CommentSection';

export function LifePostDetailPage({
  post,
  onBack,
  focusComments = false,
}: {
  post: LifePost;
  onBack: () => void;
  focusComments?: boolean;
}) {
  const [commentCount, setCommentCount] = useState(post.comments);

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
          <button type="button" aria-label="分享生活动态"><Share2 size={17} />分享</button>
          <button type="button" aria-label="共鸣生活动态"><Heart size={17} />共鸣 {post.resonance}</button>
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
