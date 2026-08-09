import type { CreateActivityInput } from '../domain/types';
import type {
  AdminContentItem,
  ApiActivity,
  ActivityProposalStatus,
  ActivityListParams,
  ApiComment,
  ApiContentTag,
  ApiLifePost,
  ApiNeed,
  ApiThread,
  ApiUser,
  CommentPage,
  ContentListParams,
  ContentStatus,
  ContentType,
  QiahaoApi,
} from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }
  if (!response.ok) {
    const { apiErrorEnvelopeSchema } = await import('../contracts/api');
    const parsed = apiErrorEnvelopeSchema.safeParse(body);
    const error = parsed.success ? parsed.data.error : null;
    throw new ApiError(response.status, error?.code ?? 'REQUEST_FAILED', error?.message ?? `请求失败（${response.status}）`, error?.fields);
  }
  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new ApiError(response.status, 'INVALID_RESPONSE', '服务端响应格式无效');
  }
  return (body as { data: T }).data;
}

function pageParams(input: { cursor?: string | null; limit?: number; q?: string } = {}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.cursor) params.set('cursor', input.cursor);
  if (input.limit) params.set('limit', String(input.limit));
  if (input.q?.trim()) params.set('q', input.q.trim());
  return params;
}

function activityParams(input: ActivityListParams = {}): string {
  const params = pageParams(input);
  if (input.category) params.set('category', input.category);
  if (input.theme) params.set('theme', input.theme);
  if (input.lifecycle) params.set('lifecycle', input.lifecycle);
  return params.size ? `?${params.toString()}` : '';
}

function contentParams(type: 'need' | 'life', input: ContentListParams = {}): string {
  const params = pageParams(input);
  params.set('type', type);
  return `?${params.toString()}`;
}

export const api: QiahaoApi = {
  login: (phone, password) => request<{ user: ApiUser }>('/session', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  logout: () => request<void>('/session', { method: 'DELETE' }),
  me: () => request<{ user: ApiUser }>('/session'),
  profile: () => request<{ profile: import('../club/types').ClubState }>('/profile'),
  saveProfile: (profile) => request<{ profile: import('../club/types').ClubState }>('/profile', { method: 'PATCH', body: JSON.stringify(profile) }),
  activities: (input = {}) => request<{ activities: ApiActivity[]; nextCursor: string | null }>(`/activities${activityParams(input)}`),
  activity: (id) => request<{ activity: ApiActivity }>(`/activities/${encodeURIComponent(id)}`),
  createActivity: (input: CreateActivityInput) => request<{ activity: ApiActivity }>('/activities', { method: 'POST', body: JSON.stringify(input) }),
  updateActivity: (id, input) => request<{ activity: ApiActivity }>(`/activities/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  archiveActivity: (id, reason) => request<void>(`/activities/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
  changeActivityLifecycle: (id, lifecycle) => request(`/activities/${encodeURIComponent(id)}/lifecycle`, { method: 'PATCH', body: JSON.stringify({ lifecycle }) }),
  needs: (input = {}) => request<{ needs: ApiNeed[]; nextCursor: string | null }>(`/needs${pageParams(input).size ? `?${pageParams(input).toString()}` : ''}`),
  need: (id) => request<{ need: ApiNeed }>(`/needs/${encodeURIComponent(id)}`),
  createNeed: (body, tags = []) => request<{ need: ApiNeed }>('/needs', { method: 'POST', body: JSON.stringify({ body, tags }) }),
  updateNeed: (id, body, tags = []) => request<{ need: ApiNeed }>(`/needs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ body, tags }) }),
  archiveNeed: (id) => request<void>(`/needs/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({}) }),
  lifePosts: (input = {}) => request<{ lifePosts: ApiLifePost[]; nextCursor: string | null }>(`/life-posts${pageParams(input).size ? `?${pageParams(input).toString()}` : ''}`),
  lifePost: (id) => request<{ lifePost: ApiLifePost }>(`/life-posts/${encodeURIComponent(id)}`),
  createLifePost: (body, image, tags = []) => request<{ lifePost: ApiLifePost }>('/life-posts', { method: 'POST', body: JSON.stringify({ body, image, tags }) }),
  updateLifePost: (id, body, image, tags = []) => request<{ lifePost: ApiLifePost }>(`/life-posts/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ body, image, tags }) }),
  archiveLifePost: (id) => request<void>(`/life-posts/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({}) }),
  adminContent: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.tag) params.set('tag', filters.tag);
    return request<{ items: AdminContentItem[] }>(`/admin/content${params.size ? `?${params.toString()}` : ''}`);
  },
  updateContentStatus: (id, status, reason) => request<{ item: AdminContentItem }>(`/admin/content/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  adminTags: (type) => request<{ tags: ApiContentTag[] }>(`/admin/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  tags: (type) => request<{ tags: ApiContentTag[] }>(`/tags${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  createTag: (input) => request<{ tag: ApiContentTag }>('/admin/tags', { method: 'POST', body: JSON.stringify(input) }),
  updateTag: (id, input) => request<{ tag: ApiContentTag }>(`/admin/tags/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  disableTag: (id) => request<{ tag: ApiContentTag }>(`/admin/tags/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  restoreTag: (id) => request<{ tag: ApiContentTag }>(`/admin/tags/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  favorite: (id, saved) => request<{ saved: boolean }>(`/activities/${id}/favorite`, { method: saved ? 'PUT' : 'DELETE' }),
  bookmark: (contentType, id, saved) => request<{ saved: boolean }>(`/content/${contentType}/${encodeURIComponent(id)}/bookmark`, { method: saved ? 'PUT' : 'DELETE' }),
  resonate: (contentType, id, resonated) => request<{ resonated: boolean }>(`/content/${contentType}/${encodeURIComponent(id)}/resonance`, { method: resonated ? 'PUT' : 'DELETE' }),
  socialState: (contentType, id) => request<{ saved: boolean; resonated: boolean; resonanceCount: number }>(`/content/${contentType}/${encodeURIComponent(id)}/social`),
  join: (id) => request<{ thread: ApiThread | null; participationStatus: 'interested' | 'joined' }>(`/activities/${id}/join`, { method: 'POST' }),
  cancelJoin: (id) => request<{ participationStatus: null }>(`/activities/${encodeURIComponent(id)}/join`, { method: 'DELETE' }),
  setActivityInterest: (id, signal, reason) => request<{ signal: 'consider' | 'not_interested' }>(`/activities/${id}/interest`, { method: 'PUT', body: JSON.stringify({ signal, reason }) }),
  submitActivityFeedback: (id, mood, note) => request(`/activities/${encodeURIComponent(id)}/feedback`, { method: 'POST', body: JSON.stringify({ mood, note }) }),
  activityFeedback: (id) => request(`/activities/${encodeURIComponent(id)}/feedback`),
  updateActivityFeedback: (id, input) => request(`/activities/${encodeURIComponent(id)}/feedback`, { method: 'PATCH', body: JSON.stringify(input) }),
  withdrawActivityFeedback: (id) => request<void>(`/activities/${encodeURIComponent(id)}/feedback`, { method: 'DELETE' }),
  threads: () => request<{ threads: ApiThread[] }>('/threads'),
  messages: (threadId) => request(`/threads/${encodeURIComponent(threadId)}/messages`),
  sendMessage: (threadId, body) => request(`/threads/${encodeURIComponent(threadId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  withdrawMessage: (messageId) => request<void>(`/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' }),
  onboardingAnswers: () => request('/onboarding/answers'),
  saveOnboardingAnswers: (input) => request('/onboarding/answers', { method: 'PUT', body: JSON.stringify(input) }),
  deleteOnboardingAnswers: () => request<void>('/onboarding/answers', { method: 'DELETE' }),
  interestTags: () => request('/user-interest-tags'),
  createInterestTag: (input) => request('/user-interest-tags', { method: 'POST', body: JSON.stringify(input) }),
  updateInterestTag: (id, input) => request(`/user-interest-tags/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  disableInterestTag: (id) => request<void>(`/user-interest-tags/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  media: (contentId) => request(`/content/${encodeURIComponent(contentId)}/media`),
  createMedia: (contentId, input) => request(`/content/${encodeURIComponent(contentId)}/media`, { method: 'POST', body: JSON.stringify(input) }),
  updateMedia: (mediaId, input) => request(`/media/${encodeURIComponent(mediaId)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteMedia: (mediaId) => request<void>(`/media/${encodeURIComponent(mediaId)}`, { method: 'DELETE' }),
  configBootstrap: () => request('/config/bootstrap'),
  activityCategoryConfig: () => request('/config/activity-categories'),
  onboardingConfig: () => request('/config/onboarding'),
  profileOptionConfig: () => request('/config/profile-options'),
  feedbackOptionConfig: () => request('/config/feedback-options'),
  recommendationConfig: () => request('/config/recommendation'),
  recommendations: (limit = 10) => request(`/recommendations?limit=${limit}`),
  operatorConfig: (domain) => request(`/operator/config/${encodeURIComponent(domain)}`),
  operatorConfigAudit: (domain, limit = 100) => request(`/operator/config/${encodeURIComponent(domain)}/audit?limit=${limit}`),
  createOperatorConfig: (domain, input) => request(`/operator/config/${encodeURIComponent(domain)}`, { method: 'POST', body: JSON.stringify(input) }),
  updateOperatorConfig: (domain, key, input) => request(`/operator/config/${encodeURIComponent(domain)}/${encodeURIComponent(key)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  disableOperatorConfig: (domain, key, input) => request(`/operator/config/${encodeURIComponent(domain)}/${encodeURIComponent(key)}`, { method: 'DELETE', body: JSON.stringify(input) }),
  restoreOperatorConfig: (domain, key, input) => request(`/operator/config/${encodeURIComponent(domain)}/${encodeURIComponent(key)}/restore`, { method: 'POST', body: JSON.stringify(input) }),
  activityProposals: (input = {}) => {
    const params = new URLSearchParams();
    if (input.status) params.set('status', input.status satisfies ActivityProposalStatus);
    if (input.includeArchived !== undefined) params.set('includeArchived', String(input.includeArchived));
    return request(`/operator/activity-proposals${params.size ? `?${params}` : ''}`);
  },
  activityProposal: (id) => request(`/operator/activity-proposals/${encodeURIComponent(id)}`),
  updateActivityProposal: (id, input) => request(`/operator/activity-proposals/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  archiveActivityProposal: (id) => request<void>(`/operator/activity-proposals/${encodeURIComponent(id)}`, { method: 'DELETE' }),
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
