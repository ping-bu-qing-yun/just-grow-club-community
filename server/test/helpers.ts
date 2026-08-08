import { buildApp } from '../app';
import { createDatabase, type QiahaoDatabase } from '../db';
import { applyMigrations } from '../migrations/service';
import { seedDatabase } from '../seed';

const testConfigKeys = ['MYSQL_TEST_HOST', 'MYSQL_TEST_USER', 'MYSQL_TEST_PASSWORD', 'MYSQL_TEST_DATABASE'];
export const hasTestDatabaseConfig = testConfigKeys.every((key) => process.env[key] !== undefined && process.env[key] !== '');

export async function resetTestDatabase(database: QiahaoDatabase): Promise<void> {
  await database.query('SET FOREIGN_KEY_CHECKS=0');
  try {
    for (const table of [
      'notification_outbox',
      'notifications',
      'messages',
      'thread_members',
      'threads',
      'activity_members',
      'favorites',
      'activities',
      'sessions',
      'users',
    ]) {
      await database.query(`DELETE FROM ${table}`);
    }
  } finally {
    await database.query('SET FOREIGN_KEY_CHECKS=1');
  }
}

export async function buildTestApp() {
  if (!hasTestDatabaseConfig) throw new Error('未配置 MYSQL_TEST_*，跳过 server 集成测试');
  const database = await createDatabase({ envPrefix: 'MYSQL_TEST' });
  try {
    await applyMigrations(database);
    await resetTestDatabase(database);
    await seedDatabase(database);
    return { app: buildApp({ database }), database };
  } catch (error) {
    await database.close();
    throw error;
  }
}

export async function authInject(app: Awaited<ReturnType<typeof buildApp>>, options: any) {
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { phone: '13800000000', password: 'qiahao123' },
  });
  const token = login.json().data.token as string;
  return app.inject({ ...options, headers: { ...(options.headers ?? {}), authorization: `Bearer ${token}` } });
}

export async function closeTestDatabase(database: QiahaoDatabase): Promise<void> {
  await database.close();
}
