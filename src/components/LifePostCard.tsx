import { Heart, MessageCircle, Share2 } from 'lucide-react';
import type { LifePost } from '../club/types';
import { useClub } from '../club/ClubContext';

async function shareLifePost(post: LifePost) {
  const text = `${post.author} 在恰好分享：${post.text}`;
  if (navigator.share) {
    await navigator.share({ title: '恰好生活动态', text });
    return 'shared';
  }
  await navigator.clipboard?.writeText(text);
  return 'copied';
}

export function LifePostCard({
  post,
  onOpen,
  onNotice,
}: {
  post: LifePost;
  onOpen?: (post: LifePost, focusComments?: boolean) => void;
  onNotice?: (message: string) => void;
}) {
  const { toggleLifeAuthorFollow, toggleLifePostResonance, isLifeAuthorFollowed, isLifePostResonated } = useClub();
  const followed = isLifeAuthorFollowed(post.author);
  const resonated = isLifePostResonated(post.id);
  const resonance = post.resonance + (resonated ? 1 : 0);

  async function handleShare() {
    try {
      const result = await shareLifePost(post);
      onNotice?.(result === 'shared' ? '已打开系统分享' : '生活动态已复制');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onNotice?.('暂时无法分享，请稍后重试');
    }
  }

  return (
    <article className="life-post">
      <header>
        <span aria-hidden>{post.author.slice(0, 1)}</span>
        <div><b>{post.author}</b><small>{post.meta}</small></div>
        <button
          type="button"
          className={followed ? 'is-active' : undefined}
          aria-pressed={followed}
          onClick={() => {
            toggleLifeAuthorFollow(post.author);
            onNotice?.(followed ? '已取消关注' : '已关注，后续会多推荐Ta的动态');
          }}
        >
          {followed ? '已关注' : '关注'}
        </button>
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
        <button type="button" aria-label="分享生活动态" onClick={() => void handleShare()}><Share2 size={16} aria-hidden />分享</button>
        <button type="button" aria-label={`查看${post.author}的评论`} onClick={() => onOpen?.(post, true)}><MessageCircle size={16} aria-hidden />评论 {post.comments}</button>
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
          <Heart size={16} aria-hidden fill={resonated ? 'currentColor' : 'none'} />共鸣 {resonance}
        </button>
      </footer>
    </article>
  );
}
