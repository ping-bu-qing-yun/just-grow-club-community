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
import {
  ActivityRepositoryError,
  archiveActivity,
  changeActivityLifecycle,
  createActivity,
  getActivity,
  getActivityFeedback,
  listActivities,
  recordActivityInterest,
  saveActivityFeedback,
  updateActivity,
  validateActivity,
  withdrawActivityFeedback,
} from './activity-repository';
import type { ActivityLifecycle, CreateActivityInput, UserRole } from '../src/domain/types';
import { normalizeUserRole } from '../src/domain/roles';
import {
  activityListQuerySchema,
  contentListQuerySchema,
  loginRequestSchema,
  notificationListQuerySchema,
  profileRecordSchema,
  updateActivityInputSchema,
} from '../src/contracts/api';
import {
  cancelActivity,
  getContentSocialState,
  joinActivity,
  listMessages,
  listThreads,
  sendMessage,
  setContentBookmark,
  setContentResonance,
  setFavorite,
  withdrawMessage,
} from './social-repository';
import { archiveReadNotifications, getNotification, listNotifications, markNotificationRead } from './notification-repository';
import { NotificationHub } from './notification-hub';
import { AuthorizationError, requireAuthenticatedUser, requireCommentOwnerOrAdmin, requireContentOwnerOrAdmin, requireRole } from './authorization';
import { ContentRepositoryError, archiveContent, changeModerationStatus, createContentTag, listAdminContent, listContentTags, requireContent, updateContentTag } from './content-repository';
import { createNeed, getNeed, listNeeds, updateNeed } from './need-repository';
import { createLifePost, getLifePost, listLifePosts, updateLifePost } from './life-post-repository';
import { CommentRepositoryError, createComment, deleteComment, getComment, listComments } from './comment-repository';
import {
  absoluteUrl,
  renderActivityShareHtml,
  resolveShareActivity,
  resolveFrontendOrigin,
  resolveShareImageUrl,
} from './share-catalog';
import {
  ProfileRepositoryError,
  createInterestTag,
  deleteOnboardingAnswers,
  disableInterestTag,
  getOnboardingRecord,
  getProfileRecord,
  listInterestTags,
  replaceOnboardingAnswers,
  saveProfileRecord,
  updateInterestTag,
  type InterestTagKind,
} from './profile-repository';
import { PaginationCursorError } from './pagination';
import { BusinessConfigService } from './config-service';
import { ConfigMutationError } from './config-mutation-repository';
import { listConfigAuditEvents } from './config-repository';
import type { ConfigDomain, ConfigEntityType } from '../src/config/types';
import { normalizeMediaUrl } from './media-url';
import { MediaRepositoryError } from './media-repository';
import {
  ActivityProposalError,
  archiveActivityProposal,
  getActivityProposal,
  listActivityProposals,
  updateActivityProposal,
  type ActivityProposalStatus,
} from './activity-proposal-repository';
import { createContentMedia, deleteContentMedia, getContentMedia, listContentMedia, updateContentMedia } from './media-repository';
import { recommendActivities } from './recommendation-service';

type Options = { database: QiahaoDatabase; notificationHub?: NotificationHub; configService?: BusinessConfigService };
type ErrorReply = { code: (status: number) => { send: (body: unknown) => unknown } };
type LoginRow = RowDataPacket & {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: number | boolean;
  role: UserRole | string;
  account_status: 'active' | 'suspended' | 'deleted';
  password_hash: string;
};

function fail(reply: ErrorReply, status: number, code: string, message: string, fields?: Record<string, string>) {
  return reply.code(status).send({ error: { code, message, ...(fields && Object.keys(fields).length ? { fields } : {}) } });
}

function validationFields(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.map(String).join('.') || 'request';
    fields[key] ??= issue.message;
  }
  return fields;
}

function corsOrigins(): string[] {
  const configured = [process.env.QIAHAO_WEB_ORIGIN, ...(process.env.QIAHAO_CORS_ORIGINS ?? '').split(',')]
    .map((value) => value?.trim().replace(/\/$/, '') ?? '')
    .filter(Boolean)
    .filter((value) => /^https?:\/\//i.test(value));
  return [...new Set(['http://127.0.0.1:5174', 'http://localhost:5174', ...configured])];
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
  return normalizeMediaUrl(value);
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

export function buildApp({ database, notificationHub = new NotificationHub(), configService }: Options): FastifyInstance {
  const app = Fastify({ logger: false });
  const businessConfig = configService ?? new BusinessConfigService(database);
  app.register(cors, { origin: corsOrigins(), credentials: true });
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
    if (error instanceof PaginationCursorError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof ConfigMutationError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof ActivityRepositoryError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof ActivityProposalError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof MediaRepositoryError) return fail(reply, error.status, error.code, error.message);
    if (error instanceof ProfileRepositoryError) return fail(reply, error.status, error.code, error.message);
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

  app.get('/api/v2/config/bootstrap', async () => ({ data: await businessConfig.getBootstrap() }));
  app.get('/api/v2/config/activity-categories', async () => {
    const config = await businessConfig.getBootstrap();
    return { data: { version: config.versions['activity-categories'], items: config.activityCategories } };
  });
  app.get('/api/v2/config/onboarding', async () => {
    const config = await businessConfig.getBootstrap();
    return { data: { version: config.versions.onboarding, questions: config.onboarding } };
  });
  app.get('/api/v2/config/profile-options', async () => {
    const config = await businessConfig.getBootstrap();
    return { data: { version: config.versions['profile-options'], items: config.profileOptions } };
  });
  app.get('/api/v2/config/feedback-options', async () => {
    const config = await businessConfig.getBootstrap();
    return { data: { version: config.versions['feedback-options'], items: config.feedbackOptions } };
  });
  app.get('/api/v2/config/recommendation', async () => {
    const config = await businessConfig.getBootstrap();
    return { data: { version: config.versions.recommendation, ...config.recommendation } };
  });

  app.get<{ Querystring: { limit?: string } }>('/api/v2/recommendations', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const limit = request.query.limit === undefined ? 10 : Number(request.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) return fail(reply, 400, 'VALIDATION_ERROR', '推荐数量必须在 1 至 50 之间');
    return { data: await recommendActivities(database, businessConfig, user.id, limit) };
  });

  app.post<{ Body: { phone?: string; password?: string } }>('/api/v2/session', async (request, reply) => {
    const parsedCredentials = loginRequestSchema.safeParse(request.body);
    if (!parsedCredentials.success) return fail(reply, 400, 'VALIDATION_ERROR', '请填写有效的手机号和密码', validationFields(parsedCredentials.error.issues));
    const { phone, password } = parsedCredentials.data;
    const rows = phone
      ? await database.query<LoginRow[]>('SELECT * FROM users WHERE phone=? LIMIT 1', [phone])
      : [];
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return fail(reply, 401, 'INVALID_CREDENTIALS', '手机号或密码错误');
    }
    if (row.account_status !== 'active') return fail(reply, 403, 'ACCOUNT_UNAVAILABLE', '账号当前不可用');
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
      database.query<Array<RowDataPacket & { count: number | string }>>('SELECT COUNT(*) AS count FROM content_bookmarks WHERE user_id=?', [user.id]),
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

  app.get('/api/v2/profile', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    return { data: { profile: await getProfileRecord(database, user.id) } };
  });

  app.patch<{ Body: unknown }>('/api/v2/profile', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const parsed = profileRecordSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '画像或资料字段无效', validationFields(parsed.error.issues));
    return { data: { profile: await saveProfileRecord(database, user.id, parsed.data) } };
  });

  app.get('/api/v2/onboarding/answers', async (request) => {
    const user = await requireAuthenticatedUser(request, database);
    return { data: await getOnboardingRecord(database, user.id) };
  });

  app.put<{ Body: { answers?: Record<string, string[]>; currentStep?: number; completed?: boolean } }>('/api/v2/onboarding/answers', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const { answers, currentStep, completed } = request.body ?? {};
    if (!answers || typeof answers !== 'object' || Array.isArray(answers) || !Number.isInteger(currentStep) || typeof completed !== 'boolean') {
      return fail(reply, 400, 'VALIDATION_ERROR', '问卷答案、步骤或完成状态无效');
    }
    return { data: await replaceOnboardingAnswers(database, user.id, { answers, currentStep: Number(currentStep), completed }) };
  });

  app.delete('/api/v2/onboarding/answers', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    await deleteOnboardingAnswers(database, user.id);
    return reply.code(204).send();
  });

  const interestTagKinds = new Set<InterestTagKind>(['profile_tag', 'preference', 'intent', 'scene', 'barrier']);
  app.get('/api/v2/user-interest-tags', async (request) => {
    const user = await requireAuthenticatedUser(request, database);
    return { data: { tags: await listInterestTags(database, user.id) } };
  });

  app.post<{ Body: { kind?: InterestTagKind; label?: string; sourceKey?: string; sortOrder?: number } }>('/api/v2/user-interest-tags', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const { kind, label, sourceKey, sortOrder } = request.body ?? {};
    if (!kind || !interestTagKinds.has(kind) || typeof label !== 'string' || !label.trim() || label.length > 120 || (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0))) {
      return fail(reply, 400, 'VALIDATION_ERROR', '兴趣标签格式无效');
    }
    const tag = await createInterestTag(database, user.id, { kind, label: label.trim(), sourceKey, sortOrder });
    return reply.code(201).send({ data: { tag } });
  });

  app.patch<{ Params: { id: string }; Body: { label?: string; sortOrder?: number; enabled?: boolean } }>('/api/v2/user-interest-tags/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const { label, sortOrder, enabled } = request.body ?? {};
    if ((label !== undefined && (typeof label !== 'string' || !label.trim() || label.length > 120)) || (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) || (enabled !== undefined && typeof enabled !== 'boolean')) {
      return fail(reply, 400, 'VALIDATION_ERROR', '兴趣标签格式无效');
    }
    const tag = await updateInterestTag(database, user.id, request.params.id, { label, sortOrder, enabled });
    if (!tag) return fail(reply, 404, 'NOT_FOUND', '兴趣标签不存在');
    return { data: { tag } };
  });

  app.delete<{ Params: { id: string } }>('/api/v2/user-interest-tags/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!(await disableInterestTag(database, user.id, request.params.id))) return fail(reply, 404, 'NOT_FOUND', '兴趣标签不存在');
    return reply.code(204).send();
  });

  app.get('/api/v2/activities', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const parsed = activityListQuerySchema.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '活动筛选或分页参数无效', validationFields(parsed.error.issues));
    return { data: await listActivities(database, user.id, parsed.data) };
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

  app.patch<{ Params: { id: string }; Body: unknown }>('/api/v2/activities/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'activity') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    requireContentOwnerOrAdmin(user, current);
    const parsed = updateActivityInputSchema.safeParse(request.body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return fail(reply, 400, 'VALIDATION_ERROR', '请至少提供一个有效的活动字段', parsed.success ? undefined : validationFields(parsed.error.issues));
    }
    const activity = await updateActivity(database, user.id, request.params.id, parsed.data);
    if (!activity) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { activity } };
  });

  app.delete<{ Params: { id: string }; Body: { reason?: string } }>('/api/v2/activities/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'activity') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    requireContentOwnerOrAdmin(user, current);
    const reason = parseOptionalReason(request.body?.reason);
    if (reason === null) return fail(reply, 400, 'VALIDATION_ERROR', '归档原因格式无效');
    if (!(await archiveActivity(database, user.id, request.params.id, reason))) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return reply.code(204).send();
  });

  app.patch<{ Params: { id: string }; Body: { lifecycle?: ActivityLifecycle } }>('/api/v2/activities/:id/lifecycle', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const lifecycle = request.body?.lifecycle;
    if (!lifecycle || !['pre', 'formal', 'archived'].includes(lifecycle)) {
      return fail(reply, 400, 'VALIDATION_ERROR', '活动生命周期无效');
    }
    const result = await changeActivityLifecycle(database, request.params.id, lifecycle, user.id);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    if (result.kind === 'invalid-transition') {
      return fail(reply, 409, 'INVALID_TRANSITION', `活动不能从 ${result.current} 变更为 ${lifecycle}`);
    }
    return { data: { id: request.params.id, lifecycle: result.lifecycle } };
  });

  app.get('/api/v2/content', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const parsed = contentListQuerySchema.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '内容筛选或分页参数无效', validationFields(parsed.error.issues));
    if (parsed.data.type === 'need') return { data: await listNeeds(database, user.id, parsed.data) };
    return { data: await listLifePosts(database, user.id, parsed.data) };
  });

  app.post<{ Body: { type?: 'need' | 'life'; body?: string; image?: string; tags?: string[] } }>('/api/v2/content', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const type = request.body?.type;
    const body = parseContentBody(request.body?.body);
    const tags = parseTagRefs(request.body?.tags);
    if (!type || !['need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '内容不能为空且不能超过 5000 字');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    if (type === 'need') {
      const item = await createNeed(database, user.id, body, tags);
      return reply.code(201).send({ data: { item } });
    }
    const image = parseOptionalImage(request.body?.image);
    if (image === null) return fail(reply, 400, 'VALIDATION_ERROR', '图片格式无效');
    const item = await createLifePost(database, user.id, body, image, tags);
    return reply.code(201).send({ data: { item } });
  });

  app.patch<{ Params: { id: string }; Body: { body?: string; image?: string; tags?: string[] } }>('/api/v2/content/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    requireContentOwnerOrAdmin(user, current);
    if (current.contentType !== 'need' && current.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '内容不存在');
    if (current.status === 'archived') return fail(reply, 409, 'INVALID_STATUS_TRANSITION', '已归档内容不能修改');
    const hasPatch = request.body && ['body', 'image', 'tags'].some((key) => Object.prototype.hasOwnProperty.call(request.body, key));
    if (!hasPatch) return fail(reply, 400, 'VALIDATION_ERROR', '请至少提供一个可修改字段');
    const existing = current.contentType === 'need'
      ? await getNeed(database, current.id, false, user.id)
      : await getLifePost(database, current.id, false, user.id);
    if (!existing) return fail(reply, 404, 'NOT_FOUND', '内容不存在');
    const body = request.body?.body === undefined ? existing.body : parseContentBody(request.body.body);
    const tags = request.body?.tags === undefined ? existing.tags.map((tag) => tag.id) : parseTagRefs(request.body.tags);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '内容不能为空且不能超过 5000 字');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    if (current.contentType === 'need') return { data: { item: await updateNeed(database, current.id, body, tags, user.id) } };
    const image = request.body?.image === undefined ? existing.image ?? undefined : parseOptionalImage(request.body.image);
    if (image === null) return fail(reply, 400, 'VALIDATION_ERROR', '图片格式无效');
    return { data: { item: await updateLifePost(database, current.id, body, image, tags, user.id) } };
  });

  app.delete<{ Params: { id: string }; Body: { reason?: string } }>('/api/v2/content/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'need' && current.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '内容不存在');
    requireContentOwnerOrAdmin(user, current);
    const reason = parseOptionalReason(request.body?.reason);
    if (reason === null) return fail(reply, 400, 'VALIDATION_ERROR', '归档原因格式无效');
    await archiveContent(database, current.id, user.id, reason);
    return reply.code(204).send();
  });

  app.get('/api/v2/needs', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const parsed = contentListQuerySchema.safeParse({ ...(request.query as object), type: 'need' });
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '需求筛选或分页参数无效', validationFields(parsed.error.issues));
    const page = await listNeeds(database, user.id, parsed.data);
    return { data: { needs: page.items, nextCursor: page.nextCursor } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/needs/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const content = await requireContent(database, request.params.id);
    if (content.contentType !== 'need') return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    const canReadPrivate = user.role === 'operator' || user.id === content.authorId;
    if (content.status !== 'approved' && !canReadPrivate) return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    const need = await getNeed(database, request.params.id, false, user.id);
    if (!need) return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    return { data: { need } };
  });

  app.post<{ Body: { body?: string; tags?: string[] } }>('/api/v2/needs', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const body = parseContentBody(request.body?.body);
    const tags = parseTagRefs(request.body?.tags);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '需求不能为空且不能超过 5000 字');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    return reply.code(201).send({ data: { need: await createNeed(database, user.id, body, tags) } });
  });

  app.patch<{ Params: { id: string }; Body: { body?: string; tags?: string[] } }>('/api/v2/needs/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'need') return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    requireContentOwnerOrAdmin(user, current);
    if (current.status === 'archived') return fail(reply, 409, 'INVALID_STATUS_TRANSITION', '已归档需求不能修改');
    const existing = await getNeed(database, current.id, false, user.id);
    if (!existing) return fail(reply, 404, 'NOT_FOUND', '需求不存在');
    const body = request.body?.body === undefined ? existing.body : parseContentBody(request.body.body);
    const tags = request.body?.tags === undefined ? existing.tags.map((tag) => tag.id) : parseTagRefs(request.body.tags);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '需求不能为空且不能超过 5000 字');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    return { data: { need: await updateNeed(database, current.id, body, tags, user.id) } };
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
    const user = await requireAuthenticatedUser(request, database);
    const parsed = contentListQuerySchema.safeParse({ ...(request.query as object), type: 'life' });
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '生活动态筛选或分页参数无效', validationFields(parsed.error.issues));
    const page = await listLifePosts(database, user.id, parsed.data);
    return { data: { lifePosts: page.items, nextCursor: page.nextCursor } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/life-posts/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const content = await requireContent(database, request.params.id);
    if (content.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    const canReadPrivate = user.role === 'operator' || user.id === content.authorId;
    if (content.status !== 'approved' && !canReadPrivate) return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    const lifePost = await getLifePost(database, request.params.id, false, user.id);
    if (!lifePost) return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    return { data: { lifePost } };
  });

  app.post<{ Body: { body?: string; image?: string; tags?: string[] } }>('/api/v2/life-posts', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const body = parseContentBody(request.body?.body);
    const image = parseOptionalImage(request.body?.image);
    const tags = parseTagRefs(request.body?.tags);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '生活动态不能为空且不能超过 5000 字');
    if (image === null) return fail(reply, 400, 'VALIDATION_ERROR', '图片必须是 HTTPS 地址或同源 /assets/ 路径');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    return reply.code(201).send({ data: { lifePost: await createLifePost(database, user.id, body, image, tags) } });
  });

  app.patch<{ Params: { id: string }; Body: { body?: string; image?: string; tags?: string[] } }>('/api/v2/life-posts/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await requireContent(database, request.params.id);
    if (current.contentType !== 'life') return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    requireContentOwnerOrAdmin(user, current);
    if (current.status === 'archived') return fail(reply, 409, 'INVALID_STATUS_TRANSITION', '已归档生活动态不能修改');
    const existing = await getLifePost(database, current.id, false, user.id);
    if (!existing) return fail(reply, 404, 'NOT_FOUND', '生活动态不存在');
    const body = request.body?.body === undefined ? existing.body : parseContentBody(request.body.body);
    const image = request.body?.image === undefined ? existing.image ?? undefined : parseOptionalImage(request.body.image);
    const tags = request.body?.tags === undefined ? existing.tags.map((tag) => tag.id) : parseTagRefs(request.body.tags);
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '生活动态不能为空且不能超过 5000 字');
    if (image === null) return fail(reply, 400, 'VALIDATION_ERROR', '图片必须是 HTTPS 地址或同源 /assets/ 路径');
    if (!tags) return fail(reply, 400, 'VALIDATION_ERROR', '标签格式无效');
    return { data: { lifePost: await updateLifePost(database, current.id, body, image, tags, user.id) } };
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

  const contentTypes = new Set(['activity', 'need', 'life']);
  app.get<{ Params: { type: 'activity' | 'need' | 'life'; id: string } }>('/api/v2/content/:type/:id/social', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!contentTypes.has(request.params.type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const content = await requireContent(database, request.params.id);
    if (content.contentType !== request.params.type || content.status !== 'approved') return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: await getContentSocialState(database, user.id, request.params.id) };
  });
  app.put<{ Params: { type: 'activity' | 'need' | 'life'; id: string } }>('/api/v2/content/:type/:id/bookmark', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!contentTypes.has(request.params.type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const updated = await setContentBookmark(database, user.id, request.params.type, request.params.id, true);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: { saved: true } };
  });

  app.delete<{ Params: { type: 'activity' | 'need' | 'life'; id: string } }>('/api/v2/content/:type/:id/bookmark', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!contentTypes.has(request.params.type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const updated = await setContentBookmark(database, user.id, request.params.type, request.params.id, false);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: { saved: false } };
  });

  app.put<{ Params: { type: 'activity' | 'need' | 'life'; id: string } }>('/api/v2/content/:type/:id/resonance', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!contentTypes.has(request.params.type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const updated = await setContentResonance(database, user.id, request.params.type, request.params.id, true);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: { resonated: true } };
  });

  app.delete<{ Params: { type: 'activity' | 'need' | 'life'; id: string } }>('/api/v2/content/:type/:id/resonance', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!contentTypes.has(request.params.type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const updated = await setContentResonance(database, user.id, request.params.type, request.params.id, false);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: { resonated: false } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/content/:id/media', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const content = await requireContent(database, request.params.id);
    if (content.status !== 'approved' && user.role !== 'operator' && user.id !== content.authorId) return fail(reply, 404, 'NOT_FOUND', '内容不存在或不可见');
    return { data: { media: await listContentMedia(database, content.id) } };
  });

  app.post<{ Params: { id: string }; Body: { url?: string; altText?: string; sortOrder?: number } }>('/api/v2/content/:id/media', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const content = await requireContent(database, request.params.id);
    requireContentOwnerOrAdmin(user, content);
    const url = normalizeMediaUrl(request.body?.url);
    const altText = typeof request.body?.altText === 'string' ? request.body.altText.trim() : '';
    const sortOrder = request.body?.sortOrder ?? 0;
    if (!url || altText.length > 255 || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 65535) {
      return fail(reply, 400, 'VALIDATION_ERROR', '媒体地址、说明或排序值无效');
    }
    const media = await createContentMedia(database, { contentId: content.id, contentType: content.contentType, url, altText, sortOrder });
    return reply.code(201).send({ data: { media } });
  });

  app.patch<{ Params: { mediaId: string }; Body: { url?: string; altText?: string; sortOrder?: number } }>('/api/v2/media/:mediaId', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await getContentMedia(database, request.params.mediaId);
    if (!current) return fail(reply, 404, 'NOT_FOUND', '媒体不存在');
    const content = await requireContent(database, current.contentId);
    requireContentOwnerOrAdmin(user, content);
    const url = request.body?.url === undefined ? undefined : normalizeMediaUrl(request.body.url);
    const altText = request.body?.altText;
    const sortOrder = request.body?.sortOrder;
    if (url === null || (altText !== undefined && (typeof altText !== 'string' || altText.trim().length > 255)) || (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 65535))) {
      return fail(reply, 400, 'VALIDATION_ERROR', '媒体地址、说明或排序值无效');
    }
    const media = await updateContentMedia(database, current.id, { url: url ?? undefined, altText, sortOrder });
    return { data: { media } };
  });

  app.delete<{ Params: { mediaId: string } }>('/api/v2/media/:mediaId', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await getContentMedia(database, request.params.mediaId);
    if (!current) return fail(reply, 404, 'NOT_FOUND', '媒体不存在');
    const content = await requireContent(database, current.contentId);
    requireContentOwnerOrAdmin(user, content);
    await deleteContentMedia(database, current.id);
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

  app.get<{ Querystring: { type?: string } }>('/api/v2/tags', async (request, reply) => {
    const type = request.query.type as 'activity' | 'need' | 'life' | undefined;
    if (type && !['activity', 'need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    const tags = await listContentTags(database, type);
    return { data: { tags: tags.filter((tag) => tag.enabled) } };
  });

  app.get<{ Querystring: { type?: string; status?: string; tag?: string } }>('/api/v2/admin/content', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const type = request.query.type as 'activity' | 'need' | 'life' | undefined;
    const status = request.query.status as 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' | 'hidden' | undefined;
    if (request.query.tag !== undefined && typeof request.query.tag !== 'string') return fail(reply, 400, 'VALIDATION_ERROR', '标签筛选条件无效');
    if (type && !['activity', 'need', 'life'].includes(type)) return fail(reply, 400, 'VALIDATION_ERROR', '内容类型无效');
    if (status && !['draft', 'pending', 'approved', 'rejected', 'archived', 'hidden'].includes(status)) return fail(reply, 400, 'VALIDATION_ERROR', '审核状态无效');
    return { data: { items: await listAdminContent(database, { type, status, tag: request.query.tag?.trim() || undefined }) } };
  });

  app.patch<{ Params: { id: string }; Body: { status?: 'approved' | 'rejected' | 'archived' | 'pending' | 'hidden'; reason?: string } }>('/api/v2/admin/content/:id/status', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const status = request.body?.status;
    if (!status || !['approved', 'rejected', 'archived', 'pending', 'hidden'].includes(status)) return fail(reply, 400, 'VALIDATION_ERROR', '审核状态无效');
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

  app.delete<{ Params: { id: string } }>('/api/v2/admin/tags/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const tag = await updateContentTag(database, request.params.id, { enabled: false });
    return { data: { tag } };
  });

  app.post<{ Params: { id: string } }>('/api/v2/admin/tags/:id/restore', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const tag = await updateContentTag(database, request.params.id, { enabled: true });
    return { data: { tag } };
  });

  const proposalStatuses = new Set<ActivityProposalStatus>(['draft', 'submitted', 'accepted', 'rejected', 'withdrawn']);

  app.get<{ Querystring: { status?: string; includeArchived?: string } }>('/api/v2/operator/activity-proposals', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const status = request.query.status;
    if (status && !proposalStatuses.has(status as ActivityProposalStatus)) return fail(reply, 400, 'VALIDATION_ERROR', '提案状态无效');
    const includeArchived = request.query.includeArchived === 'true';
    if (request.query.includeArchived !== undefined && !['true', 'false'].includes(request.query.includeArchived)) return fail(reply, 400, 'VALIDATION_ERROR', '归档筛选值无效');
    return { data: { proposals: await listActivityProposals(database, { status: status as ActivityProposalStatus | undefined, includeArchived }) } };
  });

  app.get<{ Params: { id: string } }>('/api/v2/operator/activity-proposals/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const proposal = await getActivityProposal(database, request.params.id);
    if (!proposal) return fail(reply, 404, 'NOT_FOUND', '活动提案不存在');
    return { data: { proposal } };
  });

  app.patch<{ Params: { id: string }; Body: { title?: unknown; categoryKey?: unknown; description?: unknown; status?: unknown; reviewNote?: unknown } }>('/api/v2/operator/activity-proposals/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const body = request.body ?? {};
    const values = [body.title, body.categoryKey, body.description, body.reviewNote];
    if (values.some((value) => value !== undefined && typeof value !== 'string') || (body.status !== undefined && (typeof body.status !== 'string' || !proposalStatuses.has(body.status as ActivityProposalStatus)))) {
      return fail(reply, 400, 'VALIDATION_ERROR', '活动提案字段格式无效');
    }
    const proposal = await updateActivityProposal(database, request.params.id, user.id, body as Parameters<typeof updateActivityProposal>[3]);
    if (!proposal) return fail(reply, 404, 'NOT_FOUND', '活动提案不存在');
    return { data: { proposal } };
  });

  app.delete<{ Params: { id: string } }>('/api/v2/operator/activity-proposals/:id', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    if (!(await archiveActivityProposal(database, request.params.id, user.id))) return fail(reply, 404, 'NOT_FOUND', '活动提案不存在');
    return reply.code(204).send();
  });

  const configDomains = new Set<ConfigDomain>(['activity-categories', 'onboarding', 'profile-options', 'feedback-options', 'recommendation']);
  const configEntityTypes = new Set<ConfigEntityType>([
    'activity-category',
    'onboarding-question',
    'onboarding-option',
    'profile-option',
    'feedback-option',
    'recommendation-rule',
    'recommendation-setting',
  ]);
  function parseConfigDomain(value: string): ConfigDomain | null {
    return configDomains.has(value as ConfigDomain) ? value as ConfigDomain : null;
  }
  function parseConfigMutationBody(body: unknown): {
    entityType: ConfigEntityType;
    key?: string;
    expectedRevision: number;
    values?: Record<string, unknown>;
  } | null {
    if (!body || typeof body !== 'object') return null;
    const candidate = body as Record<string, unknown>;
    if (!configEntityTypes.has(candidate.entityType as ConfigEntityType)) return null;
    if (!Number.isInteger(candidate.expectedRevision) || Number(candidate.expectedRevision) < 0) return null;
    if (candidate.key !== undefined && (typeof candidate.key !== 'string' || !candidate.key.trim())) return null;
    if (candidate.values !== undefined && (!candidate.values || typeof candidate.values !== 'object' || Array.isArray(candidate.values))) return null;
    return {
      entityType: candidate.entityType as ConfigEntityType,
      key: typeof candidate.key === 'string' ? candidate.key.trim() : undefined,
      expectedRevision: Number(candidate.expectedRevision),
      values: candidate.values as Record<string, unknown> | undefined,
    };
  }

  app.get<{ Params: { domain: string } }>('/api/v2/operator/config/:domain', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    const config = await businessConfig.getBootstrap(true);
    const data = domain === 'activity-categories' ? config.activityCategories
      : domain === 'onboarding' ? config.onboarding
        : domain === 'profile-options' ? config.profileOptions
          : domain === 'feedback-options' ? config.feedbackOptions
            : config.recommendation;
    return { data: { domain, version: config.versions[domain], config: data } };
  });

  app.get<{ Params: { domain: string }; Querystring: { limit?: string } }>('/api/v2/operator/config/:domain/audit', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    const limit = request.query.limit === undefined ? 100 : Number(request.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) return fail(reply, 400, 'VALIDATION_ERROR', '审计分页数量必须在 1 至 500 之间');
    return { data: { events: await listConfigAuditEvents(database, domain, limit) } };
  });

  app.post<{ Params: { domain: string }; Body: unknown }>('/api/v2/operator/config/:domain', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    const body = parseConfigMutationBody(request.body);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    if (!body?.key) return fail(reply, 400, 'VALIDATION_ERROR', '配置实体、业务键或版本无效');
    const result = await businessConfig.mutate({ domain, ...body, key: body.key, actorId: user.id, mode: 'create' });
    return reply.code(201).send({ data: result });
  });

  app.patch<{ Params: { domain: string; entityKey: string }; Body: unknown }>('/api/v2/operator/config/:domain/:entityKey', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    const body = parseConfigMutationBody(request.body);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '配置实体或版本无效');
    return { data: await businessConfig.mutate({ domain, ...body, key: request.params.entityKey, actorId: user.id, mode: 'update' }) };
  });

  app.delete<{ Params: { domain: string; entityKey: string }; Body: unknown }>('/api/v2/operator/config/:domain/:entityKey', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    const body = parseConfigMutationBody(request.body);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '配置实体或版本无效');
    return { data: await businessConfig.mutate({ domain, ...body, key: request.params.entityKey, actorId: user.id, mode: 'disable' }) };
  });

  app.post<{ Params: { domain: string; entityKey: string }; Body: unknown }>('/api/v2/operator/config/:domain/:entityKey/restore', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    requireRole(user, 'operator');
    const domain = parseConfigDomain(request.params.domain);
    const body = parseConfigMutationBody(request.body);
    if (!domain) return fail(reply, 404, 'NOT_FOUND', '配置域不存在');
    if (!body) return fail(reply, 400, 'VALIDATION_ERROR', '配置实体或版本无效');
    return { data: await businessConfig.mutate({ domain, ...body, key: request.params.entityKey, actorId: user.id, mode: 'restore' }) };
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

  app.delete<{ Params: { id: string } }>('/api/v2/activities/:id/join', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const result = await cancelActivity(database, user.id, request.params.id);
    if (result === 'missing') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    if (result === 'not-joined') return fail(reply, 409, 'NOT_JOINED', '尚未报名或预约该活动');
    return { data: { participationStatus: null } };
  });

  app.put<{ Params: { id: string }; Body: { signal?: 'consider' | 'not_interested'; reason?: string } }>('/api/v2/activities/:id/interest', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const signal = request.body?.signal;
    const reason = parseOptionalReason(request.body?.reason);
    if (!signal || !['consider', 'not_interested'].includes(signal)) return fail(reply, 400, 'VALIDATION_ERROR', '活动意向无效');
    if (reason === null || (signal === 'not_interested' && reason && reason.length > 255)) return fail(reply, 400, 'VALIDATION_ERROR', '不考虑原因格式无效');
    let reasonKey = reason;
    if (signal === 'not_interested' && reason) {
      const config = await businessConfig.getBootstrap();
      const option = config.feedbackOptions.find((item) => item.groupKey === 'activity_dislike_reason' && (item.key === reason || item.label === reason));
      if (!option) return fail(reply, 400, 'VALIDATION_ERROR', '不考虑原因不存在或已停用');
      reasonKey = option.key;
    }
    const updated = await recordActivityInterest(database, user.id, request.params.id, signal, reasonKey);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { signal } };
  });

  app.post<{ Params: { id: string }; Body: { mood?: string; note?: string } }>('/api/v2/activities/:id/feedback', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const mood = typeof request.body?.mood === 'string' ? request.body.mood.trim() : '';
    const note = typeof request.body?.note === 'string' ? request.body.note.trim() : '';
    const config = await businessConfig.getBootstrap();
    const option = config.feedbackOptions.find((item) => item.groupKey === 'activity_mood' && (item.key === mood || item.label === mood));
    if (!option || note.length > 5000) return fail(reply, 400, 'VALIDATION_ERROR', '活动反馈格式无效或选项已停用');
    const updated = await saveActivityFeedback(database, user.id, request.params.id, option.key, note);
    if (!updated) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return reply.code(201).send({ data: { feedback: await getActivityFeedback(database, user.id, request.params.id) } });
  });

  app.get<{ Params: { id: string } }>('/api/v2/activities/:id/feedback', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const feedback = await getActivityFeedback(database, user.id, request.params.id);
    if (!feedback) return fail(reply, 404, 'NOT_FOUND', '活动反馈不存在');
    const optionRows = await database.query<Array<RowDataPacket & { label: string }>>(
      "SELECT label FROM feedback_option_configs WHERE group_key='activity_mood' AND option_key=? LIMIT 1",
      [feedback.mood],
    );
    return { data: { feedback: { ...feedback, moodLabel: optionRows[0]?.label ?? feedback.mood } } };
  });

  app.patch<{ Params: { id: string }; Body: { mood?: string; note?: string } }>('/api/v2/activities/:id/feedback', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const current = await getActivityFeedback(database, user.id, request.params.id);
    if (!current) return fail(reply, 404, 'NOT_FOUND', '活动反馈不存在');
    const mood = typeof request.body?.mood === 'string' ? request.body.mood.trim() : current.mood;
    const note = request.body?.note === undefined ? current.note : typeof request.body.note === 'string' ? request.body.note.trim() : '';
    let moodKey = current.mood;
    if (request.body?.mood !== undefined) {
      const config = await businessConfig.getBootstrap();
      const option = config.feedbackOptions.find((item) => item.groupKey === 'activity_mood' && (item.key === mood || item.label === mood));
      if (!option) return fail(reply, 400, 'VALIDATION_ERROR', '活动反馈选项不存在或已停用');
      moodKey = option.key;
    }
    if (note.length > 5000) return fail(reply, 400, 'VALIDATION_ERROR', '活动反馈内容过长');
    await saveActivityFeedback(database, user.id, request.params.id, moodKey, note);
    return { data: { feedback: await getActivityFeedback(database, user.id, request.params.id) } };
  });

  app.delete<{ Params: { id: string } }>('/api/v2/activities/:id/feedback', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    if (!(await withdrawActivityFeedback(database, user.id, request.params.id))) return fail(reply, 404, 'NOT_FOUND', '活动反馈不存在');
    return reply.code(204).send();
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

  app.post<{ Params: { id: string }; Body: { body?: string } }>('/api/v2/threads/:id/messages', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const result = await sendMessage(database, user.id, request.params.id, typeof request.body?.body === 'string' ? request.body.body : '');
    if (result.kind === 'invalid') return fail(reply, 400, 'VALIDATION_ERROR', '消息不能为空且不能超过 2000 字');
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '会话不存在');
    if (result.kind === 'forbidden') return fail(reply, 403, 'FORBIDDEN', '无权在此会话发言');
    return reply.code(201).send({ data: { message: result.message } });
  });

  app.delete<{ Params: { messageId: string } }>('/api/v2/messages/:messageId', async (request, reply) => {
    const user = await requireAuthenticatedUser(request, database);
    const result = await withdrawMessage(database, user.id, request.params.messageId);
    if (result === 'missing') return fail(reply, 404, 'NOT_FOUND', '消息不存在');
    if (result === 'forbidden') return fail(reply, 403, 'FORBIDDEN', '只能撤回自己的消息');
    return reply.code(204).send();
  });

  app.get('/api/v2/notifications', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const parsed = notificationListQuerySchema.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION_ERROR', '通知分页参数无效', validationFields(parsed.error.issues));
    const page = await listNotifications(database, user.id, parsed.data);
    return { data: { ...page, unreadCount: page.notifications.filter((item) => !item.read).length } };
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
    const activity = await resolveShareActivity(database, request.params.id);
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
