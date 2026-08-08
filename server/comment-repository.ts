import { randomUUID } from 'node:crypto';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { ApiComment, CommentContentType, CommentPage } from '../src/api/types';
import type { QiahaoDatabase, QiahaoConnection } from './db';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import { getContent } from './content-repository';

export type CommentExecutor = Pick<QiahaoDatabase, 'query'> | Pick<QiahaoConnection, 'query'>;

export class CommentRepositoryError extends Error {
  constructor(
    public readonly code: 'INVALID_CONTENT_TYPE' | 'INVALID_CURSOR' | 'CONTENT_NOT_FOUND' | 'COMMENT_NOT_FOUND' | 'INVALID_BODY',
    message: string,
    public readonly status = code === 'CONTENT_NOT_FOUND' || code === 'COMMENT_NOT_FOUND' ? 404 : 400,
  ) {
    super(message);
    this.name = 'CommentRepositoryError';
  }
}

type CommentRow = RowDataPacket & {
  id: string;
  content_type: CommentContentType;
  content_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_verified: number | boolean;
  author_bio: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type Cursor = { createdAt: string; id: string };

const contentTypes = new Set<CommentContentType>(['activity', 'need', 'life']);

function assertContentType(value: string): asserts value is CommentContentType {
  if (!contentTypes.has(value as CommentContentType)) {
    throw new CommentRepositoryError('INVALID_CONTENT_TYPE', '评论内容类型无效');
  }
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(value: string | undefined | null): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<Cursor>;
    if (typeof parsed.createdAt !== 'string' || !parsed.createdAt || typeof parsed.id !== 'string' || !parsed.id) {
      throw new Error('invalid');
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    throw new CommentRepositoryError('INVALID_CURSOR', '评论分页游标无效');
  }
}

function toComment(row: CommentRow): ApiComment {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    author: {
      id: row.author_id,
      name: row.author_name,
      avatar: row.author_avatar,
      verified: Boolean(row.author_verified),
      bio: row.author_bio,
    },
    body: row.body,
    createdAt: toIsoTimestamp(row.created_at),
    updatedAt: toIsoTimestamp(row.updated_at),
  };
}

async function requirePublicContent(database: CommentExecutor, contentType: CommentContentType, contentId: string): Promise<void> {
  assertContentType(contentType);
  const content = await getContent(database, contentId);
  if (!content || content.contentType !== contentType || content.status !== 'approved') {
    throw new CommentRepositoryError('CONTENT_NOT_FOUND', '评论对应的内容不存在或不可见');
  }
}

const commentSelect = `
  SELECT c.id,c.content_type,c.content_id,c.author_id,c.body,c.created_at,c.updated_at,c.deleted_at,
         u.name AS author_name,u.avatar AS author_avatar,u.verified AS author_verified,u.bio AS author_bio
    FROM comments c
    JOIN users u ON u.id=c.author_id`;

export async function listComments(
  database: QiahaoDatabase,
  input: { contentType: string; contentId: string; limit?: number; cursor?: string | null },
): Promise<CommentPage> {
  const { contentType, contentId } = input;
  assertContentType(contentType);
  const limit = input.limit ?? 5;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new CommentRepositoryError('INVALID_BODY', '评论分页数量必须在 1 至 100 之间');
  }
  if (!contentId?.trim() || contentId.length > 128) {
    throw new CommentRepositoryError('CONTENT_NOT_FOUND', '评论对应的内容不存在或不可见');
  }
  await requirePublicContent(database, contentType, contentId);
  const cursor = decodeCursor(input.cursor);
  const cursorClause = cursor ? ' AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))' : '';
  const cursorParams = cursor ? [cursor.createdAt, cursor.createdAt, cursor.id] : [];
  const [rows, countRows] = await Promise.all([
    database.query<CommentRow[]>(
      `${commentSelect}
        WHERE c.content_type=? AND c.content_id=? AND c.deleted_at IS NULL${cursorClause}
        ORDER BY c.created_at DESC,c.id DESC
        LIMIT ?`,
      [contentType, contentId, ...cursorParams, limit],
    ),
    database.query<Array<RowDataPacket & { total: number | string }>>(
      'SELECT COUNT(*) AS total FROM comments WHERE content_type=? AND content_id=? AND deleted_at IS NULL',
      [contentType, contentId],
    ),
  ]);
  const total = Number(countRows[0]?.total ?? 0);
  // A one-row look-ahead avoids a false nextCursor when the current page ends
  // exactly at the last comment, including after a concurrent soft deletion.
  let resolvedCursor = rows.length === limit
    ? encodeCursor({ createdAt: rows[rows.length - 1].created_at, id: rows[rows.length - 1].id })
    : null;
  if (resolvedCursor) {
    const lookahead = await database.query<RowDataPacket[]>(
      `${commentSelect}
        WHERE c.content_type=? AND c.content_id=? AND c.deleted_at IS NULL
          AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))
        LIMIT 1`,
      [contentType, contentId, rows[rows.length - 1].created_at, rows[rows.length - 1].created_at, rows[rows.length - 1].id],
    );
    if (!lookahead.length) resolvedCursor = null;
  }
  return { comments: rows.map(toComment), total, nextCursor: resolvedCursor };
}

export async function countComments(database: CommentExecutor, contentType: CommentContentType, contentId: string): Promise<number> {
  assertContentType(contentType);
  const rows = await database.query<Array<RowDataPacket & { total: number | string }>>(
    'SELECT COUNT(*) AS total FROM comments WHERE content_type=? AND content_id=? AND deleted_at IS NULL',
    [contentType, contentId],
  );
  return Number(rows[0]?.total ?? 0);
}

export async function createComment(
  database: QiahaoDatabase,
  input: { contentType: string; contentId: string; authorId: string; body: string },
): Promise<ApiComment> {
  const contentType = input.contentType;
  assertContentType(contentType);
  const body = input.body?.trim() ?? '';
  if (!body || body.length > 500) {
    throw new CommentRepositoryError('INVALID_BODY', '评论内容不能为空且不能超过 500 字');
  }
  await requirePublicContent(database, contentType, input.contentId);
  const id = `comment-${Date.now()}-${randomUUID().slice(0, 12)}`;
  const now = toMysqlDateTime();
  await database.query<ResultSetHeader>(
    `INSERT INTO comments (id,content_type,content_id,author_id,body,created_at,updated_at,deleted_at)
     VALUES (?,?,?,?,?,?,?,NULL)`,
    [id, contentType, input.contentId, input.authorId, body, now, now],
  );
  const rows = await database.query<CommentRow[]>(`${commentSelect} WHERE c.id=? LIMIT 1`, [id]);
  if (!rows[0]) throw new Error('评论创建失败');
  return toComment(rows[0]);
}

export async function getComment(database: CommentExecutor, id: string): Promise<(ApiComment & { authorId: string }) | null> {
  const rows = await database.query<CommentRow[]>(`${commentSelect} WHERE c.id=? AND c.deleted_at IS NULL LIMIT 1`, [id]);
  if (!rows[0]) return null;
  return { ...toComment(rows[0]), authorId: rows[0].author_id };
}

export async function deleteComment(database: QiahaoDatabase, id: string): Promise<void> {
  const result = await database.query<ResultSetHeader>(
    'UPDATE comments SET deleted_at=?,updated_at=? WHERE id=? AND deleted_at IS NULL',
    [toMysqlDateTime(), toMysqlDateTime(), id],
  );
  if (Number(result.affectedRows ?? 0) === 0) throw new CommentRepositoryError('COMMENT_NOT_FOUND', '评论不存在');
}

export const softDeleteComment = deleteComment;
