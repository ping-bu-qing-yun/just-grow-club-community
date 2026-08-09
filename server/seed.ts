import { hashPassword } from './auth';
import { toMysqlDateTime } from './db';
import type { QiahaoDatabase } from './db';
import { seedNotifications } from './notification-repository';

const seedTime = '2026-08-07T10:00:00.000Z';
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

const needs = [
  ['d1', 'u4', '不想尴尬交换微信，但想认真认识人。希望有一个轻松的场域，先自然认识，不急着定义关系。', 'natural-chat'],
  ['d2', 'u3', '不是不想恋爱，是越来越难进入关系。希望有一场慢慢聊的活动。', 'small-group'],
  ['d3', 'u5', '想找能聊价值观的人，而不是只聊工作。六个人的小夜谈也很好。', 'deep-talk'],
  ['d4', 'u2', '周末想找同小区附近的人，一起散步。住得近，也想慢慢认识。', 'nearby'],
  ['d5', 'u6', '第一次见面能不能不交换微信。先舒服地认识，之后再说。', 'small-group'],
  ['d6', 'u3', '想找人一起看展，然后随便聊聊。', 'weekend'],
] as const;

const lifePosts = [
  ['life-1', 'u2', '最近想找杨浦附近的朋友，周末一起散步或喝杯咖啡。先轻松认识，不急着定义关系。', '/assets/food.jpg', 'weekend'],
  ['life-2', 'u3', '你觉得舒服的关系，是从心动开始，还是从相处不费力开始？', '/assets/coffee.jpg', 'relationship'],
] as const;

// 俱乐部推荐页目前使用前端目录；为其稳定 id 建立可评论的内容记录。
const clubActivityIds = ['club-dinner', 'club-night', 'club-walk', 'club-workshop', 'club-lunch', 'club-exhibit', 'club-poem', 'club-ride'] as const;
const commentBodies = [
  '我也在找这种不需要硬破冰的认识方式。',
  '人数少一点、地点近一点，我会很愿意参加。',
  '这个想法很具体，期待后续的活动回应。',
  '先从轻松聊天开始，感觉会更自然。',
  '谢谢分享，刚好说中了我最近的感受。',
  '已经收藏，想继续关注大家的建议。',
] as const;

export async function seedDatabase(database: QiahaoDatabase): Promise<void> {
  const passwordHash = await hashPassword('qiahao123');
  const now = toMysqlDateTime(seedTime);
  await database.query(
    `INSERT IGNORE INTO users
      (id,phone,password_hash,name,avatar,bio,verified,role,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ['me', '13800000000', passwordHash, '小恰', '/assets/avatar-me.jpg', '喜欢城市散步、咖啡和不赶时间的周末。', 1, 'operator', now, now],
  );
  for (const [id, phone, name, avatar, bio, verified] of users) {
    await database.query(
      `INSERT IGNORE INTO users
        (id,phone,password_hash,name,avatar,bio,verified,role,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, phone, passwordHash, name, avatar, bio, verified, id === 'u2' ? 'host' : 'member', now, now],
    );
  }
  await database.query("UPDATE users SET role='operator' WHERE id='me'");
  await database.query("UPDATE users SET role='member' WHERE id IN ('u1','u3','u4','u5','u6')");
  await database.query("UPDATE users SET role='host' WHERE id='u2'");
  for (const activity of activities) {
    await database.query(
      `INSERT IGNORE INTO content_items
        (id,author_id,content_type,status,published_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [activity[0], activity[1], 'activity', 'approved', now, now, now],
    );
    await database.query(
      `INSERT IGNORE INTO activities
        (id,host_id,title,category,image,date_label,time,location,distance,description,capacity,price,featured,note,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [...activity, '', now],
    );
    await database.query(
      `INSERT IGNORE INTO content_item_tags (content_id,tag_id,content_type)
       SELECT ?,id,'activity' FROM content_tags WHERE content_type='activity' AND label=? LIMIT 1`,
      [activity[0], activity[3]],
    );
  }
  for (const [id, authorId, body, tagSlug] of needs) {
    await database.query(
      `INSERT IGNORE INTO content_items
        (id,author_id,content_type,status,published_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, authorId, 'need', 'approved', now, now, now],
    );
    await database.query(
      'INSERT IGNORE INTO needs (id,body,author_id,created_at,updated_at) VALUES (?,?,?,?,?)',
      [id, body, authorId, now, now],
    );
    await database.query(
      `INSERT IGNORE INTO content_item_tags (content_id,tag_id,content_type)
       SELECT ?,id,'need' FROM content_tags WHERE content_type='need' AND slug=? LIMIT 1`,
      [id, tagSlug],
    );
  }
  for (const [id, authorId, body, image, tagSlug] of lifePosts) {
    await database.query(
      `INSERT IGNORE INTO content_items
        (id,author_id,content_type,status,published_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, authorId, 'life', 'approved', now, now, now],
    );
    await database.query(
      'INSERT IGNORE INTO life_posts (id,body,image,author_id,created_at,updated_at) VALUES (?,?,?,?,?,?)',
      [id, body, image, authorId, now, now],
    );
    await database.query(
      `INSERT IGNORE INTO content_item_tags (content_id,tag_id,content_type)
       SELECT ?,id,'life' FROM content_tags WHERE content_type='life' AND slug=? LIMIT 1`,
      [id, tagSlug],
    );
  }
  for (const id of clubActivityIds) {
    await database.query(
      `INSERT IGNORE INTO content_items
        (id,author_id,content_type,status,published_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?)`,
      [id, 'me', 'activity', 'approved', now, now, now],
    );
  }
  const commentTargets = [
    ...activities.map(([id]) => ({ contentType: 'activity' as const, contentId: id })),
    ...clubActivityIds.map((contentId) => ({ contentType: 'activity' as const, contentId })),
    ...needs.map(([contentId]) => ({ contentType: 'need' as const, contentId })),
    ...lifePosts.map(([contentId]) => ({ contentType: 'life' as const, contentId })),
  ];
  for (const target of commentTargets) {
    for (let index = 0; index < commentBodies.length; index += 1) {
      const createdAt = toMysqlDateTime(new Date(Date.parse(seedTime) + (index + 1) * 1_000));
      await database.query(
        `INSERT IGNORE INTO comments
          (id,content_type,content_id,author_id,body,created_at,updated_at,deleted_at)
         VALUES (?,?,?,?,?,?,?,NULL)`,
        [
          `seed-comment-${target.contentType}-${target.contentId}-${index + 1}`,
          target.contentType,
          target.contentId,
          users[index % users.length][0],
          commentBodies[index],
          createdAt,
          createdAt,
        ],
      );
    }
  }
  await database.query(
    `INSERT IGNORE INTO threads (id,title,system,created_at)
     VALUES (?,?,?,?)`,
    ['system-safety', '恰好安全助手', 1, now],
  );
  await database.query(
    `INSERT IGNORE INTO thread_members (thread_id,user_id,unread)
     VALUES (?,?,?)`,
    ['system-safety', 'me', 1],
  );
  await database.query(
    `INSERT IGNORE INTO messages (id,thread_id,body,created_at)
     VALUES (?,?,?,?)`,
    ['system-safety-message', 'system-safety', '初次见面请选择公共场所，并告诉朋友你的行程。', now],
  );
  await seedNotifications(database);
}
