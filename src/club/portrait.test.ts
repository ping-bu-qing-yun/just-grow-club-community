import { describe, expect, it } from 'vitest';
import { defaultClubState } from './storage';
import { buildUserPortrait, computePortraitCompleteness } from './portrait';
import type { ClubState } from './types';

function state(partial: Partial<ClubState>): ClubState {
  return {
    ...defaultClubState,
    ...partial,
    profile: { ...defaultClubState.profile, ...partial.profile },
    lightAnswers: partial.lightAnswers ?? defaultClubState.lightAnswers,
  };
}

describe('buildUserPortrait', () => {
  it('maps light answers and builds highlight tags', () => {
    const portrait = buildUserPortrait(
      state({
        onboardingComplete: true,
        lightAnswers: [['想认识靠谱的人'], ['少人数饭局'], ['怕尴尬']],
      }),
    );
    expect(portrait.intents).toEqual(['想认识靠谱的人']);
    expect(portrait.scenes).toEqual(['少人数饭局']);
    expect(portrait.barriers).toEqual(['怕尴尬']);
    expect(portrait.highlightTags.slice(0, 3)).toEqual(expect.arrayContaining(['怕尴尬', '少人数饭局']));
    expect(portrait.summaryLabel).toMatch(/慢一点|少一点人/);
    expect(portrait.completeness).toBeGreaterThanOrEqual(42);
  });

  it('prefers deep-talk summary when intents point deep', () => {
    const portrait = buildUserPortrait(
      state({
        lightAnswers: [['想找能深聊的人'], ['主题 deep talk'], []],
      }),
    );
    expect(portrait.summaryLabel).toMatch(/认真聊/);
  });
});

describe('computePortraitCompleteness', () => {
  it('is low when empty and higher when filled', () => {
    const empty = computePortraitCompleteness({
      lightAnswers: [[], [], []],
      qaAnswers: {},
      profile: { ...defaultClubState.profile, nickname: '', bio: '', tags: [], preferences: [] },
      onboardingComplete: false,
    });
    const full = computePortraitCompleteness({
      lightAnswers: [['想认识靠谱的人'], ['少人数饭局'], ['怕尴尬']],
      qaAnswers: { 'basic:0': '散步', 'basic:1': '咖啡', 'basic:2': '被理解' },
      profile: defaultClubState.profile,
      onboardingComplete: true,
    });
    expect(empty).toBeLessThan(30);
    expect(full).toBeGreaterThan(empty);
    expect(full).toBeLessThanOrEqual(100);
  });
});
