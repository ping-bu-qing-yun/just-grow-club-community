import { createContext } from 'react';
import type { ApiUser } from '../api/types';
import type { Activity, CreateActivityInput, MessageThread } from '../domain/types';
import type { LifePost, Need } from '../club/types';

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
  toggleSaved: (activityId: string) => void;
  joinActivity: (activityId: string) => void;
  createActivity: (input: CreateActivityInput) => Promise<Activity>;
  createNeed: (body: string, tags?: string[], image?: string) => Promise<Need>;
  createLifePost: (body: string, image?: string, tags?: string[]) => Promise<LifePost>;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => void;
}

export const QiahaoContext = createContext<QiahaoContextValue | null>(null);
