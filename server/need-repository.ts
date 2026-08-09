import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { ApiNeed } from '../src/api/types';
import type { QiahaoDatabase } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import { createContent, listTagsForContent, recordContentAudit, requireContent, updateContentTags } from './content-repository';
import { countComments } from './comment-repository';
import { getContentSocialState } from './social-repository';
import { decodeTimestampCursor, encodeTimestampCursor } from './pagination';

type NeedRow = RowDataPacket & {
  id: string;
  body: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_verified: number | boolean;
  author_bio: string;
  status: ApiNeed['status'];
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  sort_at: string;
};

function toNeed(row: NeedRow, tags: ApiNeed['tags']): ApiNeed {
  return {
    id: row.id,
    body: row.body,
    author: { id: row.author_id, name: row.author_name, avatar: row.author_avatar, verified: Boolean(row.author_verified), bio: row.author_bio },
    tags,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at ? toIsoTimestamp(row.reviewed_at) : null,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
    commentCount: 0,
    saved: false,
    resonated: false,
    resonanceCount: 0,
  };
}

const needSelect = `
  SELECT n.id,n.body,n.author_id,u.name AS author_name,u.avatar AS author_avatar,u.verified AS author_verified,u.bio AS author_bio,
         ci.status,ci.rejection_reason,ci.reviewed_at,n.created_at,n.updated_at,
         COALESCE(ci.published_at,ci.created_at) AS sort_at
    FROM needs n
    JOIN content_items ci ON ci.id=n.id AND ci.content_type='need'
    JOIN users u ON u.id=n.author_id`;

export async function getNeed(database: QiahaoDatabase, id: string, publicOnly = true, userId?: string): Promise<ApiNeed | null> {
  const rows = await database.query<NeedRow[]>(`${needSelect} WHERE n.id=? ${publicOnly ? "AND ci.status='approved'" : ''} LIMIT 1`, [id]);
  if (!rows[0]) return null;
  const [tags, commentCount, social] = await Promise.all([
    listTagsForContent(database, id),
    countComments(database, 'need', id),
    userId ? getContentSocialState(database, userId, id) : Promise.resolve({ saved: false, resonated: false, resonanceCount: 0 }),
  ]);
  return { ...toNeed(rows[0], tags as ApiNeed['tags']), ...social, commentCount, comments: commentCount };
}

export type ContentPageInput = { limit: number; cursor?: string; q?: string };

export async function listNeeds(database: QiahaoDatabase, userId: string, input: ContentPageInput) {
  const clauses = ["ci.status='approved'"];
  const params: unknown[] = [];
  if (input.q) {
    clauses.push('(n.body LIKE ? OR n.title LIKE ? OR n.subtitle LIKE ?)');
    const query = `%${input.q}%`;
    params.push(query, query, query);
  }
  if (input.cursor) {
    const cursor = decodeTimestampCursor(input.cursor);
    clauses.push('(COALESCE(ci.published_at,ci.created_at)<? OR (COALESCE(ci.published_at,ci.created_at)=? AND n.id<?))');
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  params.push(input.limit + 1);
  const rows = await database.query<NeedRow[]>(
    `${needSelect}
      WHERE ${clauses.join(' AND ')}
      ORDER BY COALESCE(ci.published_at,ci.created_at) DESC,n.id DESC
      LIMIT ?`,
    params,
  );
  const pageRows = rows.slice(0, input.limit);
  const items = await Promise.all(pageRows.map(async (row) => {
    const [tags, commentCount, social] = await Promise.all([
      listTagsForContent(database, row.id),
      countComments(database, 'need', row.id),
      getContentSocialState(database, userId, row.id),
    ]);
    return { ...toNeed(row, tags as ApiNeed['tags']), ...social, commentCount, comments: commentCount };
  }));
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: rows.length > input.limit && last ? encodeTimestampCursor({ createdAt: last.sort_at, id: last.id }) : null,
  };
}

export async function createNeed(database: QiahaoDatabase, authorId: string, body: string, tagRefs: readonly string[] = []): Promise<ApiNeed> {
  const id = `need-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const cleanBody = body.trim();
  const now = toMysqlDateTime();
  await database.transaction(async (connection) => {
    await createContent(connection, { id, authorId, contentType: 'need', status: 'approved', tagRefs, now });
    await connection.query('INSERT INTO needs (id,body,author_id,created_at,updated_at) VALUES (?,?,?,?,?)', [id, cleanBody, authorId, now, now]);
  });
  const item = await getNeed(database, id, false, authorId);
  if (!item) throw new Error('需求创建失败');
  return item;
}

export async function updateNeed(database: QiahaoDatabase, id: string, body: string, tagRefs: readonly string[] = [], actorId?: string): Promise<ApiNeed> {
  await database.transaction(async (connection) => {
    const content = await requireContent(connection, id);
    if (content.contentType !== 'need') throw new Error('内容类型不匹配');
    const rows = await connection.query<Array<RowDataPacket & { body: string }>>('SELECT body FROM needs WHERE id=? FOR UPDATE', [id]);
    if (!rows[0]) throw new Error('需求不存在');
    const now = toMysqlDateTime();
    await connection.query('UPDATE needs SET body=?,updated_at=? WHERE id=?', [body.trim(), now, id]);
    await updateContentTags(connection, id, 'need', tagRefs);
    await connection.query('UPDATE content_items SET updated_at=? WHERE id=?', [now, id]);
    await recordContentAudit(connection, { contentId: id, contentType: 'need', actorId: actorId ?? content.authorId, eventType: 'edited', before: { body: rows[0].body }, after: { body: body.trim(), tags: tagRefs } });
  });
  const item = await getNeed(database, id, false);
  if (!item) throw new Error('需求不存在');
  return item;
}
