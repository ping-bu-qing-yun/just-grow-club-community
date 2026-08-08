import { randomUUID } from 'node:crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { ContentStatus, ContentType } from '../src/api/types';
import type { QiahaoConnection, QiahaoDatabase } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';

export type ContentExecutor = Pick<QiahaoDatabase, 'query'> | Pick<QiahaoConnection, 'query'>;
export type ContentTag = {
  id: string;
  contentType: ContentType;
  slug: string;
  label: string;
  enabled: boolean;
};
export type ContentItem = {
  id: string;
  authorId: string;
  contentType: ContentType;
  status: ContentStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ContentRow = RowDataPacket & {
  id: string;
  author_id: string;
  content_type: ContentType;
  status: ContentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
type TagRow = RowDataPacket & {
  id: string;
  content_type: ContentType;
  slug: string;
  label: string;
  enabled: number | boolean;
};
type AdminRow = ContentRow & {
  author_name: string;
  author_avatar: string;
  author_verified: number | boolean;
  author_bio: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  reviewer_verified: number | boolean | null;
  reviewer_bio: string | null;
  title: string | null;
  body: string | null;
  category: string | null;
  image: string | null;
};

export class ContentRepositoryError extends Error {
  constructor(
    public readonly code: 'CONTENT_NOT_FOUND' | 'TAG_NOT_FOUND' | 'TAG_DISABLED' | 'INVALID_STATUS_TRANSITION' | 'DUPLICATE_TAG',
    message: string,
    public readonly status = code === 'CONTENT_NOT_FOUND' ? 404 : code === 'INVALID_STATUS_TRANSITION' ? 409 : 400,
  ) {
    super(message);
    this.name = 'ContentRepositoryError';
  }
}

function toTag(row: TagRow): ContentTag {
  return {
    id: row.id,
    contentType: row.content_type,
    slug: row.slug,
    label: row.label,
    enabled: Boolean(row.enabled),
  };
}

function toContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    authorId: row.author_id,
    contentType: row.content_type,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at ? toIsoTimestamp(row.reviewed_at) : null,
    rejectionReason: row.rejection_reason,
    publishedAt: row.published_at ? toIsoTimestamp(row.published_at) : null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

const allowedTransitions: Record<ContentStatus, readonly ContentStatus[]> = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['rejected', 'archived'],
  rejected: ['pending', 'archived'],
  archived: [],
};

export function isAllowedStatusTransition(from: ContentStatus, to: ContentStatus): boolean {
  return allowedTransitions[from].includes(to);
}

export async function getContent(database: ContentExecutor, id: string): Promise<ContentItem | null> {
  const rows = await database.query<ContentRow[]>('SELECT * FROM content_items WHERE id=? LIMIT 1', [id]);
  return rows[0] ? toContent(rows[0]) : null;
}

export async function requireContent(database: ContentExecutor, id: string): Promise<ContentItem> {
  const content = await getContent(database, id);
  if (!content) throw new ContentRepositoryError('CONTENT_NOT_FOUND', '内容不存在');
  return content;
}

export async function validateContentTags(database: ContentExecutor, contentType: ContentType, refs: readonly string[] = []): Promise<ContentTag[]> {
  const uniqueRefs = [...new Set(refs.map((ref) => ref.trim()).filter(Boolean))];
  if (!uniqueRefs.length) return [];
  const placeholders = uniqueRefs.map(() => '?').join(',');
  const rows = await database.query<TagRow[]>(
    `SELECT id,content_type,slug,label,enabled
       FROM content_tags
      WHERE content_type=?
        AND (id IN (${placeholders}) OR slug IN (${placeholders}) OR label IN (${placeholders}))`,
    [contentType, ...uniqueRefs, ...uniqueRefs, ...uniqueRefs],
  );
  const byRef = new Map<string, TagRow>();
  for (const row of rows) {
    byRef.set(row.id, row);
    byRef.set(row.slug, row);
    byRef.set(row.label, row);
  }
  const tags = uniqueRefs.map((ref) => byRef.get(ref));
  if (tags.some((tag) => !tag)) throw new ContentRepositoryError('TAG_NOT_FOUND', '标签不存在或类型不匹配');
  if (tags.some((tag) => !tag!.enabled)) throw new ContentRepositoryError('TAG_DISABLED', '标签已停用');
  return tags.filter((tag): tag is TagRow => Boolean(tag)).map(toTag);
}

async function replaceContentTags(database: ContentExecutor, contentId: string, contentType: ContentType, tags: readonly ContentTag[]): Promise<void> {
  await database.query('DELETE FROM content_item_tags WHERE content_id=?', [contentId]);
  for (const tag of tags) {
    await database.query(
      'INSERT IGNORE INTO content_item_tags (content_id,tag_id,content_type) VALUES (?,?,?)',
      [contentId, tag.id, contentType],
    );
  }
}

export async function createContent(
  database: ContentExecutor,
  input: {
    id: string;
    authorId: string;
    contentType: ContentType;
    status: ContentStatus;
    tagRefs?: readonly string[];
    now?: string;
  },
): Promise<ContentItem> {
  const now = input.now ?? toMysqlDateTime();
  const tags = await validateContentTags(database, input.contentType, input.tagRefs);
  await database.query(
    `INSERT INTO content_items
      (id,author_id,content_type,status,reviewed_by,reviewed_at,rejection_reason,published_at,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      input.id,
      input.authorId,
      input.contentType,
      input.status,
      input.status === 'approved' ? input.authorId : null,
      input.status === 'approved' ? now : null,
      null,
      input.status === 'approved' ? now : null,
      now,
      now,
    ],
  );
  await replaceContentTags(database, input.id, input.contentType, tags);
  return requireContent(database, input.id);
}

export async function updateContentTags(database: ContentExecutor, id: string, contentType: ContentType, tagRefs: readonly string[]): Promise<ContentTag[]> {
  const tags = await validateContentTags(database, contentType, tagRefs);
  await replaceContentTags(database, id, contentType, tags);
  return tags;
}

export async function listContentTags(database: ContentExecutor, contentType?: ContentType): Promise<ContentTag[]> {
  const rows = contentType
    ? await database.query<TagRow[]>('SELECT id,content_type,slug,label,enabled FROM content_tags WHERE content_type=? ORDER BY enabled DESC,label', [contentType])
    : await database.query<TagRow[]>('SELECT id,content_type,slug,label,enabled FROM content_tags ORDER BY content_type,enabled DESC,label');
  return rows.map(toTag);
}

export async function createContentTag(database: ContentExecutor, input: { contentType: ContentType; slug: string; label: string }): Promise<ContentTag> {
  const slug = input.slug.trim().toLowerCase();
  const label = input.label.trim();
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug) || !label || label.length > 120) {
    throw new ContentRepositoryError('TAG_NOT_FOUND', '标签格式无效');
  }
  const id = `tag-${input.contentType}-${slug}-${randomUUID().slice(0, 8)}`;
  try {
    await database.query(
      `INSERT INTO content_tags (id,content_type,slug,label,enabled,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, input.contentType, slug, label, 1, toMysqlDateTime(), toMysqlDateTime()],
    );
  } catch (error) {
    if (error instanceof Error && /duplicate|unique/i.test(error.message)) {
      throw new ContentRepositoryError('DUPLICATE_TAG', '同类型标签已存在', 409);
    }
    throw error;
  }
  const rows = await database.query<TagRow[]>('SELECT id,content_type,slug,label,enabled FROM content_tags WHERE id=?', [id]);
  return toTag(rows[0]);
}

export async function updateContentTag(database: ContentExecutor, id: string, input: { slug?: string; label?: string; enabled?: boolean }): Promise<ContentTag> {
  const current = await database.query<TagRow[]>('SELECT id,content_type,slug,label,enabled FROM content_tags WHERE id=? LIMIT 1', [id]);
  if (!current[0]) throw new ContentRepositoryError('TAG_NOT_FOUND', '标签不存在');
  const nextSlug = input.slug === undefined ? current[0].slug : input.slug.trim().toLowerCase();
  const nextLabel = input.label === undefined ? current[0].label : input.label.trim();
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(nextSlug) || !nextLabel || nextLabel.length > 120) {
    throw new ContentRepositoryError('TAG_NOT_FOUND', '标签格式无效');
  }
  await database.query(
    'UPDATE content_tags SET slug=?,label=?,enabled=?,updated_at=? WHERE id=?',
    [nextSlug, nextLabel, input.enabled === undefined ? current[0].enabled : input.enabled ? 1 : 0, toMysqlDateTime(), id],
  );
  const rows = await database.query<TagRow[]>('SELECT id,content_type,slug,label,enabled FROM content_tags WHERE id=?', [id]);
  return toTag(rows[0]);
}

export async function listTagsForContent(database: ContentExecutor, contentId: string): Promise<ContentTag[]> {
  const rows = await database.query<TagRow[]>(
    `SELECT t.id,t.content_type,t.slug,t.label,t.enabled
       FROM content_item_tags it
       JOIN content_tags t ON t.id=it.tag_id
      WHERE it.content_id=?
      ORDER BY t.label`,
    [contentId],
  );
  return rows.map(toTag);
}

export async function changeModerationStatus(database: QiahaoDatabase, id: string, status: Exclude<ContentStatus, 'draft'>, reviewerId: string, reason?: string): Promise<ContentItem> {
  return database.transaction(async (connection) => {
    const current = await requireContent(connection, id);
    if (!isAllowedStatusTransition(current.status, status)) {
      throw new ContentRepositoryError('INVALID_STATUS_TRANSITION', `不能从 ${current.status} 变更为 ${status}`);
    }
    const now = toMysqlDateTime();
    await connection.query(
      `UPDATE content_items
          SET status=?,reviewed_by=?,reviewed_at=?,rejection_reason=?,published_at=CASE WHEN ?='approved' AND published_at IS NULL THEN ? ELSE published_at END,updated_at=?
        WHERE id=?`,
      [status, reviewerId, now, reason?.trim() || null, status, now, now, id],
    );
    return requireContent(connection, id);
  });
}

export async function archiveContent(database: QiahaoDatabase, id: string, actorId: string, reason?: string): Promise<ContentItem> {
  return changeModerationStatus(database, id, 'archived', actorId, reason);
}

export async function updateContentItem(database: QiahaoDatabase, id: string, patch: { updatedAt?: string }): Promise<ContentItem> {
  await database.query('UPDATE content_items SET updated_at=? WHERE id=?', [patch.updatedAt ?? toMysqlDateTime(), id]);
  return requireContent(database, id);
}

async function tagsForRows(database: ContentExecutor, rows: readonly { id: string }[]): Promise<Map<string, ContentTag[]>> {
  const result = new Map<string, ContentTag[]>();
  await Promise.all(rows.map(async (row) => result.set(row.id, await listTagsForContent(database, row.id))));
  return result;
}

function userSummary(row: { id: string; name: string; avatar: string; verified: number | boolean; bio: string }) {
  return { id: row.id, name: row.name, avatar: row.avatar, verified: Boolean(row.verified), bio: row.bio };
}

export async function listAdminContent(database: QiahaoDatabase, filters: { type?: ContentType; status?: ContentStatus; tag?: string } = {}) {
  const conditions = ['1=1'];
  const params: unknown[] = [];
  if (filters.type) { conditions.push('ci.content_type=?'); params.push(filters.type); }
  if (filters.status) { conditions.push('ci.status=?'); params.push(filters.status); }
  if (filters.tag) {
    conditions.push('EXISTS (SELECT 1 FROM content_item_tags fit JOIN content_tags ft ON ft.id=fit.tag_id WHERE fit.content_id=ci.id AND (ft.id=? OR ft.slug=? OR ft.label=?))');
    params.push(filters.tag, filters.tag, filters.tag);
  }
  const rows = await database.query<AdminRow[]>(
    `SELECT ci.*,u.id AS author_id,u.name AS author_name,u.avatar AS author_avatar,u.verified AS author_verified,u.bio AS author_bio,
            r.id AS reviewer_id,r.name AS reviewer_name,r.avatar AS reviewer_avatar,r.verified AS reviewer_verified,r.bio AS reviewer_bio,
            a.title AS activity_title,a.description AS activity_body,a.category,a.image AS activity_image,
            n.body AS need_body,lp.body AS life_body,lp.image AS life_image
       FROM content_items ci
       JOIN users u ON u.id=ci.author_id
       LEFT JOIN users r ON r.id=ci.reviewed_by
       LEFT JOIN activities a ON a.id=ci.id
       LEFT JOIN needs n ON n.id=ci.id
       LEFT JOIN life_posts lp ON lp.id=ci.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ci.updated_at DESC,ci.id DESC`,
    params,
  );
  const tags = await tagsForRows(database, rows);
  return rows.map((row) => ({
    id: row.id,
    contentType: row.content_type,
    status: row.status,
    author: userSummary({ id: row.author_id, name: row.author_name, avatar: row.author_avatar, verified: row.author_verified, bio: row.author_bio }),
    title: row.activity_title ?? (row.need_body ?? row.life_body ?? '').split('\n')[0].slice(0, 120),
    body: row.activity_body ?? row.need_body ?? row.life_body ?? '',
    category: row.category,
    image: row.activity_image ?? row.life_image,
    tags: tags.get(row.id) ?? [],
    reviewedBy: row.reviewer_id ? userSummary({ id: row.reviewer_id, name: row.reviewer_name ?? '', avatar: row.reviewer_avatar ?? '', verified: row.reviewer_verified ?? false, bio: row.reviewer_bio ?? '' }) : null,
    reviewedAt: row.reviewed_at ? toIsoTimestamp(row.reviewed_at) : null,
    rejectionReason: row.rejection_reason,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  }));
}
