import type { Activity, ActivityCategory, MessageThread, UserSummary } from './types';

export const categories: Array<'全部' | ActivityCategory> = [
  '全部', '饭搭子', '咖啡', '运动', '徒步', '看展', '桌游',
];

export const currentUser: UserSummary = {
  id: 'me',
  name: '小恰',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  verified: true,
  bio: '喜欢城市散步、咖啡和不赶时间的周末。',
};

const users: UserSummary[] = [
  { id: 'u1', name: '阿岚', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', verified: true, bio: '户外领队，走路不卷速度。' },
  { id: 'u2', name: '清和', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', verified: true },
  { id: 'u3', name: '安安', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80' },
  { id: 'u4', name: '林一', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80', verified: true },
  { id: 'u5', name: 'Momo', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
  { id: 'u6', name: '周末', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80', verified: true },
];

export const seedActivities: Activity[] = [
  {
    id: 'walk-001', title: '周六滨江轻徒步', category: '徒步',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=86',
    dateLabel: '周六 · 8月8日', time: '15:30', location: '徐汇滨江龙美术馆', distance: '2.4 km',
    description: '沿着黄浦江慢慢走到南浦大桥，全程约 6 公里。我们不追求配速，中途会停下来拍照和喝咖啡，第一次参加也没有压力。',
    host: users[0], participants: [users[1], users[2], users[4]], capacity: 6, price: 0, featured: true,
    note: '穿舒服的鞋，自带饮用水；下雨则顺延。',
  },
  {
    id: 'coffee-002', title: '梧桐区咖啡散步', category: '咖啡',
    image: 'https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '今天', time: '19:00', location: '武康路 376 号', distance: '1.1 km',
    description: '下班后逛两家小店，聊聊最近发现的好东西。人数不多，适合慢热的人。',
    host: users[2], participants: [users[5]], capacity: 4, price: 38,
  },
  {
    id: 'food-003', title: '今晚四人云南菜', category: '饭搭子',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '今天', time: '18:45', location: '静安寺晶品', distance: '3.0 km',
    description: '临时想吃菌子火锅，四人小桌，AA 不劝酒。希望大家准时、好聊天。',
    host: users[3], participants: [users[0], users[4]], capacity: 4, price: 120,
  },
  {
    id: 'sport-004', title: '新手友好飞盘局', category: '运动',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '周日 · 8月9日', time: '17:00', location: '世纪公园大草坪', distance: '5.8 km',
    description: '零基础也可以来，现场会讲规则和热身。以轻松传盘为主，不打对抗。',
    host: users[5], participants: [users[1], users[2], users[3]], capacity: 10, price: 25,
  },
  {
    id: 'art-005', title: '西岸摄影展同行', category: '看展',
    image: 'https://images.unsplash.com/photo-1561839561-b13bcfe95249?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '周六 · 8月8日', time: '11:00', location: '西岸美术馆', distance: '4.2 km',
    description: '一起看完主展后在馆外聊一会儿。不需要专业知识，愿意分享感受就好。',
    host: users[4], participants: [users[0]], capacity: 5, price: 80,
  },
  {
    id: 'board-006', title: '周五轻策略桌游', category: '桌游',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '周五 · 8月7日', time: '19:30', location: '陕西南路桌游店', distance: '2.0 km',
    description: '主玩璀璨宝石和阿瓦隆，新手会教学。拒绝压力局，开心最重要。',
    host: users[1], participants: [users[3], users[5]], capacity: 7, price: 45,
  },
  {
    id: 'run-007', title: '苏州河 5K 慢跑', category: '运动',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '明天', time: '07:15', location: '昌平路桥南岸', distance: '1.8 km',
    description: '六分半到七分配速，跑前一起热身，跑完吃早餐。',
    host: users[3], participants: [users[0], users[2]], capacity: 6, price: 0,
  },
  {
    id: 'brunch-008', title: '周日早午餐拼桌', category: '饭搭子',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=84',
    dateLabel: '周日 · 8月9日', time: '11:30', location: '愚园路 1088 号', distance: '3.6 km',
    description: '想认识两三个新朋友，吃完可以顺路逛愚园路。AA，口味没有忌口。',
    host: users[2], participants: [users[4]], capacity: 4, price: 95,
  },
];

export const seedMessages: MessageThread[] = [
  {
    id: 'system-safety', title: '恰好安全助手', lastMessage: '初次见面请选择公共场所，并告诉朋友你的行程。',
    time: '昨天', unread: 1, system: true,
  },
];

export const categoryImages: Record<ActivityCategory, string> = {
  饭搭子: seedActivities[2].image,
  咖啡: seedActivities[1].image,
  运动: seedActivities[3].image,
  徒步: seedActivities[0].image,
  看展: seedActivities[4].image,
  桌游: seedActivities[5].image,
};

