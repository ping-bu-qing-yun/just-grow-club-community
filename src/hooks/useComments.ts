import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { ApiComment, CommentContentType, CommentPage, QiahaoApi } from '../api/types';
import { localCommentsFor } from '../comments/local-comments';
import type { UserRole } from '../domain/types';

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
  role?: UserRole;
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

function isContentMissing(reason: unknown): boolean {
  return (
    reason instanceof ApiError &&
    reason.status === 404 &&
    (reason.code === 'CONTENT_NOT_FOUND' || reason.message.includes('内容不存在'))
  );
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
  const keyRef = useRef(key);
  keyRef.current = key;
  const [fallbackLocalMode, setFallbackLocalMode] = useState(false);
  const effectiveLocalMode = localMode || fallbackLocalMode;
  const cacheRef = useRef(new Map<string, CommentCacheEntry>());
  const localEntriesRef = useRef(new Map<string, ApiComment[]>());
  if (effectiveLocalMode && !localEntriesRef.current.has(key)) {
    localEntriesRef.current.set(key, localCommentsFor(contentType, contentId));
  }
  if (effectiveLocalMode && !cacheRef.current.has(key)) {
    const initial = localPage(localEntriesRef.current.get(key) ?? [], null, 5);
    cacheRef.current.set(key, { comments: initial.comments, total: initial.total, nextCursor: initial.nextCursor });
  }
  const [entry, setEntry] = useState<CommentCacheEntry | null>(() => cacheRef.current.get(key) ?? null);
  const [entryKey, setEntryKey] = useState(key);
  const [viewState, setViewState] = useState<CommentViewState>('preview');
  const [loading, setLoading] = useState(() => !effectiveLocalMode);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const activeEntry = entryKey === key ? entry : cacheRef.current.get(key) ?? null;
  const entryRef = useRef<CommentCacheEntry | null>(null);
  entryRef.current = activeEntry;

  const ensureLocalEntries = useCallback(() => {
    const current = localEntriesRef.current.get(key);
    if (current) return current;
    const seeded = localCommentsFor(contentType, contentId);
    localEntriesRef.current.set(key, seeded);
    return seeded;
  }, [contentId, contentType, key]);

  const readPage = useCallback(async (cursor?: string | null, limit = 5): Promise<CommentPage> => {
    if (!effectiveLocalMode) {
      try {
        return await apiClient.listComments({ contentType, contentId, limit, cursor });
      } catch (reason) {
        if (!isContentMissing(reason)) throw reason;
        setFallbackLocalMode(true);
      }
    }
    const local = ensureLocalEntries();
    return localPage(local, cursor, limit);
  }, [apiClient, contentId, contentType, effectiveLocalMode, ensureLocalEntries]);

  const saveEntry = useCallback((next: CommentCacheEntry) => {
    cacheRef.current.set(key, next);
    entryRef.current = next;
    setEntry(next);
    setEntryKey(key);
  }, [key]);

  const loadPreview = useCallback(async (force = false) => {
    const requestKey = key;
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
      if (keyRef.current !== requestKey) return;
      saveEntry({ comments: page.comments, total: page.total, nextCursor: page.nextCursor });
    } catch (reason) {
      if (keyRef.current !== requestKey) return;
      setEntry(null);
      setError(reason instanceof Error ? reason.message : '评论加载失败');
    } finally {
      if (keyRef.current === requestKey) setLoading(false);
    }
  }, [key, keyRef, readPage, saveEntry]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const expand = useCallback(async () => {
    const requestKey = key;
    const current = entryRef.current;
    if (!current || loadingMoreRef.current) return;
    setViewState('expanded');
    setError(null);
    if (!current.nextCursor) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      let next = current;
      let cursor: string | null = current.nextCursor;
      const seen = new Set<string>();
      while (cursor && !seen.has(cursor)) {
        seen.add(cursor);
        const page = await readPage(cursor, 100);
        if (keyRef.current !== requestKey) return;
        next = {
          comments: mergeComments(next.comments, page.comments),
          total: page.total,
          nextCursor: page.nextCursor,
        };
        cursor = page.nextCursor;
      }
      if (keyRef.current !== requestKey) return;
      saveEntry(next);
    } catch (reason) {
      if (keyRef.current !== requestKey) return;
      setError(reason instanceof Error ? reason.message : '展开评论失败');
    } finally {
      loadingMoreRef.current = false;
      if (keyRef.current === requestKey) setLoadingMore(false);
    }
  }, [key, keyRef, readPage, saveEntry]);

  const collapse = useCallback(() => {
    setViewState('preview');
  }, []);

  const create = useCallback(async (rawBody: string): Promise<boolean> => {
    const requestKey = key;
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
      let comment: ApiComment;
      if (effectiveLocalMode) {
        comment = localComment(contentType, contentId, body, viewer);
      } else {
        try {
          comment = (await apiClient.createComment({ contentType, contentId, body })).comment;
        } catch (reason) {
          if (!isContentMissing(reason)) throw reason;
          setFallbackLocalMode(true);
          comment = localComment(contentType, contentId, body, viewer);
        }
      }
      if (effectiveLocalMode || comment.id.startsWith('local-comment-')) {
        const currentLocal = ensureLocalEntries();
        localEntriesRef.current.set(key, [comment, ...currentLocal.filter((item) => item.id !== comment.id)]);
      }
      if (keyRef.current !== requestKey) return false;
      const current = entryRef.current ?? { comments: [], total: 0, nextCursor: null };
      saveEntry({
        comments: [comment, ...current.comments.filter((item) => item.id !== comment.id)],
        total: current.total + 1,
        nextCursor: current.nextCursor,
      });
      return true;
    } catch (reason) {
      if (keyRef.current !== requestKey) return false;
      setError(reason instanceof Error ? reason.message : '发表评论失败');
      return false;
    } finally {
      if (keyRef.current === requestKey) setSubmitting(false);
    }
  }, [apiClient, contentId, contentType, effectiveLocalMode, ensureLocalEntries, key, keyRef, saveEntry, viewer]);

  const remove = useCallback(async (comment: ApiComment): Promise<boolean> => {
    const requestKey = key;
    if (!viewer) {
      setError('请先登录后再删除评论');
      return false;
    }
    setDeletingIds((current) => new Set(current).add(comment.id));
    setError(null);
    try {
      if (effectiveLocalMode || comment.id.startsWith('local-comment-')) {
        const local = ensureLocalEntries();
        localEntriesRef.current.set(key, local.filter((item) => item.id !== comment.id));
      } else {
        await apiClient.deleteComment(comment.id);
      }
      if (keyRef.current !== requestKey) return true;
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
      if (keyRef.current !== requestKey) return false;
      setError(reason instanceof Error ? reason.message : '删除评论失败');
      return false;
    } finally {
      setDeletingIds((current) => {
        const next = new Set(current);
        next.delete(comment.id);
        return next;
      });
    }
  }, [apiClient, effectiveLocalMode, ensureLocalEntries, key, keyRef, saveEntry, viewer]);

  const isActiveKey = entryKey === key;
  const visibleViewState = isActiveKey ? viewState : 'preview';
  const comments = useMemo(() => {
    const all = activeEntry?.comments ?? [];
    return visibleViewState === 'preview' ? all.slice(0, 5) : all;
  }, [activeEntry?.comments, visibleViewState]);

  return {
    comments,
    total: activeEntry?.total ?? 0,
    viewState: visibleViewState,
    loading: !isActiveKey || loading,
    loadingMore: isActiveKey && loadingMore,
    submitting: isActiveKey && submitting,
    deletingIds,
    error: isActiveKey ? error : null,
    canToggle: (activeEntry?.total ?? 0) > 5,
    create,
    remove,
    expand,
    collapse,
    retry: () => loadPreview(true),
  };
}
