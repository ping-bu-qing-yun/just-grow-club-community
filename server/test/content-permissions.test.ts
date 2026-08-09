import { afterEach, expect } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import { applyMigrations } from '../migrations/service';
import { authInjectAs, buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }; database: { close: () => Promise<void>; query: (...args: any[]) => Promise<any> } }> = [];

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    await resource.database.close();
  }
});

const activityPayload = {
  title: '周日城市散步',
  category: '徒步',
  description: '沿苏州河慢慢走。',
  dateLabel: '周日 · 8月9日',
  time: '16:00',
  location: '衡山路地铁站',
  capacity: 6,
  price: 0,
};

mysqlIt('returns authoritative roles and rejects forged activity permissions', async () => {
  const resource = await buildTestApp();
  resources.push(resource);

  const adminLogin = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: { phone: '13800000000', password: 'qiahao123' } });
  const userLogin = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: { phone: '13800000001', password: 'qiahao123' } });
  expect(adminLogin.json().data.user.role).toBe('admin');
  expect(userLogin.json().data.user.role).toBe('user');

  const response = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/activities',
    payload: { ...activityPayload, role: 'admin' },
  });
  expect(response.statusCode).toBe(403);
  expect(response.json().error.code).toBe('FORBIDDEN');
});

mysqlIt('creates approved need and life content but protects another author', async () => {
  const resource = await buildTestApp();
  resources.push(resource);

  const need = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/needs',
    payload: { body: '找同频的人周末散步。', tags: ['natural-chat'] },
  });
  expect(need.statusCode).toBe(201);
  expect(need.json().data.need.status).toBe('approved');

  const life = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/life-posts',
    payload: { body: '今天去江边走了走。', image: '/assets/coffee.jpg', tags: ['weekend'] },
  });
  expect(life.statusCode).toBe(201);
  expect(life.json().data.lifePost.status).toBe('approved');

  const patch = await authInjectAs(resource.app, '13800000001', {
    method: 'PATCH',
    url: '/api/needs/d1',
    payload: { body: '不应修改他人的需求。', tags: [] },
  });
  const archive = await authInjectAs(resource.app, '13800000001', { method: 'DELETE', url: '/api/needs/d1' });
  expect(patch.statusCode).toBe(403);
  expect(archive.statusCode).toBe(403);
});

mysqlIt('enforces content-type tags, disabled tags, and duplicate-tag idempotence', async () => {
  const resource = await buildTestApp();
  resources.push(resource);

  const mismatch = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/needs',
    payload: { body: '标签类型不匹配应被拒绝。', tags: ['relationship'] },
  });
  expect(mismatch.statusCode).toBe(400);
  expect(mismatch.json().error.code).toBe('TAG_NOT_FOUND');

  const disabled = await authInjectAs(resource.app, '13800000000', {
    method: 'PATCH',
    url: '/api/admin/tags/life-relationship',
    payload: { enabled: false },
  });
  expect(disabled.statusCode).toBe(200);

  const rejected = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/life-posts',
    payload: { body: '停用标签应被拒绝。', tags: ['relationship'] },
  });
  expect(rejected.statusCode).toBe(400);
  expect(rejected.json().error.code).toBe('TAG_DISABLED');

  const duplicate = await authInjectAs(resource.app, '13800000001', {
    method: 'POST',
    url: '/api/needs',
    payload: { body: '重复标签只应建立一条关联。', tags: ['natural-chat', 'natural-chat'] },
  });
  expect(duplicate.statusCode).toBe(201);
  expect(duplicate.json().data.need.tags).toHaveLength(1);
});

mysqlIt('can apply the recorded migration chain repeatedly without duplicate versions', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  await applyMigrations(resource.database);
  await applyMigrations(resource.database);
  const rows = await resource.database.query<Array<RowDataPacket & { version: string; count: number | string }>>(
    'SELECT version,COUNT(*) AS count FROM schema_migrations GROUP BY version ORDER BY version',
  );
  expect(rows.every((row) => Number(row.count) === 1)).toBe(true);
});

mysqlIt('lets an admin moderate content and keeps rejected content out of public lists', async () => {
  const resource = await buildTestApp();
  resources.push(resource);

  const rejected = await authInjectAs(resource.app, '13800000000', {
    method: 'PATCH',
    url: '/api/admin/content/d1/status',
    payload: { status: 'rejected', reason: '内容需要进一步说明。' },
  });
  expect(rejected.statusCode).toBe(200);
  expect(rejected.json().data.item.status).toBe('rejected');
  expect(rejected.json().data.item.rejectionReason).toBe('内容需要进一步说明。');

  const publicList = await authInjectAs(resource.app, '13800000001', { method: 'GET', url: '/api/needs' });
  expect(publicList.statusCode).toBe(200);
  expect(publicList.json().data.needs.some((item: { id: string }) => item.id === 'd1')).toBe(false);

  const archived = await authInjectAs(resource.app, '13800000000', {
    method: 'PATCH',
    url: '/api/admin/content/d1/status',
    payload: { status: 'archived', reason: '归档测试。' },
  });
  expect(archived.statusCode).toBe(200);
  expect(archived.json().data.item.status).toBe('archived');
});

mysqlIt('re-reads the role for an existing session after a role change', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const login = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: { phone: '13800000001', password: 'qiahao123' } });
  const token = login.json().data.token as string;
  await resource.database.query("UPDATE users SET role='admin' WHERE id='u1'");
  const response = await resource.app.inject({ method: 'POST', url: '/api/activities', headers: { authorization: `Bearer ${token}` }, payload: activityPayload });
  expect(response.statusCode).toBe(201);
});
