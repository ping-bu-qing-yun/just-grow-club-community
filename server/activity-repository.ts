import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { ActivityLifecycle, CreateActivityInput, ParticipationStatus } from '../src/domain/types';
import { toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';
import { createContent, listTagsForContent, recordContentAudit } from './content-repository';
import { countComments } from './comment-repository';
import { createActivityInputSchema } from '../src/contracts/api';
import { decodeCursor, encodeCursor } from './pagination';
import { setPrimaryContentMedia } from './media-repository';

export class ActivityRepositoryError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409,
    public readonly code: 'INVALID_CATEGORY' | 'ACTIVITY_NOT_FOUND' | 'ACTIVITY_ARCHIVED' | 'VALIDATION_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'ActivityRepositoryError';
  }
}

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  avatar: string;
  verified: number | boolean;
  bio: string;
};

type ActivityRow = RowDataPacket & {
  id: string;
  title: string;
  category: string;
  category_key: string;
  theme_key: string;
  image: string;
  date_label: string;
  time: string;
  location: string;
  distance: string;
  description: string;
  capacity: number | string;
  price: number | string;
  featured: number | boolean;
  note: string;
  host_user_id: string;
  host_name: string;
  host_avatar: string;
  host_verified: number | boolean;
  host_bio: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived' | 'hidden';
  lifecycle: ActivityLifecycle;
  audience: string;
  pitch: string;
  boundary: string;
  match_label: string;
  created_at: string;
};

type AgendaRow = RowDataPacket & { title: string; body: string };

function toUser(row: UserRow | { id: string; name: string; avatar: string; verified: number | boolean; bio: string }) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    verified: Boolean(row.verified),
    bio: row.bio,
  };
}

async function toActivity(database: QiahaoDatabase, row: ActivityRow, userId: string) {
  const [participants, savedRows, joinedRows, tags, commentCount, agenda] = await Promise.all([
    database.query<UserRow[]>(
      `SELECT u.id,u.name,u.avatar,u.verified,u.bio
         FROM activity_members m
         JOIN users u ON u.id=m.user_id
        WHERE m.activity_id=? AND m.status='joined'
        ORDER BY m.created_at`,
      [row.id],
    ),
    database.query<RowDataPacket[]>('SELECT 1 FROM content_bookmarks WHERE user_id=? AND content_id=? LIMIT 1', [userId, row.id]),
    database.query<Array<RowDataPacket & { status: ParticipationStatus }>>('SELECT status FROM activity_members WHERE user_id=? AND activity_id=? LIMIT 1', [userId, row.id]),
    listTagsForContent(database, row.id),
    countComments(database, 'activity', row.id),
    database.query<AgendaRow[]>(
      'SELECT title,body FROM activity_agenda_items WHERE activity_id=? ORDER BY sequence_no',
      [row.id],
    ),
  ]);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryKey: row.category_key,
    themeKey: row.theme_key,
    image: row.image,
    dateLabel: row.date_label,
    time: row.time,
    location: row.location,
    distance: row.distance,
    description: row.description,
    host: toUser({
      id: row.host_user_id,
      name: row.host_name,
      avatar: row.host_avatar,
      verified: row.host_verified,
      bio: row.host_bio,
    }),
    participants: participants.map(toUser),
    capacity: Number(row.capacity),
    price: Number(row.price),
    featured: Boolean(row.featured),
    note: row.note,
    lifecycle: row.lifecycle,
    participationStatus: joinedRows[0]?.status ?? null,
    status: row.status,
    tags,
    commentCount,
    comments: commentCount,
    saved: savedRows.length > 0,
    joined: joinedRows[0]?.status === 'joined',
    audience: row.audience,
    pitch: row.pitch,
    boundary: row.boundary,
    matchLabel: row.match_label,
    flow: agenda.map((item) => ({ title: item.title, body: item.body })),
  };
}

const activityWithHost = `
  SELECT a.*,COALESCE(ac.label,a.category) AS category,COALESCE(ac.config_key,a.category) AS category_key,
         COALESCE(ac.theme_key,'other') AS theme_key,
         ci.status,u.id AS host_user_id,u.name AS host_name,u.avatar AS host_avatar,
         u.verified AS host_verified,u.bio AS host_bio
    FROM activities a
    JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
    JOIN users u ON u.id=a.host_id
    LEFT JOIN activity_category_configs ac ON ac.config_key=a.category OR ac.label=a.category`;

export type ActivityListInput = {
  limit: number;
  cursor?: string;
  q?: string;
  category?: string;
  theme?: 'low' | 'deep' | 'walk' | 'workshop' | 'other';
  lifecycle?: 'pre' | 'formal';
};

type ActivityCursor = { featured: number; createdAt: string; id: string };

function isActivityCursor(value: unknown): value is ActivityCursor {
  if (!value || typeof value !== 'object') return false;
  const cursor = value as Partial<ActivityCursor>;
  return (cursor.featured === 0 || cursor.featured === 1)
    && typeof cursor.createdAt === 'string'
    && cursor.createdAt.length > 0
    && typeof cursor.id === 'string'
    && cursor.id.length > 0;
}

export async function listActivities(database: QiahaoDatabase, userId: string, input: ActivityListInput) {
  const clauses = ["a.lifecycle<>'archived'"];
  const params: unknown[] = [];
  if (input.lifecycle) {
    clauses.push('a.lifecycle=?');
    params.push(input.lifecycle);
  }
  if (input.theme) {
    clauses.push("COALESCE(ac.theme_key,'other')=?");
    params.push(input.theme);
  }
  if (input.q) {
    clauses.push('(a.title LIKE ? OR a.location LIKE ? OR a.description LIKE ? OR a.category LIKE ? OR ac.label LIKE ?)');
    const query = `%${input.q}%`;
    params.push(query, query, query, query, query);
  }
  if (input.category) {
    clauses.push('(a.category=? OR ac.config_key=?)');
    params.push(input.category, input.category);
  }
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor, isActivityCursor);
    clauses.push('(a.featured<? OR (a.featured=? AND (a.created_at<? OR (a.created_at=? AND a.id<?))))');
    params.push(cursor.featured, cursor.featured, cursor.createdAt, cursor.createdAt, cursor.id);
  }
  params.push(input.limit + 1);
  const rows = await database.query<ActivityRow[]>(
    `${activityWithHost}
      WHERE ${clauses.join(' AND ')}
      ORDER BY a.featured DESC,a.created_at DESC,a.id DESC
      LIMIT ?`,
    params,
  );
  const pageRows = rows.slice(0, input.limit);
  const activities = await Promise.all(pageRows.map((row) => toActivity(database, row, userId)));
  const last = pageRows.at(-1);
  return {
    activities,
    nextCursor: rows.length > input.limit && last
      ? encodeCursor({ featured: Number(Boolean(last.featured)), createdAt: last.created_at, id: last.id })
      : null,
  };
}

export async function getActivity(database: QiahaoDatabase, userId: string, id: string) {
  const rows = await database.query<ActivityRow[]>(
    `${activityWithHost} WHERE a.id=? AND a.lifecycle<>'archived' LIMIT 1`,
    [id],
  );
  return rows[0] ? toActivity(database, rows[0], userId) : null;
}

export function validateActivity(input: Partial<CreateActivityInput>) {
  const parsed = createActivityInputSchema.safeParse(input);
  if (parsed.success) return null;
  const textFields = [input.title, input.description, input.location, input.dateLabel, input.time];
  if (textFields.some((value) => typeof value !== 'string' || !value.trim())) return '请完整填写活动信息';
  if (input.title!.length > 255 || input.location!.length > 255 || input.dateLabel!.length > 120 || input.description!.length > 20000) return '活动文字内容过长';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time!)) return '时间格式无效';
  if (!Number.isInteger(input.capacity) || input.capacity! < 2 || input.capacity! > 50) return '人数需在 2 至 50 人之间';
  if (!Number.isInteger(input.price) || input.price! < 0) return '费用不能为负数';
  return null;
}

export async function createActivity(database: QiahaoDatabase, userId: string, input: CreateActivityInput) {
  const id = `created-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const categoryRows = await database.query<Array<RowDataPacket & { config_key: string; icon_key: string }>>(
    'SELECT config_key,icon_key FROM activity_category_configs WHERE (config_key=? OR label=?) AND enabled=1 LIMIT 1',
    [input.category, input.category],
  );
  const category = categoryRows[0];
  if (!category) throw new ActivityRepositoryError(400, 'INVALID_CATEGORY', '活动类型不存在或已停用');
  const images: Record<string, string> = {
    utensils: '/assets/food.jpg', coffee: '/assets/coffee.jpg', dumbbell: '/assets/sport.jpg',
    footprints: '/assets/hike.jpg', palette: '/assets/art.jpg', dices: '/assets/board.jpg',
  };
  await database.transaction(async (connection: QiahaoConnection) => {
    const now = toMysqlDateTime();
    await createContent(connection, {
      id,
      authorId: userId,
      contentType: 'activity',
      status: 'approved',
      tagRefs: [],
      now,
    });
    const image = images[category.icon_key] ?? '/assets/coffee.jpg';
    await connection.query(
      `INSERT INTO activities
        (id,host_id,title,category,image,date_label,time,location,distance,description,capacity,price,featured,note,lifecycle,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        userId,
        input.title.trim(),
        category.config_key,
        image,
        input.dateLabel.trim(),
        input.time,
        input.location.trim(),
        '由你发起',
        input.description.trim(),
        input.capacity,
        input.price,
        0,
        '请在活动开始前与参与者确认集合信息。',
        'pre',
        now,
      ],
    );
    await setPrimaryContentMedia(connection, { contentId: id, contentType: 'activity', url: image, altText: input.title });
  });
  return getActivity(database, userId, id);
}

export type UpdateActivityInput = Partial<CreateActivityInput>;

export async function updateActivity(database: QiahaoDatabase, actorId: string, id: string, patch: UpdateActivityInput) {
  await database.transaction(async (connection) => {
    const rows = await connection.query<Array<RowDataPacket & {
      title: string; category: string; description: string; date_label: string; time: string;
      location: string; capacity: number | string; price: number | string; lifecycle: ActivityLifecycle;
    }>>(
      `SELECT title,category,description,date_label,time,location,capacity,price,lifecycle
         FROM activities WHERE id=? FOR UPDATE`,
      [id],
    );
    const current = rows[0];
    if (!current) throw new ActivityRepositoryError(404, 'ACTIVITY_NOT_FOUND', '活动不存在');
    if (current.lifecycle === 'archived') throw new ActivityRepositoryError(409, 'ACTIVITY_ARCHIVED', '已归档活动不能修改');
    const next: CreateActivityInput = {
      title: patch.title ?? current.title,
      category: patch.category ?? current.category,
      description: patch.description ?? current.description,
      dateLabel: patch.dateLabel ?? current.date_label,
      time: patch.time ?? current.time,
      location: patch.location ?? current.location,
      capacity: patch.capacity ?? Number(current.capacity),
      price: patch.price ?? Number(current.price),
    };
    const validation = validateActivity(next);
    if (validation) throw new ActivityRepositoryError(400, 'VALIDATION_ERROR', validation);
    const categories = patch.category === undefined
      ? [{ config_key: current.category }]
      : await connection.query<Array<RowDataPacket & { config_key: string }>>(
        'SELECT config_key FROM activity_category_configs WHERE (config_key=? OR label=?) AND enabled=1 LIMIT 1',
        [next.category, next.category],
      );
    if (!categories[0]) throw new ActivityRepositoryError(400, 'INVALID_CATEGORY', '活动类型不存在或已停用');
    const now = toMysqlDateTime();
    await connection.query(
      `UPDATE activities
          SET title=?,category=?,description=?,date_label=?,time=?,location=?,capacity=?,price=?,updated_at=?
        WHERE id=?`,
      [next.title.trim(), categories[0].config_key, next.description.trim(), next.dateLabel.trim(), next.time, next.location.trim(), next.capacity, next.price, now, id],
    );
    await connection.query('UPDATE content_items SET updated_at=? WHERE id=?', [now, id]);
    await recordContentAudit(connection, {
      contentId: id,
      contentType: 'activity',
      actorId,
      eventType: 'edited',
      before: current,
      after: next,
    });
  });
  return getActivity(database, actorId, id);
}

export async function archiveActivity(database: QiahaoDatabase, actorId: string, id: string, reason?: string): Promise<boolean> {
  return database.transaction(async (connection) => {
    const rows = await connection.query<Array<RowDataPacket & { lifecycle: ActivityLifecycle; status: string }>>(
      `SELECT a.lifecycle,ci.status FROM activities a JOIN content_items ci ON ci.id=a.id WHERE a.id=? FOR UPDATE`,
      [id],
    );
    const current = rows[0];
    if (!current) return false;
    if (current.lifecycle === 'archived' && current.status === 'archived') return true;
    const now = toMysqlDateTime();
    await connection.query("UPDATE activities SET lifecycle='archived',updated_at=? WHERE id=?", [now, id]);
    await connection.query(
      "UPDATE content_items SET status='archived',archived_at=COALESCE(archived_at,?),reviewed_by=?,reviewed_at=?,rejection_reason=?,updated_at=? WHERE id=?",
      [now, actorId, now, reason?.trim() || null, now, id],
    );
    await recordContentAudit(connection, {
      contentId: id,
      contentType: 'activity',
      actorId,
      eventType: 'archived',
      reason,
      before: current,
      after: { lifecycle: 'archived', status: 'archived' },
    });
    return true;
  });
}

export type ActivityLifecycleResult =
  | { kind: 'missing' }
  | { kind: 'invalid-transition'; current: ActivityLifecycle }
  | { kind: 'ok'; lifecycle: ActivityLifecycle };

export async function changeActivityLifecycle(
  database: QiahaoDatabase,
  id: string,
  next: ActivityLifecycle,
  actorId?: string,
): Promise<ActivityLifecycleResult> {
  return database.transaction(async (connection) => {
    const rows = await connection.query<Array<RowDataPacket & { lifecycle: ActivityLifecycle }>>(
      'SELECT lifecycle FROM activities WHERE id=? FOR UPDATE',
      [id],
    );
    const current = rows[0]?.lifecycle;
    if (!current) return { kind: 'missing' as const };
    if (current === next) return { kind: 'ok' as const, lifecycle: current };
    const allowed = (current === 'pre' && next === 'formal')
      || ((current === 'pre' || current === 'formal') && next === 'archived');
    if (!allowed) return { kind: 'invalid-transition' as const, current };
    const now = toMysqlDateTime();
    await connection.query('UPDATE activities SET lifecycle=?,updated_at=? WHERE id=?', [next, now, id]);
    if (next === 'archived') {
      await connection.query(
        "UPDATE content_items SET status='archived',archived_at=COALESCE(archived_at,?),reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=?",
        [now, actorId ?? null, now, now, id],
      );
    }
    await recordContentAudit(connection, {
      contentId: id,
      contentType: 'activity',
      actorId,
      eventType: next === 'archived' ? 'archived' : 'lifecycle_changed',
      before: { lifecycle: current },
      after: { lifecycle: next },
    });
    return { kind: 'ok' as const, lifecycle: next };
  });
}

export async function recordActivityInterest(
  database: QiahaoDatabase,
  userId: string,
  activityId: string,
  signal: 'consider' | 'not_interested',
  reason?: string,
): Promise<boolean> {
  const rows = await database.query<RowDataPacket[]>(
    `SELECT 1 FROM activities a
      JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
      WHERE a.id=? LIMIT 1`,
    [activityId],
  );
  if (!rows.length) return false;
  const now = toMysqlDateTime();
  await database.query(
    `INSERT INTO activity_interest_signals
      (user_id,activity_id,signal_type,reason,occurrence_count,created_at,updated_at)
     VALUES (?,?,?,?,1,?,?)
     ON DUPLICATE KEY UPDATE
       signal_type=VALUES(signal_type),reason=VALUES(reason),occurrence_count=occurrence_count+1,updated_at=VALUES(updated_at)`,
    [userId, activityId, signal, reason?.trim() || null, now, now],
  );
  return true;
}

export async function saveActivityFeedback(
  database: QiahaoDatabase,
  userId: string,
  activityId: string,
  mood: string,
  note: string,
): Promise<boolean> {
  const rows = await database.query<RowDataPacket[]>(
    `SELECT 1 FROM activities a
      JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity'
      WHERE a.id=? LIMIT 1`,
    [activityId],
  );
  if (!rows.length) return false;
  const now = toMysqlDateTime();
  await database.query(
    `INSERT INTO activity_feedback
      (id,activity_id,user_id,mood,note,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE mood=VALUES(mood),note=VALUES(note),updated_at=VALUES(updated_at),deleted_at=NULL`,
    [`feedback-${activityId}-${userId}`, activityId, userId, mood, note.trim(), now, now],
  );
  return true;
}

export async function getActivityFeedback(database: QiahaoDatabase, userId: string, activityId: string) {
  const rows = await database.query<Array<RowDataPacket & { id: string; mood: string; note: string; created_at: string; updated_at: string }>>(
    `SELECT id,mood,note,created_at,updated_at FROM activity_feedback
      WHERE activity_id=? AND user_id=? AND deleted_at IS NULL LIMIT 1`,
    [activityId, userId],
  );
  return rows[0] ?? null;
}

export async function withdrawActivityFeedback(database: QiahaoDatabase, userId: string, activityId: string): Promise<boolean> {
  const result = await database.query<import('mysql2/promise').ResultSetHeader>(
    'UPDATE activity_feedback SET deleted_at=?,updated_at=? WHERE activity_id=? AND user_id=? AND deleted_at IS NULL',
    [toMysqlDateTime(), toMysqlDateTime(), activityId, userId],
  );
  return result.affectedRows > 0;
}
