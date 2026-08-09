import { randomUUID } from 'node:crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { ContentType } from '../src/api/types';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';

export class MediaRepositoryError extends Error {
  constructor(public readonly status: 409, public readonly code: 'SORT_ORDER_CONFLICT', message: string) {
    super(message);
    this.name = 'MediaRepositoryError';
  }
}

function translateMediaError(error: unknown): never {
  const mysqlError = error as { errno?: number; code?: string };
  if (mysqlError.errno === 1062 || mysqlError.code === 'ER_DUP_ENTRY') {
    throw new MediaRepositoryError(409, 'SORT_ORDER_CONFLICT', '同一内容的媒体排序值不能重复');
  }
  throw error;
}

export interface ContentMediaItem {
  id: string;
  contentId: string;
  contentType: ContentType;
  type: 'image';
  url: string;
  altText: string;
  sortOrder: number;
  createdAt: string;
}

type MediaRow = RowDataPacket & {
  id: string;
  content_id: string;
  content_type: ContentType;
  media_type: 'image';
  url: string;
  alt_text: string;
  sort_order: number | string;
  created_at: string;
};

function toMedia(row: MediaRow): ContentMediaItem {
  return {
    id: row.id,
    contentId: row.content_id,
    contentType: row.content_type,
    type: row.media_type,
    url: row.url,
    altText: row.alt_text,
    sortOrder: Number(row.sort_order),
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export async function listContentMedia(database: QiahaoDatabase, contentId: string): Promise<ContentMediaItem[]> {
  const rows = await database.query<MediaRow[]>('SELECT * FROM content_media WHERE content_id=? ORDER BY sort_order,id', [contentId]);
  return rows.map(toMedia);
}

async function syncPrimaryImage(connection: QiahaoConnection, contentId: string, contentType: ContentType): Promise<void> {
  const rows = await connection.query<Array<RowDataPacket & { url: string }>>(
    'SELECT url FROM content_media WHERE content_id=? ORDER BY sort_order,id LIMIT 1',
    [contentId],
  );
  const image = rows[0]?.url ?? null;
  const now = toMysqlDateTime();
  if (contentType === 'activity') await connection.query('UPDATE activities SET image=?,updated_at=? WHERE id=?', [image ?? '', now, contentId]);
  if (contentType === 'life') await connection.query('UPDATE life_posts SET image=?,updated_at=? WHERE id=?', [image, now, contentId]);
  if (contentType === 'need') await connection.query('UPDATE needs SET image=?,updated_at=? WHERE id=?', [image, now, contentId]);
}

async function insertMedia(
  connection: QiahaoConnection,
  id: string,
  input: { contentId: string; contentType: ContentType; url: string; altText?: string; sortOrder?: number },
  now = toMysqlDateTime(),
): Promise<void> {
  await connection.query(
    `INSERT INTO content_media (id,content_id,content_type,media_type,url,alt_text,sort_order,created_at)
     VALUES (?,?,?,'image',?,?,?,?)`,
    [id, input.contentId, input.contentType, input.url, input.altText?.trim() || '', input.sortOrder ?? 0, now],
  );
}

export async function setPrimaryContentMedia(
  connection: QiahaoConnection,
  input: { contentId: string; contentType: ContentType; url?: string | null; altText?: string },
): Promise<void> {
  const rows = await connection.query<MediaRow[]>(
    'SELECT * FROM content_media WHERE content_id=? ORDER BY sort_order,id LIMIT 1 FOR UPDATE',
    [input.contentId],
  );
  const current = rows[0];
  const url = input.url?.trim() || null;
  if (current && url) {
    await connection.query('UPDATE content_media SET url=?,alt_text=? WHERE id=?', [url, input.altText?.trim() || current.alt_text, current.id]);
  } else if (current) {
    await connection.query('DELETE FROM content_media WHERE id=?', [current.id]);
  } else if (url) {
    await insertMedia(connection, randomUUID(), { ...input, url, sortOrder: 0 });
  }
  await syncPrimaryImage(connection, input.contentId, input.contentType);
}

export async function createContentMedia(
  database: QiahaoDatabase,
  input: { contentId: string; contentType: ContentType; url: string; altText?: string; sortOrder?: number },
): Promise<ContentMediaItem> {
  const id = randomUUID();
  const now = toMysqlDateTime();
  try {
    await database.transaction(async (connection) => {
      await insertMedia(connection, id, input, now);
      await syncPrimaryImage(connection, input.contentId, input.contentType);
    });
  } catch (error) {
    translateMediaError(error);
  }
  const rows = await database.query<MediaRow[]>('SELECT * FROM content_media WHERE id=? LIMIT 1', [id]);
  return toMedia(rows[0]);
}

export async function getContentMedia(database: QiahaoDatabase, id: string): Promise<ContentMediaItem | null> {
  const rows = await database.query<MediaRow[]>('SELECT * FROM content_media WHERE id=? LIMIT 1', [id]);
  return rows[0] ? toMedia(rows[0]) : null;
}

export async function updateContentMedia(
  database: QiahaoDatabase,
  id: string,
  input: { url?: string; altText?: string; sortOrder?: number },
): Promise<ContentMediaItem | null> {
  try {
    return await database.transaction(async (connection) => {
    const rows = await connection.query<MediaRow[]>('SELECT * FROM content_media WHERE id=? FOR UPDATE', [id]);
    const current = rows[0];
    if (!current) return null;
    await connection.query(
      'UPDATE content_media SET url=?,alt_text=?,sort_order=? WHERE id=?',
      [input.url ?? current.url, input.altText === undefined ? current.alt_text : input.altText.trim(), input.sortOrder ?? Number(current.sort_order), id],
    );
    await syncPrimaryImage(connection, current.content_id, current.content_type);
    const updated = await connection.query<MediaRow[]>('SELECT * FROM content_media WHERE id=? LIMIT 1', [id]);
    return toMedia(updated[0]);
    });
  } catch (error) {
    translateMediaError(error);
  }
}

export async function deleteContentMedia(database: QiahaoDatabase, id: string): Promise<boolean> {
  return database.transaction(async (connection) => {
    const rows = await connection.query<MediaRow[]>('SELECT * FROM content_media WHERE id=? FOR UPDATE', [id]);
    const current = rows[0];
    if (!current) return false;
    const result = await connection.query<ResultSetHeader>('DELETE FROM content_media WHERE id=?', [id]);
    await syncPrimaryImage(connection, current.content_id, current.content_type);
    return result.affectedRows > 0;
  });
}
