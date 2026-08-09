import { describe, expect, it, vi } from 'vitest';
import { isAllowedStatusTransition, validateContentTags, type ContentExecutor } from '../content-repository';

function tagExecutor(rows: Array<{ id: string; content_type: 'activity' | 'need' | 'life'; slug: string; label: string; enabled: number }>) {
  const query = vi.fn().mockResolvedValue(rows);
  return { database: { query } as unknown as ContentExecutor, query };
}

describe('content moderation transitions', () => {
  it('accepts the documented transitions', () => {
    expect(isAllowedStatusTransition('pending', 'approved')).toBe(true);
    expect(isAllowedStatusTransition('pending', 'rejected')).toBe(true);
    expect(isAllowedStatusTransition('approved', 'rejected')).toBe(true);
    expect(isAllowedStatusTransition('approved', 'archived')).toBe(true);
    expect(isAllowedStatusTransition('rejected', 'pending')).toBe(true);
    expect(isAllowedStatusTransition('rejected', 'archived')).toBe(true);
  });

  it('keeps archived content terminal and rejects arbitrary jumps', () => {
    expect(isAllowedStatusTransition('archived', 'approved')).toBe(false);
    expect(isAllowedStatusTransition('archived', 'pending')).toBe(false);
    expect(isAllowedStatusTransition('pending', 'archived')).toBe(false);
    expect(isAllowedStatusTransition('draft', 'approved')).toBe(false);
  });

  it('validates tag type and enabled state, and de-duplicates references', async () => {
    const mismatch = tagExecutor([]);
    await expect(validateContentTags(mismatch.database, 'need', ['relationship'])).rejects.toMatchObject({
      code: 'TAG_NOT_FOUND',
      status: 400,
    });

    const disabled = tagExecutor([{ id: 'need-paused', content_type: 'need', slug: 'paused', label: '暂停', enabled: 0 }]);
    await expect(validateContentTags(disabled.database, 'need', ['paused'])).rejects.toMatchObject({
      code: 'TAG_DISABLED',
      status: 400,
    });

    const duplicate = tagExecutor([{ id: 'need-chat', content_type: 'need', slug: 'chat', label: '聊天', enabled: 1 }]);
    const tags = await validateContentTags(duplicate.database, 'need', ['chat', 'chat']);
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ id: 'need-chat', contentType: 'need', enabled: true });
  });
});
