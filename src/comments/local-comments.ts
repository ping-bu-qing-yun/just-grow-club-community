import type { ApiComment, CommentContentType } from '../api/types';
import { clubActivities, lifePosts, seedNeeds } from '../club/seed';

const authors = [
  { id: 'u1', name: '阿岚', avatar: '/assets/avatar-1.jpg' },
  { id: 'u2', name: '清和', avatar: '/assets/avatar-2.jpg' },
  { id: 'u3', name: '安安', avatar: '/assets/avatar-3.jpg' },
  { id: 'u4', name: '林一', avatar: '/assets/avatar-4.jpg' },
  { id: 'u5', name: 'Momo', avatar: '/assets/avatar-5.jpg' },
  { id: 'u6', name: '周末', avatar: '/assets/avatar-6.jpg' },
];

const bodies = [
  '我也在找这种不需要硬破冰的认识方式。',
  '如果人数少一点、地点近一点，我会很愿意参加。',
  '这个想法很具体，期待后续的活动回应。',
  '先从轻松聊天开始，感觉会更自然。',
  '谢谢分享，刚好说中了我最近的感受。',
  '已经收藏，想继续关注大家的建议。',
];

function countFor(contentType: CommentContentType, contentId: string): number {
  if (contentType === 'need') return seedNeeds.find((item) => item.id === contentId)?.comments ?? 0;
  if (contentType === 'life') return lifePosts.find((item) => item.id === contentId)?.comments ?? 0;
  return clubActivities.some((item) => item.id === contentId) ? 6 : 0;
}

/** JSDOM/local-preview fallback. Production reads the same shape from /api/comments. */
export function localCommentsFor(contentType: CommentContentType, contentId: string): ApiComment[] {
  const count = countFor(contentType, contentId);
  return Array.from({ length: count }, (_, index) => {
    const author = authors[index % authors.length];
    const createdAt = new Date(Date.UTC(2026, 7, 7, 10, 0, count - index)).toISOString();
    return {
      id: `local-comment-${contentType}-${contentId}-${index + 1}`,
      contentType,
      contentId,
      author,
      body: bodies[index % bodies.length],
      createdAt,
      updatedAt: createdAt,
    };
  });
}
