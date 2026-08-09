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

const requiredIndexes = [
  ['content_items', 'idx_content_items_public'],
  ['content_items', 'idx_content_items_author'],
  ['content_items', 'idx_content_items_review'],
  ['needs', 'idx_needs_author'],
  ['life_posts', 'idx_life_posts_author'],
  ['content_tags', 'idx_content_tags_enabled'],
  ['content_item_tags', 'idx_content_item_tags_tag'],
  ['comments', 'idx_comments_content_order'],
  ['comments', 'idx_comments_author_order'],
] as const;

const requiredForeignKeys = [
  ['content_items', 'author_id', 'users', 'id'],
  ['content_items', 'reviewed_by', 'users', 'id'],
  ['needs', 'id', 'content_items', 'id'],
  ['needs', 'author_id', 'users', 'id'],
  ['life_posts', 'id', 'content_items', 'id'],
  ['life_posts', 'author_id', 'users', 'id'],
  ['activities', 'id', 'content_items', 'id'],
  ['content_item_tags', 'content_id', 'content_items', 'id'],
  ['content_item_tags', 'tag_id', 'content_tags', 'id'],
  ['comments', 'author_id', 'users', 'id'],
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
    ['comments', ['content_type', 'content_id', 'author_id', 'body', 'created_at', 'updated_at', 'deleted_at']],
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

async function verifyIndexes(database: QiahaoDatabase): Promise<void> {
  const rows = await database.query<Array<RowDataPacket & { TABLE_NAME: string; INDEX_NAME: string }>>(
    `SELECT TABLE_NAME,INDEX_NAME
       FROM information_schema.statistics
      WHERE table_schema=DATABASE()
        AND table_name IN (?)`,
    [[...new Set(requiredIndexes.map(([table]) => table))]],
  );
  const present = new Set(rows.map((row) => `${row.TABLE_NAME}.${row.INDEX_NAME}`));
  const missing = requiredIndexes
    .map(([table, index]) => `${table}.${index}`)
    .filter((index) => !present.has(index));
  if (missing.length) throw new Error(`迁移后仍缺少索引：${missing.join(', ')}`);
}

async function verifyForeignKeys(database: QiahaoDatabase): Promise<void> {
  const rows = await database.query<Array<RowDataPacket & {
    TABLE_NAME: string;
    COLUMN_NAME: string;
    REFERENCED_TABLE_NAME: string;
    REFERENCED_COLUMN_NAME: string;
  }>>(
    `SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE CONSTRAINT_SCHEMA=DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );
  const present = new Set(rows.map((row) => `${row.TABLE_NAME}.${row.COLUMN_NAME}->${row.REFERENCED_TABLE_NAME}.${row.REFERENCED_COLUMN_NAME}`));
  const missing = requiredForeignKeys
    .map(([table, column, referencedTable, referencedColumn]) => `${table}.${column}->${referencedTable}.${referencedColumn}`)
    .filter((relation) => !present.has(relation));
  if (missing.length) throw new Error(`迁移后仍缺少外键：${missing.join(', ')}`);
}

async function verifyContentData(database: QiahaoDatabase): Promise<void> {
  const rows = await database.query<Array<RowDataPacket & {
    orphan_activities: number | string;
    invalid_tag_types: number | string;
    invalid_roles: number | string;
  }>>(
    `SELECT
       (SELECT COUNT(*)
          FROM activities a
          LEFT JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity'
         WHERE ci.id IS NULL) AS orphan_activities,
       (SELECT COUNT(*)
          FROM content_item_tags it
          JOIN content_items ci ON ci.id=it.content_id
          JOIN content_tags t ON t.id=it.tag_id
         WHERE it.content_type<>ci.content_type OR it.content_type<>t.content_type) AS invalid_tag_types,
       (SELECT COUNT(*) FROM users WHERE role IS NULL OR role NOT IN ('member','host','operator')) AS invalid_roles`,
  );
  const row = rows[0];
  if (!row) throw new Error('迁移校验未返回数据一致性结果');
  if (Number(row.orphan_activities) > 0) throw new Error(`迁移后存在 ${row.orphan_activities} 条活动缺少统一内容父记录`);
  if (Number(row.invalid_tag_types) > 0) throw new Error(`迁移后存在 ${row.invalid_tag_types} 条内容标签类型不一致`);
  if (Number(row.invalid_roles) > 0) throw new Error(`迁移后存在 ${row.invalid_roles} 个非法用户角色`);
  const demoRows = await database.query<Array<RowDataPacket & { role: string }>>('SELECT role FROM users WHERE id=? LIMIT 1', ['me']);
  if (demoRows[0] && demoRows[0].role !== 'operator') throw new Error('演示账号 me 必须映射为 operator');
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
  await verifyIndexes(database);
  await verifyForeignKeys(database);
  await verifyContentData(database);
}
