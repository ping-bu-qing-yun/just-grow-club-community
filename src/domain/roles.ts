import type { UserSummary } from './types';

/** 管理者（小CC）才能发布活动；本地演示用户 me 默认视为管理者。 */
export function canPublishActivity(user: Pick<UserSummary, 'id'> | null | undefined): boolean {
  if (!user) return false;
  return user.id === 'me' || user.id === 'operator' || user.id.startsWith('op-');
}
