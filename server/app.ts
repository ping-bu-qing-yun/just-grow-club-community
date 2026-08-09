import { randomBytes } from 'node:crypto';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import type { RowDataPacket } from 'mysql2/promise';
import {
  CSRF_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  authenticateToken,
  createSession,
  parseCookieHeader,
  revokeSession,
  sessionTokenFromHeaders,
  verifyPassword,
} from './auth';
import type { QiahaoDatabase } from './db';
import { seedDatabase } from './seed';
import { changeActivityLifecycle, createActivity, getActivity, listActivities, validateActivity } from './activity-repository';
import type { ActivityLifecycle, CreateActivityInput, UserRole } from '../src/domain/types';
import { normalizeUserRole } from '../src/domain/roles';
import { joinActivity, listMessages, listThreads, setFavorite } from './social-repository';
import { archiveReadNotifications, getNotification, listNotifications, markNotificationRead } from './notification-repository';
import { NotificationHub } from './notification-hub';
import { AuthorizationError, requireAuthenticatedUser, requireCommentOwnerOrAdmin, requireContentOwnerOrAdmin, requireRole } from './authorization';
import { ContentRepositoryError, archiveContent, changeModerationStatus, createContentTag, listAdminContent, listContentTags, requireContent, updateContentTag } from './content-repository';
import { createNeed, getNeed, listNeeds, updateNeed } from './need-repository';
import { createLifePost, getLifePost, listLifePosts, updateLifePost } from './life-post-repository';
import { CommentRepositoryError, createComment, deleteComment, getComment, listComments } from './comment-repository';
import {
  absoluteUrl,
  getShareActivity,
  renderActivityShareHtml,
  resolveFrontendOrigin,
  resolveShareImageUrl,
} from './share-catalog';

type Options = { database: QiahaoDatabase; notificationHub?: NotificationHub };
type ErrorReply = { code: (status: number) => { send: (body: unknown) => unknown } };
type LoginRow = RowDataPacket & {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: number | boolean;
  role: UserRole | string;
  password_hash: string;
};

function fail(reply: ErrorReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } });
}

const sessionMaxAgeSeconds = 30 * 24 * 60 * 60;

function cookieValue(name: string, value: string, options: { httpOnly?: boolean; maxAge: number }): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const httpOnly = options.httpOnly ? '; HttpOnly' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${options.maxAge}; SameSite=Lax${httpOnly}${secure}`;
}

function setSessionCookies(reply: FastifyReply, token: string, csrfToken: string): void {
  reply.header('set-cookie', [
    cookieValue(SESSION_COOKIE_NAME, token, { httpOnly: true, maxAge: sessionMaxAgeSeconds }),
    cookieValue(CSRF_COOKIE_NAME, csrfToken, { maxAge: sessionMaxAgeSeconds }),
  ]);
}

function clearSessionCookies(reply: FastifyReply): void {
  reply.header('set-cookie', [
    cookieValue(SESSION_COOKIE_NAME, '', { httpOnly: true, maxAge: 0 }),
    cookieValue(CSRF_COOKIE_NAME, '', { maxAge: 0 }),
  ]);
}

function csrfHeader(request: FastifyRequest): string {
  const value = request.headers['x-csrf-token'];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function parseTagRefs(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20 || value.some((item) => typeof item !== 'string' || item.length > 120)) return null;
  return value;
}

function parseContentBody(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const body = value.trim();
  return body && body.length <= 5000 ? body : null;
}

function parseOptionalImage(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 512) return null;
  const image = value.trim();
  return image || undefined;
}

function parseOptionalReason(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > 1000) return null;
  const reason = value.trim();
  return reason || undefined;
}

async function userFrom(request: FastifyRequest, database: QiahaoDatabase) {
  return authenticateToken(database, request.headers.authorization, request.headers.cookie);
}

export function buildApp({ database, notificationHub = new NotificationHub() }: Options): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: ['http://127.0.0.1:5174', 'http://localhost:5174'], credentials: true });
  app.addHook('preHandler', async (request, reply) => {
    const pathname = request.raw.url?.split('?', 1)[0] ?? '';
    const method = request.method.toUpperCase();
    const safeMethod = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const isSessionLogin = method === 'POST' && pathname === '/api/v2/session';
    if (!pathname.startsWith('/api/v2/') || safeMethod || isSessionLogin) return;
    const cookieToken = parseCookieHeader(request.headers.cookie)[CSRF_COOKIE_NAME] ?? '';
    if (!cookieToken || csrfHeader(request) !== cookieToken) {
      return fail(reply, 403, 'CSRF_INVALID', '请求校验已失效，请刷新页面后重试');
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AuthorizationError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof ContentRepositoryError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof CommentRepositoryError) {
      const code = ['INVALID_BODY', 'INVALID_CONTENT_TYPE', 'INVALID_CURSOR'].includes(error.code) ? 'VALIDATION_ERROR' : error.code;
      return fail(reply, error.status, code, error.message);
    }
    throw error;
  });

  app.get('/api/v2/health', async (_request, reply) => {
    try {
      await database.query('SELECT 1');
      return { data: { status: 'ok' } };
    } catch {
      return fail(reply, 503, 'DATABASE_UNAVAILABLE', '数据库暂不可用');
    }
  });

  app.post<{ Body: { phone?: string; password?: string } }>('/api/v2/session', async (request, reply) => {
    const phone = typeof request.body?.phone === 'string' ? request.body.phone.trim() : undefined;
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const rows = phone
      ? await database.query<LoginRow[]>('SELECT * FROM users WHERE phone=? LIMIT 1', [phone])
      : [];
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return fail(reply, 401, 'INVALID_CREDENTIALS', '手机号或密码错误');
    }
    const token = await createSession(database, row.id);
    setSessionCookies(reply, token, randomBytes(32).toString('base64url'));
    return {
      data: {
        user: {
          id: row.id,
          phone: row.phone,
          name: row.name,
          avatar: row.avatar,
          bio: row.bio,
          verified: Boolean(row.verified),
          role: normalizeUserRole(row.role),
        },
      },
    };
  });

  app.delete('/api/v2/session', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const token = sessionTokenFromHeaders(request.headers.authorization, request.headers.cookie);
    await revokeSession(database, token);
    clearSessionCookies(reply);
    return reply.code(204).send();
  });

  app.get('/api/v2/session', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const [joinedRows, hostedRows, savedRows] = await Promise.all([
      database.query<Array<RowDataPacket & { count: number | string }>>('SELECT COUNT(*) AS count FROM activity_members WHERE user_id=?', [user.id]),
      database.query<Array<RowDataPacket & { count: number | string }>>('SELECT COUNT(*) AS count FROM activities WHERE host_id=?', [user.id]),
      database.query<Array<RowDataPacket & { count: number | string }>>('SELECT COUNT(*) AS count FROM favorites WHERE user_id=?', [user.id]),
    ]);
    return {
      data: {
        user,
        stats: {
          joined: Number(joinedRows[0]?.count ?? 0),
          hosted: Number(hostedRows[0]?.count ?? 0),
          saved: Number(savedRows[0]?.count ?? 0),
        },
      },
    };
  });

  app.get('/api/v2/activities', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { activities: await listActivities(database, user.id) } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/activities/:id', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const item = await getActivity(database, user.id, request.params.id);
    if (!item) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { activity: item } };
  });

  app.post<{ Body: Partial<CreateActivityInput> }>('/api/v2/activities', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    if (user.role !== 'operator') return fail(reply, 403, 'FORBIDDEN', '只有运营者可以发布活动');
    const input = request.body ?? {};
    const message = validateActivity(input);
    if (message) return fail(reply, 400, 'VALIDATION_ERROR', message);
    const item = await createActivity(database, user.id, input as CreateActivityInput);
    if (!item) return fail(reply, 500, 'PERSISTENCE_ERROR', '活动创建失败');
    return reply.code(201).send({ data: { activity: item } });
  });

  app.patch<{ Params: { id: string }; Body: { lifecycle?: ActivityLifecycle } }>('/api/v2/activities/:id/lifecycle', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const lifecycle = request.body?.lifecycle;
    if (!lifecycle || !['pre', 'formal', 'archived'].includes(lifecycle)) {
      return fail(reply, 400, 'VALIDATION_ERROR', '活动生命周期无效');
    }
    const result = await changeActivityLifecycle(database, request.params.id, lifecycle);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    if (result.kind === 'invalid-transition') {
      return fail(reply, 409, 'INVALID_TRANSITION', `活动不能从 ${result.current} 变更为 ${lifecycle}`);
    }
    return { data: { id: request.params.id, lifecycle: result.lifecycle } };
  });

  app.get('/api/v2/needs', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { needs: await listNeeds(database) } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/needs/:id', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const need = await getNeed(database, request.params.id);
    if (!need) return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    return { data: { need } };
  });

  app.post<{ Body: { body?: string; tags?: string[] } }>('/api/v2/needs', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const body = parseContentBody(request.body?.body);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '需求内容不能为空且不能超过 5000 字');
    const tags = parseTagRefs(request.body?.tags);
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    const need = await createNeed(database, user.id, body, tags);
    return reply.code(201).send({ data: { need } });
  });

  app.patch<{ Params: { id: string }; Body: { body?: string; tags?: string[] } }>('/api/v2/needs/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'need') return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    requireContentOwnerOrAdmin(user, current);
    if (current.status === 'archived') return fail(reply, 409, 'INVALID_STATUS_TRANSITION', '已归档内容不能修改');
    const body = parseContentBody(request.body?.body);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '需求内容不能为空且不能超过 5000 字');
    const tags = parseTagRefs(request.body?.tags);
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    const need = await updateNeed(database, request.params.id, body, tags);
    return { data: { need } };
  });

  app.delete<{ Params: { id: string }; Body: { reason?: string } }>('/api/v2/needs/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'need') return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    requireContentOwnerOrAdmin(user, current);
    const reason = parseOptionalReason(request.body?.reason);
    if (reason === null) return fail(reply, 400, 'VALIDATION_ERROR', '归档原因格式无效');
    await archiveContent(database, current.id, user.id, reason);
    return reply.code(204).send();
  });

  app.get('/api/v2/life-posts', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { lifePosts: await listLifePosts(database) } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/life-posts/:id', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const lifePost = await getLifePost(database, request.params.id);
    if (!lifePost) return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    return { data: { lifePost } };
  });

  app.post<{ Body: { body?: string; image?: string; tags?: string[] } }>('/api/v2/life-posts', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const body = parseContentBody(request.body?.body);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '生活动态不能为空且不能超过 5000 字');
    const image = parseOptionalImage(request.body?.image);
    const tags = parseTagRefs(request.body?.tags);
    if (image === null || !tags) return fail(reply, 400, 'VALIDATION_ERROR', '图片或标签格式无效');
    const lifePost = await createLifePost(database, user.id, body, image, tags);
    return reply.code(201).send({ data: { lifePost } });
  });

  app.patch<{ Params: { id: string }; Body: { body?: string; image?: string; tags?: string[] } }>('/api/v2/life-posts/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    requireContentOwnerOrAdmin(user, current);
    if (current.status === 'archived') return fail(reply, 409, 'INVALID_STATUS_TRANSITION', '已归档内容不能修改');
    const body = parseContentBody(request.body?.body);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '生活动态不能为空且不能超过 5000 字');
    const image = parseOptionalImage(request.body?.image);
    const tags = parseTagRefs(request.body?.tags);
    if (image === null || !tags) return fail(reply, 400, 'VALIDATION_ERROR', '图片或标签格式无效');
    const lifePost = await updateLifePost(database, request.params.id, body, image, tags);
    return { data: { lifePost } };
  });

  app.delete<{ Params: { id: string }; Body: { reason?: string } }>('/api/v2/life-posts/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    requireContentOwnerOrAdmin(user, current);
    const reason = parseOptionalReason(request.body?.reason);
    if (reason === null) return fail(reply, 400, 'VALIDATION_ERROR', '归档原因格式无效');
    await archiveContent(database, current.id, user.id, reason);
    return reply.code(204).send();
  });

  app.get<{ Querystring: { contentType?: string; contentId?: string; limit?: string; cursor?: string } }>('/api/v2/comments', async (request, reply) => {
    const contentType = typeof request.query.contentType === 'string' ? request.query.contentType.trim() : '';
    const contentId = typeof request.query.contentId === 'string' ? request.query.contentId.trim() : '';
    if (request.query.contentType !== undefined && typeof request.query.contentType !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '评论内容类型无效');
    if (request.query.contentId !== undefined && typeof request.query.contentId !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '评论内容标识无效');
    if (request.query.limit !== undefined && typeof request.query.limit !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '评论分页数量无效');
    if (request.query.cursor !== undefined && typeof request.query.cursor !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '评论分页游标无效');
    const rawLimit = request.query.limit === undefined ? 5 : Number(request.query.limit);
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
      return fail(reply, 400, 'VALIDATION_ERROR', '评论分页数量必须在 1 至 100 之间');
    }
    const page = await listComments(database, { contentType, contentId, limit: rawLimit, cursor: request.query.cursor });
    return { data: page };
  });

  app.post<{ Body: { contentType?: string; contentId?: string; body?: string } }>('/api/v2/comments', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const contentType = typeof request.body?.contentType === 'string' ? request.body.contentType.trim() : '';
    const contentId = typeof request.body?.contentId === 'string' ? request.body.contentId.trim() : '';
    const body = typeof request.body?.body === 'string' ? request.body.body : '';
    const comment = await createComment(database, { contentType, contentId, authorId: user.id, body });
    return reply.code(201).send({ data: { comment } });
  });

  app.delete<{ Params: { commentId: string } }>('/api/v2/comments/:commentId', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await getComment(database, request.params.commentId);
    if (!current) return fail(reply, 404, 'COMMENT_NOT_FOUND', '评论不存在');
    requireCommentOwnerOrAdmin(user, current);
    await deleteComment(database, request.params.commentId);
    return reply.code(204).send();
  });

  app.get<{ Querystring: { type?: string; status?: string; tag?: string } }>('/api/v2/admin/content', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const type = request.query.type as 'activity' | 'need' | 'life' | undefined;
    const status = request.query.status as 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' | undefined;
    if (request.query.tag !== undefined && typeof request.query.tag !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '标签筛选条件无效');
    if (type && !['activity', 'need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    if (status && !['draft', 'pending', 'approved', 'rejected', 'archived'].includes(status)) return fail(reply, 400, 'VALIDATION_ERROR', '审核状态无效');
    return { data: { items: await listAdminContent(database, { type, status, tag: request.query.tag?.trim() || undefined }) } };
  });

  app.patch<{ Params: { id: string }; Body: { status?: 'approved' | 'rejected' | 'archived' | 'pending'; reason?: string } }>('/api/v2/admin/content/:id/status', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const status = request.body?.status;
    if (!status || !['approved', 'rejected', 'archived', 'pending'].includes(status)) return fail(reply, 400, 'VALIDATION_ERROR', '审核状态无效');
    const reason = parseOptionalReason(request.body?.reason);
    if (reason === null) return fail(reply, 400, 'VALIDATION_ERROR', '审核原因格式无效');
    const item = await changeModerationStatus(database, request.params.id, status, user.id, reason);
    const items = await listAdminContent(database, { type: item.contentType, status: item.status });
    const updated = items.find((candidate) => candidate.id === item.id);
    return { data: { item: updated ?? item } };
  });

  app.get<{ Querystring: { type?: string } }>('/api/v2/admin/tags', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const type = request.query.type as 'activity' | 'need' | 'life' | undefined;
    if (type && !['activity', 'need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    return { data: { tags: await listContentTags(database, type) } };
  });

  app.post<{ Body: { type?: 'activity' | 'need' | 'life'; slug?: string; label?: string } }>('/api/v2/admin/tags', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const { type, slug, label } = request.body ?? {};
    if (!type || !slug || !label || !['activity', 'need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '标签信息不完整');
    const tag = await createContentTag(database, { contentType: type, slug, label });
    return reply.code(201).send({ data: { tag } });
  });

  app.patch<{ Params: { id: string }; Body: { slug?: string; label?: string; enabled?: boolean } }>('/api/v2/admin/tags/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const tag = await updateContentTag(database, request.params.id, request.body ?? {});
    return { data: { tag } };
  });

  app.put<{ Params: { id: string } }>('/api/v2/activities/:id/favorite', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    if (!(await setFavorite(database, user.id, request.params.id, true))) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { saved: true } };
  });

  app.delete<{ Params: { id: string } }>('/api/v2/activities/:id/favorite', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    if (!(await setFavorite(database, user.id, request.params.id, false))) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { saved: false } };
  });

  app.post<{ Params: { id: string } }>('/api/v2/activities/:id/join', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const result = await joinActivity(database, user.id, request.params.id);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    if (result.kind === 'full') return fail(reply, 409, 'ACTIVITY_FULL', '活动名额已满');
    if (result.participationStatus === 'joined' && !result.thread) return fail(reply, 500, 'PERSISTENCE_ERROR', '活动群聊创建失败');
    return { data: { thread: result.thread, participationStatus: result.participationStatus } };
  });

  app.get('/api/v2/threads', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { threads: await listThreads(database, user.id) } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/threads/:id/messages', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const result = await listMessages(database, user.id, request.params.id);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '会话不存在');
    if (result.kind === 'forbidden') return fail(reply, 403, 'FORBIDDEN', '无权查看此会话');
    return { data: { messages: result.messages } };
  });

  app.get('/api/v2/notifications', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const notifications = await listNotifications(database, user.id);
    return { data: { notifications, unreadCount: notifications.filter((item) => !item.read).length } };
  });

  app.patch<{ Params: { id: string } }>('/api/v2/notifications/:id/read', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const updated = await markNotificationRead(database, user.id, request.params.id);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '通知不存在');
    notificationHub.publish(user.id, { type: 'upsert', notification: updated });
    return { data: { notification: updated } };
  });

  const archiveHandler = async (request: FastifyRequest, reply: ErrorReply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const ids = await archiveReadNotifications(database, user.id);
    if (ids.length) notificationHub.publish(user.id, { type: 'archive', ids });
    return { data: { archivedCount: ids.length } };
  };
  app.post('/api/v2/notifications/read/archive', archiveHandler);
  app.delete('/api/v2/notifications/read', archiveHandler);

  app.get('/api/v2/notifications/stream', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    reply.hijack();
    const response = reply.raw;
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    response.write(': connected\n\n');
    const unsubscribe = notificationHub.subscribe(user.id, (event) => {
      if (!response.destroyed) response.write(`event: notification\ndata: ${JSON.stringify(event)}\n\n`);
    });
    const heartbeat = setInterval(() => {
      if (!response.destroyed) response.write(': heartbeat\n\n');
    }, 15_000);
    response.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });

  // 分享落地页：给微信/爬虫 OG 图文；真人浏览器会 meta-refresh / JS 跳回 SPA 详情
  app.get<{ Params: { id: string } }>('/api/share/activity/:id', async (request, reply) => {
    const activity = getShareActivity(request.params.id);
    if (!activity) return fail(reply, 404, 'NOT_FOUND', '活动不存在');

    const protoHeader = request.headers['x-forwarded-proto'];
    const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0]?.trim()
      || (request.protocol ?? 'http');
    const host = request.headers['x-forwarded-host'] || request.headers.host || '127.0.0.1:3001';
    const origin = `${proto}://${host}`;
    const frontendOrigin = resolveFrontendOrigin('http://127.0.0.1:5174');
    const pageUrl = absoluteUrl(origin, `/api/share/activity/${encodeURIComponent(activity.id)}`);
    const appUrl = `${frontendOrigin}/activities/${encodeURIComponent(activity.id)}`;
    const imageUrl = resolveShareImageUrl(activity.image, frontendOrigin);

    reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'public, max-age=300')
      .send(renderActivityShareHtml({ activity, pageUrl, imageUrl, appUrl }));
  });

  return app;
}

export async function createSeededApp(database: QiahaoDatabase, notificationHub?: NotificationHub) {
  await seedDatabase(database);
  return buildApp({ database, notificationHub });
}
