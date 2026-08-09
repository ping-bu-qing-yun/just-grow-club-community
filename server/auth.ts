import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { RowDataPacket } from 'mysql2/promise';
import type { QiahaoDatabase } from './db';
import { toMysqlDateTime } from './db';
import type { UserRole } from '../src/domain/types';
import { normalizeUserRole } from '../src/domain/roles';

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE_NAME = 'qiahao_session';
export const CSRF_COOKIE_NAME = 'qiahao_csrf';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
  role: UserRole;
}

type UserRow = RowDataPacket & {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: number | boolean;
  role: UserRole | string;
  account_status?: 'active' | 'suspended' | 'deleted';
  password_hash?: string;
  expires_at?: string;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [, saltHex, keyHex] = stored.split('$');
    if (!saltHex || !keyHex) return false;
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), 64) as Buffer;
    const expected = Buffer.from(keyHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCookieHeader(header?: string): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator <= 0) return cookies;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (!name) return cookies;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
    return cookies;
  }, {});
}

export function sessionTokenFromHeaders(authorization?: string, cookieHeader?: string): string {
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (bearer) return bearer;
  return parseCookieHeader(cookieHeader)[SESSION_COOKIE_NAME] ?? '';
}

export async function createSession(database: QiahaoDatabase, userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 30 * 86400000);
  await database.query(
    `INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at)
     VALUES (?,?,?,?,?)`,
    [randomUUID(), userId, tokenHash(token), toMysqlDateTime(expiresAt), toMysqlDateTime(createdAt)],
  );
  return token;
}

export async function authenticateToken(database: QiahaoDatabase, authorization?: string, cookieHeader?: string): Promise<AuthenticatedUser | null> {
  const token = sessionTokenFromHeaders(authorization, cookieHeader);
  if (!token) return null;
  const rows = await database.query<UserRow[]>(
    `SELECT u.id,u.phone,u.name,u.avatar,u.bio,u.verified,u.role,u.account_status,s.expires_at
       FROM sessions s
       JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=?
      LIMIT 1`,
    [tokenHash(token)],
  );
  const row = rows[0];
  if (
    !row
    || (row.account_status !== undefined && row.account_status !== 'active')
    || !row.expires_at
    || Date.parse(row.expires_at) <= Date.now()
  ) return null;
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    verified: Boolean(row.verified),
    role: normalizeUserRole(row.role),
  };
}

export async function revokeSession(database: QiahaoDatabase, token: string): Promise<void> {
  await database.query('DELETE FROM sessions WHERE token_hash=?', [tokenHash(token)]);
}
