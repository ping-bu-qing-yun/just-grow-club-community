import type { AppNotification, NotificationCategory, NotificationTargetType } from '../src/notifications/types';
import type { QiahaoDatabase } from './db';

type NotificationRow = {
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

function toNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: Boolean(row.read_at),
    readAt: row.read_at,
    archivedAt: row.archived_at,
    actor: row.actor_id ? { id: row.actor_id, name: row.actor_name ?? '', avatar: row.actor_avatar ?? undefined } : undefined,
    target: { type: row.target_type, id: row.target_id ?? undefined, label: row.target_label ?? undefined },
  };
}

const selectNotification = `
  SELECT n.id,n.user_id,n.category,n.title,n.body,n.actor_id,
         actor.name AS actor_name,actor.avatar AS actor_avatar,
         n.target_type,n.target_id,n.target_label,n.read_at,n.archived_at,n.created_at
  FROM notifications n
  LEFT JOIN users actor ON actor.id=n.actor_id`;

export function listNotifications(database: QiahaoDatabase, userId: string): AppNotification[] {
  const rows = database.raw.prepare(`${selectNotification}
    WHERE n.user_id=? AND n.archived_at IS NULL
    ORDER BY n.created_at DESC,n.id DESC`).all(userId) as NotificationRow[];
  return rows.map(toNotification);
}

export function getNotification(database: QiahaoDatabase, userId: string, id: string): AppNotification | null {
  const row = database.raw.prepare(`${selectNotification} WHERE n.user_id=? AND n.id=? AND n.archived_at IS NULL`).get(userId, id) as NotificationRow | undefined;
  return row ? toNotification(row) : null;
}

export function markNotificationRead(database: QiahaoDatabase, userId: string, id: string): AppNotification | null {
  const now = new Date().toISOString();
  const result = database.raw.prepare(`UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE user_id=? AND id=? AND archived_at IS NULL`).run(now, userId, id);
  if (!result.changes) return getNotification(database, userId, id);
  return getNotification(database, userId, id);
}

export function archiveReadNotifications(database: QiahaoDatabase, userId: string): string[] {
  const rows = database.raw.prepare(`SELECT id FROM notifications WHERE user_id=? AND read_at IS NOT NULL AND archived_at IS NULL`).all(userId) as Array<{ id: string }>;
  if (!rows.length) return [];
  const now = new Date().toISOString();
  database.raw.prepare(`UPDATE notifications SET archived_at=? WHERE user_id=? AND read_at IS NOT NULL AND archived_at IS NULL`).run(now, userId);
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

export function createNotification(database: QiahaoDatabase, input: CreateNotificationInput): AppNotification {
  const targetType = input.targetType ?? 'none';
  if (targetType === 'none' && input.targetId) throw new Error('通知目标类型为 none 时不能提供目标 ID');
  const now = input.createdAt ?? new Date().toISOString();
  database.raw.prepare(`INSERT INTO notifications
    (id,user_id,category,title,body,actor_id,target_type,target_id,target_label,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    input.id,input.userId,input.category,input.title.trim(),input.body.trim(),input.actorId ?? null,
    targetType,input.targetId ?? null,input.targetLabel ?? null,now,
  );
  return getNotification(database, input.userId, input.id)!;
}

export function seedNotifications(database: QiahaoDatabase): void {
  const insert = database.raw.prepare(`INSERT OR IGNORE INTO notifications
    (id,user_id,category,title,body,actor_id,target_type,target_id,target_label,read_at,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  insert.run('notice-weekend-activities','me','announcement','本周活动上新','周末轻聊天晚餐局和滨江轻徒步已开放报名，先看看有没有适合你的见面。',null,'activity','club-dinner','查看活动',null,'2026-08-08T09:30:00.000Z');
  insert.run('notice-safety','me','system','恰好安全提醒','第一次线下见面，请优先选择公共场所，并将行程告诉一位信任的朋友。',null,'none',null,null,null,'2026-08-08T08:15:00.000Z');
  insert.run('notice-like-need','me','like','有人赞了你的需求','清和赞了你的需求：不想尴尬交换微信，但想认真认识人。','u2','need','d1','查看需求',null,'2026-08-07T20:40:00.000Z');
  insert.run('notice-comment-activity','me','comment','收到一条评论回复','阿岚回复你：集合前我会在活动群里发准确位置，路上见。','u1','messages','system-safety','查看会话','2026-08-07T18:20:00.000Z','2026-08-07T18:20:00.000Z');
}
