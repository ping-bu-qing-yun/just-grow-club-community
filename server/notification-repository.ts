import type { RowDataPacket } from 'mysql2/promise';
import type { AppNotification, NotificationCategory, NotificationTargetType } from '../src/notifications/types';
import { toIsoTimestamp, toMysqlDateTime } from './db';
import type { QiahaoDatabase } from './db';
import { decodeTimestampCursor, encodeTimestampCursor } from './pagination';

type NotificationRow = RowDataPacket & {
  id: string;
  user_id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  target_type: NotificationTargetType;
  target_id: string | null;
  target_label: string | null;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
};

function optionalTimestamp(value: string | null): string | null {
  return value === null ? null : toIsoTimestamp(value);
}

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    createdAt: toIsoTimestamp(row.created_at),
    read: row.read_at !== null,
    readAt: optionalTimestamp(row.read_at),
    archivedAt: optionalTimestamp(row.archived_at),
    actor: row.actor_id
      ? { id: row.actor_id, name: row.actor_name ?? '', avatar: row.actor_avatar ?? undefined }
      : undefined,
    target: {
      type: row.target_type,
      id: row.target_id ?? undefined,
      label: row.target_label ?? undefined,
    },
  };
}

const selectNotification = `
  SELECT n.id,n.user_id,n.category,n.title,n.body,n.actor_id,
         actor.name AS actor_name,actor.avatar AS actor_avatar,
         n.target_type,n.target_id,n.target_label,n.read_at,n.archived_at,n.created_at
    FROM notifications n
    LEFT JOIN users actor ON actor.id=n.actor_id`;

export async function listNotifications(
  database: QiahaoDatabase,
  userId: string,
  input: { limit: number; cursor?: string },
) {
  const cursor = input.cursor ? decodeTimestampCursor(input.cursor) : null;
  const rows = await database.query<NotificationRow[]>(
    `${selectNotification}
      WHERE n.user_id=? AND n.archived_at IS NULL
        ${cursor ? 'AND (n.created_at<? OR (n.created_at=? AND n.id<?))' : ''}
      ORDER BY n.created_at DESC,n.id DESC
      LIMIT ?`,
    cursor
      ? [userId, cursor.createdAt, cursor.createdAt, cursor.id, input.limit + 1]
      : [userId, input.limit + 1],
  );
  const pageRows = rows.slice(0, input.limit);
  const last = pageRows.at(-1);
  return {
    notifications: pageRows.map(toNotification),
    nextCursor: rows.length > input.limit && last ? encodeTimestampCursor({ createdAt: last.created_at, id: last.id }) : null,
  };
}

export async function getNotification(database: QiahaoDatabase, userId: string, id: string): Promise<AppNotification | null> {
  const rows = await database.query<NotificationRow[]>(
    `${selectNotification} WHERE n.user_id=? AND n.id=? AND n.archived_at IS NULL LIMIT 1`,
    [userId, id],
  );
  return rows[0] ? toNotification(rows[0]) : null;
}

export async function markNotificationRead(database: QiahaoDatabase, userId: string, id: string): Promise<AppNotification | null> {
  await database.query(
    `UPDATE notifications
        SET read_at=COALESCE(read_at,?)
      WHERE user_id=? AND id=? AND archived_at IS NULL`,
    [toMysqlDateTime(), userId, id],
  );
  return getNotification(database, userId, id);
}

export async function archiveReadNotifications(database: QiahaoDatabase, userId: string): Promise<string[]> {
  const rows = await database.query<Array<RowDataPacket & { id: string }>>(
    `SELECT id
       FROM notifications
      WHERE user_id=? AND read_at IS NOT NULL AND archived_at IS NULL`,
    [userId],
  );
  if (!rows.length) return [];
  await database.query(
    `UPDATE notifications
        SET archived_at=?
      WHERE user_id=? AND read_at IS NOT NULL AND archived_at IS NULL`,
    [toMysqlDateTime(), userId],
  );
  return rows.map((row) => row.id);
}

export interface CreateNotificationInput {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actorId?: string;
  targetType?: NotificationTargetType;
  targetId?: string;
  targetLabel?: string;
  createdAt?: string;
}

export async function createNotification(database: QiahaoDatabase, input: CreateNotificationInput): Promise<AppNotification> {
  const targetType = input.targetType ?? 'none';
  if (targetType === 'none' && input.targetId) throw new Error('通知目标类型为 none 时不能提供目标 ID');
  await database.query(
    `INSERT INTO notifications
      (id,user_id,category,title,body,actor_id,target_type,target_id,target_label,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      input.id,
      input.userId,
      input.category,
      input.title.trim(),
      input.body.trim(),
      input.actorId ?? null,
      targetType,
      input.targetId ?? null,
      input.targetLabel ?? null,
      toMysqlDateTime(input.createdAt ?? new Date()),
    ],
  );
  const notification = await getNotification(database, input.userId, input.id);
  if (!notification) throw new Error('通知创建后无法读取');
  return notification;
}

export async function seedNotifications(database: QiahaoDatabase): Promise<void> {
  const notices = [
    ['notice-weekend-activities', 'me', 'announcement', '本周活动上新', '周末轻聊天晚餐局和滨江轻徒步已开放报名，先看看有没有适合你的见面。', null, 'activity', 'club-dinner', '查看活动', null, '2026-08-08T09:30:00.000Z'],
    ['notice-safety', 'me', 'system', '恰好安全提醒', '第一次线下见面，请优先选择公共场所，并将行程告诉一位信任的朋友。', null, 'none', null, null, null, '2026-08-08T08:15:00.000Z'],
    ['notice-like-need', 'me', 'like', '有人赞了你的需求', '清和赞了你的需求：不想尴尬交换微信，但想认真认识人。', 'u2', 'need', 'd1', '查看需求', null, '2026-08-07T20:40:00.000Z'],
    ['notice-comment-activity', 'me', 'comment', '收到一条评论回复', '阿岚回复你：集合前我会在活动群里发准确位置，路上见。', 'u1', 'messages', 'system-safety', '查看会话', '2026-08-07T18:20:00.000Z', '2026-08-07T18:20:00.000Z'],
    ['notice-activity-feedback', 'me', 'feedback', '填写活动反馈', '你参加的「周五轻聊天晚餐局」已结束，花 1 分钟写下感受，会让下次推荐更准。', null, 'activity', 'club-dinner', '去填写反馈', null, '2026-08-07T12:00:00.000Z'],
  ] as const;
  for (const notice of notices) {
    await database.query(
      `INSERT IGNORE INTO notifications
        (id,user_id,category,title,body,actor_id,target_type,target_id,target_label,read_at,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        notice[0],
        notice[1],
        notice[2],
        notice[3],
        notice[4],
        notice[5],
        notice[6],
        notice[7],
        notice[8],
        notice[9] ? toMysqlDateTime(notice[9]) : null,
        toMysqlDateTime(notice[10]),
      ],
    );
  }
}
