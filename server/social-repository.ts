import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { MessageThread } from '../src/domain/types';
import { toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';

type ActivityRow = RowDataPacket & {
  id: string;
  title: string;
  host_id: string;
  capacity: number | string;
  image: string;
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
  const activities = await database.query<RowDataPacket[]>(
    `SELECT a.id FROM activities a
      JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
      WHERE a.id=? LIMIT 1`,
    [activityId],
  );
  if (!activities.length) return false;
  if (saved) {
    await database.query(
      'INSERT IGNORE INTO favorites (user_id,activity_id,created_at) VALUES (?,?,?)',
      [userId, activityId, toMysqlDateTime()],
    );
  } else {
    await database.query('DELETE FROM favorites WHERE user_id=? AND activity_id=?', [userId, activityId]);
  }
  return true;
}

export type JoinActivityResult =
  | { kind: 'missing' }
  | { kind: 'full' }
  | { kind: 'ok'; thread: MessageThread | null };

export async function joinActivity(database: QiahaoDatabase, userId: string, activityId: string): Promise<JoinActivityResult> {
  const result = await database.transaction(async (connection) => {
    const activities = await connection.query<ActivityRow[]>(
      `SELECT a.id,a.title,a.host_id,a.capacity,a.image
         FROM activities a
         JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
        WHERE a.id=? FOR UPDATE`,
      [activityId],
    );
    const activity = activities[0];
    if (!activity) return { kind: 'missing' as const };

    const existing = await connection.query<RowDataPacket[]>(
      'SELECT 1 FROM activity_members WHERE user_id=? AND activity_id=? LIMIT 1',
      [userId, activityId],
    );
    const threadId = `thread-${activityId}`;
    if (existing.length) return { kind: 'ok' as const, thread: await readThread(connection, threadId, userId) };

    const countRows = await connection.query<Array<RowDataPacket & { count: number | string }>>(
      `SELECT COUNT(*) AS count
         FROM activity_members
        WHERE activity_id=? AND status='joined'`,
      [activityId],
    );
    if (Number(countRows[0]?.count ?? 0) >= Number(activity.capacity)) return { kind: 'full' as const };

    const now = toMysqlDateTime();
    await connection.query(
      'INSERT INTO activity_members (user_id,activity_id,status,created_at) VALUES (?,?,?,?)',
      [userId, activityId, 'joined', now],
    );
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
    return { kind: 'ok' as const, thread: await readThread(connection, threadId, userId) };
  });
  return result;
}

async function readThread(connection: QiahaoDatabase | QiahaoConnection, id: string, userId?: string): Promise<MessageThread | null> {
  const rows = await connection.query<ThreadRow[]>(
    `SELECT t.id,t.activity_id,t.title,t.image,t.is_system AS \`system\`,
            latest.body AS last_message,latest.created_at AS message_created_at,
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
    `SELECT id,thread_id AS threadId,sender_id AS senderId,body,created_at AS createdAt
       FROM messages
      WHERE thread_id=?
      ORDER BY created_at,messages.id`,
    [threadId],
  );
  return { kind: 'ok' as const, messages };
}
