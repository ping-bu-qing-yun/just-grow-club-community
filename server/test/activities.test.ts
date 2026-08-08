import { afterEach, expect } from 'vitest';
import { authInject, buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }, database: { close: () => void } }> = [];
afterEach(async () => { for (const resource of resources.splice(0)) { await resource.app.close(); resource.database.close(); } });

mysqlIt('lists seeded activities with user state', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const response = await authInject(resource.app, { method: 'GET', url: '/api/activities' });
  expect(response.statusCode).toBe(200);
  expect(response.json().data.activities).toHaveLength(8);
  expect(response.json().data.activities[0]).toMatchObject({ id: expect.any(String), host: { id: expect.any(String) }, saved: false, joined: false });
});

mysqlIt('publishes an activity owned by the current user', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const response = await authInject(resource.app, { method: 'POST', url: '/api/activities', payload: { title: '周日城市散步', category: '徒步', description: '沿苏州河慢慢走。', dateLabel: '周日 · 8月9日', time: '16:00', location: '衡山路地铁站', capacity: 6, price: 0 } });
  expect(response.statusCode).toBe(201);
  expect(response.json().data.activity.host.name).toBe('小恰');
});

mysqlIt('rejects invalid activity input', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const response = await authInject(resource.app, { method: 'POST', url: '/api/activities', payload: { title: '', category: '徒步' } });
  expect(response.statusCode).toBe(400);
  expect(response.json().error.code).toBe('VALIDATION_ERROR');
});
