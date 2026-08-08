import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { ActivityCategory, CreateActivityInput } from '../src/domain/types';
import { toMysqlDateTime } from './db';
import type { QiahaoConnection, QiahaoDatabase } from './db';
import { createContent, listTagsForContent } from './content-repository';
import { countComments } from './comment-repository';

const categories = new Set<ActivityCategory>(['饭搭子', '咖啡', '运动', '徒步', '看展', '桌游']);

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
  category: ActivityCategory;
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
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
};

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
  const [participants, savedRows, joinedRows, tags, commentCount] = await Promise.all([
    database.query<UserRow[]>(
      `SELECT u.id,u.name,u.avatar,u.verified,u.bio
         FROM activity_members m
         JOIN users u ON u.id=m.user_id
        WHERE m.activity_id=?
        ORDER BY m.created_at`,
      [row.id],
    ),
    database.query<RowDataPacket[]>('SELECT 1 FROM favorites WHERE user_id=? AND activity_id=? LIMIT 1', [userId, row.id]),
    database.query<RowDataPacket[]>('SELECT 1 FROM activity_members WHERE user_id=? AND activity_id=? LIMIT 1', [userId, row.id]),
    listTagsForContent(database, row.id),
    countComments(database, 'activity', row.id),
  ]);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
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
    status: row.status,
    tags,
    commentCount,
    comments: commentCount,
    saved: savedRows.length > 0,
    joined: joinedRows.length > 0,
  };
}

const activityWithHost = `
  SELECT a.*,ci.status,u.id AS host_user_id,u.name AS host_name,u.avatar AS host_avatar,
         u.verified AS host_verified,u.bio AS host_bio
    FROM activities a
    JOIN content_items ci ON ci.id=a.id AND ci.content_type='activity' AND ci.status='approved'
    JOIN users u ON u.id=a.host_id`;

export async function listActivities(database: QiahaoDatabase, userId: string) {
  const rows = await database.query<ActivityRow[]>(
    `${activityWithHost} ORDER BY a.featured DESC,a.created_at DESC`,
  );
  return Promise.all(rows.map((row) => toActivity(database, row, userId)));
}

export async function getActivity(database: QiahaoDatabase, userId: string, id: string) {
  const rows = await database.query<ActivityRow[]>(
    `${activityWithHost} WHERE a.id=? LIMIT 1`,
    [id],
  );
  return rows[0] ? toActivity(database, rows[0], userId) : null;
}

export function validateActivity(input: Partial<CreateActivityInput>) {
  const textFields = [input.title, input.description, input.location, input.dateLabel, input.time];
  if (textFields.some((value) => typeof value !== 'string' || !value.trim())) return '请完整填写活动信息';
  if (input.title!.length > 255 || input.location!.length > 255 || input.dateLabel!.length > 120 || input.description!.length > 20000) return '活动文字内容过长';
  if (!categories.has(input.category as ActivityCategory)) return '活动类型无效';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time!)) return '时间格式无效';
  if (!Number.isInteger(input.capacity) || input.capacity! < 2 || input.capacity! > 50) return '人数需在 2 至 50 人之间';
  if (!Number.isInteger(input.price) || input.price! < 0) return '费用不能为负数';
  return null;
}

export async function createActivity(database: QiahaoDatabase, userId: string, input: CreateActivityInput) {
  const id = `created-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const images: Record<ActivityCategory, string> = {
    '饭搭子': '/assets/food.jpg',
    '咖啡': '/assets/coffee.jpg',
    '运动': '/assets/sport.jpg',
    '徒步': '/assets/hike.jpg',
    '看展': '/assets/art.jpg',
    '桌游': '/assets/board.jpg',
  };
  await database.transaction(async (connection: QiahaoConnection) => {
    const now = toMysqlDateTime();
    await createContent(connection, {
      id,
      authorId: userId,
      contentType: 'activity',
      status: 'approved',
      tagRefs: [input.category],
      now,
    });
    await connection.query(
      `INSERT INTO activities
        (id,host_id,title,category,image,date_label,time,location,distance,description,capacity,price,featured,note,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        userId,
        input.title.trim(),
        input.category,
        images[input.category],
        input.dateLabel.trim(),
        input.time,
        input.location.trim(),
        '由你发起',
        input.description.trim(),
        input.capacity,
        input.price,
        0,
        '请在活动开始前与参与者确认集合信息。',
        now,
      ],
    );
  });
  return getActivity(database, userId, id);
}
