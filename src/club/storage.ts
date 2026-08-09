import type { ClubState, LifePost } from './types';

export const CLUB_STORAGE_KEY_PREFIX = 'qiahao-club-state-v1';
/** @deprecated 仅用于迁移旧全局 key */
export const CLUB_STORAGE_KEY = CLUB_STORAGE_KEY_PREFIX;

export const defaultClubState: ClubState = {
  onboardingComplete: false,
  onboardingStep: 0,
  lightAnswers: [[], [], []],
  qaAnswers: {},
  profile: {
    nickname: '',
    avatar: '',
    birthDate: '',
    gender: '',
    education: '',
    occupation: '',
    height: '',
    city: '',
    hometown: '',
    relationship: '',
    bio: '',
    tags: [],
    preferences: [],
    supplementalInfo: {
      ideal: '',
      expectation: '',
      age: '',
      other: '',
    },
  },
  savedNeedIds: [],
  resonatedNeedIds: [],
  publishedNeeds: [],
  publishedLifePosts: [],
  followedLifeAuthorIds: [],
  resonatedLifePostIds: [],
  savedClubActivityIds: [],
  joinedClubActivityIds: [],
  cancelledClubActivityReasons: {},
  dislikedClubActivityIds: [],
  consideredClubActivityReasons: {},
  reservationCommentedActivityIds: [],
};

export function clubStorageKey(userId: string): string {
  return `${CLUB_STORAGE_KEY_PREFIX}:${encodeURIComponent(userId || 'local-user')}`;
}

function normalizeState(raw: Partial<ClubState> | null | undefined): ClubState {
  return {
    ...defaultClubState,
    ...raw,
    profile: {
      ...defaultClubState.profile,
      ...(raw?.profile ?? {}),
      supplementalInfo: {
        ...defaultClubState.profile.supplementalInfo,
        ...(raw?.profile?.supplementalInfo ?? {}),
      },
    },
    lightAnswers: Array.isArray(raw?.lightAnswers) ? raw!.lightAnswers : defaultClubState.lightAnswers,
    qaAnswers: raw?.qaAnswers && typeof raw.qaAnswers === 'object' ? raw.qaAnswers : {},
    savedNeedIds: Array.isArray(raw?.savedNeedIds) ? raw!.savedNeedIds : [],
    resonatedNeedIds: Array.isArray(raw?.resonatedNeedIds) ? raw!.resonatedNeedIds : [],
    publishedNeeds: Array.isArray(raw?.publishedNeeds) ? raw!.publishedNeeds : [],
    publishedLifePosts: Array.isArray(raw?.publishedLifePosts) ? raw!.publishedLifePosts : [],
    followedLifeAuthorIds: Array.isArray(raw?.followedLifeAuthorIds) ? raw!.followedLifeAuthorIds : [],
    resonatedLifePostIds: Array.isArray(raw?.resonatedLifePostIds) ? raw!.resonatedLifePostIds : [],
    savedClubActivityIds: Array.isArray(raw?.savedClubActivityIds) ? raw!.savedClubActivityIds : [],
    joinedClubActivityIds: Array.isArray(raw?.joinedClubActivityIds) ? raw!.joinedClubActivityIds : [],
    cancelledClubActivityReasons:
      raw?.cancelledClubActivityReasons && typeof raw.cancelledClubActivityReasons === 'object'
        ? raw.cancelledClubActivityReasons
        : {},
    dislikedClubActivityIds: Array.isArray(raw?.dislikedClubActivityIds) ? raw!.dislikedClubActivityIds : [],
    consideredClubActivityReasons:
      raw?.consideredClubActivityReasons && typeof raw.consideredClubActivityReasons === 'object'
        ? raw.consideredClubActivityReasons
        : {},
    reservationCommentedActivityIds: Array.isArray(raw?.reservationCommentedActivityIds) ? raw!.reservationCommentedActivityIds : [],
  };
}

/** 首次按用户读取时，若仅有旧全局 key，迁移到用户 key 后删除全局 key */
export function readClubState(userId = 'local-user'): ClubState {
  try {
    const key = clubStorageKey(userId);
    const scoped = window.localStorage.getItem(key);
    if (scoped) return normalizeState(JSON.parse(scoped) as Partial<ClubState>);

    const legacy = window.localStorage.getItem(CLUB_STORAGE_KEY_PREFIX);
    if (legacy) {
      const parsed = normalizeState(JSON.parse(legacy) as Partial<ClubState>);
      window.localStorage.setItem(key, JSON.stringify(parsed));
      window.localStorage.removeItem(CLUB_STORAGE_KEY_PREFIX);
      return parsed;
    }
    return { ...defaultClubState };
  } catch {
    return { ...defaultClubState };
  }
}

export function writeClubState(state: ClubState, userId = 'local-user'): void {
  try {
    window.localStorage.setItem(clubStorageKey(userId), JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export type { LifePost };
