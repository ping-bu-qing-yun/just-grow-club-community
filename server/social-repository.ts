import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { MessageThread } from '../src/domain/types';
import type { ActivityLifecycle, ParticipationStatus } from '../src/domain/types';
import type { ContentType } from '../src/api/types';
import { toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';

type ActivityRow = RowDataPacket & {
  id: string;
  title: string;
  host_id: string;
  capacity: number | string;
  image: string;
  lifecycle: ActivityLifecycle;
};

type ThreadRow = RowDataPacket & {
  id: string;
  activity_id: string | null;
  title: string;
  image: string | null;
  system: number | boolean;
  last_message: string | null;
  message_created_at: string | null;
  unread: number | string;
};

export async function setFavorite(database: QiahaoDatabase, userId: string, activityId: string, saved: boolean): Promise<boolean> {
  return setContentBookmark(database, userId, 'activity', activityId, saved);
}

async function publicContentExists(database: QiahaoDatabase, contentType: ContentType, contentId: string): Promise<boolean> {
  const rows = await database.query<RowDataPacket[]>(
    `SELECT 1 FROM content_items
      WHERE id=? AND content_type=? AND status='approved'
      LIMIT 1`,
    [contentId, contentType],
  );
  return rows.length > 0;
}

export async function setContentBookmark(
  database: QiahaoDatabase,
  userId: string,
  contentType: ContentType,
  contentId: string,
  saved: boolean,
): Promise<boolean> {
  if (!(await publicContentExists(database, contentType, contentId))) return false;
  if (saved) {
    await database.query(
      'INSERT IGNORE INTO content_bookmarks (user_id,content_id,content_type,created_at) VALUES (?,?,?,?)',
      [userId, contentId, contentType, toMysqlDateTime()],
    );
  } else {
    await database.query('DELETE FROM content_bookmarks WHERE user_id=? AND content_id=?', [userId, contentId]);
  }
  return true;
}

export async function setContentResonance(
  database: QiahaoDatabase,
  userId: string,
  contentType: ContentType,
  contentId: string,
  resonated: boolean,
): Promise<boolean> {
  if (!(await publicContentExists(database, contentType, contentId))) return false;
  if (resonated) {
    await database.query(
      `INSERT IGNORE INTO content_reactions
        (user_id,content_id,content_type,reaction_type,created_at)
       VALUES (?,?,?,'resonance',?)`,
      [userId, contentId, contentType, toMysqlDateTime()],
    );
  } else {
    await database.query(
      `DELETE FROM content_reactions
        WHERE user_id=? AND content_id=? AND reaction_type='resonance'`,
      [userId, contentId],
    );
  }
  return true;
}

export async function getContentSocialState(
  database: QiahaoDatabase,
  userId: string,
  contentId: string,
): Promise<{ saved: boolean; resonated: boolean; resonanceCount: number }> {
  const rows = await database.query<Array<RowDataPacket & {
    saved: number | string;
    resonated: number | string;
    resonance_count: number | string;
  }>>(
    `SELECT
       EXISTS(SELECT 1 FROM content_bookmarks WHERE user_id=? AND content_id=?) AS saved,
       EXISTS(SELECT 1 FROM content_reactions WHERE user_id=? AND content_id=? AND reaction_type='resonance') AS resonated,
       (SELECT COUNT(*) FROM content_reactions WHERE content_id=? AND reaction_type='resonance') AS resonance_count`,
    [userId, contentId, userId, contentId, contentId],
  );
  return {
    saved: Boolean(Number(rows[0]?.saved ?? 0)),
    resonated: Boolean(Number(rows[0]?.resonated ?? 0)),
    resonanceCount: Number(rows[0]?.resonance_count ?? 0),
  };
}

export type JoinActivityResult =
  | { kind: 'missing' }
  | { kind: 'full' }
  | { kind: 'ok'; thread: MessageThread | null; participationStatus: ParticipationStatus };

export async function joinActivity(database: QiahaoDatabase, userId: string, activityId: string): Promise<JoinActivityResult> {
  const result = await database.transaction(async (connection) => {
    const activities = await connection.query<ActivityRow[]>(
      `SELECT a.id,a.title,a.host_id,a.capacity,a.image,a.lifecycle
         FROM activities a
         JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
        WHERE a.id=? FOR UPDATE`,
      [activityId],
    );
    const activity = activities[0];
    if (!activity || activity.lifecycle === 'archived') return { kind: 'missing' as const };

    const existing = await connection.query<Array<RowDataPacket & { status: ParticipationStatus }>>(
      'SELECT status FROM activity_members WHERE user_id=? AND activity_id=? LIMIT 1',
      [userId, activityId],
    );
    const threadId = `thread-${activityId}`;
    if (existing[0]?.status === 'joined' || (existing[0]?.status === 'interested' && activity.lifecycle === 'pre')) {
      return {
        kind: 'ok' as const,
        participationStatus: existing[0].status,
        thread: existing[0].status === 'joined' ? await readThread(connection, threadId, userId) : null,
      };
    }

    const participationStatus: ParticipationStatus = activity.lifecycle === 'pre' ? 'interested' : 'joined';

    const countRows = await connection.query<Array<RowDataPacket & { count: number | string }>>(
      `SELECT COUNT(*) AS count
         FROM activity_members
        WHERE activity_id=? AND status='joined'`,
      [activityId],
    );
    if (participationStatus === 'joined' && Number(countRows[0]?.count ?? 0) >= Number(activity.capacity)) return { kind: 'full' as const };

    const now = toMysqlDateTime();
    if (existing[0]?.status === 'interested') {
      await connection.query(
        "UPDATE activity_members SET status='joined',updated_at=?,cancelled_at=NULL WHERE user_id=? AND activity_id=? AND status='interested'",
        [now, userId, activityId],
      );
    } else {
      await connection.query(
        `INSERT INTO activity_members (user_id,activity_id,status,created_at)
         VALUES (?,?,?,?)
         ON DUPLICATE KEY UPDATE status=VALUES(status),updated_at=VALUES(created_at),cancelled_at=NULL`,
        [userId, activityId, participationStatus, now],
      );
    }
    if (participationStatus === 'interested') return { kind: 'ok' as const, thread: null, participationStatus };
    await connection.query(
      `INSERT INTO threads (id,activity_id,title,is_system,image,created_at)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title=VALUES(title),image=VALUES(image)`,
      [threadId, activityId, `${activity.title}群聊`, 0, activity.image, now],
    );
    await connection.query(
      `INSERT INTO thread_members (thread_id,user_id,unread)
       VALUES (?,?,1)
       ON DUPLICATE KEY UPDATE unread=unread`,
      [threadId, userId],
    );
    await connection.query(
      `INSERT INTO thread_members (thread_id,user_id,unread)
       VALUES (?,?,0)
       ON DUPLICATE KEY UPDATE unread=unread`,
      [threadId, activity.host_id],
    );
    await connection.query(
      'INSERT INTO messages (id,thread_id,sender_id,body,created_at) VALUES (?,?,?,?,?)',
      [randomUUID(), threadId, activity.host_id, '欢迎加入，出发前会在这里同步集合信息。', now],
    );
    return { kind: 'ok' as const, thread: await readThread(connection, threadId, userId), participationStatus };
  });
  return result;
}

async function readThread(connection: QiahaoDatabase | QiahaoConnection, id: string, userId?: string): Promise<MessageThread | null> {
  const rows = await connection.query<ThreadRow[]>(
    `SELECT t.id,t.activity_id,t.title,t.image,t.is_system AS \`system\`,
            CASE WHEN latest.deleted_at IS NULL THEN latest.body ELSE '消息已撤回' END AS last_message,
            latest.created_at AS message_created_at,
            tm.unread
       FROM threads t
       JOIN thread_members tm ON tm.thread_id=t.id
       LEFT JOIN messages latest
         ON latest.id=(SELECT m.id FROM messages m WHERE m.thread_id=t.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1)
      WHERE t.id=? ${userId ? 'AND tm.user_id=?' : ''}
      LIMIT 1`,
    userId ? [id, userId] : [id],
  );
  const row = rows[0];
  return row ? {
    id: row.id,
    activityId: row.activity_id ?? undefined,
    title: row.title,
    lastMessage: row.last_message ?? '',
    time: row.message_created_at ?? '',
    unread: Number(row.unread),
    image: row.image ?? undefined,
    system: Boolean(row.system),
  } : null;
}

export async function listThreads(database: QiahaoDatabase, userId: string): Promise<MessageThread[]> {
  const rows = await database.query<Array<RowDataPacket & { id: string }>>(
    `SELECT t.id
       FROM threads t
       JOIN thread_members tm ON tm.thread_id=t.id
      WHERE tm.user_id=?
      ORDER BY t.created_at DESC`,
    [userId],
  );
  const threads = await Promise.all(rows.map((row) => readThread(database, row.id, userId)));
  return threads.filter((thread): thread is MessageThread => thread !== null);
}

export async function listMessages(database: QiahaoDatabase, userId: string, threadId: string) {
  const exists = await database.query<RowDataPacket[]>('SELECT 1 FROM threads WHERE id=? LIMIT 1', [threadId]);
  if (!exists.length) return { kind: 'missing' as const };
  const member = await database.query<RowDataPacket[]>(
    'SELECT 1 FROM thread_members WHERE thread_id=? AND user_id=? LIMIT 1',
    [threadId, userId],
  );
  if (!member.length) return { kind: 'forbidden' as const };
  const messages = await database.query(
    `SELECT id,thread_id AS threadId,sender_id AS senderId,
            CASE WHEN deleted_at IS NULL THEN body ELSE '' END AS body,
            created_at AS createdAt,updated_at AS updatedAt,deleted_at IS NOT NULL AS withdrawn
       FROM messages
      WHERE thread_id=?
      ORDER BY created_at,messages.id`,
    [threadId],
  );
  await database.query('UPDATE thread_members SET unread=0,last_read_at=? WHERE thread_id=? AND user_id=?', [toMysqlDateTime(), threadId, userId]);
  return { kind: 'ok' as const, messages };
}

export async function cancelActivity(database: QiahaoDatabase, userId: string, activityId: string): Promise<'missing' | 'not-joined' | 'removed'> {
  return database.transaction(async (connection) => {
    const rows = await connection.query<Array<RowDataPacket & { status: ParticipationStatus }>>(
      `SELECT m.status FROM activity_members m
        JOIN activities a ON a.id=m.activity_id
       WHERE m.user_id=? AND m.activity_id=? FOR UPDATE`,
      [userId, activityId],
    );
    if (!rows[0]) {
      const activities = await connection.query<RowDataPacket[]>('SELECT 1 FROM activities WHERE id=? LIMIT 1', [activityId]);
      return activities.length ? 'not-joined' as const : 'missing' as const;
    }
    if (rows[0].status === 'cancelled') return 'not-joined' as const;
    const now = toMysqlDateTime();
    await connection.query(
      "UPDATE activity_members SET status='cancelled',cancelled_at=?,updated_at=? WHERE user_id=? AND activity_id=?",
      [now, now, userId, activityId],
    );
    const threadId = `thread-${activityId}`;
    await connection.query('DELETE FROM thread_members WHERE thread_id=? AND user_id=?', [threadId, userId]);
    return 'removed' as const;
  });
}

export async function sendMessage(database: QiahaoDatabase, userId: string, threadId: string, body: string) {
  const cleanBody = body.trim();
  if (!cleanBody || cleanBody.length > 2000) return { kind: 'invalid' as const };
  return database.transaction(async (connection) => {
    const members = await connection.query<RowDataPacket[]>(
      'SELECT 1 FROM thread_members WHERE thread_id=? AND user_id=? LIMIT 1',
      [threadId, userId],
    );
    if (!members.length) {
      const threads = await connection.query<RowDataPacket[]>('SELECT 1 FROM threads WHERE id=? LIMIT 1', [threadId]);
      return { kind: threads.length ? 'forbidden' as const : 'missing' as const };
    }
    const id = randomUUID();
    const now = toMysqlDateTime();
    await connection.query(
      `INSERT INTO messages (id,thread_id,sender_id,message_type,body,created_at,updated_at)
       VALUES (?,?,?,'text',?,?,?)`,
      [id, threadId, userId, cleanBody, now, now],
    );
    await connection.query('UPDATE threads SET updated_at=? WHERE id=?', [now, threadId]);
    await connection.query('UPDATE thread_members SET unread=unread+1 WHERE thread_id=? AND user_id<>?', [threadId, userId]);
    return { kind: 'ok' as const, message: { id, threadId, senderId: userId, body: cleanBody, createdAt: now, updatedAt: now, withdrawn: false } };
  });
}

export async function withdrawMessage(database: QiahaoDatabase, userId: string, messageId: string): Promise<'missing' | 'forbidden' | 'withdrawn'> {
  return database.transaction(async (connection) => {
    const rows = await connection.query<Array<RowDataPacket & { sender_id: string | null; deleted_at: string | null }>>(
      'SELECT sender_id,deleted_at FROM messages WHERE id=? FOR UPDATE',
      [messageId],
    );
    const message = rows[0];
    if (!message) return 'missing' as const;
    if (message.sender_id !== userId) return 'forbidden' as const;
    if (message.deleted_at) return 'withdrawn' as const;
    const now = toMysqlDateTime();
    await connection.query('UPDATE messages SET deleted_at=?,updated_at=? WHERE id=?', [now, now, messageId]);
    return 'withdrawn' as const;
  });
}
