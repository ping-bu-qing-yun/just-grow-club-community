import type { z } from 'zod';
import type {
  activityCategorySchema,
  activityLifecycleSchema,
  createActivityInputSchema,
  participationStatusSchema,
  userRoleSchema,
} from '../contracts/api';

export type ActivityCategory = z.infer<typeof activityCategorySchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type ActivityLifecycle = z.infer<typeof activityLifecycleSchema>;
export type ParticipationStatus = z.infer<typeof participationStatusSchema>;

export interface UserSummary {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  bio?: string;
  role?: UserRole;
}

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  image: string;
  dateLabel: string;
  time: string;
  location: string;
  distance: string;
  description: string;
  host: UserSummary;
  participants: UserSummary[];
  capacity: number;
  price: number;
  featured?: boolean;
  note?: string;
  lifecycle: ActivityLifecycle;
  participationStatus?: ParticipationStatus | null;
  audience?: string;
  pitch?: string;
  boundary?: string;
  matchLabel?: string;
  flow?: Array<{ title: string; body: string }>;
}

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;

export interface MessageThread {
  id: string;
  activityId?: string;
  title: string;
  lastMessage: string;
  time: string;
  unread?: number;
  image?: string;
  system?: boolean;
}

export interface Need {
  id: string;
  author: string;
  subtitle: string;
  tags: string[];
  title: string;
  copy: string;
  image: string;
  resonance: number;
  comments: number;
  response: string;
  similar?: boolean;
}

export interface LifePost {
  id: string;
  author: string;
  meta: string;
  kind: string;
  text: string;
  images: string[];
  tag: string;
  comments: number;
  resonance: number;
}

export interface PersistedState {
  customActivities: Activity[];
  savedIds: string[];
  joinedIds: string[];
  messages: MessageThread[];
}

