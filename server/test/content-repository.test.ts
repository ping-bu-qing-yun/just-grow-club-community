import { describe, expect, it } from 'vitest';
import { isAllowedStatusTransition } from '../content-repository';

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
});
