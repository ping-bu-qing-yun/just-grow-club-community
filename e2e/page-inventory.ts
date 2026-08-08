export type PageInventoryNode = {
  id: string;
  name: string;
  roleRequired: 'any' | 'operator' | 'member';
  tags: string[];
};

export const PAGE_INVENTORY: PageInventoryNode[] = [
  { id: 'login', name: '登录', roleRequired: 'any', tags: ['entry'] },
  { id: 'loading', name: '加载中', roleRequired: 'any', tags: ['state'] },
  { id: 'error', name: '错误', roleRequired: 'any', tags: ['state'] },
  { id: 'onboard-light', name: '三问入门', roleRequired: 'any', tags: ['onboarding'] },
  { id: 'onboard-qa', name: 'QA 问答', roleRequired: 'any', tags: ['onboarding'] },
  { id: 'onboard-profile', name: '基础资料', roleRequired: 'any', tags: ['onboarding'] },
  { id: 'onboard-portrait', name: '画像结果', roleRequired: 'any', tags: ['onboarding'] },
  { id: 'home', name: '活动首页', roleRequired: 'any', tags: ['p0-path', 'club'] },
  { id: 'activity-detail', name: '俱乐部活动详情', roleRequired: 'any', tags: ['p0-path', 'club'] },
  { id: 'explore', name: '发现', roleRequired: 'any', tags: ['club'] },
  { id: 'needs', name: '需求广场', roleRequired: 'any', tags: ['club'] },
  { id: 'life', name: '生活动态', roleRequired: 'any', tags: ['club'] },
  { id: 'need-detail', name: '需求详情', roleRequired: 'any', tags: ['club'] },
  { id: 'profile', name: '我的', roleRequired: 'any', tags: ['account'] },
  { id: 'profile-editor', name: '编辑资料', roleRequired: 'any', tags: ['account'] },
  { id: 'records-attended', name: '参加过活动', roleRequired: 'any', tags: ['account'] },
  { id: 'records-saved-needs', name: '需求收藏', roleRequired: 'any', tags: ['account', 'known-probe'] },
  { id: 'saved-activities', name: '活动收藏', roleRequired: 'any', tags: ['account', 'known-probe'] },
  { id: 'messages', name: '消息', roleRequired: 'any', tags: ['account', 'known-probe'] },
  { id: 'publish-sheet', name: '发布类型', roleRequired: 'any', tags: ['publish'] },
  { id: 'create-activity', name: '发布活动', roleRequired: 'operator', tags: ['publish'] },
  { id: 'create-need', name: '发布需求', roleRequired: 'any', tags: ['publish'] },
  { id: 'create-life', name: '发布生活', roleRequired: 'any', tags: ['publish'] },
  { id: 'toast', name: '全局提示', roleRequired: 'any', tags: ['feedback'] },
  { id: 'notif-center', name: '通知中心', roleRequired: 'any', tags: ['notification'] },
  { id: 'notif-detail', name: '通知详情', roleRequired: 'any', tags: ['notification'] },
  { id: 'dislike-sheet', name: '不考虑原因', roleRequired: 'any', tags: ['feedback'] },
];
