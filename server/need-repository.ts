import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { ApiNeed } from '../src/api/types';
import type { QiahaoDatabase } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import { createContent, listTagsForContent, requireContent, updateContentTags } from './content-repository';
import { countComments } from './comment-repository';

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
  };
}

const needSelect = `
  SELECT n.id,n.body,n.author_id,u.name AS author_name,u.avatar AS author_avatar,u.verified AS author_verified,u.bio AS author_bio,
         ci.status,ci.rejection_reason,ci.reviewed_at,n.created_at,n.updated_at
    FROM needs n
    JOIN content_items ci ON ci.id=n.id AND ci.content_type='need'
    JOIN users u ON u.id=n.author_id`;

export async function getNeed(database: QiahaoDatabase, id: string, publicOnly = true): Promise<ApiNeed | null> {
  const rows = await database.query<NeedRow[]>(`${needSelect} WHERE n.id=? ${publicOnly ? "AND ci.status='approved'" : ''} LIMIT 1`, [id]);
  if (!rows[0]) return null;
  const [tags, commentCount] = await Promise.all([
    listTagsForContent(database, id),
    countComments(database, 'need', id),
  ]);
  return { ...toNeed(rows[0], tags as ApiNeed['tags']), commentCount, comments: commentCount };
}

export async function listNeeds(database: QiahaoDatabase): Promise<ApiNeed[]> {
  const rows = await database.query<NeedRow[]>(`${needSelect} WHERE ci.status='approved' ORDER BY ci.published_at DESC,ci.created_at DESC`);
  return Promise.all(rows.map(async (row) => {
    const [tags, commentCount] = await Promise.all([
      listTagsForContent(database, row.id),
      countComments(database, 'need', row.id),
    ]);
    return { ...toNeed(row, tags as ApiNeed['tags']), commentCount, comments: commentCount };
  }));
}

export async function createNeed(database: QiahaoDatabase, authorId: string, body: string, tagRefs: readonly string[] = []): Promise<ApiNeed> {
  const id = `need-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const cleanBody = body.trim();
  const now = toMysqlDateTime();
  await database.transaction(async (connection) => {
    await createContent(connection, { id, authorId, contentType: 'need', status: 'approved', tagRefs, now });
    await connection.query('INSERT INTO needs (id,body,author_id,created_at,updated_at) VALUES (?,?,?,?,?)', [id, cleanBody, authorId, now, now]);
  });
  const item = await getNeed(database, id, false);
  if (!item) throw new Error('需求创建失败');
  return item;
}

export async function updateNeed(database: QiahaoDatabase, id: string, body: string, tagRefs: readonly string[] = []): Promise<ApiNeed> {
  await database.transaction(async (connection) => {
    const content = await requireContent(connection, id);
    if (content.contentType !== 'need') throw new Error('内容类型不匹配');
    const now = toMysqlDateTime();
    await connection.query('UPDATE needs SET body=?,updated_at=? WHERE id=?', [body.trim(), now, id]);
    await updateContentTags(connection, id, 'need', tagRefs);
    await connection.query('UPDATE content_items SET updated_at=? WHERE id=?', [now, id]);
  });
  const item = await getNeed(database, id, false);
  if (!item) throw new Error('需求不存在');
  return item;
}
