import { afterEach, expect } from 'vitest';
import { authInject, buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }, database: { close: () => Promise<void> } }> = [];
afterEach(async () => { for (const resource of resources.splice(0)) { await resource.app.close(); await resource.database.close(); } });

mysqlIt('toggles favorites idempotently', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  expect((await authInject(resource.app, { method: 'PUT', url: '/api/activities/walk-001/favorite' })).statusCode).toBe(200);
  expect((await authInject(resource.app, { method: 'PUT', url: '/api/activities/walk-001/favorite' })).statusCode).toBe(200);
  const list = await authInject(resource.app, { method: 'GET', url: '/api/activities' });
  expect(list.json().data.activities.find((item: { id: string }) => item.id === 'walk-001').saved).toBe(true);
});

mysqlIt('joins once and creates a readable activity thread', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const first = await authInject(resource.app, { method: 'POST', url: '/api/activities/walk-001/join' });
  const second = await authInject(resource.app, { method: 'POST', url: '/api/activities/walk-001/join' });
  expect(first.statusCode).toBe(200); expect(second.json().data.thread.id).toBe(first.json().data.thread.id);
  const threads = await authInject(resource.app, { method: 'GET', url: '/api/threads' });
  expect(threads.json().data.threads).toEqual(expect.arrayContaining([expect.objectContaining({ activityId: 'walk-001' })]));
});

mysqlIt('prevents a non-member from reading an activity thread', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const thread = await authInject(resource.app, { method: 'POST', url: '/api/activities/walk-001/join' });
  const response = await resource.app.inject({ method: 'GET', url: `/api/threads/${thread.json().data.thread.id}/messages` });
  expect(response.statusCode).toBe(401);
});
