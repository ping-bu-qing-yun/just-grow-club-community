import { createDatabase } from './db';
import { createSeededApp } from './app';

const database = createDatabase();
await createSeededApp(database).then(async (app) => {
  await app.listen({ host: process.env.QIAHAO_API_HOST ?? '127.0.0.1', port: Number(process.env.QIAHAO_API_PORT ?? 3001) });
  const close = async () => { await app.close(); database.close(); process.exit(0); };
  process.once('SIGINT', close); process.once('SIGTERM', close);
  console.log(`Qiahao API listening on http://127.0.0.1:${process.env.QIAHAO_API_PORT ?? 3001}`);
});
