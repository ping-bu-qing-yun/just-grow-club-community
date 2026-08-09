import type { CreateActivityInput } from '../domain/types';
import type {
  AdminContentItem,
  ApiActivity,
  ApiComment,
  ApiContentTag,
  ApiLifePost,
  ApiNeed,
  ApiThread,
  ApiUser,
  CommentPage,
  ContentStatus,
  ContentType,
  QiahaoApi,
} from './types';

export class ApiError extends Error { constructor(public status: number, public code: string, message: string) { super(message); this.name = 'ApiError'; } }

const API_BASE = '/api/v2';
const CSRF_COOKIE_NAME = 'qiahao_csrf';

function readCookie(name: string): string {
  const prefix = `${name}=`;
  const part = document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  if (!part) return '';
  try {
    return decodeURIComponent(part.slice(prefix.length));
  } catch {
    return part.slice(prefix.length);
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const method = (init.method ?? 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) headers.set('x-csrf-token', csrfToken);
  }
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });
  if (response.status === 204) return undefined as T;
  const body = await response.json() as { data?: T; error?: { code: string; message: string } };
  if (!response.ok) throw new ApiError(response.status, body.error?.code ?? 'REQUEST_FAILED', body.error?.message ?? '请求失败');
  return body.data as T;
}
export const api: QiahaoApi = {
  login: (phone, password) => request<{ user: ApiUser }>('/session', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  logout: () => request<void>('/session', { method: 'DELETE' }),
  me: () => request<{ user: ApiUser }>('/session'),
  activities: () => request<{ activities: ApiActivity[] }>('/activities'),
  createActivity: (input: CreateActivityInput) => request<{ activity: ApiActivity }>('/activities', { method: 'POST', body: JSON.stringify(input) }),
  async needs() { const { items } = await request<{ items: ApiNeed[] }>('/content?type=need'); return { needs: items }; },
  async createNeed(body, tags = []) { const { item } = await request<{ item: ApiNeed }>('/content', { method: 'POST', body: JSON.stringify({ type: 'need', body, tags }) }); return { need: item }; },
  async updateNeed(id, body, tags = []) { const { item } = await request<{ item: ApiNeed }>(`/content/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ body, tags }) }); return { need: item }; },
  archiveNeed: (id) => request<void>(`/content/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  async lifePosts() { const { items } = await request<{ items: ApiLifePost[] }>('/content?type=life'); return { lifePosts: items }; },
  async createLifePost(body, image, tags = []) { const { item } = await request<{ item: ApiLifePost }>('/content', { method: 'POST', body: JSON.stringify({ type: 'life', body, image, tags }) }); return { lifePost: item }; },
  async updateLifePost(id, body, image, tags = []) { const { item } = await request<{ item: ApiLifePost }>(`/content/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ body, image, tags }) }); return { lifePost: item }; },
  archiveLifePost: (id) => request<void>(`/content/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  adminContent: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.tag) params.set('tag', filters.tag);
    return request<{ items: AdminContentItem[] }>(`/admin/content${params.size ? `?${params.toString()}` : ''}`);
  },
  updateContentStatus: (id, status, reason) => request<{ item: AdminContentItem }>(`/admin/content/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  adminTags: (type) => request<{ tags: ApiContentTag[] }>(`/admin/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  createTag: (input) => request<{ tag: ApiContentTag }>('/admin/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id, input) => request<{ tag: ApiContentTag }>(`/admin/tags/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  favorite: (id, saved) => request<{ saved: boolean }>(`/activities/${id}/favorite`, { method: saved ? 'PUT' : 'DELETE' }),
  bookmark: (contentType, id, saved) => request<{ saved: boolean }>(`/content/${contentType}/${encodeURIComponent(id)}/bookmark`, { method: saved ? 'PUT' : 'DELETE' }),
  resonate: (contentType, id, resonated) => request<{ resonated: boolean }>(`/content/${contentType}/${encodeURIComponent(id)}/resonance`, { method: resonated ? 'PUT' : 'DELETE' }),
  join: (id) => request<{ thread: ApiThread | null; participationStatus: 'interested' | 'joined' }>(`/activities/${id}/join`, { method: 'POST' }),
  threads: () => request<{ threads: ApiThread[] }>('/threads'),
  listComments: ({ contentType, contentId, limit = 5, cursor }) => {
    const params = new URLSearchParams({ contentType, contentId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request<CommentPage>(`/comments?${params.toString()}`);
  },
  createComment: ({ contentType, contentId, body }) =>
    request<{ comment: ApiComment }>('/comments', {
      method: 'POST',
      body: JSON.stringify({ contentType, contentId, body }),
    }),
  deleteComment: (commentId) => request<void>(`/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' }),
};
