import { describe, expect, it } from 'vitest';
import { canPublishActivity } from './roles';

describe('activity publishing role matrix', () => {
  it('allows only the authoritative admin role', () => {
    expect(canPublishActivity({ role: 'admin' })).toBe(true);
    expect(canPublishActivity({ role: 'user' })).toBe(false);
    expect(canPublishActivity({ role: undefined })).toBe(false);
    expect(canPublishActivity(null)).toBe(false);
    expect(canPublishActivity(undefined)).toBe(false);
  });
});
