import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activitySharePayload,
  buildActivityDeepLink,
  buildActivityShareLink,
  getClubActivityById,
  readActivityIdFromLocation,
  shareActivity,
  writeActivityIdToLocation,
} from './activityShare';
import { clubActivities } from '../club/seed';

describe('activityShare helpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('resolves club activities by id', () => {
    expect(getClubActivityById('club-dinner')?.title).toBe('周五轻聊天晚餐局');
    expect(getClubActivityById('missing')).toBeNull();
  });

  it('reads and writes activity deep-link query', () => {
    expect(readActivityIdFromLocation('')).toBeNull();
    writeActivityIdToLocation('club-dinner');
    expect(window.location.search).toContain('activity=club-dinner');
    expect(readActivityIdFromLocation()).toBe('club-dinner');
    writeActivityIdToLocation(null);
    expect(window.location.search).not.toContain('activity=');
  });

  it('builds share payload with og landing url', () => {
    const activity = clubActivities[0];
    const payload = activitySharePayload(activity);
    expect(payload.title).toBe(activity.title);
    expect(payload.url).toBe(buildActivityShareLink(activity.id));
    expect(payload.url).toContain('/api/share/activity/club-dinner');
    expect(buildActivityDeepLink(activity.id)).toContain('?activity=club-dinner');
  });

  it('falls back to clipboard copy when share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });

    await expect(shareActivity(clubActivities[0])).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith(buildActivityShareLink('club-dinner'));
  });
});
