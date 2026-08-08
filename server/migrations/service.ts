import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { REQUIRED_MIGRATIONS } from '../db';
import type { QiahaoDatabase } from '../db';

const migrationRoot = resolve(process.cwd(), 'server/migrations/mysql');
const requiredTables = [
  'users',
  'sessions',
  'activities',
  'favorites',
  'activity_members',
  'threads',
  'thread_members',
  'messages',
  'notifications',
  'notification_outbox',
  'content_items',
  'needs',
  'life_posts',
  'content_tags',
  'content_item_tags',
  'schema_migrations',
] as const;

export function splitMigrationStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

export async function migrationStatementCounts(): Promise<Array<{ version: string; statements: number }>> {
  return Promise.all(REQUIRED_MIGRATIONS.map(async (version) => ({
    version,
    statements: splitMigrationStatements(await readFile(join(migrationRoot, version), 'utf8')).length,
  })));
}

async function verifyTables(database: QiahaoDatabase): Promise<void> {
  const rows = await database.query<Array<RowDataPacket & { TABLE_NAME: string }>>(
    `SELECT TABLE_NAME
       FROM information_schema.tables
      WHERE table_schema=DATABASE()
        AND table_name IN (?)`,
    [requiredTables],
  );
  const present = new Set(rows.map((row) => row.TABLE_NAME));
  const missing = requiredTables.filter((table) => !present.has(table));
  if (missing.length) throw new Error(`迁移后仍缺少数据表：${missing.join(', ')}`);
}

export async function applyMigrations(database: QiahaoDatabase): Promise<void> {
  await database.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version VARCHAR(64) PRIMARY KEY,
       applied_at DATETIME(3) NOT NULL
     )`,
  );
  for (const version of REQUIRED_MIGRATIONS) {
    const rows = await database.query<Array<RowDataPacket & { version: string }>>(
      'SELECT version FROM schema_migrations WHERE version=?',
      [version],
    );
    if (rows.length) continue;
    const sql = await readFile(join(migrationRoot, version), 'utf8');
    for (const statement of splitMigrationStatements(sql)) await database.query(statement);
    await database.query(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, NOW(3))',
      [version],
    );
  }
  await verifyTables(database);
}
