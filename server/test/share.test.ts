import { afterEach, expect } from 'vitest';
import { authInject, buildTestApp, mysqlIt } from './helpers';
import { getShareActivity } from '../share-catalog';

const resources: Array<{ app: { close: () => Promise<void>; inject: Function }; database: { close: () => void } }> = [];
afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    resource.database.close();
  }
});

mysqlIt('returns og html for activity share landing pages', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const activity = getShareActivity('club-dinner')!;
  const response = await resource.app.inject({
    method: 'GET',
    url: '/api/share/activity/club-dinner',
    headers: { host: '127.0.0.1:3001' },
  });
  expect(response.statusCode).toBe(200);
  expect(response.headers['content-type']).toContain('text/html');
  expect(response.body).toContain(`og:title" content="${activity.title}"`);
  expect(response.body).toContain('og:image');
  expect(response.body).toContain('/assets/food.jpg');
  expect(response.body).toContain('activity=club-dinner');
});

mysqlIt('returns 404 for unknown activity share ids', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const response = await resource.app.inject({ method: 'GET', url: '/api/share/activity/not-real' });
  expect(response.statusCode).toBe(404);
});
