import { expect, it } from 'vitest';
import { NotificationHub, type NotificationEvent } from '../notification-hub';

it('fans out notification events locally and to the configured remote publisher', () => {
  const local: NotificationEvent[] = [];
  const remote: Array<{ userId: string; event: NotificationEvent }> = [];
  const hub = new NotificationHub((userId, event) => remote.push({ userId, event }));
  const unsubscribe = hub.subscribe('me', (event) => local.push(event));
  const event: NotificationEvent = { type: 'archive', ids: ['notice-1'] };

  hub.publish('me', event);
  expect(local).toEqual([event]);
  expect(remote).toEqual([{ userId: 'me', event }]);

  unsubscribe();
  hub.publishLocal('me', event);
  expect(local).toHaveLength(1);
});
