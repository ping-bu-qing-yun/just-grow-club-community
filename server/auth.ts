import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { RowDataPacket } from 'mysql2/promise';
import type { QiahaoDatabase } from './db';
import { toMysqlDateTime } from './db';

const scrypt = promisify(scryptCallback);

export interface AuthenticatedUser {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
}

type UserRow = RowDataPacket & {
  id: string;
  phone: string;
  name: string;
  avatar: string;
  bio: string;
  verified: number | boolean;
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

export async function authenticateToken(database: QiahaoDatabase, header?: string): Promise<AuthenticatedUser | null> {
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const rows = await database.query<UserRow[]>(
    `SELECT u.id,u.phone,u.name,u.avatar,u.bio,u.verified,s.expires_at
       FROM sessions s
       JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=?
      LIMIT 1`,
    [tokenHash(token)],
  );
  const row = rows[0];
  if (!row || !row.expires_at || Date.parse(row.expires_at) <= Date.now()) return null;
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    verified: Boolean(row.verified),
  };
}

export async function revokeSession(database: QiahaoDatabase, token: string): Promise<void> {
  await database.query('DELETE FROM sessions WHERE token_hash=?', [tokenHash(token)]);
}
