import { afterEach, expect, it } from 'vitest';
import { createDatabase, type QiahaoDatabase } from '../db';

let database: QiahaoDatabase | undefined;
afterEach(() => database?.close());

it('creates the complete schema in memory', () => {
  database = createDatabase(':memory:');
  const tables = database.raw.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all().map((row) => (row as { name: string }).name);
  expect(tables).toEqual(expect.arrayContaining([
    'activities', 'activity_members', 'favorites', 'messages',
    'sessions', 'thread_members', 'threads', 'users',
  ]));
});
