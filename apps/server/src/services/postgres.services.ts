import pg from 'pg';
import logger from "../logger/winston.logger.js";
import { DATABASE_URL } from "../env.js";
const { Pool } = pg;

class PostgresService {
  private pool: pg.Pool;

  constructor() {
    const connectionString = DATABASE_URL;
    const caCert = process.env.POSTGRES_CA_CERT;

    const config: pg.PoolConfig = {
      connectionString,
    };

    if (caCert) {
      config.ssl = {
        rejectUnauthorized: true,
        ca: caCert,
      };
      logger.info(`🔒 Postgres SSL CA certificate loaded from environment.`);
    }

    this.pool = new Pool(config);

    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.info('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Database query error', error);
      throw error;
    }
  }

  public async connect() {
    return this.pool.connect();
  }

  public async close() {
    await this.pool.end();
    logger.info("👋 Postgres disconnected");
  }

  public getPool() {
    return this.pool;
  }
}

export const postgresService = new PostgresService();
export default postgresService;
