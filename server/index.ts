import { createDatabase } from './db';
import { createSeededApp } from './app';
import { NotificationHub } from './notification-hub';
import { connectNotificationRedis } from './notification-redis';

const database = createDatabase();
const notificationHub = new NotificationHub();
const notificationRedis = await connectNotificationRedis(notificationHub);
await createSeededApp(database, notificationHub).then(async (app) => {
  await app.listen({ host: process.env.QIAHAO_API_HOST ?? '127.0.0.1', port: Number(process.env.QIAHAO_API_PORT ?? 3001) });
  const close = async () => { await app.close(); await notificationRedis?.close(); database.close(); process.exit(0); };
  process.once('SIGINT', close); process.once('SIGTERM', close);
  console.log(`Qiahao API listening on http://127.0.0.1:${process.env.QIAHAO_API_PORT ?? 3001}`);
});
