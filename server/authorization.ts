import type { FastifyRequest } from 'fastify';
import { authenticateToken, type AuthenticatedUser } from './auth';
import type { QiahaoDatabase } from './db';

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403, public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN', message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireAuthenticatedUser(request: FastifyRequest, database: QiahaoDatabase): Promise<AuthenticatedUser> {
  const user = await authenticateToken(database, request.headers.authorization);
  if (!user) throw new AuthorizationError(401, 'UNAUTHORIZED', '请先登录');
  return user;
}

export function requireRole(user: AuthenticatedUser, role: 'admin' | 'user'): void {
  if (user.role !== role) throw new AuthorizationError(403, 'FORBIDDEN', '无权执行此操作');
}

export function requireContentOwnerOrAdmin(user: AuthenticatedUser, content: { authorId: string }): void {
  if (user.role !== 'admin' && user.id !== content.authorId) {
    throw new AuthorizationError(403, 'FORBIDDEN', '只能操作自己的内容');
  }
}

export function requireCommentOwnerOrAdmin(user: AuthenticatedUser, comment: { authorId: string }): void {
  if (user.role !== 'admin' && user.id !== comment.authorId) {
    throw new AuthorizationError(403, 'FORBIDDEN', '只能删除自己的评论');
  }
}
