import { buildApp } from '../app';
import { createDatabase, type QiahaoDatabase } from '../db';
import { seedDatabase } from '../seed';

export async function buildTestApp() {
  const database = createDatabase(':memory:');
  await seedDatabase(database);
  const app = buildApp({ database });
  return { app, database };
}

export async function authInject(app: Awaited<ReturnType<typeof buildApp>>, options: any) {
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'qiahao123',
  }});
  const token = login.json().data.token as string;
  return app.inject({ ...options, headers: { ...(options.headers ?? {}), authorization: `Bearer ${token}` } });
}

export function closeTestDatabase(database: QiahaoDatabase) {
  database.close();
}
