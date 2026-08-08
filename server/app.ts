import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import type { RowDataPacket } from 'mysql2/promise';
import { authenticateToken, createSession, revokeSession, verifyPassword } from './auth';
import type { QiahaoDatabase } from './db';
import { seedDatabase } from './seed';
import { createActivity, getActivity, listActivities, validateActivity } from './activity-repository';
import type { CreateActivityInput } from '../src/domain/types';
import { joinActivity, listMessages, listThreads, setFavorite } from './social-repository';
import { archiveReadNotifications, getNotification, listNotifications, markNotificationRead } from './notification-repository';
import { NotificationHub } from './notification-hub';

type Options = { database: QiahaoDatabase; notificationHub?: NotificationHub };
type ErrorReply = { code: (status: number) => { send: (body: unknown) => unknown } };
type LoginRow = RowDataPacket & {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: number | boolean;
  password_hash: string;
};

function fail(reply: ErrorReply, status: number, code: string, message: string) {
  return reply.code(status).send({ error: { code, message } });
}

async function userFrom(request: FastifyRequest, database: QiahaoDatabase) {
  return authenticateToken(database, request.headers.authorization);
}

export function buildApp({ database, notificationHub = new NotificationHub() }: Options): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: ['http://127.0.0.1:5174', 'http://localhost:5174'] });

  app.get('/api/health', async (_request, reply) => {
    try {
      await database.query('SELECT 1');
      return { data: { status: 'ok' } };
    } catch {
      return fail(reply, 503, 'DATABASE_UNAVAILABLE', '数据库暂不可用');
    }
  });

  app.post<{ Body: { phone?: string; password?: string } }>('/api/auth/login', async (request, reply) => {
    const phone = request.body?.phone?.trim();
    const password = request.body?.password ?? '';
    const rows = phone
      ? await database.query<LoginRow[]>('SELECT * FROM users WHERE phone=? LIMIT 1', [phone])
      : [];
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return fail(reply, 401, 'INVALID_CREDENTIALS', '手机号或密码错误');
    }
    const token = await createSession(database, row.id);
    return {
      data: {
        token,
        user: {
          id: row.id,
          phone: row.phone,
          name: row.name,
          avatar: row.avatar,
          bio: row.bio,
          verified: Boolean(row.verified),
        },
      },
    };
  });

  app.post('/api/auth/logout', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const token = request.headers.authorization!.slice(7).trim();
    await revokeSession(database, token);
    return reply.code(204).send();
  });

  app.get('/api/me', async (request, reply) => {
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

  app.get('/api/activities', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { activities: await listActivities(database, user.id) } };
  });

  app.get<{ Params: { id: string } }>('/api/activities/:id', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const item = await getActivity(database, user.id, request.params.id);
    if (!item) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { activity: item } };
  });

  app.post<{ Body: Partial<CreateActivityInput> }>('/api/activities', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const input = request.body ?? {};
    const message = validateActivity(input);
    if (message) return fail(reply, 400, 'VALIDATION_ERROR', message);
    const item = await createActivity(database, user.id, input as CreateActivityInput);
    if (!item) return fail(reply, 500, 'PERSISTENCE_ERROR', '活动创建失败');
    return reply.code(201).send({ data: { activity: item } });
  });

  app.put<{ Params: { id: string } }>('/api/activities/:id/favorite', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    if (!(await setFavorite(database, user.id, request.params.id, true))) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { saved: true } };
  });

  app.delete<{ Params: { id: string } }>('/api/activities/:id/favorite', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    if (!(await setFavorite(database, user.id, request.params.id, false))) return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    return { data: { saved: false } };
  });

  app.post<{ Params: { id: string } }>('/api/activities/:id/join', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const result = await joinActivity(database, user.id, request.params.id);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '活动不存在');
    if (result.kind === 'full') return fail(reply, 409, 'ACTIVITY_FULL', '活动名额已满');
    if (!result.thread) return fail(reply, 500, 'PERSISTENCE_ERROR', '活动群聊创建失败');
    return { data: { thread: result.thread } };
  });

  app.get('/api/threads', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    return { data: { threads: await listThreads(database, user.id) } };
  });

  app.get<{ Params: { id: string } }>('/api/threads/:id/messages', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const result = await listMessages(database, user.id, request.params.id);
    if (result.kind === 'missing') return fail(reply, 404, 'NOT_FOUND', '会话不存在');
    if (result.kind === 'forbidden') return fail(reply, 403, 'FORBIDDEN', '无权查看此会话');
    return { data: { messages: result.messages } };
  });

  app.get('/api/notifications', async (request, reply) => {
    const user = await userFrom(request, database);
    if (!user) return fail(reply, 401, 'UNAUTHORIZED', '请先登录');
    const notifications = await listNotifications(database, user.id);
    return { data: { notifications, unreadCount: notifications.filter((item) => !item.read).length } };
  });

  app.patch<{ Params: { id: string } }>('/api/notifications/:id/read', async (request, reply) => {
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
  app.post('/api/notifications/read/archive', archiveHandler);
  app.delete('/api/notifications/read', archiveHandler);

  app.get('/api/notifications/stream', async (request, reply) => {
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
  return app;
}

export async function createSeededApp(database: QiahaoDatabase, notificationHub?: NotificationHub) {
  await seedDatabase(database);
  return buildApp({ database, notificationHub });
}
