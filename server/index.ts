import { buildApp } from './app';
import { createDatabase } from './db';
import { NotificationHub } from './notification-hub';
import { connectNotificationRedis } from './notification-redis';
import { BusinessConfigService } from './config-service';
import { connectConfigRedis } from './config-redis';

async function main(): Promise<void> {
  const database = await createDatabase();
  let notificationRedis: Awaited<ReturnType<typeof connectNotificationRedis>> = null;
  let configRedis: Awaited<ReturnType<typeof connectConfigRedis>> = null;
  try {
    await database.assertMigrations();
    const notificationHub = new NotificationHub();
    const configService = new BusinessConfigService(database);
    notificationRedis = await connectNotificationRedis(notificationHub);
    configRedis = await connectConfigRedis(configService);
    const app = buildApp({ database, notificationHub, configService });
    await app.listen({
      host: process.env.QIAHAO_API_HOST ?? '127.0.0.1',
      port: Number(process.env.QIAHAO_API_PORT ?? 3001),
    });

    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      await app.close();
      await notificationRedis?.close();
      await configRedis?.close();
      await database.close();
    };
    process.once('SIGINT', () => { void close(); });
    process.once('SIGTERM', () => { void close(); });
    console.log(`Qiahao API listening on http://127.0.0.1:${process.env.QIAHAO_API_PORT ?? 3001}`);
  } catch (error) {
    await notificationRedis?.close();
    await configRedis?.close();
    await database.close();
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'API 启动失败');
  process.exitCode = 1;
});
