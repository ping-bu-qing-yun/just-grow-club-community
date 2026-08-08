import type { AppNotification } from './types';

export const seedNotifications: AppNotification[] = [
  {
    id: 'notice-weekend-activities',
    category: 'announcement',
    title: '本周活动上新',
    body: '周末轻聊天晚餐局和滨江轻徒步已开放报名，先看看有没有适合你的见面。',
    createdAt: '2026-08-08T09:30:00.000Z',
    read: false,
    target: { type: 'activity', label: '查看活动' },
  },
  {
    id: 'notice-safety',
    category: 'system',
    title: '恰好安全提醒',
    body: '第一次线下见面，请优先选择公共场所，并将行程告诉一位信任的朋友。',
    createdAt: '2026-08-08T08:15:00.000Z',
    read: false,
    target: { type: 'none' },
  },
  {
    id: 'notice-like-need',
    category: 'like',
    title: '有人赞了你的需求',
    body: '清和赞了你的需求：不想尴尬交换微信，但想认真认识人。',
    createdAt: '2026-08-07T20:40:00.000Z',
    read: false,
    actor: { id: 'u2', name: '清和', avatar: '/assets/avatar-2.jpg' },
    target: { type: 'need', label: '查看需求' },
  },
  {
    id: 'notice-comment-activity',
    category: 'comment',
    title: '收到一条评论回复',
    body: '阿岚回复你：集合前我会在活动群里发准确位置，路上见。',
    createdAt: '2026-08-07T18:20:00.000Z',
    read: true,
    actor: { id: 'u1', name: '阿岚', avatar: '/assets/avatar-1.jpg' },
    target: { type: 'messages', label: '查看会话' },
  },
];
