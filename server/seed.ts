import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth';
import type { QiahaoDatabase } from './db';
import { seedNotifications } from './notification-repository';

const now = '2026-08-07T10:00:00.000Z';
const users = [
  ['u1', '13800000001', '阿矚', '/assets/avatar-1.jpg', '户外领队，走路不卷速度。', 1],
  ['u2', '13800000002', '清和', '/assets/avatar-2.jpg', '咖啡和城市散步。', 1],
  ['u3', '13800000003', '安安', '/assets/avatar-3.jpg', '周末看展。', 0],
  ['u4', '13800000004', '林一', '/assets/avatar-4.jpg', '轻运动爱好者。', 1],
  ['u5', '13800000005', 'Momo', '/assets/avatar-5.jpg', '认真吃饭。', 0],
  ['u6', '13800000006', '周末', '/assets/avatar-6.jpg', '桌游新手。', 1],
] as const;
const activities = [
  ['walk-001', 'u1', '周六滨江轻徒步', '徒步', '/assets/hike.jpg', '周六 · 8月8日', '15:30', '徐汇滨江龙美术馆', '2.4 km', '沿着黄浦江慢慢走到南浦大桥，中途会停下来拍照和喝咖啡。', 6, 0, 1],
  ['coffee-002', 'u3', '梧桐区咖啡散步', '咖啡', '/assets/coffee.jpg', '今天', '19:00', '武康路376号', '1.1 km', '下班后逛两家小店，聊聊最近发现的好东西。', 4, 38, 0],
  ['food-003', 'u4', '今晚四人云南菜', '饭搭子', '/assets/food.jpg', '今天', '18:45', '静安寺晶品', '3.0 km', '临时想吃菌子火锅，四人小桌，AA不劝酒。', 4, 120, 0],
  ['sport-004', 'u6', '新手友好飞盘局', '运动', '/assets/sport.jpg', '周日 · 8月9日', '17:00', '世纪公园大草坪', '5.8 km', '零基础也可以来，现场讲规则和热身。', 10, 25, 0],
  ['art-005', 'u5', '西岸摄影展同行', '看展', '/assets/art.jpg', '周六 · 8月8日', '11:00', '西岸美术馆', '4.2 km', '一起看完主展后在馆外聊一会儿。', 5, 80, 0],
  ['board-006', 'u2', '周五轻策略桌游', '桌游', '/assets/board.jpg', '周五 · 8月7日', '19:30', '陕西南路桌游店', '2.0 km', '主玩璀璨宝石，新手会教学。', 7, 45, 0],
  ['run-007', 'u4', '苏州河 5K 慢跑', '运动', '/assets/run.jpg', '明天', '07:15', '昌平路桥南岸', '1.8 km', '六分半到七分配速，跑前一起热身。', 6, 0, 0],
  ['brunch-008', 'u3', '周日早午餐拼桌', '饭搭子', '/assets/brunch.jpg', '周日 · 8月9日', '11:30', '愚园路1088号', '3.6 km', '想认识两三个新朋友，吃完可以顺路逛公园。', 4, 95, 0],
] as const;

export async function seedDatabase(database: QiahaoDatabase): Promise<void> {
  const db = database.raw;
  const passwordHash = await hashPassword('qiahao123');
  db.prepare(`INSERT OR IGNORE INTO users (id, phone, password_hash, name, avatar, bio, verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('me', '13800000000', passwordHash, '小恰', '/assets/avatar-me.jpg', '喜欢城市散步、咖啡和不赶时间的周末。', 1, now, now);
  const userStmt = db.prepare(`INSERT OR IGNORE INTO users (id, phone, password_hash, name, avatar, bio, verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [id, phone, name, avatar, bio, verified] of users) userStmt.run(id, phone, passwordHash, name, avatar, bio, verified, now, now);
  const activityStmt = db.prepare(`INSERT OR IGNORE INTO activities (id, host_id, title, category, image, date_label, time, location, distance, description, capacity, price, featured, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const activity of activities) activityStmt.run(...activity, '', now);
  db.prepare(`INSERT OR IGNORE INTO threads (id, title, system, created_at) VALUES (?, ?, 1, ?)`).run('system-safety', '恰好安全助手', now);
  db.prepare(`INSERT OR IGNORE INTO thread_members (thread_id, user_id, unread) VALUES (?, ?, 1)`).run('system-safety', 'me');
  db.prepare(`INSERT OR IGNORE INTO messages (id, thread_id, body, created_at) VALUES (?, ?, ?, ?)`).run('system-safety-message', 'system-safety', '初次见面请选择公共场所，并告诉朋友你的行程。', now);
  seedNotifications(database);
}
