export type ActivityCategory = '饭搭子' | '咖啡' | '运动' | '徒步' | '看展' | '桌游';
export type UserRole = 'member' | 'host' | 'operator';

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
}

export interface CreateActivityInput {
  title: string;
  category: ActivityCategory;
  description: string;
  dateLabel: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
  image?: string;
}

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
