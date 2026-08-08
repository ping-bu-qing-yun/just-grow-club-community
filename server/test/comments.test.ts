import { afterEach, expect, it } from 'vitest';
import { authInject, buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }; database: { close: () => Promise<void> } }> = [];

afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    await resource.database.close();
  }
});

async function tokenFor(app: { inject: (options: any) => Promise<any> }, phone: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { phone, password: 'qiahao123' },
  });
  return response.json().data.token as string;
}

mysqlIt('returns five comments first and follows a stable cursor', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const first = await resource.app.inject({ method: 'GET', url: '/api/comments?contentType=need&contentId=d1' });
  expect(first.statusCode).toBe(200);
  expect(first.json().data.comments).toHaveLength(5);
  expect(first.json().data.total).toBe(6);
  expect(first.json().data.nextCursor).toEqual(expect.any(String));

  const cursor = encodeURIComponent(first.json().data.nextCursor);
  const second = await resource.app.inject({ method: 'GET', url: `/api/comments?contentType=need&contentId=d1&cursor=${cursor}` });
  expect(second.statusCode).toBe(200);
  expect(second.json().data.comments).toHaveLength(1);
  expect(second.json().data.nextCursor).toBeNull();
});

mysqlIt('requires login to create and lets the operator soft-delete a comment', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const anonymous = await resource.app.inject({
    method: 'POST',
    url: '/api/comments',
    payload: { contentType: 'need', contentId: 'd1', body: '匿名评论' },
  });
  expect(anonymous.statusCode).toBe(401);

  const created = await authInject(resource.app, {
    method: 'POST',
    url: '/api/comments',
    payload: { contentType: 'need', contentId: 'd1', body: '  新的一条评论  ' },
  });
  expect(created.statusCode).toBe(201);
  const id = created.json().data.comment.id as string;
  expect(created.json().data.comment.body).toBe('新的一条评论');

  const deleted = await authInject(resource.app, { method: 'DELETE', url: `/api/comments/${id}` });
  expect(deleted.statusCode).toBe(204);
  const list = await resource.app.inject({ method: 'GET', url: '/api/comments?contentType=need&contentId=d1&limit=100' });
  expect(list.json().data.total).toBe(6);
  expect(list.json().data.comments.some((comment: { id: string }) => comment.id === id)).toBe(false);
});

mysqlIt('rejects invalid content and prevents ordinary users deleting another author comment', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const invalid = await authInject(resource.app, {
    method: 'POST',
    url: '/api/comments',
    payload: { contentType: 'unknown', contentId: 'd1', body: 'x' },
  });
  expect(invalid.statusCode).toBe(400);

  const first = await authInject(resource.app, {
    method: 'POST',
    url: '/api/comments',
    payload: { contentType: 'need', contentId: 'd1', body: '管理员评论' },
  });
  const id = first.json().data.comment.id as string;
  const userToken = await tokenFor(resource.app, '13800000001');
  const forbidden = await resource.app.inject({ method: 'DELETE', url: `/api/comments/${id}`, headers: { authorization: `Bearer ${userToken}` } });
  expect(forbidden.statusCode).toBe(403);
});
