import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { ApiLifePost } from '../src/api/types';
import type { QiahaoDatabase } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import { createContent, listTagsForContent, recordContentAudit, requireContent, updateContentTags } from './content-repository';
import { countComments } from './comment-repository';
import { getContentSocialState } from './social-repository';
import { decodeTimestampCursor, encodeTimestampCursor } from './pagination';
import type { ContentPageInput } from './need-repository';
import { setPrimaryContentMedia } from './media-repository';

type LifeRow = RowDataPacket & {
  id: string;
  body: string;
  image: string | null;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_verified: number | boolean;
  author_bio: string;
  status: ApiLifePost['status'];
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  sort_at: string;
};

function toLifePost(row: LifeRow, tags: ApiLifePost['tags']): ApiLifePost {
  return {
    id: row.id,
    body: row.body,
    image: row.image,
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

const lifeSelect = `
  SELECT lp.id,lp.body,lp.image,lp.author_id,u.name AS author_name,u.avatar AS author_avatar,u.verified AS author_verified,u.bio AS author_bio,
         ci.status,ci.rejection_reason,ci.reviewed_at,lp.created_at,lp.updated_at,
         COALESCE(ci.published_at,ci.created_at) AS sort_at
    FROM life_posts lp
    JOIN content_items ci ON ci.id=lp.id AND ci.content_type='life'
    JOIN users u ON u.id=lp.author_id`;

export async function getLifePost(database: QiahaoDatabase, id: string, publicOnly = true, userId?: string): Promise<ApiLifePost | null> {
  const rows = await database.query<LifeRow[]>(`${lifeSelect} WHERE lp.id=? ${publicOnly ? "AND ci.status='approved'" : ''} LIMIT 1`, [id]);
  if (!rows[0]) return null;
  const [tags, commentCount, social] = await Promise.all([
    listTagsForContent(database, id),
    countComments(database, 'life', id),
    userId ? getContentSocialState(database, userId, id) : Promise.resolve({ saved: false, resonated: false, resonanceCount: 0 }),
  ]);
  return { ...toLifePost(rows[0], tags as ApiLifePost['tags']), ...social, commentCount, comments: commentCount };
}

export async function listLifePosts(database: QiahaoDatabase, userId: string, input: ContentPageInput) {
  const clauses = ["ci.status='approved'"];
  const params: unknown[] = [];
  if (input.q) {
    clauses.push('lp.body LIKE ?');
    params.push(`%${input.q}%`);
  }
  if (input.cursor) {
    const cursor = decodeTimestampCursor(input.cursor);
    clauses.push('(COALESCE(ci.published_at,ci.created_at)<? OR (COALESCE(ci.published_at,ci.created_at)=? AND lp.id<?))');
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  params.push(input.limit + 1);
  const rows = await database.query<LifeRow[]>(
    `${lifeSelect}
      WHERE ${clauses.join(' AND ')}
      ORDER BY COALESCE(ci.published_at,ci.created_at) DESC,lp.id DESC
      LIMIT ?`,
    params,
  );
  const pageRows = rows.slice(0, input.limit);
  const items = await Promise.all(pageRows.map(async (row) => {
    const [tags, commentCount, social] = await Promise.all([
      listTagsForContent(database, row.id),
      countComments(database, 'life', row.id),
      getContentSocialState(database, userId, row.id),
    ]);
    return { ...toLifePost(row, tags as ApiLifePost['tags']), ...social, commentCount, comments: commentCount };
  }));
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: rows.length > input.limit && last ? encodeTimestampCursor({ createdAt: last.sort_at, id: last.id }) : null,
  };
}

export async function createLifePost(database: QiahaoDatabase, authorId: string, body: string, image?: string, tagRefs: readonly string[] = []): Promise<ApiLifePost> {
  const id = `life-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const cleanBody = body.trim();
  const now = toMysqlDateTime();
  await database.transaction(async (connection) => {
    await createContent(connection, { id, authorId, contentType: 'life', status: 'approved', tagRefs, now });
    await connection.query('INSERT INTO life_posts (id,body,image,author_id,created_at,updated_at) VALUES (?,?,?,?,?,?)', [id, cleanBody, image?.trim() || null, authorId, now, now]);
    await setPrimaryContentMedia(connection, { contentId: id, contentType: 'life', url: image, altText: cleanBody.slice(0, 255) });
  });
  const item = await getLifePost(database, id, false, authorId);
  if (!item) throw new Error('生活动态创建失败');
  return item;
}

export async function updateLifePost(database: QiahaoDatabase, id: string, body: string, image?: string, tagRefs: readonly string[] = [], actorId?: string): Promise<ApiLifePost> {
  await database.transaction(async (connection) => {
    const content = await requireContent(connection, id);
    if (content.contentType !== 'life') throw new Error('内容类型不匹配');
    const rows = await connection.query<Array<RowDataPacket & { body: string; image: string | null }>>('SELECT body,image FROM life_posts WHERE id=? FOR UPDATE', [id]);
    if (!rows[0]) throw new Error('生活动态不存在');
    const now = toMysqlDateTime();
    await connection.query('UPDATE life_posts SET body=?,image=?,updated_at=? WHERE id=?', [body.trim(), image?.trim() || null, now, id]);
    await setPrimaryContentMedia(connection, { contentId: id, contentType: 'life', url: image, altText: body.trim().slice(0, 255) });
    await updateContentTags(connection, id, 'life', tagRefs);
    await connection.query('UPDATE content_items SET updated_at=? WHERE id=?', [now, id]);
    await recordContentAudit(connection, { contentId: id, contentType: 'life', actorId: actorId ?? content.authorId, eventType: 'edited', before: { body: rows[0].body, image: rows[0].image }, after: { body: body.trim(), image: image?.trim() || null, tags: tagRefs } });
  });
  const item = await getLifePost(database, id, false);
  if (!item) throw new Error('生活动态不存在');
  return item;
}
