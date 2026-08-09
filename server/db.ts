import mysql, {
  type FieldPacket,
  type OkPacket,
  type Pool,
  type PoolConnection,
  type PoolOptions,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';

type QueryResult = RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader;
export type DatabaseRows<T extends RowDataPacket = RowDataPacket> = T[];

export const REQUIRED_MIGRATIONS = [
  '001_canonical_domain_schema.sql',
  '002_dynamic_business_config.sql',
] as const;

export function toMysqlDateTime(value: Date | string = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('无效的日期时间');
  return date.toISOString().slice(0, 23).replace('T', ' ');
}

export function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value ?? '');
  if (!text) return text;
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  return /(?:Z|[+-]\d\d:\d\d)$/.test(normalized) ? normalized : `${normalized}Z`;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: PoolOptions['ssl'];
  poolMin: number;
  poolMax: number;
}

export interface QiahaoDatabase {
  query<T extends QueryResult = RowDataPacket[]>(sql: string, params?: readonly unknown[]): Promise<T>;
  getConnection(): Promise<QiahaoConnection>;
  transaction<T>(callback: (connection: QiahaoConnection) => Promise<T>): Promise<T>;
  assertMigrations(): Promise<void>;
  close(): Promise<void>;
}

export interface QiahaoConnection {
  query<T extends QueryResult = RowDataPacket[]>(sql: string, params?: readonly unknown[]): Promise<T>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
}

function envValue(prefix: string, key: string): string | undefined {
  return process.env[`${prefix}_${key}`];
}

function requiredEnv(prefix: string, key: string): string {
  const value = envValue(prefix, key);
  if (value === undefined || value.trim() === '') {
    throw new Error(`缺少 ${prefix}_${key} 数据库配置`);
  }
  return value;
}

function positiveInteger(value: string | undefined, fallback: number, key: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${key} 必须是正整数`);
  return parsed;
}

function sslOption(prefix: string): PoolOptions['ssl'] {
  const value = envValue(prefix, 'SSL');
  if (value === undefined || value === '' || value === 'false') return undefined;
  if (value !== 'true') throw new Error(`${prefix}_SSL 必须是 true 或 false`);
  return {};
}

export function databaseConfigFromEnv(prefix = 'MYSQL'): DatabaseConfig {
  const poolMin = positiveInteger(envValue(prefix, 'POOL_MIN'), 1, `${prefix}_POOL_MIN`);
  const poolMax = positiveInteger(envValue(prefix, 'POOL_MAX'), 10, `${prefix}_POOL_MAX`);
  if (poolMin > poolMax) throw new Error(`${prefix}_POOL_MIN 不能大于 ${prefix}_POOL_MAX`);
  return {
    host: requiredEnv(prefix, 'HOST'),
    port: positiveInteger(envValue(prefix, 'PORT'), 3306, `${prefix}_PORT`),
    user: requiredEnv(prefix, 'USER'),
    password: requiredEnv(prefix, 'PASSWORD'),
    database: requiredEnv(prefix, 'DATABASE'),
    ssl: sslOption(prefix),
    poolMin,
    poolMax,
  };
}

function createPool(config: DatabaseConfig): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl,
    connectionLimit: config.poolMax,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    multipleStatements: false,
    dateStrings: true,
  });
}

class MySqlConnection implements QiahaoConnection {
  constructor(private readonly connection: PoolConnection) {}

  async query<T extends QueryResult = RowDataPacket[]>(sql: string, params: readonly unknown[] = []): Promise<T> {
    const [rows] = await this.connection.query<T>(sql, params as unknown[]);
    return rows;
  }

  beginTransaction(): Promise<void> {
    return this.connection.beginTransaction();
  }

  commit(): Promise<void> {
    return this.connection.commit();
  }

  rollback(): Promise<void> {
    return this.connection.rollback();
  }

  release(): void {
    this.connection.release();
  }
}

class MySqlDatabase implements QiahaoDatabase {
  constructor(private readonly pool: Pool, private readonly config: DatabaseConfig) {}

  async query<T extends QueryResult = RowDataPacket[]>(sql: string, params: readonly unknown[] = []): Promise<T> {
    const [rows] = await this.pool.query<T>(sql, params as unknown[]);
    return rows;
  }

  async getConnection(): Promise<QiahaoConnection> {
    return new MySqlConnection(await this.pool.getConnection());
  }

  async transaction<T>(callback: (connection: QiahaoConnection) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Preserve the original transaction error.
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  async assertMigrations(): Promise<void> {
    let rows: RowDataPacket[];
    try {
      rows = await this.query<RowDataPacket[]>('SELECT version FROM schema_migrations ORDER BY version');
    } catch {
      throw new Error('数据库迁移未完成：缺少 schema_migrations，请执行 npm run db:migrate -- --apply');
    }
    const applied = new Set(rows.map((row) => String(row.version)));
    const missing = REQUIRED_MIGRATIONS.filter((version) => !applied.has(version));
    if (missing.length) {
      throw new Error(`数据库迁移未完成：缺少 ${missing.join(', ')}，请执行 npm run db:migrate -- --apply`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async verifyConnection(): Promise<void> {
    await this.pool.query('SELECT 1');
    if (this.config.poolMin > 1) {
      const connections = await Promise.all(
        Array.from({ length: this.config.poolMin - 1 }, () => this.pool.getConnection()),
      );
      connections.forEach((connection) => connection.release());
    }
  }
}

export async function createDatabase(options: { envPrefix?: string } = {}): Promise<QiahaoDatabase> {
  const config = databaseConfigFromEnv(options.envPrefix ?? 'MYSQL');
  const database = new MySqlDatabase(createPool(config), config);
  try {
    await database.verifyConnection();
    return database;
  } catch (error) {
    await database.close();
    throw new Error(`无法连接 MySQL 数据库 ${config.host}:${config.port}/${config.database}`, { cause: error });
  }
}

export type DatabaseQueryResult = [QueryResult, FieldPacket[]];
