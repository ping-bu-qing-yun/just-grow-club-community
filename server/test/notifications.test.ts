import { afterEach, expect } from 'vitest';
import { authInject, buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }; database: { close: () => void } }> = [];
afterEach(async () => { for (const resource of resources.splice(0)) { await resource.app.close(); resource.database.close(); } });

mysqlIt('lists the five notification categories for the authenticated user', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const response = await authInject(resource.app, { method: 'GET', url: '/api/notifications' });
  expect(response.statusCode).toBe(200);
  expect(response.json().data.notifications).toHaveLength(5);
  expect(response.json().data.notifications.map((item: { category: string }) => item.category)).toEqual(
    expect.arrayContaining(['announcement', 'system', 'like', 'comment', 'feedback']),
  );
  expect(response.json().data.unreadCount).toBe(4);
});

mysqlIt('marks one notification read and archives only read notifications', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  const read = await authInject(resource.app, { method: 'PATCH', url: '/api/notifications/notice-weekend-activities/read' });
  expect(read.statusCode).toBe(200);
  expect(read.json().data.notification.read).toBe(true);

  const archive = await authInject(resource.app, { method: 'POST', url: '/api/notifications/read/archive' });
  expect(archive.json().data.archivedCount).toBe(2);
  const remaining = await authInject(resource.app, { method: 'GET', url: '/api/notifications' });
  expect(remaining.json().data.notifications.map((item: { id: string }) => item.id).sort()).toEqual(
    ['notice-activity-feedback', 'notice-like-need', 'notice-safety'].sort(),
  );
});

mysqlIt('does not expose notifications without a valid session', async () => {
  const resource = await buildTestApp(); resources.push(resource);
  expect((await resource.app.inject({ method: 'GET', url: '/api/notifications' })).statusCode).toBe(401);
  expect((await resource.app.inject({ method: 'GET', url: '/api/notifications/stream' })).statusCode).toBe(401);
});
