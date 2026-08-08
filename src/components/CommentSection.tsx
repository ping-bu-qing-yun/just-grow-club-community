import { LoaderCircle, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CommentContentType } from '../api/types';
import { useQiahaoOptional } from '../state/QiahaoContext';
import { type CommentApi, type CommentViewer, useComments } from '../hooks/useComments';

const localViewer: CommentViewer = {
  id: 'me',
  name: '小恰',
  avatar: '/assets/avatar-me.jpg',
  role: 'operator',
};

function canDeleteComment(viewer: CommentViewer | null, authorId: string): boolean {
  return Boolean(viewer && (viewer.id === authorId || viewer.role === 'operator' || viewer.role === 'admin'));
}

function formatCommentTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const delta = Date.now() - date.getTime();
  if (delta >= 0 && delta < 60_000) return '刚刚';
  if (delta >= 0 && delta < 3_600_000) return `${Math.max(1, Math.floor(delta / 60_000))}分钟前`;
  if (delta >= 0 && delta < 86_400_000) return `${Math.max(1, Math.floor(delta / 3_600_000))}小时前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function CommentSection({
  contentType,
  contentId,
  title = '大家怎么说',
  onCountChange,
  apiClient,
  viewer: viewerProp,
  localMode: localModeProp,
}: {
  contentType: CommentContentType;
  contentId: string;
  title?: string;
  onCountChange?: (count: number) => void;
  apiClient?: CommentApi;
  viewer?: CommentViewer | null;
  localMode?: boolean;
}) {
  const qiahao = useQiahaoOptional();
  const localMode = localModeProp ?? qiahao?.localMode ?? !qiahao;
  const viewer = viewerProp === undefined
    ? qiahao?.user ?? (localMode ? localViewer : null)
    : viewerProp;
  const {
    comments,
    total,
    viewState,
    loading,
    loadingMore,
    submitting,
    deletingIds,
    error,
    canToggle,
    create,
    remove,
    expand,
    collapse,
    retry,
  } = useComments({ contentType, contentId, apiClient, localMode, viewer });
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!loading) onCountChange?.(total);
  }, [loading, onCountChange, total]);

  async function submit() {
    const created = await create(body);
    if (created) setBody('');
  }

  return (
    <section className="comment-section" id={`${contentType}-${contentId}-comments`} aria-label={`${title}评论区`}>
      <header className="comment-section__header">
        <h2>{title}</h2>
        {!loading && <span aria-label={`共${total}条评论`}>{total} 条</span>}
      </header>

      {loading ? (
        <div className="comment-section__state" role="status">
          <LoaderCircle size={18} className="comment-section__spinner" aria-hidden />
          正在加载评论
        </div>
      ) : comments.length === 0 ? (
        <div className="need-empty-panel comment-section__empty" aria-disabled="true">
          <strong>还没有评论</strong>
          <span>第一个说点什么吧</span>
        </div>
      ) : (
        <ul className="comment-section__list" aria-label="评论列表" aria-busy={loadingMore}>
          {comments.map((comment) => (
            <li key={comment.id} className="comment-section__item">
              {comment.author.avatar ? (
                <img src={comment.author.avatar} alt="" className="comment-section__avatar" />
              ) : (
                <span className="comment-section__avatar comment-section__avatar--initial" aria-hidden>
                  {comment.author.name.slice(0, 1)}
                </span>
              )}
              <div className="comment-section__copy">
                <div>
                  <strong>{comment.author.name}</strong>
                  <time dateTime={comment.createdAt}>{formatCommentTime(comment.createdAt)}</time>
                </div>
                <p>{comment.body}</p>
              </div>
              {canDeleteComment(viewer, comment.author.id) && (
                <button
                  type="button"
                  className="comment-section__delete"
                  aria-label={`删除${comment.author.name}的评论`}
                  disabled={deletingIds.has(comment.id)}
                  onClick={() => void remove(comment)}
                >
                  {deletingIds.has(comment.id) ? <LoaderCircle size={15} className="comment-section__spinner" /> : <Trash2 size={15} />}
                  <span>删除</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canToggle && (
        <button
          type="button"
          className="comment-section__toggle"
          onClick={() => void (viewState === 'expanded' ? collapse() : expand())}
          disabled={loadingMore}
          aria-label={viewState === 'expanded' ? '收起评论' : '展开更多评论'}
        >
          <MessageCircle size={16} aria-hidden />
          {loadingMore ? '正在加载全部评论' : viewState === 'expanded' ? '收起评论' : '展开全部评论'}
        </button>
      )}

      <form
        className="comment-section__composer"
        aria-label="发表评论"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="sr-only" htmlFor={`${contentType}-${contentId}-comment-body`}>评论内容</label>
        <textarea
          id={`${contentType}-${contentId}-comment-body`}
          value={body}
          maxLength={500}
          disabled={submitting}
          onChange={(event) => setBody(event.target.value)}
          placeholder={viewer ? '说点什么…' : '登录后可以发表评论'}
        />
        <button type="submit" aria-label="发布评论" disabled={submitting || !body.trim()}>
          {submitting ? <LoaderCircle size={17} className="comment-section__spinner" /> : <Send size={17} />}
        </button>
      </form>

      {error && (
        <div className="comment-section__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void retry()}>重试</button>
        </div>
      )}
    </section>
  );
}
