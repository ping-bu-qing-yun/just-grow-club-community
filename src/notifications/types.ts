export const notificationCategories = ['announcement', 'system', 'like', 'comment'] as const;

export type NotificationCategory = (typeof notificationCategories)[number];
export type NotificationTargetType = 'activity' | 'need' | 'messages' | 'none';

export interface NotificationTarget {
  type: NotificationTargetType;
  id?: string;
  label?: string;
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  archivedAt?: string | null;
  actor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  target?: NotificationTarget;
}

export interface NotificationState {
  notifications: AppNotification[];
}
