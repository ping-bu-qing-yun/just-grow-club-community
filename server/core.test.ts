// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ActivityLifecycle } from '../src/domain/types';
import { changeActivityLifecycle } from './activity-repository';
import { buildApp } from './app';
import type { AuthenticatedUser } from './auth';
import { hashPassword } from './auth';
import { AuthorizationError, requireCommentOwnerOrAdmin, requireContentOwnerOrAdmin, requireRole } from './authorization';
import { REQUIRED_MIGRATIONS, type QiahaoDatabase } from './db';
import { isIgnorableMigrationError, migrationStatementCounts, splitMigrationStatements } from './migrations/service';
import { changeModerationStatus, isAllowedStatusTransition } from './content-repository';
import { cancelActivity, joinActivity, listThreads } from './social-repository';
import { decodeTimestampCursor, encodeTimestampCursor, PaginationCursorError } from './pagination';
import { assertMediaUrl, MediaUrlError } from './media-url';
import { setPrimaryContentMedia } from './media-repository';
import { mutateConfigEntity } from './config-mutation-repository';

const operator: AuthenticatedUser = { id: 'op', phone: '1', name: '运营', avatar: '', bio: '', verified: true, role: 'operator' };
const member: AuthenticatedUser = { ...operator, id: 'member', role: 'member' };

function lifecycleDatabase(initial: ActivityLifecycle): { database: QiahaoDatabase; current(): ActivityLifecycle } {
  let lifecycle = initial;
  const connection = {
    async query(sql: string, params: readonly unknown[] = []) {
      if (sql.startsWith('SELECT lifecycle')) return [{ lifecycle }];
      if (sql.startsWith('UPDATE activities')) {
        lifecycle = params[0] as ActivityLifecycle;
        return { affectedRows: 1 };
      }
      if (sql.startsWith('INSERT INTO content_audit_events')) return { affectedRows: 1 };
      throw new Error(`unexpected query: ${sql}`);
    },
  };
  return {
    database: {
      ...connection,
      getConnection: async () => connection,
      transaction: async <T,>(callback: (value: typeof connection) => Promise<T>) => callback(connection),
      assertMigrations: async () => undefined,
      close: async () => undefined,
    } as unknown as QiahaoDatabase,
    current: () => lifecycle,
  };
}

let passwordHash = '';
beforeAll(async () => { passwordHash = await hashPassword('qiahao123'); });

function loginDatabase(accountStatus: 'active' | 'suspended' | 'deleted' = 'active'): QiahaoDatabase {
  return {
    async query(sql: string) {
      if (sql.startsWith('SELECT * FROM users')) return [{ id: 'me', phone: '13800000000', name: '小恰', avatar: '/assets/avatar-me.jpg', bio: '', verified: 1, role: 'admin', account_status: accountStatus, password_hash: passwordHash }];
      if (sql.startsWith('INSERT INTO sessions')) return { affectedRows: 1 };
      throw new Error(`unexpected query: ${sql}`);
    },
    getConnection: async () => { throw new Error('not used'); },
    transaction: async () => { throw new Error('not used'); },
    assertMigrations: async () => undefined,
    close: async () => undefined,
  } as unknown as QiahaoDatabase;
}

function authenticatedDatabase(role: 'member' | 'host' | 'operator'): QiahaoDatabase {
  return {
    async query(sql: string) {
      if (sql.startsWith('SELECT * FROM users')) return [{ id: 'me', phone: '13800000000', name: '小恰', avatar: '', bio: '', verified: 1, role, account_status: 'active', password_hash: passwordHash }];
      if (sql.startsWith('INSERT INTO sessions')) return { affectedRows: 1 };
      if (sql.includes('FROM sessions s') && sql.includes('JOIN users')) return [{ id: 'me', phone: '13800000000', name: '小恰', avatar: '', bio: '', verified: 1, role, account_status: 'active', expires_at: '2099-01-01 00:00:00.000' }];
      if (sql.includes('FROM activity_proposals p')) return [];
      throw new Error(`unexpected query: ${sql}`);
    },
    getConnection: async () => { throw new Error('not used'); },
    transaction: async () => { throw new Error('not used'); },
    assertMigrations: async () => undefined,
    close: async () => undefined,
  } as unknown as QiahaoDatabase;
}

const emptyConfig = {
  versions: { 'activity-categories': 1, onboarding: 1, 'profile-options': 1, 'feedback-options': 1, recommendation: 1 },
  activityCategories: [], onboarding: [], profileOptions: [], feedbackOptions: [], recommendation: { rules: [], settings: [] },
};

async function authenticatedHeaders(app: ReturnType<typeof buildApp>) {
  const login = await app.inject({ method: 'POST', url: '/api/v2/session', payload: { phone: '13800000000', password: 'qiahao123' } });
  const cookies = login.cookies;
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  const csrf = cookies.find((cookie) => cookie.name === 'qiahao_csrf')?.value ?? '';
  return { cookie: cookieHeader, 'x-csrf-token': csrf };
}

describe('authorization and activity lifecycle', () => {
  it('enforces canonical roles and owner-or-operator rules', () => {
    expect(() => requireRole(operator, 'operator')).not.toThrow();
    expect(() => requireRole(member, 'operator')).toThrow(AuthorizationError);
    expect(() => requireContentOwnerOrAdmin(member, { authorId: member.id })).not.toThrow();
    expect(() => requireContentOwnerOrAdmin(operator, { authorId: 'other' })).not.toThrow();
    expect(() => requireCommentOwnerOrAdmin(member, { authorId: 'other' })).toThrow(AuthorizationError);
  });

  it('allows pre to formal and rejects formal to pre', async () => {
    const pre = lifecycleDatabase('pre');
    await expect(changeActivityLifecycle(pre.database, 'a1', 'formal')).resolves.toEqual({ kind: 'ok', lifecycle: 'formal' });
    expect(pre.current()).toBe('formal');
    const formal = lifecycleDatabase('formal');
    await expect(changeActivityLifecycle(formal.database, 'a1', 'pre')).resolves.toEqual({ kind: 'invalid-transition', current: 'formal' });
  });

  it('supports hiding approved content and restoring it without bypassing the fixed moderation state machine', () => {
    expect(isAllowedStatusTransition('approved', 'hidden')).toBe(true);
    expect(isAllowedStatusTransition('hidden', 'approved')).toBe(true);
    expect(isAllowedStatusTransition('hidden', 'archived')).toBe(true);
    expect(isAllowedStatusTransition('pending', 'hidden')).toBe(false);
  });

  it('treats repeated archive requests as idempotent and does not write a duplicate audit event', async () => {
    const queries: string[] = [];
    const connection = {
      async query(sql: string) {
        queries.push(sql);
        if (sql.startsWith('SELECT * FROM content_items')) return [{
          id: 'need-1', author_id: 'member', content_type: 'need', status: 'archived', reviewed_by: 'op',
          reviewed_at: '2026-08-09 10:00:00.000', rejection_reason: null, published_at: '2026-08-09 09:00:00.000',
          created_at: '2026-08-09 09:00:00.000', updated_at: '2026-08-09 10:00:00.000',
        }];
        throw new Error(`unexpected query: ${sql}`);
      },
    };
    const database = {
      transaction: async <T,>(callback: (value: typeof connection) => Promise<T>) => callback(connection),
    } as unknown as QiahaoDatabase;
    await expect(changeModerationStatus(database, 'need-1', 'archived', 'op')).resolves.toMatchObject({ status: 'archived' });
    expect(queries).toHaveLength(1);
  });

  it('promotes an existing interest to joined when a pre activity becomes formal', async () => {
    const queries: string[] = [];
    const connection = {
      async query(sql: string) {
        queries.push(sql);
        if (sql.includes('FROM activities a') && sql.includes('FOR UPDATE')) return [{ id: 'a1', title: '活动', host_id: 'host', capacity: 6, image: '', lifecycle: 'formal' }];
        if (sql.startsWith('SELECT status FROM activity_members')) return [{ status: 'interested' }];
        if (sql.includes('SELECT COUNT(*) AS count')) return [{ count: 0 }];
        if (sql.includes('SELECT t.id,t.activity_id')) return [{ id: 'thread-a1', activity_id: 'a1', title: '活动群聊', image: null, system: 0, last_message: '欢迎加入', message_created_at: '2026-08-09 10:00:00.000', unread: 1 }];
        return { affectedRows: 1 };
      },
    };
    const database = {
      ...connection,
      getConnection: async () => connection,
      transaction: async <T,>(callback: (value: typeof connection) => Promise<T>) => callback(connection),
      assertMigrations: async () => undefined,
      close: async () => undefined,
    } as unknown as QiahaoDatabase;
    await expect(joinActivity(database, 'member', 'a1')).resolves.toMatchObject({ kind: 'ok', participationStatus: 'joined' });
    const promotionSql = queries.find((sql) => sql.startsWith("UPDATE activity_members SET status='joined'"));
    expect(promotionSql).toBeDefined();
    expect(promotionSql).toMatch(/updated_at|cancelled_at/);
    expect(queries.some((sql) => sql.startsWith('INSERT INTO activity_members'))).toBe(false);
  });

  it('cancels participation with a durable status and removes thread membership', async () => {
    const queries: string[] = [];
    const connection = {
      async query(sql: string) {
        queries.push(sql);
        if (sql.includes('SELECT m.status FROM activity_members')) return [{ status: 'joined' }];
        return { affectedRows: 1 };
      },
    };
    const database = {
      ...connection,
      getConnection: async () => connection,
      transaction: async <T,>(callback: (value: typeof connection) => Promise<T>) => callback(connection),
      assertMigrations: async () => undefined,
      close: async () => undefined,
    } as unknown as QiahaoDatabase;

    await expect(cancelActivity(database, 'member', 'a1')).resolves.toBe('removed');
    expect(queries.some((sql) => sql.includes("UPDATE activity_members SET status='cancelled'"))).toBe(true);
    expect(queries).toContain('DELETE FROM thread_members WHERE thread_id=? AND user_id=?');
    expect(queries.join('\n')).toMatch(/cancelled_at/);
  });

  it('uses a MySQL-safe alias when it reads member threads', async () => {
    const database = {
      async query(sql: string) {
        if (sql.includes('t.is_system AS system')) throw new Error('unquoted MySQL reserved keyword alias');
        if (sql.includes('ORDER BY t.created_at DESC')) return [{ id: 'thread-a1' }];
        if (sql.includes('SELECT t.id,t.activity_id')) {
          return [{
            id: 'thread-a1', activity_id: 'a1', title: '活动群聊', image: null, system: 0,
            last_message: '欢迎加入', message_created_at: '2026-08-09 10:00:00.000', unread: 1,
          }];
        }
        throw new Error(`unexpected query: ${sql}`);
      },
    } as unknown as QiahaoDatabase;

    await expect(listThreads(database, 'member')).resolves.toEqual([{
      id: 'thread-a1', activityId: 'a1', title: '活动群聊', lastMessage: '欢迎加入',
      time: '2026-08-09 10:00:00.000', unread: 1, image: undefined, system: false,
    }]);
  });
});

describe('migrations and v2 session security', () => {
  it('keeps the additive migration chain parseable and destructive-SQL free', async () => {
    expect(splitMigrationStatements('SELECT 1;\nSELECT 2;\n')).toEqual(['SELECT 1', 'SELECT 2']);
    const counts = await migrationStatementCounts();
    expect(counts.map((item) => item.version)).toEqual([...REQUIRED_MIGRATIONS]);
    expect(counts.map((item) => item.version)).toEqual(['001_canonical_domain_schema.sql', '002_dynamic_business_config.sql']);
    expect(counts[0]?.statements).toBe(33);
    expect(counts[1]?.statements).toBe(40);
    expect(counts.at(-1)?.version).toBe('002_dynamic_business_config.sql');
    for (const version of REQUIRED_MIGRATIONS) {
      const sql = await readFile(resolve('server/migrations/mysql', version), 'utf8');
      expect(sql).not.toMatch(/\bDROP\s+TABLE\b/i);
    }
    const canonical = await readFile(resolve('server/migrations/mysql/001_canonical_domain_schema.sql'), 'utf8');
    expect((canonical.match(/CREATE TABLE IF NOT EXISTS/g) ?? [])).toHaveLength(31);
    expect(canonical).not.toContain('CREATE TABLE IF NOT EXISTS `schema_migrations`');
    const dynamic = await readFile(resolve('server/migrations/mysql/002_dynamic_business_config.sql'), 'utf8');
    for (const table of [
      'activity_category_configs',
      'onboarding_question_configs',
      'onboarding_option_configs',
      'profile_option_configs',
      'feedback_option_configs',
      'recommendation_rule_configs',
      'recommendation_setting_configs',
      'config_revisions',
      'config_audit_events',
    ]) {
      expect(dynamic).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
    expect(dynamic.match(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci/g)).toHaveLength(9);
    expect(dynamic).toMatch(/ALTER TABLE activity_proposals\s+ADD COLUMN archived_at/i);
    expect(dynamic).not.toMatch(/ADD COLUMN IF NOT EXISTS/i);
    expect(isIgnorableMigrationError('ALTER TABLE activities ADD COLUMN archived_at DATETIME(3)', { code: 'ER_DUP_FIELDNAME' })).toBe(true);
    expect(isIgnorableMigrationError('ALTER TABLE activities ADD COLUMN archived_at DATETIME(3)', { errno: 1060 })).toBe(true);
    expect(isIgnorableMigrationError('UPDATE activities SET category=?', { code: 'ER_DUP_FIELDNAME' })).toBe(false);
    expect(dynamic).not.toMatch(/(?:DELETE\s+FROM|UPDATE)\s+content_tags/i);
  });

  it('keeps media URLs on the HTTPS or same-origin asset boundary', () => {
    expect(assertMediaUrl('https://cdn.example.com/image.jpg')).toBe('https://cdn.example.com/image.jpg');
    expect(assertMediaUrl('/assets/coffee.jpg')).toBe('/assets/coffee.jpg');
    expect(() => assertMediaUrl('http://example.com/image.jpg')).toThrow(MediaUrlError);
    expect(() => assertMediaUrl('/assets/../secret.txt')).toThrow(MediaUrlError);
    expect(() => assertMediaUrl('https://user:pass@example.com/image.jpg')).toThrow(MediaUrlError);
  });

  it('stores a newly published primary image in content_media and keeps the legacy cover in sync', async () => {
    const queries: string[] = [];
    const connection = {
      async query(sql: string) {
        queries.push(sql);
        if (sql.startsWith('SELECT * FROM content_media')) return [];
        if (sql.startsWith('SELECT url FROM content_media')) return [{ url: '/assets/life.jpg' }];
        return { affectedRows: 1 };
      },
    } as unknown as import('./db').QiahaoConnection;
    await setPrimaryContentMedia(connection, { contentId: 'life-1', contentType: 'life', url: '/assets/life.jpg', altText: '生活动态' });
    expect(queries.some((sql) => sql.startsWith('INSERT INTO content_media'))).toBe(true);
    expect(queries.some((sql) => sql.startsWith('UPDATE life_posts SET image='))).toBe(true);
  });

  it('writes config revision and audit atomically and rejects stale revisions', async () => {
    let entity: Record<string, unknown> | null = null;
    const connection = {
      async query(sql: string, params: readonly unknown[] = []) {
        if (sql.startsWith('SELECT COALESCE(MAX(revision_no)')) return [{ revision: 1 }];
        if (sql.startsWith('SELECT * FROM activity_category_configs')) return entity ? [entity] : [];
        if (sql.startsWith('INSERT INTO config_revisions')) return { insertId: 7, affectedRows: 1 };
        if (sql.startsWith('INSERT INTO activity_category_configs')) {
          entity = { config_key: params[0], label: params[1], theme_key: params[2], icon_key: params[3], enabled: 1, sort_order: params[6] };
          return { insertId: 9, affectedRows: 1 };
        }
        if (sql.startsWith('INSERT INTO config_audit_events')) return { insertId: 8, affectedRows: 1 };
        throw new Error(`unexpected query: ${sql}`);
      },
    };
    const database = {
      ...connection,
      transaction: async <T,>(callback: (value: typeof connection) => Promise<T>) => callback(connection),
    } as unknown as QiahaoDatabase;
    await expect(mutateConfigEntity(database, {
      domain: 'activity-categories', entityType: 'activity-category', key: 'reading', expectedRevision: 1,
      actorId: 'op', mode: 'create', values: { label: '共读', themeKey: 'deep', iconKey: 'book', sortOrder: 70 },
    })).resolves.toMatchObject({ revision: 2, entity: { config_key: 'reading', label: '共读' } });
    entity = null;
    await expect(mutateConfigEntity(database, {
      domain: 'activity-categories', entityType: 'activity-category', key: 'walking', expectedRevision: 0,
      actorId: 'op', mode: 'create', values: { label: '散步', themeKey: 'walk', iconKey: 'footprints' },
    })).rejects.toMatchObject({ code: 'VERSION_CONFLICT', status: 409 });
  });

  it('rejects executable-shaped or unbounded recommendation settings before opening a transaction', async () => {
    const database = {
      transaction: async () => { throw new Error('不应打开事务'); },
    } as unknown as QiahaoDatabase;
    await expect(mutateConfigEntity(database, {
      domain: 'recommendation', entityType: 'recommendation-setting', key: 'cold_start', expectedRevision: 1,
      actorId: 'op', mode: 'update', values: { value: { formal: 'process.exit()', pre: 42 } },
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    await expect(mutateConfigEntity(database, {
      domain: 'recommendation', entityType: 'recommendation-setting', key: 'sql_expression', expectedRevision: 1,
      actorId: 'op', mode: 'create', values: { value: { sql: 'SELECT * FROM users' } },
    })).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });

  it('round-trips opaque timestamp cursors and rejects malformed values', () => {
    const value = { createdAt: '2026-08-09 10:00:00.000', id: 'notice-1' };
    expect(decodeTimestampCursor(encodeTimestampCursor(value))).toEqual(value);
    expect(() => decodeTimestampCursor('not-a-valid-cursor')).toThrow(PaginationCursorError);
  });

  it('sets session and CSRF cookies without returning a token', async () => {
    const app = buildApp({ database: loginDatabase() });
    const response = await app.inject({ method: 'POST', url: '/api/v2/session', payload: { phone: '13800000000', password: 'qiahao123' } });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.user.role).toBe('operator');
    expect(response.json().data.token).toBeUndefined();
    expect(String(response.headers['set-cookie'])).toContain('qiahao_session=');
    expect(String(response.headers['set-cookie'])).toContain('HttpOnly');
    expect(String(response.headers['set-cookie'])).toContain('qiahao_csrf=');
    await app.close();
  });

  it('rejects unsafe v2 requests without CSRF', async () => {
    const app = buildApp({ database: loginDatabase() });
    const response = await app.inject({ method: 'POST', url: '/api/v2/activities/a1/join' });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('CSRF_INVALID');
    await app.close();
  });

  it('exposes active config publicly but protects operator configuration by role', async () => {
    const configService = { getBootstrap: async () => emptyConfig, mutate: async () => { throw new Error('not used'); } };
    const memberApp = buildApp({ database: authenticatedDatabase('member'), configService: configService as never });
    const memberHeaders = await authenticatedHeaders(memberApp);
    const publicResponse = await memberApp.inject({ method: 'GET', url: '/api/v2/config/bootstrap' });
    expect(publicResponse.statusCode).toBe(200);
    expect(publicResponse.json().data.versions.recommendation).toBe(1);
    const forbidden = await memberApp.inject({ method: 'GET', url: '/api/v2/operator/config/recommendation', headers: memberHeaders });
    expect(forbidden.statusCode).toBe(403);
    await memberApp.close();

    const operatorApp = buildApp({ database: authenticatedDatabase('operator'), configService: configService as never });
    const operatorHeaders = await authenticatedHeaders(operatorApp);
    const allowed = await operatorApp.inject({ method: 'GET', url: '/api/v2/operator/config/recommendation', headers: operatorHeaders });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().data).toMatchObject({ domain: 'recommendation', version: 1 });
    await operatorApp.close();
  });

  it('keeps activity proposals operator-only and validates status filters', async () => {
    const memberApp = buildApp({ database: authenticatedDatabase('member') });
    const memberHeaders = await authenticatedHeaders(memberApp);
    expect((await memberApp.inject({ method: 'GET', url: '/api/v2/operator/activity-proposals', headers: memberHeaders })).statusCode).toBe(403);
    await memberApp.close();

    const operatorApp = buildApp({ database: authenticatedDatabase('operator') });
    const operatorHeaders = await authenticatedHeaders(operatorApp);
    const invalid = await operatorApp.inject({ method: 'GET', url: '/api/v2/operator/activity-proposals?status=unknown', headers: operatorHeaders });
    expect(invalid.statusCode).toBe(400);
    const list = await operatorApp.inject({ method: 'GET', url: '/api/v2/operator/activity-proposals?status=submitted', headers: operatorHeaders });
    expect(list.statusCode).toBe(200);
    expect(list.json().data.proposals).toEqual([]);
    await operatorApp.close();
  });

  it('rejects suspended accounts after password verification', async () => {
    const app = buildApp({ database: loginDatabase('suspended') });
    const response = await app.inject({ method: 'POST', url: '/api/v2/session', payload: { phone: '13800000000', password: 'qiahao123' } });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('ACCOUNT_UNAVAILABLE');
    await app.close();
  });

  it('returns field-level validation details in the shared error envelope', async () => {
    const app = buildApp({ database: loginDatabase() });
    const response = await app.inject({ method: 'POST', url: '/api/v2/session', payload: { phone: '', password: '' } });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', fields: { phone: expect.any(String), password: expect.any(String) } } });
    await app.close();
  });

  it('renders the compatibility share page from an approved database activity', async () => {
    const database = {
      async query(sql: string) {
        if (sql.includes('FROM activities a') && sql.includes("ci.status='approved'")) {
          return [{ id: 'created-a1', title: '数据库活动', description: '已批准活动', image: '/assets/coffee.jpg', date_label: '周六', time: '15:30', location: '徐汇滨江' }];
        }
        throw new Error(`unexpected query: ${sql}`);
      },
      getConnection: async () => { throw new Error('not used'); },
      transaction: async () => { throw new Error('not used'); },
      assertMigrations: async () => undefined,
      close: async () => undefined,
    } as unknown as QiahaoDatabase;
    const app = buildApp({ database });
    const response = await app.inject({ method: 'GET', url: '/api/share/activity/created-a1' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('数据库活动');
    expect(response.body).toContain('/activities/created-a1');
    await app.close();
  });
});
