import type { ClubState, LifePost } from './types';

export const CLUB_STORAGE_KEY_PREFIX = 'qiahao-club-state-v1';
/** @deprecated 仅保留旧 key 名称供兼容代码识别；正式模式不再自动迁移。 */
export const CLUB_STORAGE_KEY = CLUB_STORAGE_KEY_PREFIX;

export const defaultClubState: ClubState = {
  onboardingComplete: false,
  onboardingStep: 0,
  lightAnswers: [[], [], []],
  qaAnswers: {},
  profile: {
    nickname: '',
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
  },
};

const previewClubState: ClubState = {
  ...defaultClubState,
  profile: {
    nickname: '小恰',
    birthDate: '1997-08-12',
    gender: '女',
    education: '本科',
    occupation: '品牌策划',
    height: '165cm',
    city: '上海 杨浦区',
    hometown: '中国',
    relationship: '正在寻觅',
    bio: '我喜欢有趣但不吵闹的活动，也希望在自然的相处里慢慢认识一个人。',
    tags: ['喜欢深聊', '周末散步', '慢热'],
    preferences: ['喝杯咖啡', '看展', '户外运动'],
  },
};

export function clubStorageKey(userId: string): string {
  return `${CLUB_STORAGE_KEY_PREFIX}:${encodeURIComponent(userId || 'local-user')}`;
}

function normalizeState(raw: Partial<ClubState> | null | undefined): ClubState {
  return {
    ...previewClubState,
    ...raw,
    profile: { ...previewClubState.profile, ...(raw?.profile ?? {}) },
    lightAnswers: Array.isArray(raw?.lightAnswers) ? raw!.lightAnswers : previewClubState.lightAnswers,
    qaAnswers: raw?.qaAnswers && typeof raw.qaAnswers === 'object' ? raw.qaAnswers : {},
  };
}

/** 仅供显式 preview/JSDOM 模式使用；不会读取或迁移旧的正式业务缓存。 */
export function readClubState(userId = 'local-user'): ClubState {
  try {
    const key = clubStorageKey(userId);
    const scoped = window.localStorage.getItem(key);
    if (scoped) return normalizeState(JSON.parse(scoped) as Partial<ClubState>);
    return normalizeState(null);
  } catch {
    return normalizeState(null);
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
