import { createContext } from 'react';
import type { ApiMessage, ApiRecommendation, ApiUser } from '../api/types';
import type { Activity, CreateActivityInput, MessageThread } from '../domain/types';
import type { ClubState, LifePost, Need } from '../club/types';
import type { ContentType } from '../api/types';
import type { BusinessConfigBootstrap } from '../config/types';

export type QiahaoStatus = 'loading' | 'anonymous' | 'authenticated' | 'error';

export interface QiahaoContextValue {
  activities: Activity[];
  needs: Need[];
  lifePosts: LifePost[];
  savedIds: Set<string>;
  joinedIds: Set<string>;
  messages: MessageThread[];
  user: ApiUser | null;
  status: QiahaoStatus;
  error: string | null;
  loading: boolean;
  localMode: boolean;
  profileRecord: ClubState | null;
  businessConfig: BusinessConfigBootstrap | null;
  recommendations: ApiRecommendation[];
  hasMoreNeeds: boolean;
  hasMoreLifePosts: boolean;
  loadingMoreContent: boolean;
  toggleSaved: (activityId: string) => void;
  joinActivity: (activityId: string) => void;
  cancelActivity: (activityId: string) => Promise<void>;
  toggleContentSaved: (contentType: ContentType, contentId: string) => void;
  toggleContentResonance: (contentType: ContentType, contentId: string) => void;
  createActivity: (input: CreateActivityInput) => Promise<Activity>;
  updateActivity: (id: string, input: Partial<CreateActivityInput>) => Promise<Activity>;
  archiveActivity: (id: string, reason?: string) => Promise<void>;
  changeActivityLifecycle: (id: string, lifecycle: 'formal' | 'archived') => Promise<void>;
  createNeed: (body: string, tags?: string[]) => Promise<Need>;
  updateNeed: (id: string, body: string, tags?: string[]) => Promise<Need>;
  archiveNeed: (id: string) => Promise<void>;
  createLifePost: (body: string, image?: string, tags?: string[]) => Promise<LifePost>;
  updateLifePost: (id: string, body: string, image?: string, tags?: string[]) => Promise<LifePost>;
  archiveLifePost: (id: string) => Promise<void>;
  loadMoreContent: (contentType: 'need' | 'life') => Promise<void>;
  saveProfileRecord: (profile: ClubState) => Promise<ClubState>;
  saveOnboardingProgress: (record: ClubState) => Promise<void>;
  deleteOnboardingProgress: () => Promise<void>;
  setActivityInterest: (activityId: string, signal: 'consider' | 'not_interested', reason?: string) => Promise<void>;
  submitActivityFeedback: (activityId: string, mood: string, note: string) => Promise<void>;
  sendThreadMessage: (threadId: string, body: string) => Promise<ApiMessage>;
  withdrawThreadMessage: (threadId: string, messageId: string) => Promise<void>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

export const QiahaoContext = createContext<QiahaoContextValue | null>(null);
