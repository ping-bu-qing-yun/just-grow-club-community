import { createDatabase } from '../db';
import { applyMigrations, migrationStatementCounts } from './service';
import type { RowDataPacket } from 'mysql2/promise';

const apply = process.argv.includes('--apply');

async function main(): Promise<void> {
  const database = await createDatabase();
  try {
    const tables = await database.query<Array<RowDataPacket & { TABLE_NAME: string }>>(
      `SELECT TABLE_NAME
         FROM information_schema.tables
        WHERE table_schema=DATABASE()
        ORDER BY TABLE_NAME`,
    );
    console.log(`目标数据库可访问，已有表 ${tables.length} 个`);
    if (!apply) {
      console.log('dry-run：未执行任何写操作');
      for (const item of await migrationStatementCounts()) console.log(`${item.version}: ${item.statements} 条 SQL`);
      return;
    }
    await applyMigrations(database);
    console.log('迁移完成：所有版本已记录');
  } finally {
    await database.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '数据库迁移失败');
  process.exitCode = 1;
});
