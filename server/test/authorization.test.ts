import { describe, expect, it } from 'vitest';
import { requireCommentOwnerOrOperator, requireContentOwnerOrAdmin, requireRole, AuthorizationError } from '../authorization';
import type { AuthenticatedUser } from '../auth';

const user = (role: 'admin' | 'user', id = 'u1'): AuthenticatedUser => ({
  id,
  phone: '13800000001',
  name: '测试用户',
  avatar: '',
  bio: '',
  verified: false,
  role,
});

describe('server authorization helpers', () => {
  it('requires the server role for administrator actions', () => {
    expect(() => requireRole(user('admin'), 'admin')).not.toThrow();
    expect(() => requireRole(user('user'), 'admin')).toThrowError(new AuthorizationError(403, 'FORBIDDEN', '无权执行此操作'));
  });

  it('limits content changes to the author or admin', () => {
    expect(() => requireContentOwnerOrAdmin(user('user'), { authorId: 'u1' })).not.toThrow();
    expect(() => requireContentOwnerOrAdmin(user('user'), { authorId: 'u2' })).toThrowError(AuthorizationError);
    expect(() => requireContentOwnerOrAdmin(user('admin'), { authorId: 'u2' })).not.toThrow();
  });

  it('keeps comment deletion compatible with the new admin role', () => {
    expect(() => requireCommentOwnerOrOperator(user('admin'), { authorId: 'u2' })).not.toThrow();
    expect(() => requireCommentOwnerOrOperator(user('user'), { authorId: 'u2' })).toThrowError(AuthorizationError);
  });
});
