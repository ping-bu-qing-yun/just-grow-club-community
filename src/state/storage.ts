import type { PersistedState } from '../domain/types';

export const STORAGE_KEY = 'qiahao-state-v1';

export const emptyPersistedState: PersistedState = {
  customActivities: [],
  savedIds: [],
  joinedIds: [],
  messages: [],
};

export function readPersistedState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersistedState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    return {
      customActivities: Array.isArray(parsed.customActivities) ? parsed.customActivities : [],
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
      joinedIds: Array.isArray(parsed.joinedIds) ? parsed.joinedIds : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return emptyPersistedState;
  }
}

export function writePersistedState(state: PersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The app remains usable with in-memory state when storage is unavailable.
  }
}

