export function normalizeMediaUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url || url.length > 512) return null;
  if (url.startsWith('/assets/')) {
    if (url.includes('..') || url.includes('\\') || /[?#]/.test(url)) return null;
    return /^\/assets\/[a-zA-Z0-9/_().@+-]+$/.test(url) ? url : null;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function assertMediaUrl(value: unknown): string {
  const normalized = normalizeMediaUrl(value);
  if (!normalized) throw new MediaUrlError();
  return normalized;
}
export class MediaUrlError extends Error {
  constructor(message = '媒体地址必须是 HTTPS URL 或同源 /assets/ 路径') {
    super(message);
    this.name = 'MediaUrlError';
  }
}
