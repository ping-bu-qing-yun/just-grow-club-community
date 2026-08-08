import type { UserRole } from './types';

export function canPublishActivity(user: { role?: UserRole } | null | undefined): boolean {
  return user?.role === 'admin';
}
