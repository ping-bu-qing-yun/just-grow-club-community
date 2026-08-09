import { writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

function required(name) {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`缺少 ${name} 数据库配置`);
  return value;
}

function outputPathFromArgs(argv) {
  const index = argv.indexOf('--output');
  if (index < 0) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error('--output 必须指定文件路径');
  return value;
}

function normalizeCreateTable(createSql) {
  return createSql
    .replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/ AUTO_INCREMENT=\d+\b/g, '');
}

async function main() {
  const connection = await mysql.createConnection({
    host: required('MYSQL_HOST'),
    port: Number(process.env.MYSQL_PORT || 3306),
    user: required('MYSQL_USER'),
    password: required('MYSQL_PASSWORD'),
    database: required('MYSQL_DATABASE'),
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
    dateStrings: true,
  });

  try {
    const [tables] = await connection.query(
      `SELECT TABLE_NAME
         FROM information_schema.tables
        WHERE table_schema=DATABASE()
          AND TABLE_TYPE='BASE TABLE'
          AND TABLE_NAME<>'schema_migrations'
        ORDER BY TABLE_NAME`,
    );
    const statements = [];
    for (const { TABLE_NAME: tableName } of tables) {
      const [rows] = await connection.query(`SHOW CREATE TABLE \`${tableName.replaceAll('`', '``')}\``);
      const createSql = rows[0]?.['Create Table'];
      if (!createSql) throw new Error(`无法读取 ${tableName} 的建表语句`);
      statements.push(normalizeCreateTable(createSql));
    }

    const sql = [
      '-- Generated from the canonical MySQL schema. Do not hand-edit table definitions.',
      '-- Regenerate with: npm run db:schema:export -- --output server/migrations/mysql/001_canonical_domain_schema.sql',
      'SET FOREIGN_KEY_CHECKS=0;',
      ...statements.map((statement) => `${statement};`),
      'SET FOREIGN_KEY_CHECKS=1;',
      '',
    ].join('\n\n');

    const outputPath = outputPathFromArgs(process.argv.slice(2));
    if (outputPath) {
      await writeFile(outputPath, sql, 'utf8');
      console.log(`已导出 ${tables.length} 张表到 ${outputPath}`);
    } else {
      process.stdout.write(sql);
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : '导出 MySQL schema 失败');
  process.exitCode = 1;
});
