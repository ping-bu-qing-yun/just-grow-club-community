import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ApiComment, CommentContentType, CommentPage, QiahaoApi } from '../api/types';
import { localCommentsFor } from '../comments/local-comments';

export type CommentViewState = 'preview' | 'expanded';
export type CommentApi = Pick<QiahaoApi, 'listComments' | 'createComment' | 'deleteComment'>;

type CommentCacheEntry = {
  comments: ApiComment[];
  total: number;
  nextCursor: string | null;
};

export type CommentViewer = {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
};

function mergeComments(current: ApiComment[], incoming: ApiComment[]): ApiComment[] {
  const byId = new Map(current.map((comment) => [comment.id, comment]));
  for (const comment of incoming) byId.set(comment.id, comment);
  // The API already returns the stable created_at/id order. Preserve that
  // order while appending cursor pages and locally-created comments.
  return [...byId.values()];
}

function localPage(comments: ApiComment[], cursor: string | null | undefined, limit: number): CommentPage {
  const offset = cursor ? Number(cursor) : 0;
  const start = Number.isInteger(offset) && offset >= 0 ? offset : 0;
  const page = comments.slice(start, start + limit);
  const nextOffset = start + page.length;
  return {
    comments: page,
    total: comments.length,
    nextCursor: nextOffset < comments.length ? String(nextOffset) : null,
  };
}

function localComment(contentType: CommentContentType, contentId: string, body: string, viewer: CommentViewer): ApiComment {
  const createdAt = new Date().toISOString();
  return {
    id: `local-comment-${contentType}-${contentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentType,
    contentId,
    author: { id: viewer.id, name: viewer.name, avatar: viewer.avatar ?? '' },
    body,
    createdAt,
    updatedAt: createdAt,
  };
}

export function useComments({
  contentType,
  contentId,
  apiClient = api,
  localMode = false,
  viewer,
}: {
  contentType: CommentContentType;
  contentId: string;
  apiClient?: CommentApi;
  localMode?: boolean;
  viewer: CommentViewer | null;
}) {
  const key = `${contentType}:${contentId}`;
  const cacheRef = useRef(new Map<string, CommentCacheEntry>());
  const localEntriesRef = useRef(new Map<string, ApiComment[]>());
  if (localMode && !localEntriesRef.current.has(key)) {
    localEntriesRef.current.set(key, localCommentsFor(contentType, contentId));
  }
  if (localMode && !cacheRef.current.has(key)) {
    const initial = localPage(localEntriesRef.current.get(key) ?? [], null, 5);
    cacheRef.current.set(key, { comments: initial.comments, total: initial.total, nextCursor: initial.nextCursor });
  }
  const [entry, setEntry] = useState<CommentCacheEntry | null>(() => cacheRef.current.get(key) ?? null);
  const [entryKey, setEntryKey] = useState(key);
  const [viewState, setViewState] = useState<CommentViewState>('preview');
  const [loading, setLoading] = useState(() => !localMode);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const activeEntry = entryKey === key ? entry : cacheRef.current.get(key) ?? null;
  const entryRef = useRef<CommentCacheEntry | null>(null);
  entryRef.current = activeEntry;

  const readPage = useCallback(async (cursor?: string | null, limit = 5): Promise<CommentPage> => {
    if (!localMode) return apiClient.listComments({ contentType, contentId, limit, cursor });
    let local = localEntriesRef.current.get(key);
    if (!local) {
      local = localCommentsFor(contentType, contentId);
      localEntriesRef.current.set(key, local);
    }
    return localPage(local, cursor, limit);
  }, [apiClient, contentId, contentType, key, localMode]);

  const saveEntry = useCallback((next: CommentCacheEntry) => {
    cacheRef.current.set(key, next);
    entryRef.current = next;
    setEntry(next);
    setEntryKey(key);
  }, [key]);

  const loadPreview = useCallback(async (force = false) => {
    setViewState('preview');
    setError(null);
    if (!force) {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setEntry(cached);
        setEntryKey(key);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const page = await readPage(null, 5);
      saveEntry({ comments: page.comments, total: page.total, nextCursor: page.nextCursor });
    } catch (reason) {
      setEntry(null);
      setError(reason instanceof Error ? reason.message : '评论加载失败');
    } finally {
      setLoading(false);
    }
  }, [key, readPage, saveEntry]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const expand = useCallback(async () => {
    const current = entryRef.current;
    if (!current || loadingMore) return;
    setViewState('expanded');
    setError(null);
    if (!current.nextCursor) return;
    setLoadingMore(true);
    try {
      let next = current;
      let cursor: string | null = current.nextCursor;
      const seen = new Set<string>();
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const page = await readPage(cursor, 100);
        next = {
          comments: mergeComments(next.comments, page.comments),
          total: page.total,
          nextCursor: page.nextCursor,
        };
        cursor = page.nextCursor;
      }
      saveEntry(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '展开评论失败');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, readPage, saveEntry]);

  const collapse = useCallback(() => {
    setViewState('preview');
  }, []);

  const create = useCallback(async (rawBody: string): Promise<boolean> => {
    const body = rawBody.trim();
    if (!body || body.length > 500) {
      setError('评论内容不能为空且不能超过 500 字');
      return false;
    }
    if (!viewer) {
      setError('请先登录后再发表评论');
      return false;
    }
    setSubmitting(true);
    setError(null);
    try {
      const comment = localMode
        ? localComment(contentType, contentId, body, viewer)
        : (await apiClient.createComment({ contentType, contentId, body })).comment;
      if (localMode) {
        const currentLocal = localEntriesRef.current.get(key) ?? [];
        localEntriesRef.current.set(key, [comment, ...currentLocal.filter((item) => item.id !== comment.id)]);
      }
      const current = entryRef.current ?? { comments: [], total: 0, nextCursor: null };
      saveEntry({
        comments: [...current.comments.filter((item) => item.id !== comment.id), comment],
        total: current.total + 1,
        nextCursor: current.nextCursor,
      });
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '发表评论失败');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [apiClient, contentId, contentType, key, localMode, saveEntry, viewer]);

  const remove = useCallback(async (comment: ApiComment): Promise<boolean> => {
    if (!viewer) {
      setError('请先登录后再删除评论');
      return false;
    }
    setDeletingIds((current) => new Set(current).add(comment.id));
    setError(null);
    try {
      if (localMode) {
        const local = localEntriesRef.current.get(key) ?? [];
        localEntriesRef.current.set(key, local.filter((item) => item.id !== comment.id));
      } else {
        await apiClient.deleteComment(comment.id);
      }
      const current = entryRef.current;
      if (current) {
        saveEntry({
          comments: current.comments.filter((item) => item.id !== comment.id),
          total: Math.max(0, current.total - 1),
          nextCursor: current.nextCursor,
        });
      }
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '删除评论失败');
      return false;
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(comment.id);
        return next;
      });
    }
  }, [apiClient, key, localMode, saveEntry, viewer]);

  const comments = useMemo(() => {
    const all = activeEntry?.comments ?? [];
    return viewState === 'preview' ? all.slice(0, 5) : all;
  }, [activeEntry?.comments, viewState]);

  return {
    comments,
    total: activeEntry?.total ?? 0,
    viewState,
    loading,
    loadingMore,
    submitting,
    deletingIds,
    error,
    canToggle: (activeEntry?.total ?? 0) > 5,
    create,
    remove,
    expand,
    collapse,
    retry: () => loadPreview(true),
  };
}
