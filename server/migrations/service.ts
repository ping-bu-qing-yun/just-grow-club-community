import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { REQUIRED_MIGRATIONS } from '../db';
import type { QiahaoDatabase } from '../db';

const migrationRoot = resolve(process.cwd(), 'server/migrations/mysql');
const requiredTables = [
  'users',
  'sessions',
  'user_profiles',
  'user_onboarding_progress',
  'user_onboarding_answers',
  'user_interest_tags',
  'content_items',
  'activities',
  'needs',
  'life_posts',
  'content_tags',
  'content_item_tags',
  'content_media',
  'comments',
  'content_bookmarks',
  'content_reactions',
  'content_share_events',
  'activity_agenda_items',
  'activity_need_links',
  'activity_interest_signals',
  'activity_feedback',
  'activity_members',
  'activity_proposals',
  'threads',
  'thread_members',
  'messages',
  'content_reports',
  'content_audit_events',
  'notifications',
  'notification_outbox',
  'favorites',
  'activity_category_configs',
  'onboarding_question_configs',
  'onboarding_option_configs',
  'profile_option_configs',
  'feedback_option_configs',
  'recommendation_rule_configs',
  'recommendation_setting_configs',
  'config_revisions',
  'config_audit_events',
  'schema_migrations',
] as const;

const requiredIndexes = [
  ['user_profiles', 'idx_user_profiles_city_district'],
  ['user_interest_tags', 'idx_user_interest_tags_user_kind'],
  ['content_items', 'idx_content_items_public'],
  ['content_items', 'idx_content_items_author'],
  ['content_items', 'idx_content_items_review'],
  ['activities', 'idx_activities_discovery'],
  ['activities', 'idx_activities_schedule'],
  ['needs', 'idx_needs_author'],
  ['life_posts', 'idx_life_posts_author'],
  ['content_tags', 'idx_content_tags_enabled'],
  ['content_item_tags', 'idx_content_item_tags_tag'],
  ['content_media', 'idx_content_media_content'],
  ['comments', 'idx_comments_content_order'],
  ['comments', 'idx_comments_author_order'],
  ['content_bookmarks', 'idx_content_bookmarks_user'],
  ['content_reactions', 'idx_content_reactions_content'],
  ['content_share_events', 'idx_content_share_events_content'],
  ['activity_agenda_items', 'uq_activity_agenda_items_activity_sequence'],
  ['activity_need_links', 'idx_activity_need_links_need'],
  ['activity_interest_signals', 'idx_activity_interest_signals_activity'],
  ['activity_feedback', 'uq_activity_feedback_activity_user'],
  ['activity_members', 'idx_members_activity'],
  ['activity_proposals', 'idx_activity_proposals_host_status'],
  ['activity_proposals', 'idx_activity_proposals_review'],
  ['threads', 'uq_threads_activity'],
  ['thread_members', 'idx_thread_members_user'],
  ['messages', 'idx_messages_thread_created'],
  ['content_reports', 'idx_content_reports_status_created'],
  ['content_audit_events', 'idx_content_audit_events_content'],
  ['notifications', 'idx_notifications_user_state'],
  ['notification_outbox', 'idx_notification_outbox_pending'],
  ['favorites', 'idx_favorites_activity'],
  ['activity_category_configs', 'uq_activity_category_configs_key'],
  ['activity_category_configs', 'idx_activity_category_configs_enabled'],
  ['onboarding_question_configs', 'uq_onboarding_question_configs_key'],
  ['onboarding_question_configs', 'idx_onboarding_question_configs_enabled'],
  ['onboarding_option_configs', 'uq_onboarding_option_configs_question_key'],
  ['onboarding_option_configs', 'idx_onboarding_option_configs_enabled'],
  ['profile_option_configs', 'uq_profile_option_configs_group_key'],
  ['profile_option_configs', 'idx_profile_option_configs_enabled'],
  ['feedback_option_configs', 'uq_feedback_option_configs_group_key'],
  ['feedback_option_configs', 'idx_feedback_option_configs_enabled'],
  ['recommendation_rule_configs', 'uq_recommendation_rule_configs_key'],
  ['recommendation_rule_configs', 'uq_recommendation_rule_configs_term'],
  ['recommendation_setting_configs', 'uq_recommendation_setting_configs_key'],
  ['config_revisions', 'uq_config_revisions_domain_revision'],
  ['config_audit_events', 'idx_config_audit_events_domain_created'],
  ['config_audit_events', 'idx_config_audit_events_entity'],
] as const;

const requiredForeignKeys = [
  ['sessions', 'user_id', 'users', 'id'],
  ['user_profiles', 'user_id', 'users', 'id'],
  ['user_onboarding_progress', 'user_id', 'users', 'id'],
  ['user_onboarding_answers', 'user_id', 'users', 'id'],
  ['user_interest_tags', 'user_id', 'users', 'id'],
  ['content_items', 'author_id', 'users', 'id'],
  ['content_items', 'reviewed_by', 'users', 'id'],
  ['activities', 'id', 'content_items', 'id'],
  ['needs', 'id', 'content_items', 'id'],
  ['life_posts', 'id', 'content_items', 'id'],
  ['content_item_tags', 'content_id', 'content_items', 'id'],
  ['content_item_tags', 'tag_id', 'content_tags', 'id'],
  ['content_media', 'content_id', 'content_items', 'id'],
  ['comments', 'content_id', 'content_items', 'id'],
  ['comments', 'author_id', 'users', 'id'],
  ['content_bookmarks', 'user_id', 'users', 'id'],
  ['content_bookmarks', 'content_id', 'content_items', 'id'],
  ['content_reactions', 'user_id', 'users', 'id'],
  ['content_reactions', 'content_id', 'content_items', 'id'],
  ['content_share_events', 'content_id', 'content_items', 'id'],
  ['activity_agenda_items', 'activity_id', 'activities', 'id'],
  ['activity_need_links', 'activity_id', 'activities', 'id'],
  ['activity_need_links', 'need_id', 'needs', 'id'],
  ['activity_interest_signals', 'activity_id', 'activities', 'id'],
  ['activity_feedback', 'activity_id', 'activities', 'id'],
  ['activity_members', 'activity_id', 'activities', 'id'],
  ['activity_proposals', 'host_user_id', 'users', 'id'],
  ['activity_proposals', 'source_need_id', 'needs', 'id'],
  ['activity_proposals', 'reviewed_by', 'users', 'id'],
  ['threads', 'activity_id', 'activities', 'id'],
  ['thread_members', 'thread_id', 'threads', 'id'],
  ['messages', 'thread_id', 'threads', 'id'],
  ['content_reports', 'content_id', 'content_items', 'id'],
  ['content_audit_events', 'content_id', 'content_items', 'id'],
  ['notifications', 'target_content_id', 'content_items', 'id'],
  ['notifications', 'target_thread_id', 'threads', 'id'],
  ['notification_outbox', 'notification_id', 'notifications', 'id'],
  ['notification_outbox', 'user_id', 'users', 'id'],
  ['favorites', 'user_id', 'users', 'id'],
  ['favorites', 'activity_id', 'activities', 'id'],
  ['activity_category_configs', 'created_by', 'users', 'id'],
  ['activity_category_configs', 'updated_by', 'users', 'id'],
  ['onboarding_question_configs', 'created_by', 'users', 'id'],
  ['onboarding_question_configs', 'updated_by', 'users', 'id'],
  ['onboarding_option_configs', 'question_id', 'onboarding_question_configs', 'id'],
  ['profile_option_configs', 'created_by', 'users', 'id'],
  ['feedback_option_configs', 'created_by', 'users', 'id'],
  ['recommendation_rule_configs', 'created_by', 'users', 'id'],
  ['recommendation_setting_configs', 'created_by', 'users', 'id'],
  ['config_revisions', 'actor_id', 'users', 'id'],
  ['config_audit_events', 'revision_id', 'config_revisions', 'id'],
  ['config_audit_events', 'actor_id', 'users', 'id'],
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

export function isIgnorableMigrationError(statement: string, error: unknown): boolean {
  if (!/^ALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN\s+/i.test(statement)) return false;
  if (!error || typeof error !== 'object') return false;
  const mysqlError = error as { code?: unknown; errno?: unknown };
  return mysqlError.code === 'ER_DUP_FIELDNAME' || mysqlError.errno === 1060;
}

async function executeMigrationStatement(database: QiahaoDatabase, statement: string): Promise<void> {
  try {
    await database.query(statement);
  } catch (error) {
    if (isIgnorableMigrationError(statement, error)) return;
    throw error;
  }
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
    ['users', ['role', 'account_status']],
    ['user_profiles', ['birth_date', 'gender', 'city', 'profile_visibility']],
    ['user_onboarding_progress', ['onboarding_version', 'current_step', 'completed_at']],
    ['user_onboarding_answers', ['question_key', 'answer_order', 'answer_value']],
    ['user_interest_tags', ['tag_kind', 'label', 'source_key', 'sort_order', 'enabled', 'updated_at']],
    ['content_items', ['author_id', 'content_type', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'published_at']],
    ['activities', ['content_type', 'lifecycle', 'starts_at', 'ends_at', 'audience', 'pitch', 'boundary', 'match_label']],
    ['needs', ['content_type', 'title', 'subtitle', 'body', 'author_id', 'city', 'district']],
    ['life_posts', ['content_type', 'kind', 'body', 'image', 'author_id', 'city', 'district']],
    ['content_tags', ['content_type', 'slug', 'label', 'enabled']],
    ['content_item_tags', ['content_id', 'tag_id', 'content_type']],
    ['content_media', ['content_id', 'media_type', 'url', 'sort_order']],
    ['comments', ['content_type', 'content_id', 'author_id', 'body', 'created_at', 'updated_at', 'deleted_at']],
    ['content_bookmarks', ['user_id', 'content_id', 'content_type']],
    ['content_reactions', ['user_id', 'content_id', 'reaction_type']],
    ['activity_agenda_items', ['activity_id', 'sequence_no', 'title', 'body']],
    ['activity_need_links', ['activity_id', 'need_id', 'link_type']],
    ['activity_interest_signals', ['user_id', 'activity_id', 'signal_type', 'occurrence_count']],
    ['activity_feedback', ['activity_id', 'user_id', 'mood', 'note', 'deleted_at']],
    ['activity_members', ['status']],
    ['activity_proposals', ['host_user_id', 'source_need_id', 'category', 'status', 'reviewed_by', 'archived_at']],
    ['thread_members', ['unread', 'joined_at', 'last_read_at']],
    ['messages', ['message_type', 'deleted_at']],
    ['content_reports', ['reporter_id', 'content_id', 'reason', 'status']],
    ['content_audit_events', ['content_id', 'event_type', 'before_data', 'after_data']],
    ['notifications', ['target_content_id', 'target_content_type', 'target_thread_id']],
    ['activity_category_configs', ['config_key', 'label', 'theme_key', 'icon_key', 'enabled', 'sort_order', 'created_by', 'updated_by']],
    ['onboarding_question_configs', ['question_key', 'section_key', 'prompt', 'input_type', 'required_flag', 'enabled', 'sort_order']],
    ['onboarding_option_configs', ['question_id', 'option_key', 'label', 'answer_value', 'enabled', 'sort_order']],
    ['profile_option_configs', ['group_key', 'option_key', 'label', 'option_value', 'enabled', 'sort_order']],
    ['feedback_option_configs', ['group_key', 'option_key', 'label', 'enabled', 'sort_order']],
    ['recommendation_rule_configs', ['rule_key', 'source_term', 'themes_json', 'tokens_json', 'reason_text', 'enabled']],
    ['recommendation_setting_configs', ['setting_key', 'value_json', 'enabled']],
    ['config_revisions', ['domain_key', 'revision_no', 'actor_id', 'summary']],
    ['config_audit_events', ['revision_id', 'domain_key', 'entity_type', 'entity_key', 'action', 'before_data', 'after_data']],
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
    invalid_activity_lifecycle: number | string;
    invalid_participation_status: number | string;
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
       (SELECT COUNT(*) FROM users WHERE role IS NULL OR role NOT IN ('member','host','operator')) AS invalid_roles,
       (SELECT COUNT(*) FROM activities WHERE lifecycle IS NULL OR lifecycle NOT IN ('pre','formal','archived')) AS invalid_activity_lifecycle,
       (SELECT COUNT(*) FROM activity_members WHERE status IS NULL OR status NOT IN ('interested','joined','cancelled','waitlisted')) AS invalid_participation_status`,
  );
  const row = rows[0];
  if (!row) throw new Error('迁移校验未返回数据一致性结果');
  if (Number(row.orphan_activities) > 0) throw new Error(`迁移后存在 ${row.orphan_activities} 条活动缺少统一内容父记录`);
  if (Number(row.invalid_tag_types) > 0) throw new Error(`迁移后存在 ${row.invalid_tag_types} 条内容标签类型不一致`);
  if (Number(row.invalid_roles) > 0) throw new Error(`迁移后存在 ${row.invalid_roles} 个非法用户角色`);
  if (Number(row.invalid_activity_lifecycle) > 0) throw new Error(`迁移后存在 ${row.invalid_activity_lifecycle} 条非法活动生命周期`);
  if (Number(row.invalid_participation_status) > 0) throw new Error(`迁移后存在 ${row.invalid_participation_status} 条非法参与状态`);
  const demoRows = await database.query<Array<RowDataPacket & { role: string }>>('SELECT role FROM users WHERE id=? LIMIT 1', ['me']);
  if (demoRows[0] && demoRows[0].role !== 'operator') throw new Error('演示账号 me 必须映射为 operator');
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
  await verifyColumns(database);
  await verifyIndexes(database);
  await verifyForeignKeys(database);
  await verifyContentData(database);
}
