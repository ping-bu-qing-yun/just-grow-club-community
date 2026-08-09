import type { ApiActivity } from '../api/types';
import type { Activity, UserSummary } from '../domain/types';
import type { ClubActivity } from './types';

const categoryTheme: Record<Activity['category'], ClubActivity['theme']> = {
  '饭搭子': 'low',
  '咖啡': 'deep',
  '运动': 'walk',
  '徒步': 'walk',
  '看展': 'other',
  '桌游': 'workshop',
};

const themeCategory: Record<ClubActivity['theme'], Activity['category']> = {
  low: '饭搭子',
  deep: '咖啡',
  walk: '徒步',
  workshop: '桌游',
  other: '看展',
};

function numericValue(value: string, fallback: number): number {
  const values = value.match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [];
  return values.length ? Math.max(...values) : fallback;
}

export function clubActivityToDomain(activity: ClubActivity, host: UserSummary): Activity {
  return {
    id: activity.id,
    title: activity.title,
    category: themeCategory[activity.theme],
    image: activity.image,
    dateLabel: activity.date,
    time: activity.timeRange.match(/\b\d{2}:\d{2}\b/)?.[0] ?? '19:00',
    location: activity.location,
    distance: '俱乐部精选',
    description: activity.description,
    host,
    participants: [],
    capacity: numericValue(activity.people, 6),
    price: numericValue(activity.fee, 0),
    featured: activity.id === 'club-dinner',
    note: activity.boundary,
    lifecycle: activity.status === '预活动' ? 'pre' : 'formal',
    participationStatus: null,
    audience: activity.audience,
    pitch: activity.pitch,
    boundary: activity.boundary,
    matchLabel: activity.matchLabel,
    flow: activity.flow,
  };
}

export function domainActivityToClub(activity: Activity | ApiActivity): ClubActivity {
  const tags = 'tags' in activity && Array.isArray(activity.tags)
    ? activity.tags.map((tag) => typeof tag === 'string' ? tag : tag.label)
    : [];
  const flow = activity.flow?.length
    ? activity.flow
    : [
        { title: `${activity.time} 集合`, body: '到场后由主理人说明流程与安全边界。' },
        { title: '自然交流', body: activity.description },
      ];
  return {
    id: activity.id,
    theme: categoryTheme[activity.category],
    status: activity.lifecycle === 'pre' ? '预活动' : '成熟活动',
    title: activity.title,
    tags: tags.length ? tags : [activity.category],
    description: activity.description,
    image: activity.image,
    date: activity.dateLabel,
    location: activity.location,
    people: `${activity.capacity}人`,
    fee: activity.price > 0 ? `¥${activity.price}` : '免费',
    needs: tags.length ? tags : [activity.category],
    timeRange: `${activity.dateLabel} · ${activity.time}`,
    audience: activity.audience || '想在线下自然认识同频朋友的人',
    flow,
    boundary: activity.boundary || activity.note || '不强制交换联系方式，任何互动都以双方自愿为前提。',
    pitch: activity.pitch || activity.description,
    matchLabel: activity.matchLabel || (activity.featured ? '本周精选' : '适合你'),
  };
}
