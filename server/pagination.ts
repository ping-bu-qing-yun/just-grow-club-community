export class PaginationCursorError extends Error {
  readonly code = 'INVALID_CURSOR';
  readonly status = 400;

  constructor(message = '分页游标无效') {
    super(message);
    this.name = 'PaginationCursorError';
  }
}

export function encodeCursor(value: Record<string, string | number>): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

export function decodeCursor<T>(cursor: string, isValid: (value: unknown) => value is T): T {
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as unknown;
    if (!isValid(value)) throw new PaginationCursorError();
    return value;
  } catch (error) {
    if (error instanceof PaginationCursorError) throw error;
    throw new PaginationCursorError();
  }
}

export type TimestampCursor = { createdAt: string; id: string };

function isTimestampCursor(value: unknown): value is TimestampCursor {
  if (!value || typeof value !== 'object') return false;
  const cursor = value as Partial<TimestampCursor>;
  return typeof cursor.createdAt === 'string'
    && cursor.createdAt.length > 0
    && typeof cursor.id === 'string'
    && cursor.id.length > 0;
}

export function decodeTimestampCursor(cursor: string): TimestampCursor {
  return decodeCursor(cursor, isTimestampCursor);
}

export function encodeTimestampCursor(value: TimestampCursor): string {
  return encodeCursor(value);
}
