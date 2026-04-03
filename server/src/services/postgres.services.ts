/**
 * PostgreSQL Database Service.
 * Manages the connection pool for the main relational database.
 */

import pg from 'pg';
import logger from "../logger/winston.logger";
const { Pool } = pg;

class PostgresService {
  private pool: pg.Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const caCert = process.env.POSTGRES_CA_CERT;

    const config: pg.PoolConfig = {
      connectionString,
    };

    // SSL Configuration for cloud databases
    if (caCert) {
      config.ssl = {
        rejectUnauthorized: true,
        ca: caCert,
      };
      logger.info(`🔒 Postgres SSL CA certificate loaded from environment.`);
    }

    this.pool = new Pool(config);

    // Error listener to handle unexpected connection drops
    this.pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }

  /**
   * Execute a SQL query.
   */
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

  /**
   * Get a client from the pool for transactions.
   */
  public async connect() {
    return this.pool.connect();
  }

  /**
   * Gracefully shuts down the connection pool.
   */
  public async close() {
    await this.pool.end();
    logger.info("👋 Postgres disconnected");
  }

  /**
   * Expose the raw pool.
   */
  public getPool() {
    return this.pool;
  }
}

export const postgresService = new PostgresService();
export default postgresService;
