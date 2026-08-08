import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { LifePost } from '../club/types';

export function LifePostCard({
  post,
  onOpen,
}: {
  post: LifePost;
  onOpen?: (post: LifePost, focusComments?: boolean) => void;
}) {
  return (
    <article className="life-post">
      <header>
        <span aria-hidden>{post.author.slice(0, 1)}</span>
        <div><b>{post.author}</b><small>{post.meta}</small></div>
        <button type="button">关注</button>
      </header>
      <button type="button" className="life-post__open" onClick={() => onOpen?.(post)}>
        <em>{post.kind}</em>
        <p>{post.text}</p>
      </button>
      <div className="life-post-images">
        {post.images.map((image) => <img src={image} alt="" key={image} />)}
      </div>
      <strong>{post.tag}</strong>
      <footer>
        <button type="button" aria-label="分享生活动态"><Share2 size={16} aria-hidden />分享</button>
        <button type="button" aria-label={`查看${post.author}的评论`} onClick={() => onOpen?.(post, true)}><MessageCircle size={16} aria-hidden />评论 {post.comments}</button>
        <button type="button" aria-label="共鸣生活动态"><Heart size={16} aria-hidden />共鸣 {post.resonance}</button>
      </footer>
    </article>
  );
}
