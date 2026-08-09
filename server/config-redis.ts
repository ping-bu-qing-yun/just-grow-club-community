import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import type { ConfigInvalidationEvent } from './config-service';
import { BusinessConfigService } from './config-service';

const CHANNEL = 'qiahao:business-config-events:v1';

export interface ConfigRedisBridge {
  close(): Promise<void>;
}

export async function connectConfigRedis(service: BusinessConfigService): Promise<ConfigRedisBridge | null> {
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
      const payload = JSON.parse(raw) as { source: string; event: ConfigInvalidationEvent };
      if (payload.source !== instanceId && payload.event?.domain) service.invalidateLocal();
    } catch {
      // MySQL remains authoritative; the next explicit invalidation or process restart reconciles the cache.
    }
  });
  service.setRemotePublisher((event) => {
    void publisher.publish(CHANNEL, JSON.stringify({ source: instanceId, event })).catch(() => undefined);
  });
  return {
    async close() {
      await subscriber.quit();
      await publisher.quit();
    },
  };
}
