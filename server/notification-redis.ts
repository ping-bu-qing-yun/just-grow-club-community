import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';
import type { NotificationEvent } from './notification-hub';
import { NotificationHub } from './notification-hub';

const CHANNEL = 'qiahao:notification-events:v1';

export interface NotificationRedisBridge {
  close(): Promise<void>;
}

/** Redis is optional for a single API instance and required for multi-instance fan-out. */
export async function connectNotificationRedis(hub: NotificationHub): Promise<NotificationRedisBridge | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  const publisher = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  const subscriber = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  const instanceId = `${process.pid}:${randomUUID()}`;
  try {
    await publisher.connect();
    await subscriber.connect();
    await subscriber.subscribe(CHANNEL);
  } catch {
    publisher.disconnect();
    subscriber.disconnect();
    return null;
  }
  subscriber.on('message', (_channel, raw) => {
    try {
      const event = JSON.parse(raw) as { source: string; userId: string; event: NotificationEvent };
      if (event.source !== instanceId && event.userId && event.event) hub.publishLocal(event.userId, event.event);
    } catch {
      // Ignore malformed cross-instance events; REST reconciliation remains authoritative.
    }
  });
  hub.setRemotePublisher((userId: string, event: NotificationEvent) => {
    void publisher.publish(CHANNEL, JSON.stringify({ source: instanceId, userId, event })).catch(() => undefined);
  });
  return {
    async close() {
      await subscriber.quit();
      await publisher.quit();
    },
  };
}
