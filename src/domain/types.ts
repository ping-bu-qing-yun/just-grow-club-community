export type ActivityCategory = '饭搭子' | '咖啡' | '运动' | '徒步' | '看展' | '桌游';

export interface UserSummary {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  bio?: string;
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

export interface PersistedState {
  customActivities: Activity[];
  savedIds: string[];
  joinedIds: string[];
  messages: MessageThread[];
}

