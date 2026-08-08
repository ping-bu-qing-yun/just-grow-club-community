import type { AppNotification } from '../src/notifications/types';

export type NotificationEvent =
  | { type: 'upsert'; notification: AppNotification }
  | { type: 'archive'; ids: string[] };

type Subscriber = (event: NotificationEvent) => void;

/** Process-local fan-out. Redis can publish into this hub when running multiple instances. */
export class NotificationHub {
  private readonly subscribers = new Map<string, Set<Subscriber>>();

  private remotePublish?: (userId: string, event: NotificationEvent) => void;

  constructor(remotePublish?: (userId: string, event: NotificationEvent) => void) {
    this.remotePublish = remotePublish;
  }

  setRemotePublisher(remotePublish: (userId: string, event: NotificationEvent) => void): void {
    this.remotePublish = remotePublish;
  }

  subscribe(userId: string, subscriber: Subscriber): () => void {
    const current = this.subscribers.get(userId) ?? new Set<Subscriber>();
    current.add(subscriber);
    this.subscribers.set(userId, current);
    return () => {
      current.delete(subscriber);
      if (current.size === 0) this.subscribers.delete(userId);
    };
  }

  publish(userId: string, event: NotificationEvent): void {
    this.publishLocal(userId, event);
    this.remotePublish?.(userId, event);
  }

  publishLocal(userId: string, event: NotificationEvent): void {
    for (const subscriber of this.subscribers.get(userId) ?? []) subscriber(event);
  }
}
