import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface QiahaoDatabase {
  raw: DatabaseSync;
  close(): void;
}

export function createDatabase(path = process.env.QIAHAO_DB_PATH ?? 'data/qiahao.sqlite'): QiahaoDatabase {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const raw = new DatabaseSync(path);
  raw.exec(readFileSync(resolve(process.cwd(), 'server/schema.sql'), 'utf8'));
  return { raw, close: () => raw.close() };
}
