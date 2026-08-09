import { afterEach, expect } from 'vitest';
import { buildTestApp, mysqlIt } from './helpers';

const resources: Array<{ app: { close: () => Promise<void> }, database: { close: () => void } }> = [];
afterEach(async () => {
  for (const resource of resources.splice(0)) {
    await resource.app.close();
    await resource.database.close();
  }
});

mysqlIt('logs in the demo user and authorizes /api/me', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const login = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'qiahao123',
  }});
  expect(login.statusCode).toBe(200);
  const token = login.json().data.token as string;
  const me = await resource.app.inject({ method: 'GET', url: '/api/me', headers: {
    authorization: `Bearer ${token}`,
  }});
  expect(me.statusCode).toBe(200);
  expect(me.json().data.user.name).toBe('小恰');
  expect(me.json().data.user.role).toBe('admin');
});

mysqlIt('rejects a wrong password without exposing details', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const response = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'wrong-password',
  }});
  expect(response.statusCode).toBe(401);
  expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
});

mysqlIt('rejects protected endpoints without a token', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const response = await resource.app.inject({ method: 'GET', url: '/api/me' });
  expect(response.statusCode).toBe(401);
  expect(response.json().error.code).toBe('UNAUTHORIZED');
});

mysqlIt('invalidates the bearer token immediately after logout', async () => {
  const resource = await buildTestApp();
  resources.push(resource);
  const login = await resource.app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'qiahao123',
  }});
  const token = login.json().data.token as string;
  const logout = await resource.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { authorization: `Bearer ${token}` } });
  expect(logout.statusCode).toBe(204);
  const me = await resource.app.inject({ method: 'GET', url: '/api/me', headers: { authorization: `Bearer ${token}` } });
  expect(me.statusCode).toBe(401);
});
