export type PageInventoryNode = {
  id: string;
  name: string;
  route: string;
  roleRequired: 'any' | 'member' | 'host' | 'operator';
  tags: string[];
};

export const PAGE_INVENTORY: PageInventoryNode[] = [
  { id: 'home', name: '活动首页', route: '/activities', roleRequired: 'any', tags: ['p0-path', 'club'] },
  { id: 'activity-detail', name: '俱乐部活动详情', route: '/activities/club-dinner', roleRequired: 'any', tags: ['p0-path', 'club'] },
  { id: 'explore', name: '发现', route: '/discover', roleRequired: 'any', tags: ['club'] },
  { id: 'needs', name: '需求广场', route: '/needs', roleRequired: 'any', tags: ['club'] },
  { id: 'life', name: '生活动态', route: '/needs?view=life', roleRequired: 'any', tags: ['club'] },
  { id: 'need-detail', name: '需求详情', route: '/needs/d1', roleRequired: 'any', tags: ['club'] },
  { id: 'life-detail', name: '生活详情', route: '/life/life-1', roleRequired: 'any', tags: ['club'] },
  { id: 'profile', name: '我的', route: '/profile', roleRequired: 'any', tags: ['account'] },
  { id: 'profile-editor', name: '编辑资料', route: '/profile/edit', roleRequired: 'any', tags: ['account'] },
  { id: 'records-attended', name: '参加过活动', route: '/profile/records/attended', roleRequired: 'any', tags: ['account'] },
  { id: 'records-saved-needs', name: '需求收藏', route: '/profile/records/saved-needs', roleRequired: 'any', tags: ['account'] },
  { id: 'saved-activities', name: '活动收藏', route: '/profile/records/saved-activities', roleRequired: 'any', tags: ['account'] },
  { id: 'messages', name: '消息', route: '/messages', roleRequired: 'any', tags: ['account'] },
  { id: 'message-detail', name: '消息详情', route: '/messages/system-safety', roleRequired: 'any', tags: ['account'] },
  { id: 'create-activity', name: '发布活动', route: '/publish/activity', roleRequired: 'operator', tags: ['publish'] },
  { id: 'create-need', name: '发布需求', route: '/publish/need', roleRequired: 'any', tags: ['publish'] },
  { id: 'create-life', name: '发布生活', route: '/publish/life', roleRequired: 'any', tags: ['publish'] },
  { id: 'notif-center', name: '通知中心', route: '/notifications', roleRequired: 'any', tags: ['notification'] },
  { id: 'notif-detail', name: '通知详情', route: '/notifications/notice-safety', roleRequired: 'any', tags: ['notification'] },
  { id: 'operator-content', name: '内容治理', route: '/operator/content', roleRequired: 'operator', tags: ['operator'] },
];
