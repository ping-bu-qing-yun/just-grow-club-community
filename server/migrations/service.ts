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
  'comments',
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

async function verifyColumns(database: QiahaoDatabase): Promise<void> {
  const requiredColumns = new Map([
    ['users', ['role']],
    ['content_items', ['author_id', 'content_type', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'published_at']],
    ['needs', ['body', 'author_id']],
    ['life_posts', ['body', 'image', 'author_id']],
    ['content_tags', ['content_type', 'slug', 'label', 'enabled']],
    ['content_item_tags', ['content_id', 'tag_id', 'content_type']],
  ]);
  const rows = await database.query<Array<RowDataPacket & { TABLE_NAME: string; COLUMN_NAME: string }>>(
    `SELECT TABLE_NAME,COLUMN_NAME
       FROM information_schema.columns
      WHERE table_schema=DATABASE()
        AND table_name IN (?)`,
    [[...requiredColumns.keys()]],
  );
  const present = new Set(rows.map((row) => `${row.TABLE_NAME}.${row.COLUMN_NAME}`));
  const missing: string[] = [];
  for (const [table, columns] of requiredColumns) {
    for (const column of columns) if (!present.has(`${table}.${column}`)) missing.push(`${table}.${column}`);
  }
  if (missing.length) throw new Error(`迁移后仍缺少字段：${missing.join(', ')}`);
}

async function ensureActivitiesContentForeignKey(database: QiahaoDatabase): Promise<void> {
  const rows = await database.query<Array<RowDataPacket & { count: number | string }>>(
    `SELECT COUNT(*) AS count
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA=DATABASE()
        AND TABLE_NAME='activities'
        AND COLUMN_NAME='id'
        AND REFERENCED_TABLE_NAME='content_items'
        AND REFERENCED_COLUMN_NAME='id'`,
  );
  if (Number(rows[0]?.count ?? 0) > 0) return;
  await database.query('ALTER TABLE activities ADD CONSTRAINT fk_activities_content_item FOREIGN KEY (id) REFERENCES content_items(id)');
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
  await ensureActivitiesContentForeignKey(database);
  await verifyTables(database);
  await verifyColumns(database);
}
