import type { ClubState } from './types';

export type UserPortrait = {
  intents: string[];
  scenes: string[];
  barriers: string[];
  profileTags: string[];
  preferences: string[];
  city?: string;
  /** 0–100 */
  completeness: number;
  summaryLabel: string;
  /** 画像条上展示的短标签 */
  highlightTags: string[];
};

function nonEmpty(list: string[] | undefined): string[] {
  return (list ?? []).map((item) => item.trim()).filter(Boolean);
}

export function computePortraitCompleteness(state: Pick<ClubState, 'lightAnswers' | 'qaAnswers' | 'profile' | 'onboardingComplete'>): number {
  let score = 0;
  const lights = state.lightAnswers ?? [[], [], []];
  const answeredLights = lights.filter((group) => group.length > 0).length;
  score += Math.min(3, answeredLights) * 18; // max 54

  const qaCount = Object.values(state.qaAnswers ?? {}).filter((value) => value.trim()).length;
  score += Math.min(3, qaCount) * 8; // max 24

  const profile = state.profile;
  if (profile?.nickname?.trim()) score += 6;
  if (profile?.bio?.trim() && profile.bio.length >= 12) score += 6;
  if (profile?.tags?.length) score += 5;
  if (profile?.preferences?.length) score += 5;

  if (state.onboardingComplete) score = Math.max(score, 42);

  return Math.max(0, Math.min(100, score));
}

export function buildSummaryLabel(portrait: Pick<UserPortrait, 'intents' | 'scenes' | 'barriers'>): string {
  const { intents, scenes, barriers } = portrait;
  if (barriers.includes('怕尴尬') || scenes.includes('少人数饭局')) {
    return '你更适合，慢一点、少一点人的见面';
  }
  if (intents.includes('想找能深聊的人') || scenes.includes('主题 deep talk')) {
    return '你更适合，能认真聊几句的小局';
  }
  if (scenes.includes('轻松散步') || intents.includes('想扩大线下社交圈')) {
    return '你更适合，边走边认识的轻松场景';
  }
  if (intents.includes('想理解关系模式') || scenes.includes('关系工作坊')) {
    return '你更适合，有一点结构的关系练习';
  }
  if (barriers.includes('怕太像相亲')) {
    return '你更适合，不强定义关系的自然场景';
  }
  return '你更适合，舒服一点认识的场景';
}

export function buildUserPortrait(state: ClubState): UserPortrait {
  const lights = state.lightAnswers ?? [[], [], []];
  const intents = nonEmpty(lights[0]);
  const scenes = nonEmpty(lights[1]);
  const barriers = nonEmpty(lights[2]);
  const profileTags = nonEmpty(state.profile?.tags);
  const preferences = nonEmpty(state.profile?.preferences);

  const highlightTags = [...barriers, ...scenes, ...intents, ...profileTags]
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 3);

  const base: UserPortrait = {
    intents,
    scenes,
    barriers,
    profileTags,
    preferences,
    city: state.profile?.city?.trim() || undefined,
    completeness: computePortraitCompleteness(state),
    summaryLabel: '',
    highlightTags: highlightTags.length ? highlightTags : ['低压力', '慢慢认识'],
  };
  base.summaryLabel = buildSummaryLabel(base);
  return base;
}
