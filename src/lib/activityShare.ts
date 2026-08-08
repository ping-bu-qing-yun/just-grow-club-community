import { clubActivities } from '../club/seed';
import type { ClubActivity } from '../club/types';

export const ACTIVITY_QUERY_KEY = 'activity';

export function getClubActivityById(id: string | null | undefined): ClubActivity | null {
  if (!id) return null;
  return clubActivities.find((item) => item.id === id) ?? null;
}

export function readActivityIdFromLocation(search = window.location.search): string | null {
  try {
    const value = new URLSearchParams(search).get(ACTIVITY_QUERY_KEY);
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export function buildActivityDeepLink(activityId: string, origin = window.location.origin): string {
  const url = new URL(origin);
  url.searchParams.set(ACTIVITY_QUERY_KEY, activityId);
  return url.toString();
}

/** 给微信/爬虫的分享入口：走 /api/share，可出 OG 图文，再跳回前端详情 */
export function buildActivityShareLink(activityId: string, origin = window.location.origin): string {
  return new URL(`/api/share/activity/${encodeURIComponent(activityId)}`, origin).toString();
}

export function writeActivityIdToLocation(activityId: string | null): void {
  try {
    const url = new URL(window.location.href);
    if (activityId) url.searchParams.set(ACTIVITY_QUERY_KEY, activityId);
    else url.searchParams.delete(ACTIVITY_QUERY_KEY);
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState(window.history.state, '', next);
  } catch {
    /* ignore */
  }
}

export function activitySharePayload(activity: ClubActivity) {
  const url = buildActivityShareLink(activity.id);
  const text = [activity.pitch || activity.description, activity.timeRange || activity.date, activity.location]
    .filter(Boolean)
    .join(' · ');
  return {
    title: activity.title,
    text,
    url,
  };
}

export async function shareActivity(activity: ClubActivity): Promise<'shared' | 'copied'> {
  const payload = activitySharePayload(activity);
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void>; clipboard?: Clipboard };

  if (typeof nav.share === 'function') {
    try {
      await nav.share(payload);
      return 'shared';
    } catch (error) {
      // 用户取消分享时不降级为复制，避免打扰
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }

  if (nav.clipboard?.writeText) {
    await nav.clipboard.writeText(payload.url);
    return 'copied';
  }

  // 最后兜底
  const input = document.createElement('input');
  input.value = payload.url;
  input.setAttribute('readonly', 'true');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
  return 'copied';
}
