import type { UserRole } from './types';

export type LegacyUserRole = 'admin' | 'user';

export function normalizeUserRole(role: UserRole | LegacyUserRole | string | null | undefined): UserRole {
  if (role === 'operator' || role === 'admin') return 'operator';
  if (role === 'host') return 'host';
  return 'member';
}

export function isOperator(user: { role?: UserRole | LegacyUserRole | string } | null | undefined): boolean {
  return normalizeUserRole(user?.role) === 'operator';
}

export function canPublishActivity(user: { role?: UserRole | LegacyUserRole | string } | null | undefined): boolean {
  return isOperator(user);
}
