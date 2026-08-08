import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import mysql from 'mysql2/promise';

const apply = process.argv.includes('--apply');
const root = fileURLToPath(new URL('.', import.meta.url));
const files = ['001_initial.sql', '002_notifications.sql'];

function config() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE;
  if (!host || !user || password === undefined || !database) throw new Error('缺少 MYSQL_HOST/MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE');
  return {
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password,
    database,
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
    multipleStatements: false,
  };
}

function statements(sql: string): string[] {
  return sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const connection = await mysql.createConnection(config());
  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`目标数据库可访问，已有表 ${Array.isArray(tables) ? tables.length : 0} 个`);
    if (!apply) {
      console.log(`dry-run：将检查 ${files.length} 个 MySQL 迁移文件；未执行任何写操作`);
      return;
    }
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(64) PRIMARY KEY, applied_at DATETIME(3) NOT NULL)`);
    for (const file of files) {
      const [rows] = await connection.query('SELECT version FROM schema_migrations WHERE version=?', [file]);
      if (Array.isArray(rows) && rows.length) continue;
      const sql = await readFile(join(root, file), 'utf8');
      for (const statement of statements(sql)) await connection.query(statement);
      await connection.query('INSERT INTO schema_migrations (version, applied_at) VALUES (?, NOW(3))', [file]);
      console.log(`已应用 ${file}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '数据库迁移失败');
  process.exitCode = 1;
});
