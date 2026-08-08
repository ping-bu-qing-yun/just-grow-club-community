import { describe, expect, it } from 'vitest';
import { clubActivities } from './seed';
import { buildUserPortrait } from './portrait';
import { rankClubActivities, scoreClubActivity } from './recommend';
import { defaultClubState } from './storage';
import type { ClubState } from './types';

function portraitFrom(lightAnswers: string[][]) {
  const state: ClubState = {
    ...defaultClubState,
    onboardingComplete: true,
    lightAnswers,
  };
  return buildUserPortrait(state);
}

describe('rankClubActivities', () => {
  it('ranks low-pressure dinner higher for 怕尴尬 + 少人数', () => {
    const portrait = portraitFrom([['想认识靠谱的人'], ['少人数饭局'], ['怕尴尬']]);
    const ranked = rankClubActivities(portrait, clubActivities);
    expect(ranked[0].activity.id).toBe('club-dinner');
    expect(ranked[0].score).toBeGreaterThanOrEqual(55);
    expect(ranked[0].matchLabel).toMatch(/匹配/);
  });

  it('ranks deep-talk night higher for deep intents', () => {
    const portrait = portraitFrom([['想找能深聊的人'], ['主题 deep talk'], ['怕太像相亲']]);
    const ranked = rankClubActivities(portrait, clubActivities);
    const topIds = ranked.slice(0, 3).map((item) => item.activity.id);
    expect(topIds).toContain('club-night');
    const night = ranked.find((item) => item.activity.id === 'club-night')!;
    expect(night.score).toBeGreaterThanOrEqual(scoreClubActivity(portrait, clubActivities.find((a) => a.id === 'club-ride')!).score);
  });

  it('penalizes joined activities', () => {
    const portrait = portraitFrom([['想认识靠谱的人'], ['少人数饭局'], ['怕尴尬']]);
    const plain = rankClubActivities(portrait, clubActivities);
    const penalized = rankClubActivities(portrait, clubActivities, { penalizeIds: ['club-dinner'] });
    const plainDinner = plain.find((item) => item.activity.id === 'club-dinner')!;
    const penDinner = penalized.find((item) => item.activity.id === 'club-dinner')!;
    expect(penDinner.score).toBeLessThan(plainDinner.score);
  });

  it('excludes ids when requested', () => {
    const portrait = portraitFrom([['想认识靠谱的人'], [], []]);
    const ranked = rankClubActivities(portrait, clubActivities, { excludeIds: ['club-dinner'] });
    expect(ranked.every((item) => item.activity.id !== 'club-dinner')).toBe(true);
  });
});
