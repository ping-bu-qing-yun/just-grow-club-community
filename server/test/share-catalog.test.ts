import { describe, expect, it } from 'vitest';
import { clubActivities } from '../../src/club/seed';
import {
  absoluteUrl,
  getShareActivity,
  renderActivityShareHtml,
  resolveFrontendOrigin,
  resolveShareImageUrl,
  shareActivities,
} from '../share-catalog';

describe('share-catalog', () => {
  it('derives share catalog from clubActivities seed (single source of truth)', () => {
    expect(shareActivities.length).toBe(clubActivities.length);
    for (const activity of clubActivities) {
      const share = getShareActivity(activity.id);
      expect(share).not.toBeNull();
      expect(share!.title).toBe(activity.title);
      expect(share!.image).toBe(activity.image);
      expect(share!.description).toBe(activity.pitch || activity.description);
    }
  });

  it('renders og html with absolute image and deep-link app url', () => {
    const activity = getShareActivity('club-dinner')!;
    const html = renderActivityShareHtml({
      activity,
      pageUrl: 'https://api.example.com/api/share/activity/club-dinner',
      imageUrl: 'https://cdn.example.com/assets/food.jpg',
      appUrl: 'https://app.example.com/?activity=club-dinner',
    });
    expect(html).toContain('og:title" content="周五轻聊天晚餐局"');
    expect(html).toContain('og:image" content="https://cdn.example.com/assets/food.jpg"');
    expect(html).toContain('activity=club-dinner');
    expect(html).toContain('twitter:card" content="summary_large_image"');
  });

  it('resolves image and frontend origins from env overrides', () => {
    const prevWeb = process.env.QIAHAO_WEB_ORIGIN;
    const prevAsset = process.env.QIAHAO_ASSET_ORIGIN;
    try {
      process.env.QIAHAO_WEB_ORIGIN = 'https://app.example.com/';
      process.env.QIAHAO_ASSET_ORIGIN = 'https://cdn.example.com/';
      expect(resolveFrontendOrigin()).toBe('https://app.example.com');
      expect(resolveShareImageUrl('/assets/food.jpg', 'http://127.0.0.1:5174')).toBe(
        'https://cdn.example.com/assets/food.jpg',
      );
      expect(absoluteUrl('https://x.com', 'https://already.absolute/a.jpg')).toBe('https://already.absolute/a.jpg');
    } finally {
      if (prevWeb === undefined) delete process.env.QIAHAO_WEB_ORIGIN;
      else process.env.QIAHAO_WEB_ORIGIN = prevWeb;
      if (prevAsset === undefined) delete process.env.QIAHAO_ASSET_ORIGIN;
      else process.env.QIAHAO_ASSET_ORIGIN = prevAsset;
    }
  });
});
